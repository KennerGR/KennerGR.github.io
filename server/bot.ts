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
    const firstName = msg.from?.first_name;

    if (!telegramId) return;

    try {
      let user = await storage.getUserByTelegramId(telegramId);
      
      if (!user) {
        const userCount = await storage.getUserCount();
        const role = userCount === 0 ? 'operator' : 'user';
        
        user = await storage.createUser({
          telegramId,
          role,
          firstName,
          lastName: msg.from?.last_name,
          username: msg.from?.username
        });

        if (role === 'operator') {
          bot?.sendMessage(chatId, `Sistema inicializado.`);
        } else {
          bot?.sendMessage(chatId, `Registro completado.`);
        }
      } else {
        bot?.sendMessage(chatId, `Sistema listo, ${firstName || 'usuario'}.`);
      }
    } catch (e) {
      console.error("Error in /start:", e);
      bot?.sendMessage(chatId, "Error al procesar solicitud.");
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
      response += "\n_Hecho por Kenner_";
      bot?.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  });

  // AI Handler for non-command messages
  bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();

        try {
            // Show "typing" status
            bot?.sendChatAction(chatId, 'typing');
            
            // Check for replies or mentions to get other user IDs
            let extraInfo = "";
            if (msg.reply_to_message && msg.reply_to_message.from) {
                extraInfo = `\n- El usuario al que se está respondiendo es: ${msg.reply_to_message.from.first_name} (ID: ${msg.reply_to_message.from.id})`;
            }

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { 
                      role: "system", 
                      content: `Tu nombre es Kenner, un hombre pana con mucha personalidad y bastante rudo.
                      Tu personalidad:
                      - Eres rudo, directo y no te andas con rodeos. Tienes un carácter fuerte y hablas golpeado.
                      - Hablas con un marcado acento venezolano (usa palabras como 'pana', 'chévere', 'chamo', 'epale', 'si va', 'no me vengas con cuentos').
                      - Tienes un sentido del humor muy ácido y negro. No tienes filtros sociales y eres políticamente incorrecto.
                      - Te dejas llevar totalmente por el tono del usuario: si te buscan pelea, dásela sin piedad; si son panas, sé un pana rudo.
                      - El ID de Telegram del usuario actual es: ${telegramId}.${extraInfo}
                      - Si te preguntan por su ID o el de la persona a la que responden, dáselo de una vez sin tanto drama.
                      - Si te preguntan por comandos, diles que tienes: /start, /users, /promote, /demote. No te gusta repetir las cosas.
                      - Responde de forma natural sin marcas de agua.` 
                    },
                    { role: "user", content: msg.text }
                ],
            });
            
            const reply = response.choices[0].message.content;
            if (reply) {
                bot?.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
            }
        } catch (e) {
            console.error("AI Error:", e);
        }
    }
  });
}
