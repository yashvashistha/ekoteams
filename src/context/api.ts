// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // e.g. "https://yourdomain.com/api"
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
