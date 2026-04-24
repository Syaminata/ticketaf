import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import storage from "../utils/storage";
import "../index.css";
import { Email, Lock } from "@mui/icons-material";
import { FormControl, InputLabel, Select, MenuItem, Tooltip } from '@mui/material';
import { AdminPanelSettings as AdminIcon, SupervisedUserCircle as SuperAdminIcon, LocalShipping as GestionnaireColisIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import logo from "../images/logo.png";

export default function Login({ setUser }) {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    storage.removeToken();

    try {
      const response = await axios.post("/auth/login", { email, password, role });
      const userData = response.data.user;
      const token = response.data.token;

      storage.setToken(token);
      storage.setUser(userData);
      setUser(userData);

      if (userData.role === "gestionnaireColis") {
        navigate("/dashboard");
      } else if (userData.role === "admin" || userData.role === "superadmin") {
        navigate("/dashboard");
      } else {
        setError("Rôle non reconnu");
      }

    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) setError(err.response.data.message);
      else if (err.response?.status === 401) setError("Mot de passe incorrect");
      else if (err.response?.status === 404) setError("Utilisateur non trouvé");
      else setError("Token expiré");
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="login-card fade-in">
        <div style={{ marginBottom: '5px' }}>
          <h2 className="login-title">TICKETAF</h2>
          <h4>Connectez-vous pour accéder à votre espace.</h4>
        </div>
        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>
              <Email style={{ verticalAlign: 'middle', marginRight: '8px' , color: '#00000088'}} />
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

          <div className="login-field" style={{ '--delay': 3 }}>
            <label>
              <Lock style={{ verticalAlign: "middle", marginRight: "8px" , color: '#00000088'}} />
              Mot de passe
            </label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
                className="login-input"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </span>
            </div>
          </div>

          <div className="role-selector" style={{ 
            width: '100%',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '10px',
            justifyContent: 'space-between'
          }}>
            <button
              type="button"
              onClick={() => setRole('superadmin')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: role === 'superadmin' ? '2px solid #e6b547' : '1px solid #e2e8f0',
                backgroundColor: role === 'superadmin' ? 'rgba(230, 181, 71, 0.1)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <SuperAdminIcon style={{ color: role === 'superadmin' ? '#e6b547' : '#64748b' }} />
              <span style={{ fontSize: '0.8rem', color: role === 'superadmin' ? '#1e293b' : '#64748b', fontFamily: 'Inter, sans-serif' }}>Super Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('admin')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: role === 'admin' ? '2px solid #e6b547' : '1px solid #e2e8f0',
                backgroundColor: role === 'admin' ? 'rgba(230, 181, 71, 0.1)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <AdminIcon style={{ color: role === 'admin' ? '#e6b547' : '#64748b' }} />
              <span style={{ fontSize: '0.8rem', color: role === 'admin' ? '#1e293b' : '#64748b', fontFamily: 'Inter, sans-serif' }}>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('gestionnaireColis')}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                border: role === 'gestionnaireColis' ? '2px solid #e6b547' : '1px solid #e2e8f0',
                backgroundColor: role === 'gestionnaireColis' ? 'rgba(230, 181, 71, 0.1)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
            >
              <GestionnaireColisIcon style={{ color: role === 'gestionnaireColis' ? '#e6b547' : '#64748b' }} />
              <span style={{ fontSize: '0.8rem', color: role === 'gestionnaireColis' ? '#1e293b' : '#64748b', fontFamily: 'Inter, sans-serif' }}>Gestionnaire</span>
            </button>
          </div>

          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
