import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import storage from "../utils/storage";
import "../index.css";
import { Email, Lock } from "@mui/icons-material";
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { AdminPanelSettings as AdminIcon, SupervisedUserCircle as SuperAdminIcon } from '@mui/icons-material';
import logo from "../images/logo.png";

export default function Login({ setUser }) {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("/auth/login", { email, password, role });
      const userData = response.data.user;
      const token = response.data.token;

      storage.setToken(token);
      storage.setUser(userData);
      setUser(userData);

      if (userData.role === "admin" || userData.role === "superadmin") {
        navigate("/dashboard");
      } else {
        setError("Rôle non reconnu");
      }

    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) setError(err.response.data.message);
      else if (err.response?.status === 401) setError("Mot de passe incorrect");
      else if (err.response?.status === 404) setError("Utilisateur non trouvé");
      else setError("Erreur serveur ou identifiants invalides");
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="login-card fade-in">
        <div className="login-logo-container">
          <img src={logo} alt="Logo Ticketaf" className="login-logo" />
        </div>
        <div style={{ marginBottom: '5px' }}>
          <h2 className="login-title">Connexion au système</h2>
          <h4>Entrer vos identifiants pour accéder au tableau de bord</h4>
        </div>
        {error && <p className="login-error">{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', margin: '0 30px 10px 0' }}>
          <ToggleButtonGroup
            color="primary"
            value={role}
            exclusive
            onChange={(e, newRole) => newRole && setRole(newRole)}
            aria-label="Rôle"
            className="role-selector"
          >
            <ToggleButton value="admin" className="role-button">
              <Tooltip title="Administrateur">
                <div className="role-option">
                  <AdminIcon />
                  <span>Admin</span>
                </div>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="superadmin" className="role-button">
              <Tooltip title="Super Administrateur">
                <div className="role-option">
                  <SuperAdminIcon />
                  <span>Super Admin</span>
                </div>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>
              <Email style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez votre email"
              required
              className="login-input"
            />
          </div>

          <div className="login-field">
            <label>
              <Lock style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
              className="login-input"
            />
          </div>

          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
