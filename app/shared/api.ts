export const API_PATH =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://city-of-masters-backend-production.up.railway.app";

// app/shared/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: API_PATH,
});
type Specialist = {
  id: number;
  lat: number;
  lng: number;
  name?: string;
  isOnShift: boolean;
};

export async function getSpecialistsOnShift(): Promise<Specialist[]> {
  const response = await api.get("specialists/on-shift");
  return response.data;
}

export async function getSpecialists(): Promise<Specialist[]> {
  const response = await api.get("specialists");
  return response.data;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

