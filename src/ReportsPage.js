import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./styles/ReportsPage.css";
import printIcon from "./icons/print.png";

function ReportsPage({ onLogout }) {
  const [username] = useState(localStorage.getItem("loggedInUsername") || "");
  const [selectedReport, setSelectedReport] = useState("summary"); // "statistical", "final", "summary", "performance"
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // "month", "quarter", "year"
  const [monthYear, setMonthYear] = useState(""); // For month/year fields
  const [quarter, setQuarter] = useState(""); // For quarter field
  const [year, setYear] = useState(""); // For year field

  const rows = [
    {
      caseNo: "2024-01-001",
      caseTitle: "KATHERINE M. DALENA\n-vs-\nGUILBERT P. GUVERINA",
      complaintTitle: "VIOL. OF SAFE SPACES ACT; SLIGHT PHYSICAL INJURY",
      nature: "CRIMINAL",
      dateFiled: "01-02-204",
      dateInitialConfrontation: "01-02-2024",
      actionTaken: "M",
      dateSettlementAward: "N/A",
      dateExecution: "01-02-2024",
      mainPoint: "RESPONDENT APOLOGIZED AND WAS FORGIVEN BY THE COMPLAINANT WITH AGREEMENT TO REIMBURSE PHP2,500 MEDICAL EXPENSES INCURRED",
      statusCompliance: "N/A",
      remarks: "SETTLED"
    },
    {
      caseNo: "2024-01-002",
      caseTitle: "TERESA MAÑLAC\n-vs-\nRUBY J. VILLANUEVA",
      complaintTitle: "COLLECTION OF SUM OF MONEY (LEASE RENTAL)",
      nature: "CIVIL",
      dateFiled: "01-03-2024",
      dateInitialConfrontation: "01-05-2024",
      actionTaken: "M",
      dateSettlementAward: "01-11-2024",
      dateExecution: "N/A",
      mainPoint: "RESPONDENT PROMISED TO PAY PHP164,000 UNPAID LEASE RENTAL ON INSTALLMENT BASIS WITHIN 18-MONTHS AND TO VOLUNTARY VACATE ON",
      statusCompliance: "COMPLIED",
      remarks: "SETTLED"
    }
  ];

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
            <Link to="/Database" className="header-link">Database</Link>
            <Link to="/New-Record" className="header-link">New Record</Link>
            <Link to="/Reports" className="header-link" style={{color : "#d3000eff"}}>Reports</Link>
          </nav>
        </div>
      </header>

      {/* Search Section Table */}
      <div className="reports-search-section">
        <table className="reports-search-table">
          <tbody>
            {/* 1st Row */}
            <tr>
              <td className="reports-generate-label">GENERATE:</td>
              <td className="oval-cell">
                <span
                  className={`reports-oval${selectedReport === "statistical" ? " selected" : ""}`}
                  onClick={() => setSelectedReport("statistical")}
                />
              </td>
              <td className="reports-report-label">Statistical Report</td>
              <td  className="oval-cell">
                <span
                  className={`reports-oval${selectedPeriod === "month" ? " selected" : ""}`}
                  onClick={() => setSelectedPeriod("month")}
                />
              </td>
              <td className="reports-period-label">Month</td>
              <td>
                <input
                  type="month"
                  className="reports-input"
                  value={monthYear}
                  onChange={e => setMonthYear(e.target.value)}
                  disabled={selectedPeriod !== "month"}
                />
              </td>
              <td />
              <td />
              <td rowSpan={4} className="reports-print-cell">
                <div className="reports-print-content">
                  <img src={printIcon} alt="Print" className="reports-print-icon" />
                  <span className="reports-print-label">PRINT</span>
                </div>
              </td>
            </tr>
            {/* 2nd Row */}
            <tr>
              <td />
              <td  className="oval-cell">
                <span
                  className={`reports-oval${selectedReport === "final" ? " selected" : ""}`}
                  onClick={() => setSelectedReport("final")}
                />
              </td>
              <td className="reports-report-label">Final Report of Settlement</td>
              <td  className="oval-cell">
                <span
                  className={`reports-oval${selectedPeriod === "quarter" ? " selected" : ""}`}
                  onClick={() => setSelectedPeriod("quarter")}
                />
              </td>
              <td className="reports-period-label">Quarter</td>
              <td>
                <input
                  type="month"
                  className="reports-input"
                  value={quarter}
                  onChange={e => setQuarter(e.target.value)}
                  disabled={selectedPeriod !== "quarter"}
                />
              </td>
              <td style={{ textAlign: "right" }}>Total Number of Records:</td>
              <td>
                <input
                  type="text"
                  className="reports-input"
                  readOnly
                  value={"NaN"}
                />
              </td>
            </tr>
            {/* 3rd Row */}
            <tr>
              <td />
              <td  className="oval-cell">
                <span
                  className={`reports-oval${selectedReport === "summary" ? " selected" : ""}`}
                  onClick={() => setSelectedReport("summary")}
                />
              </td>
              <td className="reports-report-label">Summary of Cases</td>
              <td  className="oval-cell">
                <span
                  className={`reports-oval${selectedPeriod === "year" ? " selected" : ""}`}
                  onClick={() => setSelectedPeriod("year")}
                />
              </td>
              <td className="reports-period-label">Year</td>
              <td>
                <input
                  type="number"
                  className="reports-input"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  disabled={selectedPeriod !== "year"}
                  min="1900"
                  max="2100"
                  placeholder="Year"
                />
              </td>
              <td />
              <td />
            </tr>
            {/* 4th Row */}
            <tr>
              <td />
              <td  className="oval-cell">
                <span
                  className={`reports-oval${selectedReport === "performance" ? " selected" : ""}`}
                  onClick={() => setSelectedReport("performance")}
                />
              </td>
              <td className="reports-report-label">Performance Report</td>
              <td />
              <td />
              <td />
              <td />
              <td />
            </tr>
          </tbody>
        </table>
      </div>

        {/* Reports Table */}
        <div className="database-reports-table-container">
          <table className="database-reports-table-list">
            <thead>
              <tr>
                <th>CASE NO.</th>
                <th>CASE TITLE (COMPLAINANT VS. RESPONDENT)</th>
                <th>COMPLAINT TITLE</th>
                <th>NATURE</th>
                <th>DATE FILED</th>
                <th>DATE OF INITIAL CONFRONTATION</th>
                <th>ACTION TAKEN (M, C, A, C w/ ep, C46+)</th>
                <th>DATE OF SETTLEMENT OR AWARD</th>
                <th>DATE OF EXECUTION OF SETTLEMENT OR AWARD</th>
                <th>MAIN POINT OF AGREEMENT</th>
                <th>STATUS OF COMPLIANCE ON THE SETTLEMENT OR AWARD</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.caseNo}</td>
                  <td style={{ whiteSpace: "pre-line" }}>{row.caseTitle}</td>
                  <td>{row.complaintTitle}</td>
                  <td>{row.nature}</td>
                  <td>{row.dateFiled}</td>
                  <td>{row.dateInitialConfrontation}</td>
                  <td>{row.actionTaken}</td>
                  <td>{row.dateSettlementAward}</td>
                  <td>{row.dateExecution}</td>
                  <td className="main-point-cell">{row.mainPoint}</td>
                  <td>{row.statusCompliance}</td>
                  <td>{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </>
  );
}

export default ReportsPage;