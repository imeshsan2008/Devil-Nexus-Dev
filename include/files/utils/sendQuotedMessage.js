const bot_name = "> BOT NEXUS BETA";
const fs = require('fs');
const path = require('path');

// Send video messages
const sendVideoMessage = async (from, message, msg, sock, videoFilePath) => {
    const localFilePath = path.resolve(videoFilePath); // Resolve absolute path
    sendReactMessage(from, '✅', msg, sock);

    console.log('Resolved file path:', localFilePath);

    if (fs.existsSync(localFilePath)) {
        try {
            await sock.sendMessage(
                from,
                {
                    video: { url: localFilePath }, // Use a valid file URL for Baileys
                    caption: `${message}`,
                },
                { quoted: msg }
            );
            console.log("Video sent successfully to:", from);
        } catch (error) {
            sendReactMessage(from, '❌', msg, sock);

            console.error("Failed to send video message:", error.message);
            await sendQuotedMessage(from, "❌ Failed to send video. Please try again.", msg, sock);
        }
    } else {
        sendReactMessage(from, '❌', msg, sock);

        console.error("Video file does not exist:", localFilePath);
        await sendQuotedMessage(from, "❌ Video file not found.", msg, sock);
    }
};

// Send quoted messages
const sendQuotedMessage = async (from, message, msg, sock) => {
    try {
        await sock.sendMessage(
            from,
            { text: `${message}\n\n${bot_name}` },
            { quoted: msg }
        );
        console.log("Message sent to:", from);
    } catch (error) {
        console.error("Failed to send quoted message:", error.message);
    }
};

// Send reaction messages
const sendReactMessage = async (from, emoji, msg, sock) => {
    try {
        await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
        console.log("Reaction sent to:", from);
    } catch (error) {
        console.error("Failed to send reaction:", error.message);
    }
};

module.exports = { sendQuotedMessage, sendVideoMessage, sendReactMessage };
