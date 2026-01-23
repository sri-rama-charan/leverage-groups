import axios from "axios";

// Create a pre-configured instance of Axios
// This tells it to always look for the API at localhost:3000
const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// BEST PRACTICE: Interceptor to attach Token automatically
// This ensures we don't have to pass the token manually in every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`; // Standard Bearer format
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
