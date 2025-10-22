import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import "./styles/NewRecordPage.css";
import { updateCaseRecord } from "./EditRecordPage";
import editIcon from './icons/edit.png';
import ShowUploadedFile from "./utils/showUploadedFile";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

function formatTimestamp(ts) {
  if (!ts) return "";
  if (typeof ts === "object" && ts.seconds) {
    const date = new Date(ts.seconds * 1000);
    return date.toLocaleString();
  }
  return ts;
}

function ViewRecordPage({ onLogout }) {
  const [username] = useState(localStorage.getItem("loggedInUsername") || "");
  const { caseNumber } = useParams();
  const [caseData, setCaseData] = useState(null);

  // Subcollections
  const [complainants, setComplainants] = useState([]);
  const [respondents, setRespondents] = useState([]);
  const [mediationRows, setMediationRows] = useState([]);
  const [conciliationRows, setConciliationRows] = useState([]);
  const [arbitrationRows, setArbitrationRows] = useState([]);
  const [caseStatusRows, setCaseStatusRows] = useState([]);
  const [ammicableRows, setAmmicableRows] = useState([]);

  const statusOptions = [
    "On Going / Pending",
    "Settled Amicably",
    "Dismissed",
    "Withdrawn",
    "Referred to Other Office",
    "Certificate to File Action"
  ];

  useEffect(() => {
    async function fetchCase() {
      if (!caseNumber) return;
      const docRef = doc(db, "cases", caseNumber);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCaseData(docSnap.data());
      }
    }
    fetchCase();
  }, [caseNumber]);

  useEffect(() => {
    if (!caseNumber) return;

    async function fetchSubcollection(subPath) {
      const colRef = collection(db, "cases", caseNumber, subPath);
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async function fetchCaseManagementDoc(type) {
      const docRef = doc(db, "cases", caseNumber, "caseManagement", type);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return [];
      const data = docSnap.data();
      return Object.entries(data).map(([id, value]) => ({
        id,
        ...value
      }));
    }

    async function fetchCaseStatusDocs() {
      const colRef = collection(db, "cases", caseNumber, "caseStatus");
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async function fetchAllSubcollections() {
      const [
        complainantDocs,
        respondentDocs,
        mediationRowsFlat,
        conciliationRowsFlat,
        arbitrationRowsFlat,
        caseStatusDocs,
        complianceDocs
      ] = await Promise.all([
        fetchSubcollection("complainant"),
        fetchSubcollection("respondent"),
        fetchCaseManagementDoc("mediation"),
        fetchCaseManagementDoc("conciliation"),
        fetchCaseManagementDoc("arbitration"),
        fetchCaseStatusDocs(),
        fetchSubcollection("compliance")
      ]);
      setComplainants(complainantDocs);
      setRespondents(respondentDocs);
      setMediationRows(mediationRowsFlat);
      setConciliationRows(conciliationRowsFlat);
      setArbitrationRows(arbitrationRowsFlat);
      setCaseStatusRows(caseStatusDocs);
      setAmmicableRows(complianceDocs);
    }

    fetchAllSubcollections();
  }, [caseNumber]);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Notification states (add these)
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Protect against race where a delayed timeout clears editData while user re-enters edit
  const isEditingRef = useRef(isEditing);
  const submitClearTimeoutRef = useRef(null);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

  // When entering edit mode, copy the current data to editData
  const handleEditClick = () => {
    setEditData({
      ...caseData,
      complainants: complainants.map(c => ({ ...c })),
      respondents: respondents.map(c => ({ ...c })),
      mediationRows: mediationRows.map(m => ({ ...m })),
      conciliationRows: conciliationRows.map(c => ({ ...c })),
      arbitrationRows: arbitrationRows.map(a => ({ ...a })),
      // IMPORTANT: initialize selectedStatus from status so it is never undefined in edit mode
      caseStatusRows: caseStatusRows.map(s => ({
        ...s,
        selectedStatus: s.status ?? ""
      })),
      ammicableRows: ammicableRows.map(a => ({ ...a }))
    });
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  // Handle field changes in edit mode for main case fields
  const handleEditFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Handle array field changes (complainant/respondent/case management/case status/amicable)
  const handleEditArrayChange = (type, idx, field, value) => {
    setEditData(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    }));
  };

  // Submit edited data using updateCaseRecord from EditRecordPage.js
  const handleSubmitEdit = async () => {
    // show submitting overlay/message
    setSubmitting(true);
    setLoading(true);
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage("");

    try {
      // --- send the update to Firestore ---
      await updateCaseRecord(
        caseNumber,
        editData, // primary doc fields (if your update fn expects different args, adjust accordingly)
        {
          complainants: editData.complainants || [],
          respondents: editData.respondents || [],
          mediationRows: editData.mediationRows || [],
          conciliationRows: editData.conciliationRows || [],
          arbitrationRows: editData.arbitrationRows || [],
          caseStatusRows: editData.caseStatusRows || [],
          ammicableRows: editData.ammicableRows || []
        }
      );

      // Immediately update UI from local edited copy so user sees changes without refresh
      setCaseData(editData);
      setComplainants(editData.complainants || []);
      setRespondents(editData.respondents || []);
      setMediationRows(editData.mediationRows || []);
      setConciliationRows(editData.conciliationRows || []);
      setArbitrationRows(editData.arbitrationRows || []);
      setCaseStatusRows(editData.caseStatusRows || []);
      setAmmicableRows(editData.ammicableRows || []);

      // Show success toast / stop the loading indicator
      setLoading(false);
      setShowSuccess(true);
      setIsEditing(false);

      // In background, re-fetch the doc + subcollections from Firestore to ensure canonical state
      (async () => {
        try {
          // fetch main doc
          const caseDocRef = doc(db, "cases", caseNumber);
          const caseSnap = await getDoc(caseDocRef);
          if (caseSnap.exists()) {
            setCaseData(caseSnap.data());
          }

          // helper to fetch simple subcollection (complainant/respondent/compliance)
          const fetchSubcollection = async (subPath) => {
            const colRef = collection(db, "cases", caseNumber, subPath);
            const snap = await getDocs(colRef);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
          };

          // helper to fetch caseManagement doc (mediation/conciliation/arbitration)
          const fetchCaseManagementDoc = async (type) => {
            const cmRef = doc(db, "cases", caseNumber, "caseManagement", type);
            const cmSnap = await getDoc(cmRef);
            if (!cmSnap.exists()) return [];
            const data = cmSnap.data();
            // convert object map to array
            return Object.entries(data).map(([id, value]) => ({ id, ...value }));
          };

          // fetch caseStatus collection
          const fetchCaseStatusDocs = async () => {
            const colRef = collection(db, "cases", caseNumber, "caseStatus");
            const snap = await getDocs(colRef);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
          };

          // run in parallel
          const [
            complainantDocs,
            respondentDocs,
            mediationFromDb,
            conciliationFromDb,
            arbitrationFromDb,
            caseStatusFromDb,
            complianceDocs
          ] = await Promise.all([
            fetchSubcollection("complainant"),
            fetchSubcollection("respondent"),
            fetchCaseManagementDoc("mediation"),
            fetchCaseManagementDoc("conciliation"),
            fetchCaseManagementDoc("arbitration"),
            fetchCaseStatusDocs(),
            fetchSubcollection("compliance")
          ]);

          // update local arrays with authoritative values
          setComplainants(complainantDocs);
          setRespondents(respondentDocs);
          setMediationRows(mediationFromDb);
          setConciliationRows(conciliationFromDb);
          setArbitrationRows(arbitrationFromDb);
          setCaseStatusRows(caseStatusFromDb);
          setAmmicableRows(complianceDocs);
        } catch (bgErr) {
          // non-fatal: log background refresh error
          console.warn("Background refresh failed:", bgErr);
        }
      })();

      // exit edit mode after short delay so user sees success toast
      // ONLY clear editData if the user did not re-enter edit mode
      submitClearTimeoutRef.current = setTimeout(() => {
        setShowSuccess(false);
        // don't clobber editData if user re-entered edit mode
        if (!isEditingRef.current) {
          setEditData(null);
        }
        setSubmitting(false);
      }, 1400);
    } catch (err) {
      // failure UI
      const msg = (err && err.message) ? err.message : "Failed to submit changes.";
      setLoading(false);
      setSubmitting(false);
      setShowError(true);
      setErrorMessage(msg);

      // auto-hide error after a longer time
      setTimeout(() => {
        setShowError(false);
        setErrorMessage("");
      }, 4000);

      console.error("Error submitting edit:", err);
    }
  };

  // Handles changes to fields in caseStatusRows in edit mode
  const handleCaseStatusChange = (idx, field, value) => {
    setEditData(prev => ({
      ...prev,
      caseStatusRows: prev.caseStatusRows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    }));
  };

  // Adds a new blank case status row in edit mode
  const handleAddCaseStatus = () => {
    setEditData(prev => ({
      ...prev,
      caseStatusRows: [
        ...prev.caseStatusRows,
        {
          statusDate: "",
          selectedStatus: "",
          repudiated: "",
          mainPoint: "",
          execution: "",
          executionDate: "",
          executionReason: ""
        }
      ]
    }));
  };
  
const caseStatusArr = isEditing ? (editData?.caseStatusRows ?? []) : caseStatusRows;

// useEffect(() => {

//   const id = setInterval(() => {
//     try {
//       const rows = (caseStatusArr || []).map((r, i) => ({
//         idx: i,
//         status: r?.status,
//         selectedStatus: r?.selectedStatus
//       }));
//       // Clear, then print detailed info so both fields are obvious
//       console.log("CaseStatus debug (every 5s):", rows);
//       console.table(rows);
//       rows.forEach(row =>
//         console.log(`caseStatus[${row.idx}] status="${row.status}" selectedStatus="${row.selectedStatus}"`)
//       );
//     } catch (err) {
//       console.error("CaseStatus debug error:", err);
//     }
//   }, 1000);

//   return () => clearInterval(id);
// }, [isEditing, caseStatusArr]);

const dateTimeDateRef = useRef(null);   // date part of "Date & Time Filed"
const dateTimeTimeRef = useRef(null);   // time part of "Date & Time Filed"
const dateOfIncidentRef = useRef(null); // date of incident

const fpDateRef = useRef(null);    // flatpickr instance for date
const fpTimeRef = useRef(null);    // flatpickr instance for time
const fpIncidentRef = useRef(null);// flatpickr instance for incident date

// Initialize flatpickr when in edit mode (or when refs are present).
useEffect(() => {
  // only init when editing (we need editData to write into)
  if (!isEditing) {
    // cleanup any previous instances if exist
    if (fpDateRef.current) { fpDateRef.current.destroy(); fpDateRef.current = null; }
    if (fpTimeRef.current) { fpTimeRef.current.destroy(); fpTimeRef.current = null; }
    if (fpIncidentRef.current) { fpIncidentRef.current.destroy(); fpIncidentRef.current = null; }
    return;
  }

  // cleanup previous instances before creating new ones
  if (fpDateRef.current) { fpDateRef.current.destroy(); fpDateRef.current = null; }
  if (fpTimeRef.current) { fpTimeRef.current.destroy(); fpTimeRef.current = null; }
  if (fpIncidentRef.current) { fpIncidentRef.current.destroy(); fpIncidentRef.current = null; }

  // helper to safely update editData
  const setEditField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // initialize date (YYYY-MM-DD) part
  if (dateTimeDateRef.current) {
    fpDateRef.current = flatpickr(dateTimeDateRef.current, {
      dateFormat: "Y-m-d",
      allowInput: true,
      defaultDate: (editData?.dateTimeFiled?.split?.("T")?.[0]) || null,
      onChange: (selectedDates, dateStr) => {
        const currentTime = editData?.dateTimeFiled?.split?.("T")?.[1] || "";
        setEditField("dateTimeFiled", dateStr + (currentTime ? "T" + currentTime : ""));
      }
    });
  }

  // initialize time part
  if (dateTimeTimeRef.current) {
    fpTimeRef.current = flatpickr(dateTimeTimeRef.current, {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      allowInput: true,
      defaultDate: (editData?.dateTimeFiled?.split?.("T")?.[1]) || null,
      onChange: (selectedDates, timeStr) => {
        const currentDate = editData?.dateTimeFiled?.split?.("T")?.[0] || "";
        setEditField("dateTimeFiled", (currentDate ? currentDate : "") + (timeStr ? "T" + timeStr : ""));
      }
    });
  }

  // date of incident picker
  if (dateOfIncidentRef.current) {
    fpIncidentRef.current = flatpickr(dateOfIncidentRef.current, {
      dateFormat: "Y-m-d",
      allowInput: true,
      defaultDate: editData?.dateOfIncident || null,
      onChange: (selectedDates, dateStr) => {
        setEditField("dateOfIncident", dateStr);
      }
    });
  }

  return () => {
    if (fpDateRef.current) { fpDateRef.current.destroy(); fpDateRef.current = null; }
    if (fpTimeRef.current) { fpTimeRef.current.destroy(); fpTimeRef.current = null; }
    if (fpIncidentRef.current) { fpIncidentRef.current.destroy(); fpIncidentRef.current = null; }
  };
// re-run when edit mode toggles or when editData changes
}, [isEditing, editData?.dateTimeFiled, editData?.dateOfIncident]);

  // Reference: uses the same fpMapRef initializer pattern as src/NewRecordPage.js
const fpMapRef = useRef(new Map());

useEffect(() => {
  // This initializer attaches flatpickr instances to any input with class "fp-input"
  // and data attributes set in the JSX below (data-fp, data-field, data-idx).
  // It mirrors the behavior in src/NewRecordPage.js so the pickers behave the same.
  if (!isEditing) {
    // destroy any existing instances when not editing
    fpMapRef.current.forEach(inst => {
      try { inst.destroy(); } catch (e) {}
    });
    fpMapRef.current.clear();
    return;
  }

  const inputs = Array.from(document.querySelectorAll('.fp-input'));
  inputs.forEach((el) => {
    // build a stable key per element (field + idx)
    const key = `${el.dataset.field || ''}::${el.dataset.idx || ''}`;
    if (fpMapRef.current.has(key)) return; // already initialized

    const fpType = el.dataset.fp || 'date'; // 'date' or 'time'
    const commonOpts = { allowInput: true, defaultDate: el.value || null };

    let opts;
    if (fpType === 'time') {
      opts = {
        ...commonOpts,
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        onChange: (selectedDates, timeStr) => {
          el.value = timeStr;
          const idx = el.dataset.idx ? parseInt(el.dataset.idx, 10) : null;
          const field = el.dataset.field || '';
          // route to correct handler
          if (field.endsWith('Time')) {
            // mediationTime, conciliationTime, arbitrationTime
            const map = {
              mediationTime: 'mediationRows',
              conciliationTime: 'conciliationRows',
              arbitrationTime: 'arbitrationRows'
            };
            const arr = map[field];
            if (arr && idx !== null) {
              handleEditArrayChange(arr, idx, 'time', timeStr);
            }
          } else {
            // fallback to main edit handlers
            if (idx !== null && el.dataset.field) {
              // try caseStatus execution time mapping if needed; default to edit array change
              handleEditArrayChange(el.dataset.type || 'mediationRows', idx, el.dataset.prop || 'time', timeStr);
            } else {
              handleEditFieldChange(el.dataset.field, timeStr);
            }
          }
        }
      };
    } else {
      opts = {
        ...commonOpts,
        dateFormat: "Y-m-d",
        onChange: (selectedDates, dateStr) => {
          el.value = dateStr;
          const idx = el.dataset.idx ? parseInt(el.dataset.idx, 10) : null;
          const field = el.dataset.field || '';

          // route the change to the correct handler by field name
          if (field === 'complainantBirthDate') {
            if (idx !== null) handleEditArrayChange('complainants', idx, 'birthDate', dateStr);
          } else if (field === 'respondentBirthDate') {
            if (idx !== null) handleEditArrayChange('respondents', idx, 'birthDate', dateStr);
          } else if (field === 'mediationDate') {
            if (idx !== null) handleEditArrayChange('mediationRows', idx, 'date', dateStr);
          } else if (field === 'conciliationDate') {
            if (idx !== null) handleEditArrayChange('conciliationRows', idx, 'date', dateStr);
          } else if (field === 'arbitrationDate') {
            if (idx !== null) handleEditArrayChange('arbitrationRows', idx, 'date', dateStr);
          } else if (field === 'ammicableDate') {
            if (idx !== null) handleEditArrayChange('ammicableRows', idx, 'date', dateStr);
          } else if (field === 'caseStatusDate') {
            if (idx !== null) handleCaseStatusChange(idx, 'statusDate', dateStr);
          } else if (field === 'executionDate') {
            if (idx !== null) handleCaseStatusChange(idx, 'executionDate', dateStr);
          } else {
            // fallback: top-level edit field
            handleEditFieldChange(field, dateStr);
          }
        }
      };
    }

    try {
      const inst = flatpickr(el, opts);
      fpMapRef.current.set(key, inst);
    } catch (err) {
      // ignore initialization errors quietly
      console.error("flatpickr init error:", err);
    }
  });

  // cleanup: remove any instances that no longer have a matching element
  const currentKeys = new Set(inputs.map(el => `${el.dataset.field || ''}::${el.dataset.idx || ''}`));
  Array.from(fpMapRef.current.keys()).forEach(k => {
    if (!currentKeys.has(k)) {
      try { fpMapRef.current.get(k).destroy(); } catch (e) {}
      fpMapRef.current.delete(k);
    }
  });

  return () => {
    // destroy instances created in this effect on unmount
    fpMapRef.current.forEach(inst => {
      try { inst.destroy(); } catch (e) {}
    });
    fpMapRef.current.clear();
  };
// re-run when entering/leaving edit mode or when counts change
}, [isEditing, complainants.length, respondents.length, mediationRows.length, conciliationRows.length, arbitrationRows.length, ammicableRows.length, caseStatusRows.length]);

  if (!caseData) return <div>Loading...</div>;

  // Use editData in edit mode, otherwise use fetched data
  const data = isEditing ? editData : caseData;
  const complainantArr = isEditing ? editData.complainants : complainants;
  const respondentArr = isEditing ? editData.respondents : respondents;
  const mediationArr = isEditing ? editData.mediationRows : mediationRows;
  const conciliationArr = isEditing ? editData.conciliationRows : conciliationRows;
  const arbitrationArr = isEditing ? editData.arbitrationRows : arbitrationRows;

  const ammicableArr = isEditing ? editData.ammicableRows : ammicableRows;

  return (
    <div>
      {/* Header */}
      <header className="header-container">
        {/* Top Row */}
        <div className="header-top-row">
          <div className="header-top-left">
            <img src="#" alt="Logo" className="header-logo" />
            <div className="header-top-titles">
              <div className="header-city">City of Mandaluyong</div>
              <div className="header-underline" />
              <div className="header-barangay">BARANGAY HIGHWAY HILLS</div>
            </div>
          </div>
          <div className="header-top-right">
            <span className="header-admin">
              {username ? `Username: ${username}` : ""}
            </span>
            <button onClick={onLogout} className="logout-btn">Sign Out</button>
          </div>
        </div>
        {/* Bottom Row */}
        <div className="header-bottom-row">
          <div className="header-bottom-left">
            <div className="header-kp">Katarungang Pambarangay (KP)</div>
            <div className="header-kp">Management Information Systems (MIS)</div>
          </div>
          <nav className="header-bottom-nav">
            <Link to="/Dashboard" className="header-link">Dashboard</Link>
            <Link to="/Database" className="header-link" style={{color : "#d3000eff"}}>Database</Link>
            <Link to="/New-Record" className="header-link">New Record</Link>
            <Link to="/Reports" className="header-link">Reports</Link>
          </nav>
        </div>
      </header>

      {/* Case Id Number */}
      <div className="newrecord-main-content" style={{ marginTop: "60px" }}>
        <div className="newrecord-table-row">
          <table className="newrecord-table" style={{width: "27.2%"}}>
            <tbody>
              <tr>
                <td className="complainantInformation-label">Case ID Number:</td>
                <td style={{ width: "65%" }}>
                  {isEditing ? (
                    <input
                      type="text"
                      className="newrecord-input"
                      value={data.caseIdNumber || ""}
                      disabled // Case ID should not be editable
                    />
                  ) : (
                    <span>{data.caseIdNumber || caseNumber}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Complainant Section */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Complainant</h1>
        <div className="complainant-wrapper">
          <table className="complainant-table left">
            <tbody>
              <tr>
                <td className="complainant-label">Date &amp; Time Filed</td>
                <td>
                  {isEditing ? (
                    <>
                      <input
                        ref={dateTimeDateRef}
                        type="text"                        // flatpickr will attach to text input
                        className="newrecord-input small-input"
                        placeholder="Select Date"
                        // optional onBlur fallback if user types directly
                        onBlur={() => {
                          const val = dateTimeDateRef.current?.value || "";
                          const currentTime = editData?.dateTimeFiled?.split("T")?.[1] || "";
                          if (val !== (editData?.dateTimeFiled?.split("T")?.[0] || "")) {
                            setEditData(prev => ({ ...prev, dateTimeFiled: val + (currentTime ? "T" + currentTime : "") }));
                          }
                        }}
                      />
                      <input
                        ref={dateTimeTimeRef}
                        type="text"
                        className="newrecord-input small-input"
                        placeholder="Select Time"
                        onBlur={() => {
                          const val = dateTimeTimeRef.current?.value || "";
                          const currentDate = editData?.dateTimeFiled?.split("T")?.[0] || "";
                          if (val !== (editData?.dateTimeFiled?.split("T")?.[1] || "")) {
                            setEditData(prev => ({ ...prev, dateTimeFiled: (currentDate ? currentDate : "") + (val ? "T" + val : "") }));
                          }
                        }}
                      />
                    </>
                  ) : (
                    (() => {
                      let dateStr = "";
                      let timeStr = "";
                      if (data.dateTimeFiled) {
                        if (typeof data.dateTimeFiled === "object" && data.dateTimeFiled.seconds) {
                          const d = new Date(data.dateTimeFiled.seconds * 1000);
                          dateStr = d.toISOString().slice(0, 10);
                          timeStr = d.toTimeString().slice(0, 5);
                        } else if (typeof data.dateTimeFiled === "string") {
                          const t = data.dateTimeFiled.replace("T", " ").split(" ");
                          dateStr = t[0] || "";
                          timeStr = (t[1] || "").slice(0, 5);
                        }
                      }
                      return (
                        <>
                          <span>{dateStr}</span>
                          <span style={{ marginLeft: "10px" }}>{timeStr}</span>
                        </>
                      );
                    })()
                  )}
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Date of Incident</td>
                <td>
                  {isEditing ? (
                    <input
                      ref={dateOfIncidentRef}
                      type="text"
                      className="newrecord-input small-input"
                      placeholder="Select Date"
                      onBlur={() => {
                        const val = dateOfIncidentRef.current?.value || "";
                        if (val !== editData?.dateOfIncident) {
                          setEditData(prev => ({ ...prev, dateOfIncident: val }));
                        }
                      }}
                    />
                  ) : (
                    <span>{formatTimestamp(data.dateOfIncident)}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Place of Incident</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      className="newrecord-input"
                      value={data.placeOfIncident || ""}
                      onChange={e => handleEditFieldChange("placeOfIncident", e.target.value)}
                    />
                  ) : (
                    <span>{data.placeOfIncident}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <table className="complainant-table right">
            <tbody>
              <tr>
                <td className="complainant-label">
                  Nature of Complaint
                </td>
                <td>
                  {isEditing ? (
                    <select
                      className="newrecord-input"
                      value={data.natureOfComplaint || ""}
                      onChange={e => handleEditFieldChange("natureOfComplaint", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Civil">Civil</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Others">Others</option>
                    </select>
                  ) : (
                    <span>{data.natureOfComplaint}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Offense/Violation</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      className="newrecord-input"
                      value={data.offenseViolation || ""}
                      onChange={e => handleEditFieldChange("offenseViolation", e.target.value)}
                    />
                  ) : (
                    <span>{data.offenseViolation}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Specific</td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      className="newrecord-input"
                      value={data.specific || ""}
                      onChange={e => handleEditFieldChange("specific", e.target.value)}
                    />
                  ) : (
                    <span>{data.specific}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Complainant’s Information Section */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Complainant’s Information</h1>
        {complainantArr.length === 0 && <div>No complainant information.</div>}
        {complainantArr.map((c, idx) => (
          <div key={c.id || idx} className="complainantInformation-row">
            <table className="complainantInformation-table left">
              <tbody>
                <tr>
                  <td className="complainantInformation-label">Lastname:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.lastName || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "lastName", e.target.value)}
                      />
                    ) : (
                      <span>{c.lastName}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Firstname:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.firstName || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "firstName", e.target.value)}
                      />
                    ) : (
                      <span>{c.firstName}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Middlename:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.middleName || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "middleName", e.target.value)}
                      />
                    ) : (
                      <span>{c.middleName}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Extension:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.extension || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "extension", e.target.value)}
                      />
                    ) : (
                      <span>{c.extension}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Sex/Gender:</td>
                  <td>
                    {isEditing ? (
                    <select
                      style={{ width: "95%" }}
                      className="newrecord-input"
                      value={c.sex}
                      onChange={e => handleEditArrayChange("complainants", idx, "sex", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Bisexual">Bisexual</option>
                      <option value="Lesbian">Lesbian</option>
                      <option value="Gay">Gay</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                      <option value="Other">Other</option>
                    </select>
                    ) : (
                      <span>{c.sex}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Birthdate:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="date"
                        data-field="complainantBirthDate"
                        data-idx={idx}
                        value={c.birthDate || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "birthDate", e.target.value)}
                        placeholder="Select Birthdate"
                      />
                    ) : (
                      <span>{c.birthDate}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="complainantInformation-table right">
              <thead>
                <tr>
                  <th colSpan={2}>Address and Contact Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="complainantInformation-label">Province:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.province || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "province", e.target.value)}
                      />
                    ) : (
                      <span>{c.province}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">City/Mun:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.cityMunicipality || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "cityMunicipality", e.target.value)}
                      />
                    ) : (
                      <span>{c.cityMunicipality}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Barangay:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.barangay || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "barangay", e.target.value)}
                      />
                    ) : (
                      <span>{c.barangay}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Specific:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.addressSpecific || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "addressSpecific", e.target.value)}
                      />
                    ) : (
                      <span>{c.addressSpecific}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">ContactNo:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.contactNo || ""}
                        onChange={e => handleEditArrayChange("complainants", idx, "contactNo", e.target.value)}
                      />
                    ) : (
                      <span>{c.contactNo}</span>
                    )}
                  </td>
                </tr>
                <tr style={{ position: idx === complainants.length - 1 ? "relative" : "static" }}>
                  <td className="complainantInformation-label">EmailAdd:</td>
                  <td style={{ position: "relative" }}>
                    {isEditing ? (
                      <input
                        type="email"
                        className="newrecord-input"
                        value={c.email}
                        onChange={e => handleEditArrayChange("complainants", idx, "email", e.target.value)}
                      />
                    ) : (
                      <span>{c.email}</span>
                    )}
                    {idx === complainantArr.length - 1 && isEditing && (
                      <button
                        className="newrecord-add-btn add-btn-absolute"
                        type="button"
                        onClick={() => {
                          setEditData(prev => ({
                            ...prev,
                            complainants: [
                              ...prev.complainants,
                              {
                                lastName: "", firstName: "", middleName: "", extension: "", sex: "", birthDate: "", province: "", cityMunicipality: "", barangay: "", addressSpecific: "", contactNo: "", email: ""
                              }
                            ]
                          }));
                        }}
                      >
                        + ADD
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Respondent's Information Section */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Respondent’s Information</h1>
        {respondentArr.length === 0 && <div>No respondent information.</div>}
        {respondentArr.map((c, idx) => (
          <div key={c.id || idx} className="respondentInformation-row">
            <table className="respondentInformation-table left">
              <tbody>
                <tr>
                  <td className="respondentInformation-label">Lastname:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.lastName || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "lastName", e.target.value)}
                      />
                    ) : (
                      <span>{c.lastName}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Firstname:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.firstName || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "firstName", e.target.value)}
                      />
                    ) : (
                      <span>{c.firstName}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Middlename:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.middleName || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "middleName", e.target.value)}
                      />
                    ) : (
                      <span>{c.middleName}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Extension:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.extension || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "extension", e.target.value)}
                      />
                    ) : (
                      <span>{c.extension}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Sex/Gender:</td>
                  <td>
                    {isEditing ? (
                    <select
                      style={{ width: "95%" }}
                      className="newrecord-input"
                      value={c.sex || ""}
                      onChange={e => handleEditArrayChange("respondents", idx, "sex", e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Bisexual">Bisexual</option>
                      <option value="Lesbian">Lesbian</option>
                      <option value="Gay">Gay</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                      <option value="Other">Other</option>
                    </select>
                    ) : (
                      <span>{c.sex}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Birthdate:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="date"
                        data-field="respondentBirthDate"
                        data-idx={idx}
                        value={c.birthDate || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "birthDate", e.target.value)}
                        placeholder="Select Birthdate"
                      />
                    ) : (
                      <span>{c.birthDate}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            <table className="respondentInformation-table right">
              <thead>
                <tr>
                  <th colSpan={2}>Address and Contact Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="respondentInformation-label">Province:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.province || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "province", e.target.value)}
                      />
                    ) : (
                      <span>{c.province}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">City/Mun:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.cityMunicipality || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "cityMunicipality", e.target.value)}
                      />
                    ) : (
                      <span>{c.cityMunicipality}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Barangay:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.barangay || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "barangay", e.target.value)}
                      />
                    ) : (
                      <span>{c.barangay}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Specific:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.addressSpecific || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "addressSpecific", e.target.value)}
                      />
                    ) : (
                      <span>{c.addressSpecific}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">ContactNo:</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input"
                        value={c.contactNo || ""}
                        onChange={e => handleEditArrayChange("respondents", idx, "contactNo", e.target.value)}
                      />
                    ) : (
                      <span>{c.contactNo}</span>
                    )}
                  </td>
                </tr>
                <tr style={{ position: idx === respondents.length - 1 ? "relative" : "static" }}>
                  <td className="respondentInformation-label">EmailAdd:</td>
                  <td style={{ position: "relative" }}>
                    {isEditing ? (
                      <input
                        type="email"
                        className="newrecord-input"
                        value={c.email}
                        onChange={e => handleEditArrayChange("respondents", idx, "email", e.target.value)}
                      />
                    ) : (
                      <span>{c.email}</span>
                    )}
                    {idx === respondentArr.length - 1 && isEditing && (
                      <button
                        className="newrecord-add-btn add-btn-absolute"
                        type="button"
                        onClick={() => {
                          setEditData(prev => ({
                            ...prev,
                            respondents: [
                              ...prev.respondents,
                              { lastName: "", firstName: "", middleName: "", extension: "", sex: "", birthDate: "", province: "", cityMunicipality: "", barangay: "", addressSpecific: "", contactNo: "", email: "" }
                            ]
                          }));
                        }}
                      >
                        + ADD
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Case Management - Mediation Proceedings */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Case Management - Mediation</h1>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              {mediationArr.map((row, idx) => (
                <tr key={row.id || idx} style={{ position: idx === mediationArr.length - 1 ? "relative" : "static" }}>
                  <td>{`Mediation Proceedings ${idx + 1}`}</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="date"
                        data-field="mediationDate"
                        data-idx={idx}
                        value={row.date || ""}
                        onChange={e => handleEditArrayChange("mediationRows", idx, "date", e.target.value)}
                        placeholder = "Select Date"
                      />
                    ) : (
                      <span >{row.date}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="time"
                        data-field="mediationTime"
                        data-idx={idx}
                        value={row.time || ""}
                        onChange={e => handleEditArrayChange("mediationRows", idx, "time", e.target.value)}
                        placeholder = "Select Time"
                      />
                    ) : (
                      <span>{row.time}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={row.remarks || ""}
                          onChange={e => handleEditArrayChange("mediationRows", idx, "remarks", e.target.value)}
                          className="newrecord-input"
                          placeholder="Enter remarks"
                        />
                        {idx === mediationArr.length - 1 && (
                          <button
                            className="newrecord-add-btn add-btn-absolute"
                            type="button"
                            onClick={() => {
                              setEditData(prev => ({
                                ...prev,
                                mediationRows: [
                                  ...prev.mediationRows,
                                  { date: "", time: "", remarks: "" }
                                ]
                              }));
                            }}
                          >
                            + ADD
                          </button>
                        )}
                      </>
                    ) : (
                      <span>{row.remarks}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Management - Conciliation Proceedings */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Case Management - Conciliation</h1>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              {conciliationArr.map((row, idx) => (
                <tr key={row.id || idx} style={{ position: idx === conciliationArr.length - 1 ? "relative" : "static" }}>
                  <td>{`Conciliation Proceedings ${idx + 1}`}</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="date"
                        data-field="conciliationDate"
                        data-idx={idx}
                        value={row.date || ""}
                        onChange={e => handleEditArrayChange("conciliationRows", idx, "date", e.target.value)}
                        placeholder = "Select Date"
                      />
                    ) : (
                      <span>{row.date}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="time"
                        data-field="conciliationTime"
                        data-idx={idx}
                        value={row.time || ""}
                        onChange={e => handleEditArrayChange("conciliationRows", idx, "time", e.target.value)}
                        placeholder = "Select Time"
                      />
                    ) : (
                      <span>{row.time}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={row.remarks || ""}
                          onChange={e => handleEditArrayChange("conciliationRows", idx, "remarks", e.target.value)}
                          className="newrecord-input"
                          placeholder="Enter remarks"
                        />
                        {idx === conciliationArr.length - 1 && (
                          <button
                            className="newrecord-add-btn add-btn-absolute"
                            type="button"
                            onClick={() => {
                              setEditData(prev => ({
                                ...prev,
                                conciliationRows: [
                                  ...prev.conciliationRows,
                                  { date: "", time: "", remarks: "" }
                                ]
                              }));
                            }}
                          >
                            + ADD
                          </button>
                        )}
                      </>
                    ) : (
                      <span>{row.remarks}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Management - Arbitration Proceedings */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Case Management - Arbitration</h1>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              {arbitrationArr.map((row, idx) => (
                <tr key={row.id || idx} style={{ position: idx === arbitrationArr.length - 1 ? "relative" : "static" }}>
                  <td>{`Arbitration Proceedings ${idx + 1}`}</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="date"
                        data-field="arbitrationDate"
                        data-idx={idx}
                        value={row.date || ""}
                        onChange={e => handleEditArrayChange("arbitrationRows", idx, "date", e.target.value)}
                        placeholder = "Select Date"
                      />
                    ) : (
                      <span>{row.date}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="time"
                        data-field="arbitrationTime"
                        data-idx={idx}
                        value={row.time || ""}
                        onChange={e => handleEditArrayChange("arbitrationRows", idx, "time", e.target.value)}
                        placeholder = "Select Time"
                      />
                    ) : (
                      <span>{row.time}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={row.remarks || ""}
                          onChange={e => handleEditArrayChange("arbitrationRows", idx, "remarks", e.target.value)}
                          className="newrecord-input"
                          placeholder="Enter remarks"
                        />
                        {idx === arbitrationArr.length - 1 && (
                          <button
                            className="newrecord-add-btn add-btn-absolute"
                            type="button"
                            onClick={() => {
                              setEditData(prev => ({
                                ...prev,
                                arbitrationRows: [
                                  ...prev.arbitrationRows,
                                  { date: "", time: "", remarks: "" }
                                ]
                              }));
                            }}
                          >
                            + ADD
                          </button>
                        )}
                      </>
                    ) : (
                      <span>{row.remarks}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Case Status - Section */}
      <div className="newrecord-main-content">
        <h1 style={{ color: "red" }}>Case Status</h1>

        {caseStatusArr.length === 0 && <div>No case status information.</div>}

        {caseStatusArr.map((row, idx) => {
          row.selectedStatis = row.status;
          const currentStatus = row.selectedStatis;

          return (
            <div
              key={row.id || idx}
              style={{
                position: idx === caseStatusArr.length - 1 ? "relative" : "static",
                marginBottom: "40px",
              }}
            >
              <div className="newrecord-table-row">
                <table className="case-status-table">
                  <tbody>
                    <tr>
                      <td
                        className="case-status-cell"
                        style={{ fontWeight: 600, width: 220 }}
                      >
                        Date:&nbsp;
                        {isEditing ? (
                        <input
                            type="text"
                            className="case-status-input fp-input"
                            data-fp="date"
                            data-field="caseStatusDate"
                            data-idx={idx}
                            value={row.statusDate || ""}
                            onChange={(e) => handleCaseStatusChange(idx, "statusDate", e.target.value)}
                            style={{ width: "70%" }}
                            placeholder = "Select Date"
                            noCalendar = "False"
                          />
                        ) : (
                          <span>{row.statusDate}</span>
                        )}
                      </td>

                      {/* Status Options (e.g., Pending, Settled, etc.) */}
                      {statusOptions.map((option) => (
                        <td
                          key={option}
                          className={`case-status-cell status-btn${
                            currentStatus === option ? " selected" : ""
                          }`}
                          style={{
                            textAlign: "center",
                            cursor: isEditing ? "pointer" : "default",
                          }}
                          onClick={() => {
                            if (isEditing) {
                              handleCaseStatusChange(idx, "selectedStatus", option);
                              handleCaseStatusChange(idx, "status", option);
                            }
                          }}
                        >
                          {option}
                        </td>
                      ))}

                      {/* + ADD button - only appears on last row while editing */}
                      {isEditing && idx === caseStatusArr.length - 1 && (
                        <td>
                          <button
                            className="newrecord-add-btn"
                            style={{ marginRight: "10%" }}
                            onClick={handleAddCaseStatus}
                            type="button"
                          >
                            + ADD
                          </button>
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Repudiated and Execution tables (visible only if Settled Amicably) */}
              {currentStatus === "Settled Amicably" && (
                <>
                  {/* Repudiated Table */}
                  <table className="case-status-table">
                    <tbody>
                      <tr>
                        <td
                          className="case-status-cell"
                          style={{ fontWeight: 600, background: "#f8f8f8" }}
                        >
                          <span>{currentStatus}</span>
                        </td>
                        <td
                          className="case-status-cell"
                          style={{
                            fontWeight: 600,
                            borderBottomColor: "#ffffff",
                          }}
                        >
                          Main Point of Agreement/Award:
                        </td>
                      </tr>
                      <tr>
                        <td
                          className="case-status-cell"
                          style={{ fontWeight: 600, width: 220 }}
                        >
                          Repudiated?&nbsp;
                          {isEditing ? (
                            <>
                              <span
                                className={`pill-radio${
                                  row.repudiated === "Yes" ? " selected" : ""
                                }`}
                                onClick={() =>
                                  handleCaseStatusChange(idx, "repudiated", "Yes")
                                }
                              >
                                Yes
                              </span>
                              <span style={{ margin: "0 8px" }}>or</span>
                              <span
                                className={`pill-radio${
                                  row.repudiated === "No" ? " selected" : ""
                                }`}
                                onClick={() =>
                                  handleCaseStatusChange(idx, "repudiated", "No")
                                }
                              >
                                No
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                className={`pill-radio${
                                  row.repudiated === "Yes" ? " selected" : ""
                                }`}
                                style={{ cursor: "default" }}
                              >
                                Yes
                              </span>
                              <span style={{ margin: "0 8px" }}>or</span>
                              <span
                                className={`pill-radio${
                                  row.repudiated === "No" ? " selected" : ""
                                }`}
                                style={{ cursor: "default" }}
                              >
                                No
                              </span>
                            </>
                          )}
                        </td>
                        <td
                          className="case-status-cell"
                          style={{ verticalAlign: "top", paddingTop: "0px" }}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.mainPoint || ""}
                              onChange={(e) =>
                                handleCaseStatusChange(idx, "mainPoint", e.target.value)
                              }
                              className="case-status-input"
                              placeholder="Enter main point of agreement/award"
                            />
                          ) : (
                            <span>{row.mainPoint}</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Execution Table */}
                  <table className="case-status-table">
                    <tbody>
                      <tr>
                        <td
                          className="case-status-cell"
                          style={{ fontWeight: 600, width: 220 }}
                        >
                          Execution
                        </td>
                        <td
                          className="case-status-cell"
                          style={{
                            fontWeight: 600,
                            width: 240,
                            textAlign: "center",
                          }}
                        >
                          {isEditing ? (
                            <>
                              <span
                                className={`pill-radio${
                                  row.execution === "Yes" ? " selected" : ""
                                }`}
                                onClick={() =>
                                  handleCaseStatusChange(idx, "execution", "Yes")
                                }
                              >
                                Yes
                              </span>
                              <span style={{ margin: "0 8px" }}>or</span>
                              <span
                                className={`pill-radio${
                                  row.execution === "No" ? " selected" : ""
                                }`}
                                onClick={() =>
                                  handleCaseStatusChange(idx, "execution", "No")
                                }
                              >
                                No
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                className={`pill-radio${
                                  row.execution === "Yes" ? " selected" : ""
                                }`}
                                style={{ cursor: "default" }}
                              >
                                Yes
                              </span>
                              <span style={{ margin: "0 8px" }}>or</span>
                              <span
                                className={`pill-radio${
                                  row.execution === "No" ? " selected" : ""
                                }`}
                                style={{ cursor: "default" }}
                              >
                                No
                              </span>
                            </>
                          )}
                        </td>
                        <td className="case-status-cell" style={{ width: 205 }}>
                          Date:&nbsp;
                          {isEditing ? (
                            <input
                              type="text"
                              className="case-status-input fp-input"
                              data-fp="date"
                              data-field="executionDate"
                              data-idx={idx}
                              value={row.executionDate || ""}
                              onChange={(e) => handleCaseStatusChange(idx, "executionDate", e.target.value)}
                              style={{ width: "60%" }}
                              placeholder = "Select Date"
                              noCalendar = "False"
                            />
                          ) : (
                            <span>{row.executionDate}</span>
                          )}
                        </td>
                        <td className="case-status-cell">
                          Reason:&nbsp;
                          {isEditing ? (
                            <input
                              type="text"
                              value={row.executionReason || ""}
                              onChange={(e) =>
                                handleCaseStatusChange(
                                  idx,
                                  "executionReason",
                                  e.target.value
                                )
                              }
                              className="case-status-input"
                              placeholder="Enter reason"
                              style={{ width: "85%" }}
                            />
                          ) : (
                            <span>{row.executionReason}</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Compliance to Amicable Settlement */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Compliance to Amicable Settlement</h1>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              {ammicableArr.map((row, idx) => (
                <tr key={row.id || idx} style={{ position: idx === ammicableArr.length - 1 ? "relative" : "static" }}>
                  <td style={{ width: "20%" }}>
                    <span style={{marginRight: 12}}>Date:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        className="newrecord-input fp-input"
                        data-fp="date"
                        data-field="ammicableDate"
                        data-idx={idx}
                        value={row.date || ""}
                        onChange={e => handleEditArrayChange("ammicableRows", idx, "date", e.target.value)}
                        style={{ width: "70%" }}
                        placeholder = "Select Date"
                      />
                    ) : (
                      <span>{row.date}</span>
                    )}
                  </td>
                  <td>
                    <span style={{marginLeft: 12, marginRight: 12 }}>Remarks:</span>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={row.remarks || ""}
                          onChange={e => handleEditArrayChange("ammicableRows", idx, "remarks", e.target.value)}
                          className="newrecord-input"
                          placeholder="Enter remarks"
                          style={{ width: "90%" }}
                        />
                        {idx === ammicableArr.length - 1 && (
                          <button
                            className="newrecord-add-btn"
                            type="button"
                            onClick={() => {
                              setEditData(prev => ({
                                ...prev,
                                ammicableRows: [
                                  ...prev.ammicableRows,
                                  { date: "", time: "", remarks: "" }
                                ]
                              }));
                            }}
                          >
                            + ADD
                          </button>
                        )}
                      </>
                    ) : (
                      <span>{row.remarks}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Uploads (rendered by showUploadedFile component) */}
      { /* pass caseNumber (from useParams) */ }
      <ShowUploadedFile caseNumber={caseNumber} />

      {/* Submitting overlay */}
      {loading && (
        <div style={{
          position: "fixed",
          left: 0, top: 0, right: 0, bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.35)",
          zIndex: 9999
        }}>
          <div style={{
            background: "#fff",
            padding: "18px 22px",
            borderRadius: 6,
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
            fontWeight: 700,
            color: "#222"
          }}>
            Submitting case, please wait...
          </div>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div style={{
          position: "fixed",
          top: 20,
          right: "30px",
          background: "#27ae60",
          color: "#fff",
          borderRadius: "8px",
          padding: "14px 28px",
          fontWeight: 600,
          fontSize: "1.1rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          zIndex: 9998,
          display: "flex",
          alignItems: "center"
        }}>
          Case submitted successfully.
        </div>
      )}

      {/* Error toast */}
      {showError && (
        <div style={{
          position: "fixed",
          right: 20,
          top: 20,
          padding: "12px 18px",
          background: "#fff2f2",
          color: "#a40000",
          border: "1px solid #a40000",
          borderRadius: 6,
          fontWeight: 700,
          zIndex: 9999
        }}>
          {errorMessage || "Error submitting case."}
        </div>
      )}

      {/* Sticky Edit/Submit/Cancel Buttons */}
      <div className="sticky-button-panel">
        {isEditing ? (
          <>
            <button
              className="sticky-btn submit"
              style={{ marginLeft: 25 }}
              onClick={handleSubmitEdit}
              disabled={submitting}
            >
              <span>SUBMIT</span>
            </button>
            <button
              className="sticky-btn"
              style={{ marginLeft: 25 }}
              onClick={handleCancelEdit}
              disabled={submitting}
            >
              CANCEL
            </button>
          </>
        ) : (
          <button
            className="sticky-btn submit"
            onClick={handleEditClick}
          >
            <img src={editIcon} alt="Edit" style={{ marginRight: "10px "}}/>
            <span>EDIT</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ViewRecordPage;