import axios from "axios";

// Create a pre-configured instance of Axios
// This tells it to always look for the API at localhost:3000
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
