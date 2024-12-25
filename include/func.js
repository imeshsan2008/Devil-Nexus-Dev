const { getFbVideoInfo } = require("./fetch.js");
const { downloadRequests } = require("./files/fb.js");

const axios = require("axios");
const bot_name = "> BOT NEXUS BETA";


const sendQuotedMessage = async (from, message, msg,sock) => {
	await sock.sendMessage(from, 
		{ text: `${message} 
		
${bot_name}` }, 
		{ quoted: msg }
	);
	
  }
  const sendReactMessage = async (from, emoji, msg, sock) => { 
	
    await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
    
}


async function fbcmd(from, msg, sock ,splitlink  ) { 
	
	if (!splitlink) {
		sendReactMessage(from, "❓", msg, sock);

		sendQuotedMessage(
		  from,
		  "🔹 Example: .fb https://web.facebook.com/reel/1785899365480917 📹",
		  msg
		);
		return;
	  }
	  if (splitlink.toLowerCase().startsWith("https://") || splitlink.toLowerCase().startsWith("web.facebook.com")|| splitlink.toLowerCase().startsWith("facebook.com") || splitlink.toLowerCase().startsWith("fb.watch")) {
		
	  }
	  else{
		sendReactMessage(from, "❌", msg, sock);

		sendQuotedMessage(
		  from,
		  "❌ Unable to fetch video info",
		  msg
		);
		return;
	}

	const videoInfo = await getFbVideoInfo(splitlink,'fb');
	if (videoInfo) {
	  const imageBuffer = await axios
		.get(videoInfo.thumbnail, { responseType: "arraybuffer" })
		.then((res) => res.data);
sendReactMessage(from, "⬇️", msg, sock);
	  await sock.sendMessage(
		from,
		{
		  image: imageBuffer,
		  caption: `
🎥 *Title:* ${videoInfo.title} 

⏱️ *Duration:* ${videoInfo.duration} 

📥 *Do you want to download this video?*

Please reply with:
	
1️⃣ *YES*
2️⃣ *NO*

${bot_name} | FB DOWNLOADER`,
		},
		{ quoted: msg }
	  );
downloadRequests.set(from, { videoInfo, step: '1' });

	}else{
		sendReactMessage(from, "❌", msg, sock);

		sendQuotedMessage(
			from,
			"❌ Unable to fetch video info",
			msg,sock
		  );
		  return
	}
}
module.exports = {fbcmd,sendQuotedMessage
	,sendReactMessage,bot_name};
