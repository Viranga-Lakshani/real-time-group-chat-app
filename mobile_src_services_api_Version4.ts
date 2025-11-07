/**
 * Lightweight API client for HTTP endpoints.
 * For demo auth we store the token in memory/local storage.
 */
import axios from "axios";
import Constants from "expo-constants";

const API = process.env.NEXT_PUBLIC_API_URL || Constants.manifest?.extra?.apiUrl || "http://localhost:4000";

let token: string | null = null;

export function setToken(t: string | null) {
  token = t;
}

export async function login(name: string) {
  const res = await axios.post(`${API}/api/auth/login`, { name });
  setToken(res.data.token);
  return res.data;
}

export async function getChannels() {
  const res = await axios.get(`${API}/api/channels`);
  return res.data;
}

export async function createChannel(name: string) {
  const res = await axios.post(`${API}/api/channels`, { name });
  return res.data;
}

export async function fetchMessages(channelId: string) {
  const res = await axios.get(`${API}/api/channels/${channelId}/messages`);
  return res.data;
}

export async function uploadMedia(fileUri: string, filename: string) {
  // Read file and send multipart form
  const form = new FormData();
  // @ts-ignore - React Native FormData file addition
  form.append("file", {
    uri: fileUri,
    name: filename,
    type: "application/octet-stream",
  });
  const res = await fetch(`${API}/api/media/upload`, {
    method: "POST",
    body: form as any,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.json();
}

export function getApiUrl() {
  return API;
}

export function getToken() {
  return token;
}