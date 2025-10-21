import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles/DatabasePage.css";
import printIcon from "./icons/print.png";
import openIcon from "./icons/open.png";
import deleteIcon from "./icons/delete.png";
import { useDatabaseSearch } from "./utils/DatabaseSearch";
import { DatabaseDeleteRecord } from "./utils/DatabaseDeleteRecord";

function DatabasePage({ onLogout }) {
  const [username] = useState(localStorage.getItem("loggedInUsername") || "");
  const [selectedTagRow, setSelectedTagRow] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notification, setNotification] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const {
    year,
    setYear,
    caseNumber,
    setCaseNumber,
    lastname,
    setLastname,
    firstname,
    setFirstname,
    middlename,
    setMiddlename,
    extension,
    setExtension,
    filteredRows,
    loading,
    totalRecords,
  } = useDatabaseSearch(refreshKey);

  // Show confirmation modal
  const handleDeleteClick = () => {
    if (selectedTagRow !== null && filteredRows[selectedTagRow]) {
      setShowConfirm(true);
    }
  };

  // Delete record after confirmation
  const handleConfirmDelete = async () => {
    setDeleting(true);
    const selectedCaseId = filteredRows[selectedTagRow]?.caseNumber;
    if (selectedCaseId) {
      const success = await DatabaseDeleteRecord(selectedCaseId);
      if (success) {
        setNotification("Record deleted successfully!");
        setTimeout(() => setNotification(""), 1000);
        setRefreshKey(prev => prev + 1);
      }
    }
    setDeleting(false);
    setShowConfirm(false);
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  return (
    <>
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

      {/* Search Row */}
      <div className="database-search-wrapper">
        <table className="database-search-table">
          <tbody>
            <tr>
              <td className="section-title">SEARCH</td>
              <td className="database-search-label">Year:</td>
              <td>
                <input
                  type="text"
                  className="database-search-input year"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                />
              </td>
              <td className="database-search-label">Case Number:</td>
              <td>
                <input
                  type="text"
                  className="database-search-input case-number"
                  value={caseNumber}
                  onChange={e => setCaseNumber(e.target.value)}
                />
              </td>
              <td className="database-search-label">Name of Party:</td>
              <td>
                <input
                  type="text"
                  className="database-search-input"
                  value={lastname}
                  onChange={e => setLastname(e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="database-search-input"
                  value={firstname}
                  onChange={e => setFirstname(e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="database-search-input"
                  value={middlename}
                  onChange={e => setMiddlename(e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="database-search-input"
                  value={extension}
                  onChange={e => setExtension(e.target.value)}
                />
              </td>
              <td className="database-search-label">Total Number of Records:</td>
              <td>
                <input
                  type="text"
                  className="database-results-input"
                  readOnly
                  tabIndex={-1}
                  value={totalRecords}
                />
              </td>
            </tr>
            <tr>
              <td colSpan={6}></td>
              <td className="database-search-name-label">Lastname</td>
              <td className="database-search-name-label">Firstname</td>
              <td className="database-search-name-label">Middlename</td>
              <td className="database-search-name-label">Extension</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "#4BB543",
          color: "#fff",
          padding: "16px 24px",
          borderRadius: "8px",
          zIndex: 1000,
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
        }}>
          {notification}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001
        }}>
          <div style={{
            background: "#fff",
            padding: "32px",
            borderRadius: "12px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
            minWidth: "320px",
            textAlign: "center"
          }}>
            {deleting ? (
              <div>
                <div style={{ marginBottom: "12px", fontWeight: "bold", fontSize: "18px" }}>
                  Deleting record, please wait...
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "12px", fontWeight: "bold", fontSize: "18px" }}>
                  Are you sure you want to delete this record?
                </div>
                <button
                  style={{
                    background: "#4BB543",
                    color: "#fff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    marginRight: "12px",
                    cursor: "pointer"
                  }}
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                >
                  Yes
                </button>
                <button
                  style={{
                    background: "#ed1c26",
                    color: "#fff",
                    border: "none",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                  onClick={handleCancelDelete}
                  disabled={deleting}
                >
                  No
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results Row */}
      <div className="database-results-wrapper">
        <div className="database-results-row">
          <div className="database-results-left">
            <span className="database-results-title" style={{color: "#ed1c26", fontSize: "20px", fontWeight: "800", paddingLeft: "8px"}}>RESULTS</span>
            <span className="database-results-label">Number of Records Found:</span>
            <input
              type="text"
              className="database-results-input"
              readOnly
              tabIndex={-1}
              value={filteredRows.length}
            />
          </div>
          <div className="database-results-actions">
            <div className="database-results-action">
              <img src={printIcon} alt="Print" className="results-action-icon" />
              <span className="results-action-label print">
                PRINT<br />LIST
              </span>
            </div>
            <div
              className="database-results-action"
              style={{ cursor: selectedTagRow !== null ? "pointer" : "not-allowed", opacity: selectedTagRow !== null ? 1 : 0.5 }}
              onClick={() => {
                if (selectedTagRow !== null && filteredRows[selectedTagRow]) {
                  navigate(`/ViewRecord/${filteredRows[selectedTagRow].caseNumber}`);
                }
              }}
            >
              <img src={openIcon} alt="Open" className="results-action-icon" />
              <span className="results-action-label open">
                OPEN<br />RECORD
              </span>
            </div>
            <div
              className="database-results-action"
              onClick={handleDeleteClick}
              style={{ cursor: "pointer" }}
            >
              <img src={deleteIcon} alt="Delete" className="results-action-icon" />
              <span className="results-action-label delete">
                DELETE<br />RECORD
              </span>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="database-results-table-container">
          {loading ? (
            <div>Loading Database</div>
          ) : (
            <table className="database-results-table-list">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Case Number</th>
                  <th>Party</th>
                  <th>Name</th>
                  <th>Nature of Complaint</th>
                  <th>Offense/Violation</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="spacer-header"></th>
                  <th className="tag-header">Tag</th>
                </tr>
                <tr className="header-gap-row">
                  <td style={{height: "5px", borderLeft: "none", borderRight: "none", background: "#fff"}} colSpan={8}></td>
                  <td className="spacer-gap" style={{height: "5px", borderTop: "none", borderBottom: "none", background: "#fff"}}></td>
                  <td style={{height: "5px", borderLeft: "none", borderRight: "none", background: "#fff"}}></td>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.year}</td>
                    <td>{row.caseNumber}</td>
                    <td>{row.party}</td>
                    <td>{row.name}</td>
                    <td>{row.nature}</td>
                    <td>{row.offense}</td>
                    <td>{row.status}</td>
                    <td>{row.date}</td>
                    <td className="spacer-cell"></td>
                    <td
                      className={`tag-cell${selectedTagRow === idx ? " selected" : ""}`}
                      onClick={() => setSelectedTagRow(idx)}
                    >
                      {row.tag}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </>
  );
}

export default DatabasePage;