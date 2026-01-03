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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="role-select-label">Rôle</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={role}
            label="Rôle"
            onChange={(e) => setRole(e.target.value)}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              },
            }}
          >
            <MenuItem value="admin">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AdminIcon fontSize="small" />
                <span>Administrateur</span>
              </div>
            </MenuItem>
            <MenuItem value="superadmin">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SuperAdminIcon fontSize="small" />
                <span>Super Administrateur</span>
              </div>
            </MenuItem>
            <MenuItem value="gestionnaireColis">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GestionnaireColisIcon fontSize="small" />
                <span>Gestionnaire de Colis</span>
              </div>
            </MenuItem>
          </Select>
        </FormControl>

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

          <div className="login-field" style={{ position: "relative" }}>
            <label>
              <Lock style={{ verticalAlign: "middle", marginRight: "8px" }} />
              Mot de passe
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
              className="login-input"
              style={{ paddingRight: "10px" }} // espace pour l'icône
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                color: "#9694949a",
                position: "absolute",
                right: "1px",
                top: "78%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </span>
          </div>

          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
