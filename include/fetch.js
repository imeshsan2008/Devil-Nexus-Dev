const baseuri = 'https://venom-devils-api.koyeb.app';

async function getFbVideoInfo(url,qu) {
    try {
        const fetch = await import('node-fetch'); // Dynamic import
        const apiUrl = `${baseuri}/download/${qu}?url=${encodeURIComponent(url)}&apikey=e6qk1awb2v`;
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

// Use an IIFE to handle the async function
module.exports = {getFbVideoInfo};
