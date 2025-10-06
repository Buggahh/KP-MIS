import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./styles/DatabasePage.css";
import printIcon from "./icons/print.png";
import openIcon from "./icons/open.png";
import deleteIcon from "./icons/delete.png";
import { DatabaseSearch } from "./DatabaseSearch";

function DatabasePage({ onLogout }) {
  const [username] = useState(localStorage.getItem("loggedInUsername") || "");
  const [selectedTagRow, setSelectedTagRow] = useState(null);

  // Example data
  const rows = [
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    {
      year: "2025",
      caseNumber: "001",
      party: "Complainant",
      name: "FERNANDEZ, RAYMUND",
      nature: "Noise Disturbance",
      offense: "Ordinance Violation",
      status: "Open",
      date: "2025-10-03",
    },
    // ...more rows
  ];

  // Use the custom search hook
  const { year, setYear, filteredRows } = DatabaseSearch(rows);

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
              <td><input type="text" className="database-search-input case-number" /></td>

              <td className="database-search-label">Name of Party:</td>
              <td><input type="text" className="database-search-input" /></td>
              <td><input type="text" className="database-search-input" /></td>
              <td><input type="text" className="database-search-input" /></td>
              <td><input type="text" className="database-search-input" /></td>

              <td className="database-search-label">Total Number of Records:</td>
              <td>
                <input
                  type="text"
                  className="database-results-input"
                  readOnly
                  tabIndex={-1}
                  value={""} // Replace with your actual count
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
              value={""} // Replace with your actual count
            />
          </div>
          <div className="database-results-actions">
            <div className="database-results-action">
              <img src={printIcon} alt="Print" className="results-action-icon" />
              <span className="results-action-label print">
                PRINT<br />LIST
              </span>
            </div>
            <div className="database-results-action">
              <img src={openIcon} alt="Open" className="results-action-icon" />
              <span className="results-action-label open">
                OPEN<br />RECORD
              </span>
            </div>
            <div className="database-results-action">
              <img src={deleteIcon} alt="Delete" className="results-action-icon" />
              <span className="results-action-label delete">
                DELETE<br />RECORD
              </span>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="database-results-table-container">
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
        </div>
      </div>

    </>
  );
}

export default DatabasePage;