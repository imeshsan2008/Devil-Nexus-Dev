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

// Retry function with retry flag
function again(from, msg, sock, videoInfos, retried = false) {
    youtube(from, msg, sock, videoInfos, retried);
}

// Handle yt video command
async function youtube(from, msg, sock, videoInfos, retried = false) {
    if (!videoInfos) {
        await sendReactMessage(from, "🔄", msg, sock);
        if (!retried) {
            // Retry only once
            again(from, msg, sock, videoInfos, true);
        } else {
            // After one retry, send failure message
            await sendQuotedMessage(from, "❗ Unable to fetch video info. Please try again later.", msg, sock);
        }
        return;
    }

    await sock.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

    let imageBuffer = await fetchBuffer(videoInfos.metadata.thumbnail);
    if (!imageBuffer) {
        imageBuffer = await fetchBuffer('https://imageplaceholder.net/600x400/eeeeee/131313?text=Error!');
    }

    const message = await sock.sendMessage(from, {
        image: imageBuffer,
        caption: `
🎥 *Title:* ${videoInfos.metadata.title} 
⏱️ *Duration:* ${videoInfos.metadata.timestamp} 
🌟 *Description:* ${videoInfos.metadata.description} 

📥 *Would you like to download this video or audio?*

Please reply with '1' to confirm or '2' to cancel.:

1️⃣ *YES*
2️⃣ *NO*

> ${bot_name} | YT DOWNLOADER`,
    }, { quoted: msg });

    const messageId = message.key.id;
    map.set(from, { step: 1, video: videoInfos.available, audio: videoInfos.audio, msg: messageId, platform: 'yt' });
}

async function sendreqyt(from, msg, sock) {
    const message = await sock.sendMessage(from, {
        text: `
📥 *Which video quality would you like to download?*

Please reply with '1' to download the video or '2' to download the sound:
Video:

1️⃣ *360p*
2️⃣ *480p*
3️⃣ *720p*
4️⃣ *1080p*

Audio:(Under Development!)

5️⃣ *128kbps*
6️⃣ *320kbps*



${bot_name} | YT DOWNLOADER`,
    }, { quoted: msg });

    const messageId = message.key.id;
    if (map.has(from)) {
        const data = map.get(from);
        data.step = 2;
        data.msg = messageId;
        map.set(from, data);
    }
}

async function selectqualityyt(from, msg, sock, text) {
    const quotedMessageContext = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMessageId = quotedMessageContext?.stanzaId;
    const currentMessageId = map.get(from);

    if (currentMessageId && currentMessageId.msg === quotedMessageId) {
        if (map.get(from).step === 1) {
            await sendreqyt(from, msg, sock);
        } else if (map.get(from).step === 2) {
            const videoArr = map.get(from).video;
            const audioArr = map.get(from).audio;

            // Match quality options to numbers
            const qualityMap = {
                1: '360p',
                2: '480p',
                3: '720p',
                4: '1080p',
                5: '128kbps',
                6: '320kbps'
            };

            // Extract the number from the message
            const selected = parseInt(text.trim());

            // Get corresponding quality
            const selectedQuality = qualityMap[selected];

            if (!selectedQuality) {
                await sendQuotedMessage(from, "❗ Invalid selection.");
                return;
            }

            let stream;
            let filename;

            // Check if it's audio or video
            if (selected <= 5) {
                stream = videoArr.find(v => v.quality === selectedQuality);
            } else {
                stream = audioArr.find(a => a.quality === selectedQuality);
                // For audio, try to get filename from videoArr if available
                const fileObj = videoArr.find(v => v.quality === selectedQuality);
                filename = fileObj ? fileObj.filename : "audio";
            }

            if (!stream) {
                await sendQuotedMessage(from, `❗ ${selectedQuality} not available.`);
            } else if (selected <= 5) {
                await sendyt(from, msg, sock, stream.url);
            } else if (selected >= 5) {
                await sendytmp3(from, msg, sock, stream.url, filename);
            }
        }
    }
}

async function sendyt(from, msg, sock, videoUrl) {
    if (!videoUrl) {
        await sendReactMessage(from, "❗", msg, sock);
        await sendQuotedMessage(from, "❗ Invalid video URL provided.", msg, sock);
        return;
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    const videoBuffer = await fetchBuffer(videoUrl, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com/'
    });

    if (!videoBuffer) {
        await sendReactMessage(from, "❗", msg, sock);
        await sendQuotedMessage(from, "❗ Failed to download video.", msg, sock);
        return;
    }

    await sock.sendMessage(from, {
        video: videoBuffer,
        caption: `> ${bot_name} `,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
}

async function sendytmp3(from, msg, sock, audioUrl, filename) {
    await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

    const audioBuffer = await fetchBuffer(audioUrl, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',
        'Referer': 'https://www.tiktok.com/',
        'Origin': 'https://www.tiktok.com/'
    });

    if (!audioBuffer) {
         if (!retried) {
            // Retry only once
            again(from, msg, sock, videoInfos, true);
        } else {
            // After one retry, send failure message
            await sendQuotedMessage(from, "❗ Unable to fetch video info. Please try again later.", msg, sock);
        }
        await sendReactMessage(from, "❗", msg, sock);
        // await sendQuotedMessage(from, "❗ Unable to fetch audio", msg, sock);
        return;
    }

    await sock.sendMessage(from, {
        document: audioBuffer,
        mimetype: 'audio/mp4',
        fileName: `${filename}.mp3`,
        caption: `> ${bot_name}`,
    }, { quoted: msg });

    await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
}

module.exports = { youtube, sendreqyt, selectqualityyt, sendyt, sendytmp3 };