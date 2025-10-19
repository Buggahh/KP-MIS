import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import "./styles/NewRecordPage.css";
import uploadIcon from './icons/upload.png';
import submitIcon from './icons/submit.png';
import { submitNewCase } from "./SubmitCase";
import { canWriteToFirestore } from "./RoleCheck";
import { uploadFile } from "./FileUploadUtil";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

function NewRecordPage({ onLogout }) {
  const [role, setRole] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("loggedInUsername") || "");

  // Case Status state options
  const statusOptions = [
    "On Going / Pending",
    "Settled Amicably",
    "Dismissed",
    "Withdrawn",
    "Referred to Other Office",
    "Certificate to File Action"
  ];

  // Separate state for each proceedings table
  const [mediationRows, setMediationRows] = useState([
    { date: "", time: "", remarks: "" }
  ]);
  const [conciliationRows, setConciliationRows] = useState([
    { date: "", time: "", remarks: "" }
  ]);
  const [arbitrationRows, setArbitrationRows] = useState([
    { date: "", time: "", remarks: "" }
  ]);
  const [ammicableRows, setAmmicableRows] = useState([
    { date: "", time: "", remarks: "" }
  ]);

  const [caseStatusRows, setCaseStatusRows] = useState([
    {
      statusDate: "",
      selectedStatus: "",
      repudiated: "",
      mainPoint: "",
      execution: "",
      executionDate: "",
      executionReason: ""
    }
  ]);

  // Complainants state
  const [complainants, setComplainants] = useState([
    {
      lastname: "",
      firstname: "",
      middlename: "",
      extension: "",
      nickname: "",
      sex: "",
      birthdate: "",
      province: "",
      city: "",
      barangay: "",
      specific: "",
      contact: "",
      email: ""
    }
  ]);

  // Respondents state
  const [respondents, setRespondents] = useState([
    {
      lastname: "",
      firstname: "",
      middlename: "",
      extension: "",
      nickname: "",
      sex: "",
      birthdate: "",
      province: "",
      city: "",
      barangay: "",
      specific: "",
      contact: "",
      email: ""
    }
  ]);

  // Add state for Complainant section inputs (before return)
  const initialComplainantSection = {
    caseIdNumber: "", // <-- add this
    dateTimeFiled: "",
    dateOfIncident: "",
    placeOfIncident: "",
    natureOfComplaint: "",
    offenseViolation: "",
    specific: ""
  };
  const [complainantSection, setComplainantSection] = useState(initialComplainantSection);

  // Handler for Complainant section inputs
  const handleComplainantSectionChange = (field, value) => {
    setComplainantSection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch user role from Firestore
  useEffect(() => {
    async function fetchRole() {
      if (!username) return;
      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setRole(userData.role || "Unknown");
      } else {
        setRole("Unknown");
      }
    }
    fetchRole();
  }, [username]);

  // Handlers for each table - Adds the rows
  const handleMediationChange = (idx, field, value) => {
    setMediationRows(rows =>
      rows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };
  const handleConciliationChange = (idx, field, value) => {
    setConciliationRows(rows =>
      rows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };
  const handleArbitrationChange = (idx, field, value) => {
    setArbitrationRows(rows =>
      rows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };
  const handleAmmicableChange = (idx, field, value) => {
    setAmmicableRows(rows =>
      rows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };

  const handleCaseStatusChange = (idx, field, value) => {
    setCaseStatusRows(rows =>
      rows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };

  // Updates the state of rows by making it blank
  const handleAddMediation = () => {
    setMediationRows(rows => [
      ...rows,
      { date: "", time: "", remarks: "" }
    ]);
  };
  const handleAddConciliation = () => {
    setConciliationRows(rows => [
      ...rows,
      { date: "", time: "", remarks: "" }
    ]);
  };
  const handleAddArbitration = () => {
    setArbitrationRows(rows => [
      ...rows,
      { date: "", time: "", remarks: "" }
    ]);
  };
  const handleAddAmmicable = () => {
    setAmmicableRows(rows => [
      ...rows,
      { date: "", time: "", remarks: "" }
    ]);
  };

  const handleComplainantChange = (idx, field, value) => {
    setComplainants(list =>
      list.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRespondentChange = (idx, field, value) => {
    setRespondents(list =>
      list.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddComplainant = () => {
    setComplainants(list => [
      ...list,
      {
        lastname: "",
        firstname: "",
        middlename: "",
        extension: "",
        nickname: "",
        sex: "",
        birthdate: "",
        province: "",
        city: "",
        barangay: "",
        specific: "",
        contact: "",
        email: ""
      }
    ]);
  };

  const handleAddRespondent = () => {
    setRespondents(list => [
      ...list,
      {
        lastname: "",
        firstname: "",
        middlename: "",
        extension: "",
        nickname: "",
        sex: "",
        birthdate: "",
        province: "",
        city: "",
        barangay: "",
        specific: "",
        contact: "",
        email: ""
      }
    ]);
  };

  const handleAddCaseStatus = () => {
    setCaseStatusRows(rows => [
      ...rows,
      {
        statusDate: "",
        selectedStatus: "",
        repudiated: "",
        mainPoint: "",
        execution: "",
        executionDate: "",
        executionReason: ""
      }
    ]);
  };

  const initialAmmicableRows = [
    { date: "", time: "", remarks: "" }
  ];

  const handleOpenUpload = (type) => {
    setUploadType(type);
    setShowUploadModal(true);
    setUploadError("");
    setUploadedUrl("");
  };

  // Submit handler for the sticky submit button
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmitCase = async () => {
    if (!canWriteToFirestore(role)) {
      alert("You dont have access to this");
      return;
    }
    setLoading(true);

    // Check for duplicate Case ID
    const caseIdToCheck = complainantSection.caseIdNumber;
    if (!caseIdToCheck) {
      setLoading(false);
      setErrorMessage("Case ID Number is required.");
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      return;
    }
    if (await isDuplicateCaseId(caseIdToCheck)) {
      setLoading(false);
      setErrorMessage("Check Case ID! Cannot be the same.");
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      return;
    }

    try {
      await submitNewCase(
        complainantSection,
        complainants,
        respondents,
        caseStatusRows,
        ammicableRows,
        {
          arbitrationRows,
          conciliationRows,
          mediationRows
        },
        complainantSection.caseIdNumber
      );
      setComplainantSection(initialComplainantSection);
      setComplainants([
        {
          lastname: "",
          firstname: "",
          middlename: "",
          extension: "",
          nickname: "",
          sex: "",
          birthdate: "",
          province: "",
          city: "",
          barangay: "",
          specific: "",
          contact: "",
          email: ""
        }
      ]);
      setRespondents([
        {
          lastname: "",
          firstname: "",
          middlename: "",
          extension: "",
          nickname: "",
          sex: "",
          birthdate: "",
          province: "",
          city: "",
          barangay: "",
          specific: "",
          contact: "",
          email: ""
        }
      ]);
      setAmmicableRows(initialAmmicableRows);
      setCaseStatusRows([
        {
          statusDate: "",
          selectedStatus: "",
          repudiated: "",
          mainPoint: "",
          execution: "",
          executionDate: "",
          executionReason: ""
        }
      ]);
      setArbitrationRows([{ date: "", time: "", remarks: "" }]);
      setConciliationRows([{ date: "", time: "", remarks: "" }]);
      setMediationRows([{ date: "", time: "", remarks: "" }]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    } catch (err) {
      setErrorMessage("Error submitting case: " + err.message);
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
    setLoading(false);
  };

  // Check for duplicate Case ID
  async function isDuplicateCaseId(caseId) {
    if (!caseId) return false;
    const caseDocRef = doc(db, "cases", caseId);
    const caseDocSnap = await getDoc(caseDocRef);
    return caseDocSnap.exists();
  }

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState(""); // e.g., "complaintSheet"
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  const handleFileUpload = async (file) => {
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadFile(file, uploadType);
      setUploadedUrl(url);
      // Save the url to your case state if needed
    } catch (err) {
      setUploadError("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  const dateTimeDateRef = useRef(null);   // date part of "Date & Time Filed"
  const dateTimeTimeRef = useRef(null);   // time part of "Date & Time Filed"
  const dateOfIncidentRef = useRef(null); // date of incident

  const fpDateRef = useRef(null); // flatpickr instance for date
  const fpTimeRef = useRef(null); // flatpickr instance for time
  const fpIncidentRef = useRef(null); // flatpickr instance for incident date

  useEffect(() => {
    // cleanup before reinitializing
    if (fpDateRef.current) { fpDateRef.current.destroy(); fpDateRef.current = null; }
    if (fpTimeRef.current) { fpTimeRef.current.destroy(); fpTimeRef.current = null; }
    if (fpIncidentRef.current) { fpIncidentRef.current.destroy(); fpIncidentRef.current = null; }

    // init date picker
    if (dateTimeDateRef.current) {
      fpDateRef.current = flatpickr(dateTimeDateRef.current, {
        dateFormat: "Y-m-d",
        allowInput: true,
        defaultDate: complainantSection.dateTimeFiled?.split("T")[0] || null,
        onChange: (selectedDates, dateStr) => {
          const currentTime = complainantSection.dateTimeFiled?.split("T")[1] || "";
          handleComplainantSectionChange(
            "dateTimeFiled",
            dateStr + (currentTime ? "T" + currentTime : "")
          );
        }
      });
    }

    // init time picker
    if (dateTimeTimeRef.current) {
      fpTimeRef.current = flatpickr(dateTimeTimeRef.current, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        defaultDate: complainantSection.dateTimeFiled?.split("T")[1] || null,
        onChange: (selectedDates, timeStr) => {
          const currentDate = complainantSection.dateTimeFiled?.split("T")[0] || "";
          handleComplainantSectionChange(
            "dateTimeFiled",
            (currentDate ? currentDate : "") + (timeStr ? "T" + timeStr : "")
          );
        }
      });
    }

    // init date of incident picker
    if (dateOfIncidentRef.current) {
      fpIncidentRef.current = flatpickr(dateOfIncidentRef.current, {
        dateFormat: "Y-m-d",
        allowInput: true,
        defaultDate: complainantSection.dateOfIncident || null,
        onChange: (selectedDates, dateStr) => {
          handleComplainantSectionChange("dateOfIncident", dateStr);
        }
      });
    }

    // cleanup on unmount
    return () => {
      if (fpDateRef.current) { fpDateRef.current.destroy(); fpDateRef.current = null; }
      if (fpTimeRef.current) { fpTimeRef.current.destroy(); fpTimeRef.current = null; }
      if (fpIncidentRef.current) { fpIncidentRef.current.destroy(); fpIncidentRef.current = null; }
    };
  }, [complainantSection.dateTimeFiled]); // 👈 Re-run effect when date/time changes

  // Generic flatpickr initializer for other date/time fields (birthdates, case management, case status, compliance)
  const fpMapRef = useRef(new Map());
  useEffect(() => {
    // destroy previous instances
    fpMapRef.current.forEach(inst => {
      try { inst.destroy(); } catch (e) {}
    });
    fpMapRef.current.clear();

    // helper to update relevant state from flatpickr change
    const setFieldFromFp = (section, idx, field, value) => {
      // idx may be null for single-value sections (not used here)
      switch (section) {
        case "complainant":
          if (idx !== null) handleComplainantChange(Number(idx), field, value);
          break;
        case "respondent":
          if (idx !== null) handleRespondentChange(Number(idx), field, value);
          break;
        case "mediation":
          if (idx !== null) handleMediationChange(Number(idx), field, value);
          break;
        case "conciliation":
          if (idx !== null) handleConciliationChange(Number(idx), field, value);
          break;
        case "arbitration":
          if (idx !== null) handleArbitrationChange(Number(idx), field, value);
          break;
        case "ammicable":
          if (idx !== null) handleAmmicableChange(Number(idx), field, value);
          break;
        case "caseStatus":
          if (idx !== null) handleCaseStatusChange(Number(idx), field, value);
          break;
        default:
          break;
      }
    };

    // attach to all elements with .fp-input
    const nodes = document.querySelectorAll(".fp-input");
    nodes.forEach(el => {
      const section = el.dataset.section;
      const field = el.dataset.field;
      const idx = el.dataset.idx !== undefined ? el.dataset.idx : null;
      const isTime = field === "time";
      const opts = isTime
        ? {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
            allowInput: true,
            defaultDate: el.value || null,
            onChange: (selectedDates, dateStr) => {
              setFieldFromFp(section, idx, field, dateStr);
            }
          }
        : {
            dateFormat: "Y-m-d",
            allowInput: true,
            defaultDate: el.value || null,
            onChange: (selectedDates, dateStr) => {
              setFieldFromFp(section, idx, field, dateStr);
            }
          };

      try {
        const inst = flatpickr(el, opts);
        fpMapRef.current.set(el, inst);
      } catch (err) {
        console.warn("flatpickr attach failed", err);
      }
    });

    // cleanup
    return () => {
      fpMapRef.current.forEach(inst => {
        try { inst.destroy(); } catch (e) {}
      });
      fpMapRef.current.clear();
    };
    // re-run when any dynamic array length changes so newly-added rows get pickers
  }, [complainants.length, respondents.length, mediationRows.length, conciliationRows.length, arbitrationRows.length, ammicableRows.length, caseStatusRows.length]);

  useEffect(() => {
    // update pickers if the state changes from other actions
    try {
      const datePart = complainantSection.dateTimeFiled?.split("T")[0] || "";
      const timePart = complainantSection.dateTimeFiled?.split("T")[1] || "";

      if (fpDateRef.current) {
        // setDate accepts ''/null to clear
        fpDateRef.current.setDate(datePart || null, false); // false: don't trigger onChange
      }
      if (fpTimeRef.current) {
        fpTimeRef.current.setDate(timePart || null, false);
      }
      if (fpIncidentRef.current) {
        fpIncidentRef.current.setDate(complainantSection.dateOfIncident || null, false);
      }

      // sync other pickers created via fpMapRef
      fpMapRef.current.forEach((inst, el) => {
        const section = el.dataset.section;
        const field = el.dataset.field;
        const idx = el.dataset.idx !== undefined ? Number(el.dataset.idx) : null;
        let desired = el.value || "";
        // read corresponding state for better sync
        switch (section) {
          case "complainant":
            if (idx !== null) desired = (complainants[idx]?.birthdate) || "";
            break;
          case "respondent":
            if (idx !== null) desired = (respondents[idx]?.birthdate) || "";
            break;
          case "mediation":
            if (idx !== null) desired = (mediationRows[idx]?.[field]) || "";
            break;
          case "conciliation":
            if (idx !== null) desired = (conciliationRows[idx]?.[field]) || "";
            break;
          case "arbitration":
            if (idx !== null) desired = (arbitrationRows[idx]?.[field]) || "";
            break;
          case "ammicable":
            if (idx !== null) desired = (ammicableRows[idx]?.[field]) || "";
            break;
          case "caseStatus":
            if (idx !== null) desired = (caseStatusRows[idx]?.[field]) || "";
            break;
          default:
            break;
        }
        try {
          inst.setDate(desired || null, false);
        } catch (e) {
          // ignore
        }
      });
    } catch (err) {
      // ignore minor sync errors
      console.warn("flatpickr sync:", err);
    }
  }, [complainantSection.dateTimeFiled, complainantSection.dateOfIncident,
      complainants, respondents, mediationRows, conciliationRows, arbitrationRows, ammicableRows, caseStatusRows]);

  return (
    <div className="new-record-page">
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.4)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "30px 40px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
            fontSize: "1.2rem",
            fontWeight: 500,
            textAlign: "center"
          }}>
            Submitting case, please wait...
          </div>
        </div>
      )}
      {showSuccess && (
        <div style={{
          position: "fixed",
          top: "150px",
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{marginRight: "10px"}}>
          <circle cx="12" cy="12" r="12" fill="#fff" opacity="0.2"/>
          <path d="M7 13.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Case Submitted
        </div>
      )}
      {showError && (
        <div style={{
          position: "fixed",
          top: "150px",
          right: "30px",
          background: "#e74c3c",
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{marginRight: "10px"}}>
          <circle cx="12" cy="12" r="12" fill="#fff" opacity="0.2"/>
          <path d="M12 8v4m0 4h.01M21 12.79V22H3V2h9.21M21 3l-9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {errorMessage}
        </div>
      )}
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
            <Link to="/Database" className="header-link">Database</Link>
            <Link to="/New-Record" className="header-link" style={{color : "#d3000eff"}}>New Record</Link>
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
                  <input
                    type="text"
                    className="newrecord-input"
                    placeholder="Enter Case ID"
                    value={complainantSection.caseIdNumber}
                    onChange={e =>
                      handleComplainantSectionChange("caseIdNumber", e.target.value)
                    }
                  />
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
          {/* Left Table */}
          <table className="complainant-table left">
            <tbody>
              <tr>
                <td className="complainant-label">Date &amp; Time Filed</td>
                <td>
                  <input
                    ref={dateTimeDateRef}
                    type="text"                        // flatpickr will attach to text input
                    className="newrecord-input small-input"
                    placeholder="Select Date"
                    // value is managed by flatpickr + sync effect, keep uncontrolled to let flatpickr manage input
                    onBlur={() => {
                      // if user typed directly, ensure state sync (flatpickr onChange may not fire)
                      const val = dateTimeDateRef.current?.value || "";
                      const currentTime = complainantSection.dateTimeFiled?.split("T")[1] || "";
                      if (val !== (complainantSection.dateTimeFiled?.split("T")[0] || "")) {
                        handleComplainantSectionChange("dateTimeFiled", val + (currentTime ? "T" + currentTime : ""));
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
                      const currentDate = complainantSection.dateTimeFiled?.split("T")[0] || "";
                      if (val !== (complainantSection.dateTimeFiled?.split("T")[1] || "")) {
                        handleComplainantSectionChange("dateTimeFiled", (currentDate ? currentDate : "") + (val ? "T" + val : ""));
                      }
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Date of Incident</td>
                <td>
                  <input
                    ref={dateOfIncidentRef}
                    type="text"
                    className="newrecord-input small-input"
                    placeholder="Select Date"
                    onBlur={() => {
                      const val = dateOfIncidentRef.current?.value || "";
                      if (val !== complainantSection.dateOfIncident) {
                        handleComplainantSectionChange("dateOfIncident", val);
                      }
                    }}
                  />
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Place of Incident</td>
                <td>
                  <input
                    type="text"
                    className="newrecord-input"
                    placeholder="Enter place"
                    value={complainantSection.placeOfIncident}
                    onChange={e =>
                      handleComplainantSectionChange("placeOfIncident", e.target.value)
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Right Table */}
          <table className="complainant-table right">
            <tbody>
              <tr>
                <td className="complainant-label" style={{ width: "20%" }}>
                  Nature of Complaint
                </td>
                <td>
                  <select
                    className="newrecord-input"
                    value={complainantSection.natureOfComplaint}

                    onChange={e =>
                      handleComplainantSectionChange("natureOfComplaint", e.target.value)
                    }
                  >
                    <option value="">Select</option>
                    <option value="Civil">Civil</option>
                    <option value="Criminal">Criminal</option>
                    <option value="Others">Others</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Offense/Violation</td>
                <td>
                  <input
                    type="text"
                    className="newrecord-input"
                    placeholder="Enter offense"
                    value={complainantSection.offenseViolation}
                    onChange={e =>
                      handleComplainantSectionChange("offenseViolation", e.target.value)
                    }
                  />
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Specific</td>
                <td>
                  <input
                    type="text"
                    className="newrecord-input"
                    placeholder="Enter specific"
                    value={complainantSection.specific}
                    onChange={e =>
                      handleComplainantSectionChange("specific", e.target.value)
                    }
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Complainant's Information Section */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Complainant’s Information</h1>
        {complainants.map((c, idx) => (
          <div
            key={idx}
            className="complainantInformation-row"
          >
            {/* Left Table */}
            <table className="complainantInformation-table left">
              <tbody>
                <tr>
                  <td className="complainantInformation-label">Lastname:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.lastname}
                      onChange={e => handleComplainantChange(idx, "lastname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Firstname:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.firstname}
                      onChange={e => handleComplainantChange(idx, "firstname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Middlename:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.middlename}
                      onChange={e => handleComplainantChange(idx, "middlename", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Extension:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.extension}
                      onChange={e => handleComplainantChange(idx, "extension", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Nickname:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.nickname}
                      onChange={e => handleComplainantChange(idx, "nickname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Sex/Gender:</td>
                  <td>
                    <select
                      style={{ width: "95%" }}
                      className="newrecord-input"
                      value={c.sex}
                      onChange={e => handleComplainantChange(idx, "sex", e.target.value)}
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
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Birthdate:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="complainant"
                      data-idx={idx}
                      data-field="birthdate"
                      placeholder="Select Date"
                      value={c.birthdate}
                      onChange={e => handleComplainantChange(idx, "birthdate", e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Right Table */}
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
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.province}
                      onChange={e => handleComplainantChange(idx, "province", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">City/Mun:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.city}
                      onChange={e => handleComplainantChange(idx, "city", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Barangay:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.barangay}
                      onChange={e => handleComplainantChange(idx, "barangay", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Specific:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.specific}
                      onChange={e => handleComplainantChange(idx, "specific", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">ContactNo:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.contact}
                      onChange={e => handleComplainantChange(idx, "contact", e.target.value)}
                    />
                  </td>
                </tr>
                <tr style={{ position: idx === complainants.length - 1 ? "relative" : "static" }}>
                  <td className="complainantInformation-label">EmailAdd:</td>
                  <td style={{ position: "relative" }}>
                    <input
                      type="email"
                      className="newrecord-input"
                      value={c.email}
                      onChange={e => handleComplainantChange(idx, "email", e.target.value)}
                    />
                    {idx === complainants.length - 1 && (
                      <button
                        className="newrecord-add-btn add-btn-absolute"
                        type="button"
                        onClick={handleAddComplainant}
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
        {respondents.map((c, idx) => (
          <div
            key={idx}
            className="respondentInformation-row"
          >
            {/* Left Table */}
            <table className="respondentInformation-table left">
              <tbody>
                <tr>
                  <td className="respondentInformation-label">Lastname:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.lastname}
                      onChange={e => handleRespondentChange(idx, "lastname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Firstname:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.firstname}
                      onChange={e => handleRespondentChange(idx, "firstname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Middlename:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.middlename}
                      onChange={e => handleRespondentChange(idx, "middlename", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Extension:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.extension}
                      onChange={e => handleRespondentChange(idx, "extension", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Nickname:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.nickname}
                      onChange={e => handleRespondentChange(idx, "nickname", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Sex/Gender:</td>
                  <td>
                    <select
                      style={{ width: "95%" }}
                      className="newrecord-input"
                      value={c.sex}
                      onChange={e => handleRespondentChange(idx, "sex", e.target.value)}
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
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Birthdate:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="respondent"
                      data-idx={idx}
                      data-field="birthdate"
                      placeholder="Select Date"
                      value={c.birthdate}
                      onChange={e => handleRespondentChange(idx, "birthdate", e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Right Table */}
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
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.province}
                      onChange={e => handleRespondentChange(idx, "province", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">City/Mun:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.city}
                      onChange={e => handleRespondentChange(idx, "city", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Barangay:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.barangay}
                      onChange={e => handleRespondentChange(idx, "barangay", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Specific:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.specific}
                      onChange={e => handleRespondentChange(idx, "specific", e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">ContactNo:</td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input"
                      value={c.contact}
                      onChange={e => handleRespondentChange(idx, "contact", e.target.value)}
                    />
                  </td>
                </tr>
                <tr style={{ position: idx === respondents.length - 1 ? "relative" : "static" }}>
                  <td className="respondentInformation-label">EmailAdd:</td>
                  <td style={{ position: "relative" }}>
                    <input
                      type="email"
                      className="newrecord-input"
                      value={c.email}
                      onChange={e => handleRespondentChange(idx, "email", e.target.value)}
                    />
                    {idx === respondents.length - 1 && (
                      <button
                        className="newrecord-add-btn add-btn-absolute"
                        type="button"
                        onClick={handleAddRespondent}
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
        <h1 style={{ color: 'red' }}>Case Management</h1>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              {mediationRows.map((row, idx) => (
                <tr key={idx} style={{ position: idx === mediationRows.length - 1 ? "relative" : "static" }}>
                  <td>
                    {`Mediation Proceedings ${idx + 1}`}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="mediation"
                      data-idx={idx}
                      data-field="date"
                      placeholder="Select Date"
                      value={row.date}
                      onChange={e => handleMediationChange(idx, "date", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="mediation"
                      data-idx={idx}
                      data-field="time"
                      placeholder="Select Time"
                      value={row.time}
                      onChange={e => handleMediationChange(idx, "time", e.target.value)}
                    />
                  </td>
                  <td style={{ paddingLeft: "0px" }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleMediationChange(idx, "remarks", e.target.value)}
                      className="newrecord-input"
                      placeholder="Enter remarks"
                    />
                    {idx === mediationRows.length - 1 && (
                      <button
                        className="newrecord-add-btn add-btn-absolute"
                        onClick={handleAddMediation}
                        type="button"
                      >
                        + ADD
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Management - Conciliation Proceedings */}
      <div className="newrecord-main-content" style={{ borderCollapse: 'collapse', paddingTop: 0 }}>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              {conciliationRows.map((row, idx) => (
                <tr key={idx} style={{ position: idx === conciliationRows.length - 1 ? "relative" : "static" }}>
                  <td>
                    {`Conciliation Proceedings ${idx + 1}`}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="conciliation"
                      data-idx={idx}
                      data-field="date"
                      placeholder="Select Date"
                      value={row.date}
                      onChange={e => handleConciliationChange(idx, "date", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="conciliation"
                      data-idx={idx}
                      data-field="time"
                      placeholder="Select Time"
                      value={row.time}
                      onChange={e => handleConciliationChange(idx, "time", e.target.value)}
                    />
                  </td>
                  <td style={{ paddingLeft: "0px" }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleConciliationChange(idx, "remarks", e.target.value)}
                      className="newrecord-input"
                      placeholder="Enter remarks"
                    />
                    {idx === conciliationRows.length - 1 && (
                      <button
                        className="newrecord-add-btn add-btn-absolute"
                        onClick={handleAddConciliation}
                        type="button"
                      >
                        + ADD
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Management - Arbitration Proceedings */}
      <div className="newrecord-main-content" style={{ borderCollapse: 'collapse', paddingTop: 0 }}>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              {arbitrationRows.map((row, idx) => (
                <tr key={idx} style={{ position: idx === arbitrationRows.length - 1 ? "relative" : "static" }}>
                  <td>
                    {`Arbitration Proceedings ${idx + 1}`}
                  </td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="arbitration"
                      data-idx={idx}
                      data-field="date"
                      placeholder="Select Date"
                      value={row.date}
                      onChange={e => handleArbitrationChange(idx, "date", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="arbitration"
                      data-idx={idx}
                      data-field="time"
                      placeholder="Select Time"
                      value={row.time}
                      onChange={e => handleArbitrationChange(idx, "time", e.target.value)}
                    />
                  </td>
                  <td style={{ paddingLeft: "0px" }}>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleArbitrationChange(idx, "remarks", e.target.value)}
                      className="newrecord-input"
                      placeholder="Enter remarks"
                    />
                    {idx === arbitrationRows.length - 1 && (
                      <button
                        className="newrecord-add-btn add-btn-absolute"
                        onClick={handleAddArbitration}
                        type="button"
                      >
                        + ADD
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Status - Section */}
      <div className="newrecord-main-content" >
        <h1 style={{ color: 'red' }}>Case Status</h1>
        {caseStatusRows.map((row, idx) => (
          <div key={idx} style={{ position: idx === caseStatusRows.length - 1 ? "relative" : "static" , marginBottom: "40px"}}>
            {/* Case Status - Status */}
            <div className="newrecord-table-row">
              <table className="case-status-table">
                <tbody>
                  <tr>
                    <td className="case-status-cell" style={{ width: 220 }}>
                      Date:&nbsp;
                      <input
                        type="text"
                        className="case-status-input fp-input"
                        data-section="caseStatus"
                        data-idx={idx}
                        data-field="statusDate"
                        value={row.statusDate}
                        onChange={e => handleCaseStatusChange(idx, "statusDate", e.target.value)}
                        style={{ width: "70%" }}
                        placeholder= "Select Date"
                      />
                    </td>
                    {statusOptions.map(option => (
                      <td
                        key={option}
                        className={`case-status-cell status-btn${row.selectedStatus === option ? " selected" : ""}`}
                        onClick={() => handleCaseStatusChange(idx, "selectedStatus", option)}
                        style={{textAlign: "center", cursor: "pointer" }}
                      >
                        {option}

                      </td>
                    ))}
                    {idx === caseStatusRows.length - 1 && (
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
            {/* Repudiated and Execution tables, only if Settled Amicably */}
            {row.selectedStatus === "Settled Amicably" && (
              <>
                {/* Repudiated Table */}
                <table className="case-status-table">
                  <tbody>
                    <tr>
                      <td className="case-status-cell" style={{fontWeight: 600, background: "#f8f8f8" }}>
                        {row.selectedStatus && <span>{row.selectedStatus}</span>}
                      </td>
                      <td className="case-status-cell" style={{fontWeight: 600, borderBottomColor: '#ffffff'}}>
                        Main Point of Agreement/Award:
                      </td>
                    </tr>
                    <tr>
                      <td className="case-status-cell" style={{fontWeight: 600,  width: 220}}>
                        Repudiated?&nbsp;
                        <span
                          className={`pill-radio${row.repudiated === "Yes" ? " selected" : ""}`}
                          onClick={() => handleCaseStatusChange(idx, "repudiated", "Yes")}
                        >Yes</span>
                        <span style={{ margin: "0 8px" }}>or</span>
                        <span
                          className={`pill-radio${row.repudiated === "No" ? " selected" : ""}`}
                          onClick={() => handleCaseStatusChange(idx, "repudiated", "No")}
                        >No</span>
                      </td>
                      <td
                        className="case-status-cell"
                        style={{ verticalAlign: "top" , paddingTop: "0px"}}>
                        <input
                          type="text"
                          value={row.mainPoint}
                          onChange={e => handleCaseStatusChange(idx, "mainPoint", e.target.value)}
                          className="case-status-input"
                          placeholder="Enter main point of agreement/award"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                {/* Execution Table */}
                <table className="case-status-table">
                  <tbody>
                    <tr>
                      <td className="case-status-cell" style={{fontWeight: 600,  width: 220}}>Execution</td>
                      <td className="case-status-cell" style={{fontWeight: 600,  width: 240, textAlign: "center" }}>
                        <span
                          className={`pill-radio${row.execution === "Yes" ? " selected" : ""}`}
                          onClick={() => handleCaseStatusChange(idx, "execution", "Yes")}
                        >Yes</span>
                        <span style={{ margin: "0 8px" }}>or</span>
                        <span
                          className={`pill-radio${row.execution === "No" ? " selected" : ""}`}
                          onClick={() => handleCaseStatusChange(idx, "execution", "No")}
                        >No</span>
                      </td>
                      <td className="case-status-cell" style={{ width: 205 }}>
                        Date:&nbsp;
                        <input
                          type="text"
                          className="case-status-input fp-input"
                          data-section="caseStatus"
                          data-idx={idx}
                          data-field="executionDate"
                          value={row.executionDate}
                          onChange={e => handleCaseStatusChange(idx, "executionDate", e.target.value)}
                          style={{ width: "60%" }}
                          placeholder="Select Date"
                          noCalendar = "false"
                        />
                      </td>
                      <td className="case-status-cell">
                        Reason:&nbsp;
                        <input
                          type="text"
                          value={row.executionReason}
                          onChange={e => handleCaseStatusChange(idx, "executionReason", e.target.value)}
                          className="case-status-input"
                          placeholder="Enter reason"
                          style={{ width: "85%" }}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Compliance to Amicable Settlement */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Compliance to Amicable Settlement</h1>
        <div className="newrecord-table-row">
          <table className="newrecord-table">
            <tbody>
              <tr>
              </tr>
              {ammicableRows.map((row, idx) => (
                <tr key={idx} style={{ position: idx === ammicableRows.length - 1 ? "relative" : "static" }}>
                  <td style={{ width: "20%" }}>
                    <span style={{marginRight: 12}}>Date:</span>
                    <input
                      type="text"
                      className="newrecord-input fp-input"
                      data-section="ammicable"
                      data-idx={idx}
                      data-field="date"
                      placeholder="Select Date"
                      value={row.date}
                      onChange={e => handleAmmicableChange(idx, "date", e.target.value)}
                      style={{ width: "70%" }}
                    />
                  </td>
                  <td style={{ paddingLeft: "0px" }}>
                    <span style={{marginLeft: 12, marginRight: 12 }}>Remarks:</span>
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={e => handleAmmicableChange(idx, "remarks", e.target.value)}
                      className="newrecord-input"
                      placeholder="Enter remarks"
                      style={{ width: "70%" }}
                    />
                    {idx === ammicableRows.length - 1 && (
                      <button
                        className="newrecord-add-btn"
                        onClick={handleAddAmmicable}
                        type="button"
                      >
                        + ADD
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Uploads */}
      <div className="newrecord-main-content" style = {{ marginBottom: "70px" }}>
        <h1 style={{ color: 'red' }}>Uploads</h1>
        <ul className="uploads-list">
          <li>
            <img
              src={uploadIcon}
              alt="Upload File"
              className="upload-icon"
              style={{ cursor: "pointer" }}
              tabIndex={0}
              onClick={() => handleOpenUpload("complaintSheet")}
            />
            <span className="upload-label">Complaint Sheet</span>
          </li>
          <li>
            <img
              src={uploadIcon}
              alt="Upload File"
              className="upload-icon"
              style={{ cursor: "pointer" }}
              tabIndex={0}
              onClick={() => handleOpenUpload("amicableSettlement")}
            />
            <span className="upload-label">Amicable Settlement</span>
          </li>
          <li>
            <img
              src={uploadIcon}
              alt="Upload File"
              className="upload-icon"
              style={{ cursor: "pointer" }}
              tabIndex={0}
              onClick={() => handleOpenUpload("certificateToFileAction")}
            />
            <span className="upload-label">Certificate to File Action</span>
          </li>
          <li>
            <img
              src={uploadIcon}
              alt="Upload File"
              className="upload-icon"
              style={{ cursor: "pointer" }}
              tabIndex={0}
              onClick={() => handleOpenUpload("photo")}
            />
            <span className="upload-label">Photo</span>
          </li>
        </ul>
      </div>

      <div className="sticky-button-panel">
        <button className="sticky-btn submit" onClick={handleSubmitCase}>
          <img src={submitIcon} alt="Submit" />
          <span>SUBMIT</span>
        </button>
      </div>

      {showUploadModal && (
  <div style={{
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.4)", zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center"
  }}>
    <div style={{
      background: "#fff", borderRadius: "12px", padding: "32px 40px",
      minWidth: "340px", minHeight: "220px", boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
      display: "flex", flexDirection: "column", alignItems: "center"
    }}>
      <h2 style={{marginBottom: 16}}>Upload {uploadType.replace(/([A-Z])/g, ' $1')}</h2>
      <div
        style={{
          border: "2px dashed #bbb", borderRadius: "8px", width: 260, height: 120,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
          background: "#fafafa", cursor: "pointer"
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={async e => {
          e.preventDefault();
          if (e.dataTransfer.files.length) {
            await handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => document.getElementById("file-upload-input").click()}
      >
        <span style={{color: "#888"}}>Drag & drop file here<br />or click to select</span>
        <input
          id="file-upload-input"
          type="file"
          accept="image/*,.pdf"
          style={{display: "none"}}
          onChange={async e => {
            if (e.target.files.length) {
              await handleFileUpload(e.target.files[0]);
            }
          }}
        />
      </div>
      {uploading && <div style={{marginBottom: 8}}>Uploading...</div>}
      {uploadError && <div style={{color: "#e74c3c", marginBottom: 8}}>{uploadError}</div>}
      {uploadedUrl && (
        <div style={{color: "#27ae60", marginBottom: 8}}>
          Uploaded! <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">View File</a>
        </div>
      )}
      <button
        style={{
          marginTop: 8, background: "#ed1c26", color: "#fff", border: "none",
          padding: "8px 18px", borderRadius: "6px", cursor: "pointer"
        }}
        onClick={() => setShowUploadModal(false)}
        disabled={uploading}
      >
        Close
      </button>
    </div>
  </div>
)}
    </div>
  );
}
export default NewRecordPage;
