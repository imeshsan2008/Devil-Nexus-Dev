const axios = require("axios");
const { sendReactMessage, sendQuotedMessage } = require("../function/fetch");
const { bot_name } = require("../shared");
const { map } = require("./fb");

// Helper function to fetch buffer from URL
async function fetchBuffer(url, headers = {}) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer', headers });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Failed to fetch buffer. Status code: ${response.status}`);
        }
    } catch (error) {
        console.error(`Error fetching buffer from ${url}:`, error.message);
        return null;
    }
}

// Handle TikTok video command
async function tiktok(from, msg, sock, videoInfos) {
    if (!videoInfos) {
        await sendReactMessage(from, "❌", msg, sock);
        await sendQuotedMessage(from, "❌ Unable to fetch video info", msg, sock);
        return;
    }

    await sock.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

    const imageBuffer = await fetchBuffer(videoInfos.cover);
    if (!imageBuffer) {
        await sendReactMessage(from, "❌", msg, sock);
        await sendQuotedMessage(from, "❌ Unable to fetch thumbnail image", msg, sock);
        return;
    }

    const message = await sock.sendMessage(from, {
        image: imageBuffer,
        caption: `
🎥 *Title:* ${videoInfos.desc} 
⏱️ *Duration:* ${videoInfos.duration} 

📥 *Would you like to download this video?*

Please reply with '1' to confirm or '2' to cancel.:
1️⃣ *YES*
2️⃣ *NO*

> ${bot_name} | TIKTOK DOWNLOADER`,
    }, { quoted: msg });

    const messageId = message.key.id;
    map.set(from, { step: 1, video: videoInfos.video, sound: videoInfos.sound, msg: messageId, platform: 'tiktok' });
}

async function sendreq(from, msg, sock) {
    const message = await sock.sendMessage(from, {
        text: `
📥 *Which video quality would you like to download?*

Please reply with '1' to download the video or '2' to download the sound:
1️⃣ *VIDEO*
2️⃣ *ORIGINAL SOUND*

> ${bot_name} | TIKTOK DOWNLOADER`,
    }, { quoted: msg });

    const messageId = message.key.id;
    if (map.has(from)) {
        const data = map.get(from);
        data.step = 2;
        data.msg = messageId;
        map.set(from, data);
    }
}

async function selectreq(from, msg, sock, text) {
    const quotedMessageContext = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessageId = quotedMessageContext?.stanzaId;
    const currentMessageId = map.get(from);

    if (currentMessageId && currentMessageId.msg === quotedMessageId) {
        if (map.get(from).step === 1) {
            await sendreq(from, msg, sock);
        } else if (map.get(from).step === 2) {
            if (text === "1") {
                await sendtiktok(from, msg, sock, map.get(from).video);
            } else if (text === "2") {
                await sendsound(from, msg, sock, map.get(from).sound);
            }
        }
    }
}

async function sendtiktok(from, msg, sock, videoUrl) {
    if (!videoUrl) {
        await sendReactMessage(from, "❌", msg, sock);
        await sendQuotedMessage(from, "❌ Invalid video URL provided.", msg, sock);
        return;
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    const videoBuffer = await fetchBuffer(videoUrl, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com/'
    });

    if (!videoBuffer) {
        await sendReactMessage(from, "❌", msg, sock);
        await sendQuotedMessage(from, "❌ Failed to download video.", msg, sock);
        return;
    }

    await sock.sendMessage(from, {
        video: videoBuffer,
        caption: `> ${bot_name} `,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
}

async function sendsound(from, msg, sock, audioUrl) {
    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    const audioBuffer = await fetchBuffer(audioUrl, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com/'
    });

    if (!audioBuffer) {
        await sendReactMessage(from, "❌", msg, sock);
        await sendQuotedMessage(from, "❌ Unable to fetch audio", msg, sock);
        return;
    }

    await sock.sendMessage(from, {
        document: audioBuffer,
        mimetype: 'audio/mp4',
        fileName: `${from}.mp3`,
        caption: `> ${bot_name}`,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
}

module.exports = { tiktok, sendreq, selectreq, sendtiktok, sendsound };