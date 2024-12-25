const express = require("express");
const fs = require("fs");
const path = require("path");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const { fbcmd,sendReactMessage,sendQuotedMessage } = require("./include/func.js");
const sessionId = "session1000"; // Session unique ID
const app = express();
const PORT = 3000;
const axios = require("axios");

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static("public"));

// Path to settings file
const settingsPath = path.join(__dirname, "db/settings/settings.json");

// Endpoint to serve settings.json
app.get("/db/settings/settings.json", (req, res) => {
  try {
    const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return res.status(200).json({ currentSettings });
  } catch (err) {
    console.error("Error reading settings file:", err);
    res.status(500).json({ error: "Failed to read settings file" });
  }
});

// Function to get settings
function getSettings() {
  const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  const { badword, autodetectlink, fbdownload, perfix } = currentSettings;
  return { badword, autodetectlink, fbdownload, perfix };
}

// Endpoint to update settings.json
app.post("/db/settings/setsettings", (req, res) => {
  const { badword, autodetectlink } = req.body; // Use body for input data
  const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

  try {
    if (autodetectlink !== undefined) {
      if (currentSettings.autodetectlink === autodetectlink) {
        return res
          .status(200)
          .json({ message: "autodetectlink is already up-to-date" });
      }
      currentSettings.autodetectlink = autodetectlink;
    }

    if (badword !== undefined) {
      if (currentSettings.badword === badword) {
        return res
          .status(200)
          .json({ message: "badword is already up-to-date" });
      }
      currentSettings.badword = badword;
    }

    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));
    res.json({ success: true, message: "Settings updated successfully!" });
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Function to start the WhatsApp bot
async function startBot(sessionId) {
  console.log(`Starting bot for session: ${sessionId}...`);

  const authStatePath = path.join("auth_info", sessionId);
  const { state, saveCreds } = await useMultiFileAuthState(authStatePath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Print QR code in terminal
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "close") {
      console.log(`Session ${sessionId}: Connection closed, reconnecting...`);
      setTimeout(() => startBot(sessionId), 5000);
    } else if (connection === "open") {
      console.log(`Session ${sessionId}: Bot connected successfully!`);
    }

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (lastDisconnect?.error) {
      console.error(
        `Session ${sessionId}: Connection error:`,
        lastDisconnect.error
      );
    }
  });

  sock.ev.on("messages.upsert", async (message) => {
    const msg = message.messages[0];

    if (!msg || !msg.message) {
      console.log("Message object or content is null/undefined.");
      return;
    }

    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";
	  if (from.includes("status@broadcast") || from.includes("@newsletter")  ) {

      return;
		
	  }

    console.log(`Received message from ${from}: ${text}`);

    const ISallow = getSettings();


    if (ISallow.autodetectlink === "true") {
      if (text.toLowerCase().startsWith("https://") || text.toLowerCase().startsWith("web.facebook.com")|| text.toLowerCase().startsWith("facebook.com") || text.toLowerCase().startsWith("fb.watch")) {

        await fbcmd(from, msg, sock ,text )
      
      }
    }
    else if (ISallow.fbdownload === "true") {
		if (text.toLowerCase().startsWith(`${ISallow.perfix}fb`)) {
      
		  const splitlink = text.split(" ")[1];
  
    if (!splitlink) {
      
      await sendReactMessage(from, "❓", msg, sock);

      sendQuotedMessage(
        from,
        "🔹 Example: .fb https://web.facebook.com/reel/1785899365480917",
        msg,sock
      );
      return;
    }
      await fbcmd(from, msg, sock ,splitlink )
  }
	  }


    
  });
}

// Start the bot
startBot(sessionId);
