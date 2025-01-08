const express = require("express"); // Import express module
const fs = require("fs"); // Import file system module
const { getSettings, settingsPath } = require("./shared.js"); // Import getSettings and settingsPath from shared.js
const { getVideoInfo, sendReactMessage, sendQuotedMessage } = require("./function/fetch.js"); // Import functions from fetch.js
const path = require("path"); // Import path module
const makeWASocket = require("@whiskeysockets/baileys").default; // Import makeWASocket from baileys
const { useMultiFileAuthState } = require("@whiskeysockets/baileys"); // Import useMultiFileAuthState from baileys
const qrcode = require("qrcode-terminal"); // Import qrcode-terminal module
let botStartTime = Date.now(); // Record the time the bot was started
const { facebook, map, sendquality, selectquality, sendVideo } = require("./commands/fb.js"); // Import functions from fb.js
const { tiktok, sendsound, sendreq, selectreq, sendtiktok } = require("./commands/tiktok.js"); // Import functions from tiktok.js

const sessionId = "session01000"; // Session unique ID
const app = express(); // Create an express application
const PORT = process.env.PORT || 8000; // You can change this to any port you prefer

// Middleware to parse JSON
app.use(express.json()); // Use express.json() middleware
app.use(express.urlencoded({ extended: true })); // Use express.urlencoded() middleware

// Serve static files from the "public" directory
app.use(express.static("public")); // Serve static files from "public" directory

// Endpoint to serve settings.json
app.get("/db/settings/settings.json", (req, res) => {
  try {
    const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8")); // Read and parse settings file
    return res.status(200).json({ currentSettings }); // Send settings as JSON response
  } catch (err) {
    console.error("Error reading settings file:", err); // Log error
    res.status(500).json({ error: "Failed to read settings file" }); // Send error response
  }
});

// Endpoint to update settings.json
app.post("/db/settings/setsettings", (req, res) => {
  const { badword, autodetectlink, tiktokdownload, bot_name, fbdownload, perfix } = req.query; // Extract query parameters
  const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8")); // Read and parse settings file

  try {
    if (autodetectlink !== undefined) {
      if (currentSettings.autodetectlink === autodetectlink) {
        return res.status(200).json({ message: "autodetectlink is already up-to-date" }); // Send response if autodetectlink is already up-to-date
      }
      currentSettings.autodetectlink = autodetectlink; // Update autodetectlink
    }

    if (bot_name !== undefined) {
      const upperCaseBotName = bot_name.toUpperCase(); // Convert bot_name to uppercase
      currentSettings.bot_name = upperCaseBotName; // Update bot_name
    }

    if (perfix !== undefined) {
      currentSettings.perfix = perfix; // Update perfix
    }

    if (fbdownload !== undefined) {
      if (currentSettings.fbdownload === fbdownload) {
        return res.status(200).json({ message: "fbdownload is already up-to-date" }); // Send response if fbdownload is already up-to-date
      }
      currentSettings.fbdownload = fbdownload; // Update fbdownload
    }

    if (badword !== undefined) {
      if (currentSettings.badword === badword) {
        return res.status(200).json({ message: "badword is already up-to-date" }); // Send response if badword is already up-to-date
      }
      currentSettings.badword = badword; // Update badword
    }

    if (tiktokdownload !== undefined) {
      if (currentSettings.tiktokdownload === tiktokdownload) {
        return res.status(200).json({ message: "tiktokdownload is already up-to-date" }); // Send response if tiktokdownload is already up-to-date
      }
      currentSettings.tiktokdownload = tiktokdownload; // Update tiktokdownload
    }

    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2)); // Write updated settings to file
    res.json({ success: true, message: "Settings updated successfully!" }); // Send success response
  } catch (err) {
    console.error("Error updating settings:", err); // Log error
    res.status(500).json({ error: "Failed to update settings" }); // Send error response
  }
});



