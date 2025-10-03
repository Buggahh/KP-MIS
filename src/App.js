import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import './styles/App.css';
import { db } from "./firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import PortalPage from "./PortalPage";
import DatabasePage from "./DatabasePage";
import NewRecordPage from "./NewRecordPage";
import ReportsPage from "./ReportsPage";
import DashboardPage from "./DashboardPage";
import ProtectedRoute from "./ProtectedRoute";
import userIcon from './icons/user.png';
import passwordIcon from './icons/password.png';
import eyeOffIcon from './icons/eye.png';
import eyeIcon from './icons/eye-off.png';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // No need for isAdmin state, rely on localStorage and ProtectedRoute
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username === '' || password === '') {
      setError('Please enter both username and password.');
      return;
    }

    // Query Firestore for a matching user
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        localStorage.setItem("isAdminLoggedIn", "true");
        localStorage.setItem("loggedInUsername", username);
        navigate("/portal"); // Navigate to /Portal after login
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Error logging in');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("loggedInUsername");
    setUsername('');
    setPassword('');
    setError('');
  };

  return (
    <Routes>
      <Route path="/" element={
        <div className="center-wrapper">
          <div className="login-stack">
            <h1 className="login-main-title">Katarungang Pambarangay (KP) <br />Management Information System (MIS)</h1>
            <div className="login-container">
              <div className="login-title-group">
                <h2 className="login-title">Sign In</h2>
                <div className="login-subtitle">Login with your account</div>
              </div>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <div className="input-wrapper">
                  <img
                    src={userIcon}
                    alt="User Icon"
                    className="input-icon-img"
                  />
                  <input
                    className="login-input"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="input-wrapper">
                  <img
                    src={passwordIcon}
                    alt="Password Icon"
                    className="input-icon-img"
                  />
                  <input
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <img
                    src={showPassword ? eyeOffIcon : eyeIcon}
                    alt={showPassword ? "Hide password" : "Show password"}
                    className="input-eye-img"
                    onClick={() => setShowPassword(v => !v)}
                    style={{ cursor: "pointer" }}
                    tabIndex={0}
                  />
                </div>
                <button className="login-btn" type="submit">LOGIN</button>
              </form>
              <div className="error">{error}</div>
            </div>
          </div>
          {/* < FirestoreTest/> */}
        </div>
      } />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <PortalPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/database"
        element={
          <ProtectedRoute>
            <DatabasePage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-record"
        element={
          <ProtectedRoute>
            <NewRecordPage onLogout={handleLogout}/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;