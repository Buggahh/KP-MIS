import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs
} from "firebase/firestore";
import "./styles/NewRecordPage.css";
import editIcon from './icons/edit.png';
import uploadIcon from './icons/upload.png';

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
  const navigate = useNavigate();
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

    // Helper to get all docs in a subcollection and return as array of data
    async function fetchSubcollection(subPath) {
      const colRef = collection(db, "cases", caseNumber, subPath);
      const snap = await getDocs(colRef);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Helper to flatten a single document with multiple id fields (arbitrationId1, ...)
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

    // Helper to flatten all caseStatus documents (caseStatusId1, caseStatusId2, ...)
    async function fetchCaseStatusDocs() {
      const colRef = collection(db, "cases", caseNumber, "caseStatus");
      const snap = await getDocs(colRef);
      // Each doc has fields: status, statusDate, etc.
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

  if (!caseData) return <div>Loading...</div>;

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
                  <span>{caseData.caseIdNumber || caseNumber}</span>
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
                  {(() => {
                    // Handle both string and Firestore Timestamp
                    let dateStr = "";
                    let timeStr = "";
                    if (caseData.dateTimeFiled) {
                      if (typeof caseData.dateTimeFiled === "object" && caseData.dateTimeFiled.seconds) {
                        const d = new Date(caseData.dateTimeFiled.seconds * 1000);
                        dateStr = d.toISOString().slice(0, 10);
                        timeStr = d.toTimeString().slice(0, 5);
                      } else if (typeof caseData.dateTimeFiled === "string") {
                        // Accepts "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD HH:mm"
                        const t = caseData.dateTimeFiled.replace("T", " ").split(" ");
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
                  })()}
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Date of Incident</td>
                <td>
                  <span>{formatTimestamp(caseData.dateOfIncident)}</span>
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Place of Incident</td>
                <td>
                  <span>{caseData.placeOfIncident}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <table className="complainant-table right">
            <tbody>
              <tr>
                <td className="complainant-label" style={{ width: "20%" }}>
                  Nature of Complaint
                </td>
                <td>
                  <span>{caseData.natureOfComplaint}</span>
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Offense/Violation</td>
                <td>
                  <span>{caseData.offenseViolation}</span>
                </td>
              </tr>
              <tr>
                <td className="complainant-label">Specific</td>
                <td>
                  <span>{caseData.specific}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Complainant's Information Section */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Complainant’s Information</h1>
        {complainants.length === 0 && <div>No complainant information.</div>}
        {complainants.map((c, idx) => (
          <div key={c.id || idx} className="complainantInformation-row">
            <table className="complainantInformation-table left" style={{ width: "50%", tableLayout: "fixed" }}>
              <tbody>
                <tr>
                  <td className="complainantInformation-label" style={{ width: "40%" }}>Lastname:</td>
                  <td style={{ width: "60%" }}><span>{c.lastName}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Firstname:</td>
                  <td><span>{c.firstName}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Middlename:</td>
                  <td><span>{c.middleName}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Extension:</td>
                  <td><span>{c.extension}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Sex/Gender:</td>
                  <td><span>{c.sex}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Birthdate:</td>
                  <td><span>{c.birthDate}</span></td>
                </tr>
              </tbody>
            </table>
            <table className="complainantInformation-table right" style={{ width: "50%", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th colSpan={2}>Address and Contact Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="complainantInformation-label" style={{ width: "40%" }}>Province:</td>
                  <td style={{ width: "60%" }}><span>{c.province}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">City/Mun:</td>
                  <td><span>{c.cityMunicipality}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Barangay:</td>
                  <td><span>{c.barangay}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">Specific:</td>
                  <td><span>{c.addressSpecific}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">ContactNo:</td>
                  <td><span>{c.contactNo}</span></td>
                </tr>
                <tr>
                  <td className="complainantInformation-label">EmailAdd:</td>
                  <td><span>{c.email}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Respondent's Information Section */}
      <div className="newrecord-main-content">
        <h1 style={{ color: 'red' }}>Respondent’s Information</h1>
        {respondents.length === 0 && <div>No respondent information.</div>}
        {respondents.map((c, idx) => (
          <div key={c.id || idx} className="respondentInformation-row">
            <table className="respondentInformation-table left" style={{ width: "50%", tableLayout: "fixed" }}>
              <tbody>
                <tr>
                  <td className="respondentInformation-label" style={{ width: "40%" }}>Lastname:</td>
                  <td style={{ width: "60%" }}><span>{c.lastName}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Firstname:</td>
                  <td><span>{c.firstName}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Middlename:</td>
                  <td><span>{c.middleName}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Extension:</td>
                  <td><span>{c.extension}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Sex/Gender:</td>
                  <td><span>{c.sex}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Birthdate:</td>
                  <td><span>{c.birthDate}</span></td>
                </tr>
              </tbody>
            </table>
            <table className="respondentInformation-table right" style={{ width: "50%", tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th colSpan={2}>Address and Contact Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="respondentInformation-label" style={{ width: "40%" }}>Province:</td>
                  <td style={{ width: "60%" }}><span>{c.province}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">City/Mun:</td>
                  <td><span>{c.cityMunicipality}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Barangay:</td>
                  <td><span>{c.barangay}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">Specific:</td>
                  <td><span>{c.addressSpecific}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">ContactNo:</td>
                  <td><span>{c.contactNo}</span></td>
                </tr>
                <tr>
                  <td className="respondentInformation-label">EmailAdd:</td>
                  <td><span>{c.email}</span></td>
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
              {mediationRows.length === 0 && (
                <tr><td colSpan={4}>No mediation proceedings.</td></tr>
              )}
              {mediationRows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{`Mediation Proceedings ${idx + 1}`}</td>
                  <td><span>{row.date}</span></td>
                  <td><span>{row.time}</span></td>
                  <td><span>{row.remarks}</span></td>
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
              {conciliationRows.length === 0 && (
                <tr><td colSpan={4}>No conciliation proceedings.</td></tr>
              )}
              {conciliationRows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{`Conciliation Proceedings ${idx + 1}`}</td>
                  <td><span>{row.date}</span></td>
                  <td><span>{row.time}</span></td>
                  <td><span>{row.remarks}</span></td>
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
              {arbitrationRows.length === 0 && (
                <tr><td colSpan={4}>No arbitration proceedings.</td></tr>
              )}
              {arbitrationRows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{`Arbitration Proceedings ${idx + 1}`}</td>
                  <td><span>{row.date}</span></td>
                  <td><span>{row.time}</span></td>
                  <td><span>{row.remarks}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Case Status - Section */}
      <div className="newrecord-main-content" >
        <h1 style={{ color: 'red' }}>Case Status</h1>
        {caseStatusRows.length === 0 && <div>No case status records.</div>}
        {caseStatusRows.map((row, idx) => (
          <div key={row.id || idx} style={{ marginBottom: "40px" }}>
            <div className="newrecord-table-row">
              <table className="case-status-table">
                <tbody>
                  <tr>
                    <td className="case-status-cell" style={{fontWeight: 600,  width: 220}}>
                      Date:&nbsp;
                      <span>{row.statusDate}</span>
                    </td>
                    {statusOptions.map(option => (
                      <td
                        key={option}
                        className={`case-status-cell status-btn${row.status === option ? " selected" : ""}`}
                        style={{textAlign: "center"}}
                      >
                        {option}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {row.status === "Settled Amicably" && (
              <>
                <table className="case-status-table">
                  <tbody>
                    <tr>
                      <td className="case-status-cell" style={{fontWeight: 600, background: "#f8f8f8" }}>
                        {row.status && <span>{row.status}</span>}
                      </td>
                      <td className="case-status-cell" style={{fontWeight: 600, borderBottomColor: '#ffffff'}}>
                        Main Point of Agreement/Award:
                      </td>
                    </tr>
                    <tr>
                      <td className="case-status-cell" style={{fontWeight: 600,  width: 220}}>
                        Repudiated?&nbsp;
                        <span className={`pill-radio${row.repudiated === "Yes" ? " selected" : ""}`}>Yes</span>
                        <span style={{ margin: "0 8px" }}>or</span>
                        <span className={`pill-radio${row.repudiated === "No" ? " selected" : ""}`}>No</span>
                      </td>
                      <td className="case-status-cell" style={{ verticalAlign: "top" , paddingTop: "0px"}}>
                        <span>{row.mainPoint}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table className="case-status-table">
                  <tbody>
                    <tr>
                      <td className="case-status-cell" style={{fontWeight: 600,  width: 220}}>Execution</td>
                      <td className="case-status-cell" style={{fontWeight: 600,  width: 240, textAlign: "center" }}>
                        <span className={`pill-radio${row.execution === "Yes" ? " selected" : ""}`}>Yes</span>
                        <span style={{ margin: "0 8px" }}>or</span>
                        <span className={`pill-radio${row.execution === "No" ? " selected" : ""}`}>No</span>
                      </td>
                      <td className="case-status-cell" style={{ width: 205 }}>
                        Date:&nbsp;
                        <span>{row.executionDate}</span>
                      </td>
                      <td className="case-status-cell">
                        Reason:&nbsp;
                        <span>{row.executionReason}</span>
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
              {ammicableRows.length === 0 && (
                <tr><td colSpan={2}>No compliance records.</td></tr>
              )}
              {ammicableRows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td style={{ width: 0 }}>
                    <span style={{marginRight: 12}}>Date:</span>
                    <span>{row.date}</span>
                  </td>
                  <td style={{ paddingLeft: "0px" }}>
                    <span style={{marginLeft: 12, marginRight: 12 }}>Remarks:</span>
                    <span>{row.remarks}</span>
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
              style={{ cursor: "default" }}
              tabIndex={-1}
            />
            <span className="upload-label">Complaint Sheet</span>
            {caseData.uploads?.complaintSheet && (
              <a href={caseData.uploads.complaintSheet} target="_blank" rel="noopener noreferrer" style={{marginLeft: 8}}>View</a>
            )}
          </li>
          <li>
            <img
              src={uploadIcon}
              alt="Upload File"
              className="upload-icon"
              style={{ cursor: "default" }}
              tabIndex={-1}
            />
            <span className="upload-label">Amicable Settlement</span>
            {caseData.uploads?.amicableSettlement && (
              <a href={caseData.uploads.amicableSettlement} target="_blank" rel="noopener noreferrer" style={{marginLeft: 8}}>View</a>
            )}
          </li>
          <li>
            <img
              src={uploadIcon}
              alt="Upload File"
              className="upload-icon"
              style={{ cursor: "default" }}
              tabIndex={-1}
            />
            <span className="upload-label">Certificate to File Action</span>
            {caseData.uploads?.certificateToFileAction && (
              <a href={caseData.uploads.certificateToFileAction} target="_blank" rel="noopener noreferrer" style={{marginLeft: 8}}>View</a>
            )}
          </li>
          <li>
            <img
              src={uploadIcon}
              alt="Upload File"
              className="upload-icon"
              style={{ cursor: "default" }}
              tabIndex={-1}
            />
            <span className="upload-label">Photo</span>
            {caseData.uploads?.photo && (
              <a href={caseData.uploads.photo} target="_blank" rel="noopener noreferrer" style={{marginLeft: 8}}>View</a>
            )}
          </li>
        </ul>
      </div>
      
      {/* Sticky Edit Button */}
      <div className="sticky-button-panel">
        <button
          className="sticky-btn submit"
          onClick={() => navigate(`/EditRecord/${caseNumber}`)}
        >
          <img src={editIcon} alt="Edit" />
          <span>EDIT</span>
        </button>
      </div>
    </div>
  );
}
export default ViewRecordPage;