import axios from "axios";

// Get the API base URL from environment or use development default
// VITE_API_URL should include /api already (e.g., http://localhost:3000/api)
const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

console.log('🔧 Axios Base URL:', apiBaseUrl);

export default axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});
