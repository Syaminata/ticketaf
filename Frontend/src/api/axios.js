import axios from "axios";

export default axios.create({
  baseURL: "https://ticket-taf.itea.africa/api", // backend Express
  headers: {
    "Content-Type": "application/json",
  },
});
