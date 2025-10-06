import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

function PortalPage({ onLogout }) {
  const [role, setRole] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("loggedInUsername") || "wala username");

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

  return (
    <div>
      <header className="header-container">
        {/* Top Row */}
        <div className="header-top-row">
          <div className="header-top-left">
            <img src="#" alt="Logo" className="header-logo" />
            <div className="header-top-titles">
              <div className="header-city">
                City of Mandaluyong
              </div>
              <div className="header-underline" />
              <div className="header-barangay">BARANGAY HIGHWAY HILLS</div>
            </div>
          </div>
          <div className="header-top-right">
            <span className="header-admin">
              {username ? `Username: ${username}` : ""} {/*role && `| Role: ${role}`*/}
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
            <Link to="/Dashboard" className="header-link" >Dashboard</Link>
            <Link to="/Database" className="header-link">Database</Link>
            <Link to="/New-Record" className="header-link">New Record</Link>
            <Link to="/Reports" className="header-link">Reports</Link>
          </nav>
        </div>
      </header>
    </div>
  );
}

export default PortalPage;