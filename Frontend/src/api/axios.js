import axios from "axios";

export default axios.create({
  baseURL: "http://3.219.228.156/api", // backend Express
  headers: {
    "Content-Type": "application/json",
  },
});
