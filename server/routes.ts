import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupBot } from "./bot";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register integration routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Initialize Telegram Bot
  setupBot().catch(console.error);

  app.get('/api/users', async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get('/api/users/:id', async (req, res) => {
    const user = await storage.getUser(parseInt(req.params.id));
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  });

  app.get('/api/status', async (req, res) => {
    const count = await storage.getUserCount();
    res.json({
      status: "online",
      uptime: process.uptime(),
      activeUsers: count
    });
  });

  return httpServer;
}
