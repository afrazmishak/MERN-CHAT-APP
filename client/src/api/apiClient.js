import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:500/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default apiClient;