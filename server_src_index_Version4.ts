/**
 * Entry point for chat server.
 * - HTTP REST API (Fastify) for channel/list/message fetch and media upload
 * - Socket.IO for realtime: join/leave, presence, typing, message events
 *
 * This file keeps things explicit and readable. Replace/demo auth with real user system in production.
 */
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import fs from "fs";
import http from "http";
import { Server as IOServer } from "socket.io";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import pino from "pino";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const prisma = new PrismaClient();

// Ensure upload dir
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = Fastify({ logger });
app.register(cors, { origin: true });
app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: "/uploads/" });

// Simple demo auth: POST /api/auth/login { name } -> { token, user }
// The token will simply be a base64 JSON (demo only). Replace with JWT/OAuth in production.
app.post("/api/auth/login", async (req, reply) => {
  const body = req.body as any;
  const name = body?.name || `guest-${Math.floor(Math.random() * 10000)}`;
  const user = await prisma.user.create({ data: { name } });
  // Demo token: encode user id in a simple string (NOT secure)
  const token = Buffer.from(JSON.stringify({ id: user.id, name: user.name })).toString("base64");
  return reply.send({ token, user });
});

// Channels CRUD
app.get("/api/channels", async (req, reply) => {
  const channels = await prisma.channel.findMany({ orderBy: { createdAt: "asc" } });
  return reply.send(channels);
});

app.post("/api/channels", async (req, reply) => {
  const body = req.body as any;
  const ch = await prisma.channel.create({ data: { name: body.name } });
  return reply.code(201).send(ch);
});

// Fetch messages for channel (including parents and replies)
app.get("/api/channels/:id/messages", async (req, reply) => {
  const { id } = req.params as any;
  const messages = await prisma.message.findMany({
    where: { channelId: id, parentId: null },
    include: { replies: true, sender: true },
    orderBy: { createdAt: "asc" },
  });
  return reply.send(messages);
});

// Media upload (dev: stores locally)
const upload = multer({ dest: UPLOAD_DIR });
app.post("/api/media/upload", { preHandler: upload.single("file") }, async (req: any, reply) => {
  // multer attaches file metadata
  const file = req.file;
  if (!file) return reply.code(400).send({ error: "No file uploaded" });
  // To keep filenames unique, rename with UUID
  const ext = path.extname(file.originalname);
  const destName = `${uuidv4()}${ext}`;
  fs.renameSync(file.path, path.join(UPLOAD_DIR, destName));
  const url = `/uploads/${destName}`;
  return reply.send({ url });
});

// Basic health check
app.get("/health", async () => ({ status: "ok", now: new Date().toISOString() }));

const server = http.createServer(app.server);
const io = new IOServer(server, {
  cors: { origin: true },
});

// In-memory presence map: channelId -> Set of userIds
const presence = new Map<string, Set<string>>();

/**
 * Helper to parse demo token from query param
 */
function parseDemoToken(token?: string) {
  if (!token) return null;
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

io.use((socket, next) => {
  // demo auth via handshake query token
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  const user = parseDemoToken(token as string);
  if (!user) {
    // Allow anonymous users? For now reject
    return next(new Error("Authentication error"));
  }
  (socket as any).user = user;
  next();
});

io.on("connection", (socket) => {
  const user = (socket as any).user;
  logger.info({ user }, "socket connected");

  socket.on("joinChannel", async (channelId: string) => {
    socket.join(channelId);
    // update presence map
    if (!presence.has(channelId)) presence.set(channelId, new Set());
    presence.get(channelId)!.add(user.id);

    const participants = Array.from(presence.get(channelId) || []);
    io.to(channelId).emit("presence:update", { channelId, participants });

    logger.info({ channelId, user: user.id }, "joined channel");
  });

  socket.on("leaveChannel", (channelId: string) => {
    socket.leave(channelId);
    if (presence.has(channelId)) {
      presence.get(channelId)!.delete(user.id);
      const participants = Array.from(presence.get(channelId) || []);
      io.to(channelId).emit("presence:update", { channelId, participants });
    }
    logger.info({ channelId, user: user.id }, "left channel");
  });

  socket.on("typing", (payload: { channelId: string; isTyping: boolean }) => {
    socket.to(payload.channelId).emit("typing:update", { userId: user.id, isTyping: payload.isTyping });
  });

  socket.on("message:new", async (payload: { channelId: string; body?: string; parentId?: string; mediaUrl?: string }) => {
    try {
      // persist message
      const msg = await prisma.message.create({
        data: {
          channelId: payload.channelId,
          senderId: user.id,
          body: payload.body ?? null,
          mediaUrl: payload.mediaUrl ?? null,
          parentId: payload.parentId ?? null,
        },
        include: { sender: true },
      });
      // broadcast message to channel
      io.to(payload.channelId).emit("message:created", msg);
    } catch (err) {
      logger.error(err, "failed to create message");
      socket.emit("error", { error: "failed to create message" });
    }
  });

  socket.on("disconnecting", () => {
    // For each room the socket is in, remove presence
    const rooms = socket.rooms;
    rooms.forEach((room) => {
      if (presence.has(room)) {
        presence.get(room)!.delete(user.id);
        io.to(room).emit("presence:update", { channelId: room, participants: Array.from(presence.get(room) || []) });
      }
    });
  });

  socket.on("disconnect", () => {
    logger.info({ user }, "socket disconnected");
  });
});

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  logger.info(`Server listening on ${PORT}`);
});