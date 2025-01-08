const baseuri = 'https://venom-devils-api.koyeb.app';
const { bot_name } = require("../shared");

async function getVideoInfo(url,cen,qu) {
    try {
        const fetch = await import('node-fetch'); // Dynamic import
        const apiUrl = `${baseuri}/${cen}/${qu}?url=${encodeURIComponent(url)}&apikey=e6qk1awb2v`;
        const response = await fetch.default(apiUrl);
        const json = await response.json();
        const videoInfo = json.videoInfo || {};

        if (videoInfo.status === 'success') {
            return videoInfo;
        } else {
            console.log(`❌ Error: ${videoInfo.message || 'Unable to fetch video info.'}`);
            return null;
        }
    } catch (error) {
        console.error(`⚠️ An error occurred: ${error.message}`);
        return null;
    }
}

// Send reaction messages
const sendReactMessage = async (from, emoji, msg, sock) => {
    try {
        await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
        console.log("Reaction sent to:", from);
    } catch (error) {
        console.error("Failed to send reaction:", error.message);
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

// Use an IIFE to handle the async function
module.exports = {getVideoInfo,sendReactMessage,sendQuotedMessage};