/**
 * Socket.IO client wrapper.
 * Connects with token (demo) and exposes helper to join channels and send messages.
 */
import { io, Socket } from "socket.io-client";
import { getApiUrl, getToken } from "./api";

let socket: Socket | null = null;

export function connectSocket() {
  const API = getApiUrl();
  const token = getToken();
  socket = io(API, { auth: { token } });
  return socket;
}

export function getSocket() {
  return socket;
}