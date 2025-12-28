import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // 'operator', 'admin', 'user'
  createdAt: timestamp("created_at").defaultNow(),
  battlePoints: integer("battle_points").notNull().default(0),
  inBattle: boolean("in_battle").notNull().default(false),
  currentRiddle: text("current_riddle"),
  riddleAnswer: text("riddle_answer"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const insertConfigSchema = createInsertSchema(config);
export type Config = typeof config.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
