import axios from "axios";

export default axios.create({
  baseURL: "/api", // backend Express
  headers: {
    "Content-Type": "application/json",
  },
});
