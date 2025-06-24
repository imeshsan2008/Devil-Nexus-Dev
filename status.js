const { default: makeWASocket, useMultiFileAuthState, makeInMemoryStore, proto } = require("@whiskeysockets/baileys");
const P = require("pino");
const fs = require("fs");

// Auth state will be saved in ./auth folder
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        printQRInTerminal: true
    });

    // Save session
    sock.ev.on('creds.update', saveCreds);

    // On receiving new messages
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const text = msg.message?.conversation || 
                     msg.message?.extendedTextMessage?.text || "";

        // Respond with button message
        await sock.sendMessage(sender, {
            text: "ඔබට මොනවා කළ යුතුද?",
            footer: "VENOM BOT ⚡",
            buttons: [
                { buttonId: "btn1", buttonText: { displayText: "📄 INFO" }, type: 1 },
                { buttonId: "btn2", buttonText: { displayText: "🕹 HELP" }, type: 1 }
            ],
            headerType: 1
        });
    });

    // Handle button response
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message?.buttonsResponseMessage) return;

        const sender = msg.key.remoteJid;
        const buttonId = msg.message.buttonsResponseMessage.selectedButtonId;

        if (buttonId === "btn1") {
            await sock.sendMessage(sender, { text: "📄 This is a simple WhatsApp bot using Baileys." });
        } else if (buttonId === "btn2") {
            await sock.sendMessage(sender, { text: "🕹 Available Commands:\n- INFO\n- HELP" });
        }
    });
}

startBot();
