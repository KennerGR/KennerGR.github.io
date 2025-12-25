import TelegramBot from 'node-telegram-bot-api';
import { storage } from './storage';
import { openai } from './replit_integrations/image/client'; // Re-use the client from image integration for chat too? No, chat has its own client but it's not exported. I'll use OpenAI directly or the chat routes logic.
// Actually, I should use the OpenAI client from replit_integrations/image/client.ts as it is exported.
// But wait, the prompt asked for the bot to be connected to AI.
// I'll implement a simple handler that uses the OpenAI client.

let bot: TelegramBot | null = null;

export async function setupBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("TELEGRAM_BOT_TOKEN not set, skipping bot setup");
    return;
  }

  // Create a bot that uses 'polling' to fetch new updates
  bot = new TelegramBot(token, { polling: true });

  console.log("Telegram bot started...");

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    const username = msg.from?.username;
    const firstName = msg.from?.first_name;
    const lastName = msg.from?.last_name;

    if (!telegramId) return;

    try {
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        // Check if it's the first user
        const userCount = await storage.getUserCount();
        const role = userCount === 0 ? 'operator' : 'user';
        
        user = await storage.createUser({
          telegramId,
          username,
          firstName,
          lastName,
          role
        });

        if (role === 'operator') {
          bot?.sendMessage(chatId, `Hola Operador. Has sido registrado con privilegios máximos. El sistema está listo.`);
        } else {
          bot?.sendMessage(chatId, `Bienvenido. Tu registro ha sido completado.`);
        }
      } else {
        bot?.sendMessage(chatId, `Hola de nuevo, ${firstName || 'usuario'}.`);
      }
    } catch (e) {
      console.error("Error in /start:", e);
      bot?.sendMessage(chatId, "Hubo un error al procesar tu solicitud.");
    }
  });

  // Admin/Operator commands
  bot.onText(/\/promote (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !match) return;

    const user = await storage.getUserByTelegramId(telegramId);
    if (!user || user.role !== 'operator') {
      bot?.sendMessage(chatId, "No tienes permiso para ejecutar este comando.");
      return;
    }

    const targetId = parseInt(match[1]); // This assumes internal ID. Better use username or telegram ID?
    // Let's assume we pass internal ID for simplicity or telegram ID? 
    // The prompt says "give and remove admins". 
    // Let's try to find by ID.
    
    try {
      const targetUser = await storage.getUser(targetId);
      if (!targetUser) {
        bot?.sendMessage(chatId, "Usuario no encontrado.");
        return;
      }
      
      await storage.updateUserRole(targetId, 'admin');
      bot?.sendMessage(chatId, `Usuario ${targetUser.username || targetUser.firstName} promovido a Admin.`);
    } catch (e) {
        console.error(e);
        bot?.sendMessage(chatId, "Error al promover usuario.");
    }
  });

  bot.onText(/\/demote (\d+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId || !match) return;

    const user = await storage.getUserByTelegramId(telegramId);
    if (!user || user.role !== 'operator') {
      bot?.sendMessage(chatId, "No tienes permiso para ejecutar este comando.");
      return;
    }

    const targetId = parseInt(match[1]);
    try {
       const targetUser = await storage.getUser(targetId);
       if (!targetUser) {
         bot?.sendMessage(chatId, "Usuario no encontrado.");
         return;
       }
       await storage.updateUserRole(targetId, 'user');
       bot?.sendMessage(chatId, `Usuario ${targetUser.username || targetUser.firstName} degradado a Usuario.`);
    } catch (e) {
        console.error(e);
        bot?.sendMessage(chatId, "Error al degradar usuario.");
    }
  });

  bot.onText(/\/users/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString();
      if (!telegramId) return;

      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
         return;
      }

      const users = await storage.getAllUsers();
      let response = "Usuarios registrados:\n";
      users.forEach(u => {
          response += `ID: ${u.id} | ${u.username || u.firstName} | Rol: ${u.role}\n`;
      });
      bot?.sendMessage(chatId, response);
  });

  // AI Handler for non-command messages
  bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        
        try {
            // Using gpt-4o-mini for quick responses via the integration's client
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Eres un asistente útil y eficiente conectado a un sistema de gestión." },
                    { role: "user", content: msg.text }
                ],
            });
            
            const reply = response.choices[0].message.content;
            if (reply) {
                bot?.sendMessage(chatId, reply);
            }
        } catch (e) {
            console.error("AI Error:", e);
            // Don't spam errors to chat, maybe just log
        }
    }
  });
}
