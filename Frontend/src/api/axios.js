import axios from "axios";

// Prefer env value, fallback to production instance URL
const root = (import.meta.env.VITE_API_URL || "https://ticket-taf.itea.africa").replace(/\/$/, "");

export default axios.create({
  baseURL: `${root}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});
