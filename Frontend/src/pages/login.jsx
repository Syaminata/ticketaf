import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import storage from "../utils/storage";
import "../index.css";

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

      if (userData.role === "admin") {
        storage.setUser(userData);
        setUser(userData);
        navigate("/dashboard");
      } else if (userData.role === "superadmin") {
        storage.setUser(userData);
        setUser(userData);
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
      <div className="login-card">
        <h2 className="login-title">Connexion à TICKETAF</h2>

        <div className="login-role">
          <label>Se connecter en :</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="login-select"
          >
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>

        {error && <p className="login-error">{error}</p>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Email</label>
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
            <label>Mot de passe</label>
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
