const baseuri = 'https://venom-devils-api.koyeb.app';
const { bot_name, apikey } = require("../shared");
// console.log(apikey);

async function getVideoInfo(url,cen,qu) {
    try {
        const fetch = await import('node-fetch'); // Dynamic import
        const apiUrl = `${baseuri}/${cen}/${qu}?url=${encodeURIComponent(url)}&apikey=${apikey}`;
        
        const response = await fetch.default(apiUrl);
        const json = await response.json();
        
        const videoInfo = json.videoInfo || {};

        if (videoInfo.status === 'success' || videoInfo.status === true) {
            console.log(`✅ Video info fetched for URL: ${videoInfo}`);

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

// Send a reaction to a message (group or private)
const sendReactMessage = async (from, emoji, msg, sock) => {
    
    try {
        // Ensure the message has a valid key
        if (!msg || !msg.key) {
            throw new Error("Invalid message object: missing key");
        }
        

        // Send reaction
        await sock.sendMessage(from, {
            react: {
                text: emoji,
                key: msg.key, // Reference to the original message
            },
        });

        console.log(`✅ Reaction "${emoji}" sent to: ${from}`);
    } catch (error) {
        console.error(`❌ Failed to send reaction to ${from}:`, error.message);
    }
};

// Send quoted messages
const sendQuotedMessage = async (from, message, msg, sock) => {
    try {
        await sock.sendMessage(
            from,
            { text: `${message}\n\n> ${bot_name}` },
            { quoted: msg }
        );
        console.log("Message sent to:", from);
    } catch (error) {
        console.error("Failed to send quoted message:", error.message);
    }
};

// Use an IIFE to handle the async function
module.exports = {getVideoInfo,sendReactMessage,sendQuotedMessage};