// Function to start the WhatsApp bot
async function startBot(sessionId) {
  console.log(`Starting bot for session: ${sessionId}...`); // Log starting message

  const authStatePath = path.join("auth_info", sessionId); // Define auth state path
  const { state, saveCreds } = await useMultiFileAuthState(authStatePath); // Get auth state and saveCreds function

  const sock = makeWASocket({
    auth: state, // Set auth state
    printQRInTerminal: true, // Print QR code in terminal
  });
const usersnum = sock.user.id.split('@')[0].split(':')[0]; // Get phone number
const usersPushName = sock.user.name; // Get user's push name

  app.get("/db/settings/getsettings", (req, res) => {
    res.json({ usernumber: usersnum, usersPushName: usersPushName });
  });

  sock.ev.on("creds.update", saveCreds); // Save credentials on update

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update; // Extract connection, lastDisconnect, and qr from update

    if (connection === "close") {
      console.log(`Session ${sessionId}: Connection closed, reconnecting...`); // Log connection closed message
      setTimeout(() => startBot(sessionId), 5000); // Reconnect after 5 seconds
    } else if (connection === "open") {
      console.log(`Session ${sessionId}: Bot connected successfully!`); // Log connection success message
      console.log(`Logged in as: ${usersnum}`); // Log phone number
    }
  
    if (qr) {
      qrcode.generate(qr, { small: true }); // Generate QR code
    }

    if (lastDisconnect?.error) {
      console.error(`Session ${sessionId}: Connection error:`, lastDisconnect.error); // Log connection error
    }
  });

  sock.ev.on("messages.upsert", async (message) => {
    try {
      let msg = message.messages[0]; // Get the first message

      // Check if message or its content is null/undefined
      if (!msg || !msg.message) {
        console.log("Message object or content is null/undefined."); // Log null/undefined message
        return;
      }

      const from = msg.key.remoteJid; // Get sender ID
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""; // Get message text
      const pushName = msg.pushName || "there"; // Fallback if pushName is not available

      // Ignore broadcast or newsletter messages
      if (from.includes("status@broadcast") || from.includes("@newsletter")) {
        return;
      }

      const ISallow = getSettings(); // Get settings
      const perfix = ISallow.perfix; // Get prefix

      // Handle "alive" command
      if (text.toLowerCase().startsWith(perfix + 'alive')) {
        const uptime = Date.now() - botStartTime; // Calculate total uptime in milliseconds

        const hours = Math.floor(uptime / 3600000); // Calculate hours
        const minutes = Math.floor((uptime % 3600000) / 60000); // Calculate remaining minutes
        const seconds = Math.floor((uptime % 60000) / 1000); // Calculate remaining seconds

        const statusMessage = `Bot is online! ✅\n${hours} hours, ${minutes} minutes, ${seconds} seconds`; // Create status message
        await sendQuotedMessage(from, statusMessage, msg, sock); // Send status message
        sendReactMessage(from, "👋", msg, sock); // Send reaction message
      }

      const currentDate = new Date(); // Get current date
      const isJanuary1 = currentDate.getDate() === 2 && currentDate.getMonth() === 0; // Check if it's Jan 1 (your birthday)

      // Handle birthday or congratulatory messages
      if (
        msg.key.fromMe === false &&
        (text.toLowerCase().includes("birthday") ||
          text.toLowerCase().includes("congratulations") || // New keyword
          text.toLowerCase().includes("best wishes") || // New keyword
          text.toLowerCase().includes("celebrate")) // New keyword
      ) {
        if (isJanuary1) {
          const replyText = `🎉 Thank you, ${pushName}! I really appreciate it. 😊`; // Create reply text

          await sendQuotedMessage(from, replyText, msg, sock); // Send reply message
          sendReactMessage(from, "🎉", msg, sock); // Send reaction message
          return;
        } else {
          const replyText = `❌ Today is not my birthday, but thank you for the kind words! 😊`; // Create reply text
          await sendQuotedMessage(from, replyText, msg, sock); // Send reply message
          sendReactMessage(from, "❌", msg, sock); // Send reaction message
          return;
        }
      }

      // Access the quoted message context
      const quotedMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage; // Get quoted message

      // Ensure the message is a reply to the bot
      if (quotedMessage) {
        const quotedMessageContext = msg.message?.extendedTextMessage?.contextInfo; // Get quoted message context
        const quotedMessageId = quotedMessageContext?.stanzaId; // Get quoted message ID
        const currentMessageId = map.get(from); // Get current message ID
        const isQuotedMessageSame = currentMessageId && currentMessageId.msg === quotedMessageId; // Check if quoted message is the same

        if (currentMessageId.platform === 'fb') {
          console.log(currentMessageId.platform); // Log platform

          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendquality(from, msg, sock); // Send quality message
            return;
          } else           if (["2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendReactMessage(from, "🆗", msg, sock); // Send reaction message

          
          }
          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 2) {
            await selectquality(from, msg, sock, text); // Select quality
            return;
          }
          if (["1h"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendVideo(from, msg, sock, map.get(from).hd); // Send video
            return;
          }
     if (["1s"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendVideo(from, msg, sock, map.get(from).sd); // Send video
            return;
          }        }

        if (currentMessageId.platform === 'tiktok') {
          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendreq(from, msg, sock); // Send request
            return;
          } else           if (["2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendReactMessage(from, "🆗", msg, sock); // Send reaction message
          }
          
          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 2) {
            await selectreq(from, msg, sock, text); // Select request
            return;
          }
          if (["11v"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendtiktok(from, msg, sock, map.get(from).video); // Send TikTok video
            return;
          }
          if (["11s"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendsound(from, msg, sock, map.get(from).sound); // Send sound
            return;
          }
        }
      }

      // Handle Facebook video download command
      if (
        ISallow.fbdownload === "true" &&
        text.toLowerCase().startsWith(perfix + 'fb')
      ) {
        const videoLink = text.split(" ")[1]; // Get video link

        if (!videoLink) {
          await sendQuotedMessage(
            from,
            "🔹 Example: .fb https://web.facebook.com/reel/1785899365480917",
            msg,
            sock
          ); // Send example message
          await sendReactMessage(from, "❓", msg, sock); // Send reaction message
          return;
        }

        const videoInfos = await getVideoInfo(videoLink, 'download', 'fb'); // Get video info
        await facebook(from, msg, sock, videoInfos); // Handle Facebook video
      }

      if (
        ISallow.tiktokdownload === "true" &&
        text.toLowerCase().startsWith(perfix + 'tiktok')
      ) {
        const videoLink = text.split(" ")[1]; // Get video link

        if (!videoLink) {
          await sendQuotedMessage(
            from,
            "🔹 Example: .tiktok https://vt.tiktok.com/ZS6r8xQbm/",
            msg,
            sock
          ); // Send example message
          await sendReactMessage(from, "❓", msg, sock); // Send reaction message
          return;
        }

        const videoInfos = await getVideoInfo(videoLink, 'download', 'tiktok'); // Get video info
        await tiktok(from, msg, sock, videoInfos); // Handle TikTok video
      }

      // Handle Facebook video download command
      if (
        ISallow.autodetectlink === "true" &&
        (text.toLowerCase().includes('facebook.com') || text.toLowerCase().includes('fb.watch'))
      ) {
        const videoLink = text; // Get video link

        const videoInfos = await getVideoInfo(videoLink, 'download', 'fb'); // Get video info
        await facebook(from, msg, sock, videoInfos); // Handle Facebook video
      } // Handle Facebook video download command
      if (
        ISallow.autodetectlink === "true" &&
        (text.toLowerCase().includes('tiktok.com') )
      ) {
        const videoLink = text; // Get video link

        const videoInfos = await getVideoInfo(videoLink, 'download', 'tiktok'); // Get video info
        await tiktok(from, msg, sock, videoInfos); // Handle Facebook video
      }
    } catch (error) {
      console.error("An error occurred in the message handler:", error); // Log error
    }
  });
}
// Start Express server
app.listen(PORT, () => {
  // console.log(`Server running at http://localhost:${PORT}`);
});
// Start the bot
startBot(sessionId); // Start the bot with session ID
