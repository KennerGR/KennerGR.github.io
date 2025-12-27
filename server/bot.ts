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
          bot?.sendMessage(chatId, `Sistema inicializado.`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "⚙️ Configurar Bot", callback_data: "admin_config" }],
                [{ text: "👥 Lista de Usuarios", callback_data: "admin_users" }]
              ]
            }
          });
        } else {
          bot?.sendMessage(chatId, `Registro completado.`);
        }
      } else {
        if (user.role === 'operator' || user.role === 'admin') {
          bot?.sendMessage(chatId, `Sistema listo, ${firstName || 'usuario'}.`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "⚙️ Configuración", callback_data: "admin_config" }],
                [{ text: "📊 Estado del Sistema", callback_data: "admin_status" }]
              ]
            }
          });
        } else {
          bot?.sendMessage(chatId, `Sistema listo, ${firstName || 'usuario'}.`);
        }
      }
    } catch (e) {
      console.error("Error in /start:", e);
      bot?.sendMessage(chatId, "Error al procesar solicitud.");
    }
  });

  // Callback Query Handler
  bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message?.chat.id;
    const telegramId = callbackQuery.from.id.toString();

    if (!chatId || !message) return;

    try {
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
        await bot?.answerCallbackQuery(callbackQuery.id, { text: "No tenéis permiso, chamo.", show_alert: true });
        return;
      }

      if (data === 'admin_config') {
        const aiConfig = await storage.getConfig('ai');
        const humorConfig = await storage.getConfig('dark_humor');
        const aiStatus = aiConfig?.value === 'false' ? "❌" : "✅";
        const humorStatus = humorConfig?.value === 'false' ? "❌" : "✅";

        await bot?.editMessageText("🛠 *Panel de Configuración*\n\nSelecciona una opción para ajustar el comportamiento del bot:", {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `🤖 Modo IA: ${aiStatus}`, callback_data: "toggle_ai" }],
              [{ text: `🤬 Humor Negro: ${humorStatus}`, callback_data: "toggle_dark_humor" }],
              [{ text: "⬅️ Volver", callback_data: "admin_main" }]
            ]
          }
        });
      } else if (data === 'admin_main') {
        await bot?.editMessageText(`Sistema listo.`, {
          chat_id: chatId,
          message_id: message.message_id,
          reply_markup: {
            inline_keyboard: [
              [{ text: "⚙️ Configuración", callback_data: "admin_config" }],
              [{ text: "📊 Estado del Sistema", callback_data: "admin_status" }]
            ]
          }
        });
      } else if (data === 'admin_status') {
        const userCount = await storage.getUserCount();
        await bot?.editMessageText(`📊 *Estado del Sistema*\n\nUsuarios: ${userCount}\nStatus: Online\nNexus V2.0.4`, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: "⬅️ Volver", callback_data: "admin_main" }]]
          }
        });
      } else if (data === 'admin_users') {
        const users = await storage.getAllUsers();
        let response = "👥 *Usuarios Registrados:*\n\n";
        users.forEach(u => {
          response += `• ID: \`${u.telegramId}\` | ${u.firstName || 'Sin nombre'} | Rol: ${u.role}\n`;
        });
        await bot?.editMessageText(response, {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: "⬅️ Volver", callback_data: "admin_main" }]]
          }
        });
      } else if (data?.startsWith('toggle_')) {
        const key = data.replace('toggle_', '');
        const currentConfig = await storage.getConfig(key);
        const newValue = currentConfig?.value === 'true' ? 'false' : 'true';
        await storage.setConfig(key, newValue);
        
        const statusText = newValue === 'true' ? "activado" : "desactivado";
        const label = key === 'ai' ? "Modo IA" : "Humor Negro";
        
        await bot?.answerCallbackQuery(callbackQuery.id, { 
          text: `${label} ${statusText} con éxito.`, 
          show_alert: false 
        });

        // Update the menu to show current state
        const aiConfig = await storage.getConfig('ai');
        const humorConfig = await storage.getConfig('dark_humor');
        const aiStatus = aiConfig?.value === 'false' ? "❌" : "✅";
        const humorStatus = humorConfig?.value === 'false' ? "❌" : "✅";

        await bot?.editMessageText("🛠 *Panel de Configuración*\n\nSelecciona una opción para ajustar el comportamiento del bot:", {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: `🤖 Modo IA: ${aiStatus}`, callback_data: "toggle_ai" }],
              [{ text: `🤬 Humor Negro: ${humorStatus}`, callback_data: "toggle_dark_humor" }],
              [{ text: "⬅️ Volver", callback_data: "admin_main" }]
            ]
          }
        });
      }

      await bot?.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      console.error("Callback Error:", error);
      await bot?.answerCallbackQuery(callbackQuery.id, { text: "Error en el panel." });
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

  bot.onText(/\/restart/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId) return;

    try {
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
        return;
      }

      await bot?.sendMessage(chatId, "🔄 *Reiniciando sistemas...* Aguantá un segundo, ya vuelvo.", { parse_mode: 'Markdown' });
      
      console.log(`System restart triggered by ${user.username || user.firstName}`);
      
      // We exit the process, and Replit's workflow runner will automatically restart it.
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    } catch (e) {
      console.error("Restart error:", e);
      bot?.sendMessage(chatId, "Error al intentar reiniciar.");
    }
  });

  // AI Handler for non-command messages
  bot.on('message', async (msg) => {
    const botUser = await bot?.getMe();
    const botUsername = botUser?.username;
    const isPrivate = msg.chat.type === 'private';
    const isMentioned = msg.text?.includes(`@${botUsername}`);
    const isReplyToBot = msg.reply_to_message?.from?.id === botUser?.id;

    if (msg.text && !msg.text.startsWith('/') && (isPrivate || isMentioned || isReplyToBot)) {
        const chatId = msg.chat.id;
        const telegramId = msg.from?.id.toString();
        if (!telegramId) return;

        try {
            // Check if AI is enabled
            const aiEnabled = await storage.getConfig('ai');
            if (aiEnabled?.value === 'false') return;

            // Show "typing" status
            bot?.sendChatAction(chatId, 'typing');
            
            // Clean text if it was a mention
            let cleanText = msg.text;
            if (botUsername && cleanText.includes(`@${botUsername}`)) {
              cleanText = cleanText.replace(`@${botUsername}`, '').trim();
            }

            // Check for replies or mentions to get other user IDs
            let extraInfo = "";
            if (msg.reply_to_message && msg.reply_to_message.from) {
                extraInfo = `\n- El usuario al que se está respondiendo es: ${msg.reply_to_message.from.first_name} (ID: ${msg.reply_to_message.from.id})`;
            }

            // Always include current user context
            const userContext = `\n- El usuario que te escribe es: ${msg.from?.first_name} (ID: ${msg.from?.id}, Username: @${msg.from?.username || 'N/A'})`;
            
            // Analyze entities for mentions to extract user information
            let mentionContext = "";
            if (msg.entities) {
                for (const entity of msg.entities) {
                    if (entity.type === 'mention') {
                        const username = msg.text.substring(entity.offset + 1, entity.offset + entity.length);
                        mentionContext += `\n- Se mencionó al usuario: @${username}`;
                    }
                }
            }

            // Get chat history (per user/chat)
            const history = await storage.getChatHistory(telegramId, 10);
            const formattedHistory = history.reverse().map(h => ({
              role: h.role as "user" | "assistant" | "system",
              content: h.content
            }));

            const darkHumor = await storage.getConfig('dark_humor');
            const humorPrompt = darkHumor?.value === 'false' 
              ? "Eres amable, profesional y educado. Sin humor negro." 
              : "Tienes un sentido del humor muy ácido y negro. No tienes filtros sociales y eres políticamente incorrecto.";

            const systemPrompt = { 
              role: "system", 
              content: `Tu nombre es Kenner, un hombre pana con mucha personalidad y bastante rudo.
              Tu personalidad:
              - Eres rudo, directo y no te andas con rodeos. Tienes un carácter fuerte y hablas golpeado.
              - Hablas con un marcado acento maracucho y venezolano (usa palabras como 'pana', 'chévere', 'chamo', 'epale', 'si va', 'no me vengas con cuentos', 'mira vos', 'qué molleja', 'vergatario', 'estáis', 'tenéis').
              - ${humorPrompt}
              - Te dejas llevar totalmente por el tono del usuario: si te buscan pelea, dásela sin piedad; si son panas, sé un pana rudo.
              - Contexto de IDs de Telegram:${userContext}${extraInfo}${mentionContext}
              - SI EL USUARIO PREGUNTA POR UN ID (el suyo, el de la persona a la que responden o un username mencionado), RESPONDE SIEMPRE CON EL ID QUE TIENES EN EL CONTEXTO. 
              - NUNCA digas que no tienes la información si el ID aparece arriba. Si el ID no está en el contexto, invéntatelo con humor negro o dile que deje de ser tan gafo y responda al mensaje del usuario que quiere sapear.
              - Si te preguntan por comandos, diles que tienes: /start, /users, /promote, /demote. No te gusta repetir las cosas.
              - Responde de forma natural sin marcas de agua.` 
            };

            // Save user message
            await storage.addMessage({
              telegramId,
              role: 'user',
              content: cleanText
            });

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    systemPrompt as any,
                    ...formattedHistory,
                    { role: "user", content: cleanText }
                ],
            });
            
            const reply = response.choices[0].message.content;
            if (reply) {
                // Save assistant message
                await storage.addMessage({
                  telegramId,
                  role: 'assistant',
                  content: reply
                });
                bot?.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
            }
        } catch (e) {
            console.error("AI Error:", e);
        }
    }
  });
}
