import React, { useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate
} from "react-router-dom";

import OrdersDashboard from "./components/OrdersDashboard";
import OrdersList      from "./components/OrdersList";
import SettingsPanel   from "./components/SettingsPanel";
import ScanOrderPage   from "./components/ScanOrderPage";
import WebScanner      from "./components/WebScanner";
import LoginPage       from "./components/LoginPage";
import PrivateRoute    from "./components/PrivateRoute";
import { AuthContext } from "./AuthContext";

export default function App() {
  const { user, logout } = useContext(AuthContext);

  return (
    <BrowserRouter>
      {user && (
        <nav style={{
          padding: 10, background: "#f0f0f0",
          display: "flex", alignItems: "center"
        }}>
          <NavLink to="/new"
            style={({ isActive }) => ({
              marginRight:8,
              fontWeight: isActive ? "bold" : "normal"
            })}
          >
            Nuovo Ordine
          </NavLink>

          <NavLink to="/list"
            style={({ isActive }) => ({
              marginRight:8,
              fontWeight: isActive ? "bold" : "normal"
            })}
          >
            Visualizza Ordini
          </NavLink>

          <NavLink to="/scanner"
            style={({ isActive }) => ({
              marginRight:8,
              fontWeight: isActive ? "bold" : "normal"
            })}
          >
            Scanner
          </NavLink>

          {user.username==="admin" && (
            <NavLink to="/settings"
              style={({ isActive }) => ({
                marginRight:8,
                fontWeight: isActive ? "bold" : "normal"
              })}
            >
              Impostazioni
            </NavLink>
          )}

          <button onClick={logout} style={{ marginLeft:"auto" }}>
            Logout
          </button>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/new"
          element={<PrivateRoute><OrdersDashboard/></PrivateRoute>}
        />

        <Route path="/list"
          element={<PrivateRoute><OrdersList/></PrivateRoute>}
        />

        <Route path="/scanner"
          element={<PrivateRoute><WebScanner/></PrivateRoute>}
        />

        <Route path="/settings"
          element={<PrivateRoute><SettingsPanel/></PrivateRoute>}
        />

        <Route path="/scan/:barcode"
          element={<PrivateRoute><ScanOrderPage/></PrivateRoute>}
        />

        <Route path="/"
          element={<Navigate to={user?"/list":"/login"} replace />}
        />

        <Route path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
