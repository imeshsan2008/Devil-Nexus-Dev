const { sendQuotedMessage, sendVideoMessage, sendReactMessage } = require("./utils/sendQuotedMessage");
const fs = require('fs');
const path = require('path');
const https = require('https');

const downloadRequests = new Map();
const bot_name = "> BOT NEXUS BETA";
const VID_bot_name = "BOT_NEXUS_BETA";
const downloadFolder = path.join(__dirname, 'tempDownloads');

// Ensure the temporary folder exists
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

async function handleVideoQuality(from, msg, sock, replyText) {
const data = downloadRequests.get(from); // Retrieve the object stored for 'from'
    
  await sendQuotedMessage(from,  `Select Video Quality \n\n 1️⃣ HD \n 2️⃣ SD `, msg, sock);

  if (data) {
    const videoInfo = data.videoInfo; // Access the 'videoInfo' property

  downloadRequests.set(from, { videoInfo, step: '2' });
}
}

async function handleResponse(from, msg, sock, replyText) {

    if (replyText === "1" && downloadRequests.get(from).step == 1) {
        // Simulate setting up a video request


        // Ask for video quality selection
        await handleVideoQuality(from, msg, sock, replyText);
    } else if (["1", "2"].includes(replyText)) {
        
        // Handle video reply (user's quality selection)
        await handleVideoReply(from, msg, sock, replyText);
    } else {
        await sendQuotedMessage(from, `❌ Invalid option. Please try again. ${bot_name}`, msg, sock);
    }
}


async function handleVideoReply(from, msg, sock, replyText) {
    try {
        const videoInfo = downloadRequests.get(from);

        if (!videoInfo) {
            await sendQuotedMessage(from, "❌ No pending video request found. Please send a new request.", msg, sock);
            return;
        }

        // Determine the video link based on user selection
        const videoLink = (replyText === "1" && videoInfo.videoInfo.hd) ? videoInfo.videoInfo.hd
            : (replyText === "2" && videoInfo.videoInfo.sd) ? videoInfo.videoInfo.sd
            : null;

        console.log('Selected video link:', videoInfo.videoInfo.hd);

        if (!videoLink) {
            await sendQuotedMessage(from, "❌ Invalid selection or video quality not available.", msg, sock);
            return;
        }

        const timestamp = Date.now();
        const videoFilePath = path.join(
            downloadFolder,
            `${from}_DownloadedBy${VID_bot_name}_${timestamp}_video.mp4`
        );

        // Start downloading the video
        https.get(videoLink, (response) => {
            if (response.statusCode !== 200) {
                console.error("Error with HTTP response:", response.statusMessage);
                sendQuotedMessage(from, "❌ Failed to fetch the video. Please try again later.", msg, sock);
                downloadRequests.delete(from);
                return;
            }

            const fileStream = fs.createWriteStream(videoFilePath);
            response.pipe(fileStream);

            sendReactMessage(from, '⏳', msg, sock);

            fileStream.on('finish', async () => {
                console.log(`Video successfully downloaded: ${videoFilePath}`);
                await sendVideoMessage(from, bot_name, msg, sock, videoFilePath);
                downloadRequests.delete(from);

                // Optional: Delete the file after sending
                fs.unlink(videoFilePath, (err) => {
                    if (err) {
                        console.error(`Error deleting file ${videoFilePath}:`, err.message);
                    } else {
                        console.log(`Temporary file deleted: ${videoFilePath}`);
                    }
                });
            });

            fileStream.on('error', (err) => {
                console.error("Error writing file:", err.message);
                sendReactMessage(from, '❌', msg, sock);
                sendQuotedMessage(from, "❌ Failed to download the video.", msg, sock);
                downloadRequests.delete(from);
            });
        }).on('error', (err) => {
            console.error("Error with HTTP request:", err.message);
            sendReactMessage(from, '❌', msg, sock);
            sendQuotedMessage(from, "❌ Failed to fetch the video.", msg, sock);
            downloadRequests.delete(from);
        });
    } catch (error) {
        console.error("Error in handleVideoReply:", error.message);
        await sendQuotedMessage(from, "❌ An unexpected error occurred. Please try again later.", msg, sock);
    }
}

module.exports = { handleVideoReply, downloadRequests,handleVideoQuality,handleResponse };
