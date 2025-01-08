const axios = require("axios");
const { sendReactMessage,sendQuotedMessage} = require("../function/fetch");
const { bot_name } = require("../shared");
// const bot_name = "> BOT NEXUS BETA";

// A Map object to store key-value pairs.

const map = new Map();
sendVideo
// Handle Facebook video command
async function facebook(from, msg, sock, videoInfos) { 
//    console.log(videoInfos);
   
    if (videoInfos) {
        
        // React to the message to indicate processing
        await sock.sendMessage(from, { react: { text: "⬇️", key: msg.key } });

        try {
            // Fetch the thumbnail image as a buffer
            const imageBuffer = await axios.get(videoInfos.thumbnail, { responseType: 'arraybuffer' })
                .then(res => res.data)
                .catch(() => null);
            
            if (imageBuffer) {
                // Send the thumbnail image with caption
          const message  = await sock.sendMessage(from, {
                    image: imageBuffer,
                    caption: `
🎥 *Title:* ${videoInfos.title} 
⏱️ *Duration:* ${videoInfos.duration} 

📥 *Would you like to download this video?*

Please reply with '1' to confirm or '2' to cancel.:
1️⃣ *YES*
2️⃣ *NO*

${bot_name} | FB DOWNLOADER`,
                }, { quoted: msg });
                const messageId = message.key.id; 
// console.log(videoInfos);

                map.set(from, { step: 1, hd: videoInfos.hd, sd: videoInfos.sd, msg : messageId,platform: 'fb' });

                return map.get(from);

           // Set download request step
                // downloadRequests.set(from, { mapData, step: '1' });
            } else {
                throw new Error("Failed to fetch thumbnail image.");
            }
        } catch (error) {
            console.error("Error fetching or sending thumbnail:", error);
            sendReactMessage(from, "❌", msg, sock);
            sendQuotedMessage(from, "❌ Unable to fetch thumbnail image", msg, sock);
        }
    } else {
        sendReactMessage(from, "❌", msg, sock);
        sendQuotedMessage(from, "❌ Unable to fetch video info", msg, sock);
    }
}
sendquality = async (from, msg, sock) => {
    // Send the thumbnail image with caption
    const message = await sock.sendMessage(from, {
        text: `
📥 *Which video quality would you like to download?*

Please reply with '1' to download the video in HD or '2' to download the video in SD:
1️⃣ *HD*
2️⃣ *SD*

${bot_name} | FB DOWNLOADER`,
    }, { quoted: msg });

    const messageId = message.key.id;


    if (map.has(from)) {
        const data = map.get(from);
        data.step = 2;
        data.msg = messageId;
        map.set(from, data);
    }


    return map.get(from);
}
selectquality = async (from, msg, sock,text) => {
    const quotedMessageContext = msg.message?.extendedTextMessage?.contextInfo;
const quotedMessageId = quotedMessageContext?.stanzaId;
const currentMessageId = map.get(from);

if (["1", "2"].includes(text)) {
  
    if (currentMessageId && currentMessageId.msg === quotedMessageId) {
      const isQuotedMessageSame = currentMessageId.msg === quotedMessageId;
  
      if (isQuotedMessageSame) {
  if (map.get(from).step === 1) {
    await sendquality(from, msg, sock);
  
  }
        if (map.get(from).step === 2) {
        console.log(
        sendVideo(from, msg, sock, text === "1" ? map.get(from).hd : map.get(from).sd)  
        
        );
          
        }      
      }
    }

}
}
async function sendVideo(from, msg, sock, videoUrl) {
    try {
        // Send a message indicating the download is starting
        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });

        // Fetch the video as a buffer
        const videoBuffer = await axios.get(videoUrl, { responseType: 'arraybuffer' })
            .then(res => res.data)
            .catch(() => null);

        if (videoBuffer) {
            // Send the video
            await sock.sendMessage(from, {
                video: videoBuffer,
                caption: `> ${bot_name} `,
            }, { quoted: msg });

            // React to the message to indicate success
            await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } else {
            throw new Error("Failed to fetch video.");
        }
    } catch (error) {
        console.error("Error fetching or sending video:", error);
        sendReactMessage(from, "❌", msg, sock);
        sendQuotedMessage(from, "❌ Unable to fetch video", msg, sock);
    }
}

module.exports = { facebook,map,sendquality,selectquality,sendVideo }