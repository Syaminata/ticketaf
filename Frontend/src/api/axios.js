import axios from "axios";

// Get the API base URL from environment or use development default
// VITE_API_URL should include /api already (e.g., http://localhost:3000/api)
const apiBaseUrl = (import.meta.env.VITE_API_URL || "https://ticket-taf.itea.africa").replace(/\/$/, "");

const finalBaseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`;
console.log('🔧 Axios Base URL:', finalBaseUrl);

export default axios.create({
  baseURL: finalBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});
