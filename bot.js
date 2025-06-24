const express = require("express"); // Import express module
// At the top of your file, make sure you have these requires:
const fs = require('fs');  // Regular fs for sync operations
const cron = require("node-cron");

const fsPromises = require('fs').promises;  // Make sure to use fs.promises
const { getSettings, settingsPath,usrdbPath } = require("./shared.js"); // Import getSettings and settingsPath from shared.js
const { getVideoInfo, sendReactMessage, sendQuotedMessage } = require("./function/fetch.js"); // Import functions from fetch.js
// const { birthday_system } = require("./function/birthday.js"); // Import functions from fetch.js
const QRCode = require('qrcode');
const path = require("path"); // Import path module
const makeWASocket = require("@whiskeysockets/baileys").default; // Import makeWASocket from baileys
const { useMultiFileAuthState } = require("@whiskeysockets/baileys"); // Import useMultiFileAuthState from baileys
const qrcode = require("qrcode-terminal"); // Import qrcode-terminal module
let botStartTime = Date.now(); // Record the time the bot was started
const { facebook, map, sendquality, selectquality, sendVideo } = require("./commands/fb.js"); // Import functions from fb.js
const { tiktok, sendsound, sendreq, selectreq, sendtiktok } = require("./commands/tiktok.js"); // Import functions from tiktok.js
const { youtube, sendreqyt, selectqualityyt, sendyt, sendytmp3 } = require("./commands/youtube.js"); // Import functions from youtube.js

const axios = require('axios');
const { Readable } = require('stream');
const sessionId = "session1000"; // Session unique ID
const app = express(); // Create an express application
const PORT = process.env.PORT || 8000; // You can change this to any port you prefer
// const contact =  ;
// Middleware to parse JSON
app.use(express.json()); // Use express.json() middleware
app.use(express.urlencoded({ extended: true })); // Use express.urlencoded() middleware

// Serve static files from the "public" directory
app.use(express.static("public")); // Serve static files from "public" directory

// Endpoint to serve settings.json
app.get("/db/settings/settings.json", (req, res) => {
  try {
    const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8")); // Read and parse settings file
    return res.status(200).json({ currentSettings }); // Send settings as JSON response
  } catch (err) {
    console.error("Error reading settings file:", err); // Log error
    res.status(500).json({ error: "Failed to read settings file" }); // Send error response
  }
});
// Endpoint to serve settings.json
app.get("/db/usr_db/contacts.json", (req, res) => {
  try {
    const currentSettings = JSON.parse(fs.readFileSync(usrdbPath, "utf8")); // Read and parse settings file
    return res.status(200).json({ currentSettings }); // Send settings as JSON response
  } catch (err) {
    console.error("Error reading settings file:", err); // Log error
    res.status(500).json({ error: "Failed to read settings file" }); // Send error response
  }
});



// Endpoint to update settings.json
app.post("/db/settings/setsettings", (req, res) => {
  const { badword, autodetectlink, tiktokdownload, bot_name, fbdownload, perfix, api_key } = req.query; // Extract query parameters
  const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8")); // Read and parse settings file

  try {
    if (autodetectlink !== undefined) {
      if (currentSettings.autodetectlink === autodetectlink) {
        return res.status(200).json({ message: "autodetectlink is already up-to-date" }); // Send response if autodetectlink is already up-to-date
      }
      currentSettings.autodetectlink = autodetectlink; // Update autodetectlink
    }

    if (bot_name !== undefined) {
      const upperCaseBotName = bot_name.toUpperCase(); // Convert bot_name to uppercase
      currentSettings.bot_name = upperCaseBotName; // Update bot_name
    }
 if (api_key !== undefined) {
      currentSettings.api_key = api_key; // Update bot_name
    }
    if (perfix !== undefined) {
      currentSettings.perfix = perfix; // Update perfix
    }

    if (fbdownload !== undefined) {
      if (currentSettings.fbdownload === fbdownload) {
        return res.status(200).json({ message: "fbdownload is already up-to-date" }); // Send response if fbdownload is already up-to-date
      }
      currentSettings.fbdownload = fbdownload; // Update fbdownload
    }

    if (badword !== undefined) {
      if (currentSettings.badword === badword) {
        return res.status(200).json({ message: "badword is already up-to-date" }); // Send response if badword is already up-to-date
      }
      currentSettings.badword = badword; // Update badword
    }

    if (tiktokdownload !== undefined) {
      if (currentSettings.tiktokdownload === tiktokdownload) {
        return res.status(200).json({ message: "tiktokdownload is already up-to-date" }); // Send response if tiktokdownload is already up-to-date
      }
      currentSettings.tiktokdownload = tiktokdownload; // Update tiktokdownload
    }

    fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2)); // Write updated settings to file
    res.json({ success: true, message: "Settings updated successfully!" }); // Send success response
  } catch (err) {
    console.error("Error updating settings:", err); // Log error
    res.status(500).json({ error: "Failed to update settings" }); // Send error response
  }
});

// 1. Fixed file reading function
function readSettingsFile() {
  try {
    const settingsPath = path.resolve('./settings.json');
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (error) {
    console.error('Error reading settings file:', error);
    return null;
  }
}

// 2. Fixed birthday system function
// async function birthday_system() {
//   try {
//     const settings = readSettingsFile();
    
//     // Add null check for settings and birthdays
//     if (!settings || !settings.birthdays) {
//       console.log('No birthdays found in settings');
//       return [];
//     }
    
//     // Your birthday processing logic here
//     return settings.birthdays;
//   } catch (error) {
//     console.error('Failed to fetch or process birthday data:', error);
//     return [];
//   }
// }

// async function sendStatusImage(sock, imagePath, caption = '') {
//   try {
//     const absolutePath = path.resolve(imagePath);
//     await fsPromises.access(absolutePath);
//     const imageBuffer = await fsPromises.readFile(absolutePath);
    
//     await sock.sendMessage('status@broadcast', {
//       image: imageBuffer,
//       caption: caption
//     });
    
//     console.log('Status image sent successfully');
//     return true;
//   } catch (error) {
//     console.error('Error sending image status:', error);
//     return false;
//   }
// }
async function birthday_system(sock) {
    try {
        const response = await fetch('http://localhost:8000/db/usr_db/contacts.json');
        const data = await response.json();
       
        const today = new Date();
        const todayMonth = today.getMonth() + 1; // Months are 0-indexed
        const todayDay = today.getDate();

        const birthdaysToday = data.currentSettings.birthdays.filter(person => 
            person.birthday.month === todayMonth && person.birthday.day === todayDay
        );

        const sendMessage = async (person, sock) => {
            try {
              
                // Remove any non-digit characters from phone number
                const phoneNumber = person.phone.replace(/\D/g, '');
                // Add @s.whatsapp.net suffix for WhatsApp
                const jid = `${phoneNumber}@s.whatsapp.net`;
                
                const message = `🎉 Happy Birthday, ${person.name}! 🎂\n\nWishing you a fantastic day filled with joy and happiness! 🥳`;
                
                await sock.sendMessage(
                    jid, 
                    { 
                        image: { url: person.photo }, // Using the photo URL from the person's data
                        caption: message 
                    }
                ); 
                   
console.log("Birthday message sent to:", person.name);
            } catch (error) {
                console.error("Failed to send message to", person.name, ":", error.message);
            }
        };

        // Send messages to all birthdays today
        for (const person of birthdaysToday) {
            await sendMessage(person, sock);
        }

        console.log("Birthday messages sent to:", birthdaysToday.map(p => p.name));
        return birthdaysToday;
    } catch (error) {
        console.error('Failed to fetch or process birthday data:', error);
        return [];
    }
}

// Function to start the WhatsApp bot
async function startBot(sessionId) {
  console.log(`Starting bot for session: ${sessionId}...`); // Log starting message

  const authStatePath = path.join("auth_info", sessionId); // Define auth state path
  const { state, saveCreds } = await useMultiFileAuthState(authStatePath); // Get auth state and saveCreds function

  const sock = makeWASocket({
    auth: state, // Set auth state
    printQRInTerminal: true, // Print QR code in terminal
  });

  
let usersnum = 'null';
let usersPushName = 'null';

// Only try to get user info if sock.user exists
if (sock.user) {

    usersnum = sock.user.id?.split('@')[0]?.split(':')[0] || 'null';
    usersPushName = sock.user.name || 'null';

}

app.get("/db/settings/getsettings", (req, res) => {
    res.json({ 
        usernumber: usersnum, 
        usersPushName: usersPushName 
    });
});


  sock.ev.on("creds.update", saveCreds); // Save credentials on update

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update; // Extract connection, lastDisconnect, and qr from update

    if (connection === "close") {
      console.log(`Session ${sessionId}: Connection closed, reconnecting...`); // Log connection closed message
      setTimeout(() => startBot(sessionId), 5000); // Reconnect after 5 seconds
    } else if (connection === "open") {
        // sock.updateProfileStatus("තරුවක් නෙමේ මටත් ඔනේ හදක් වගෙ වෙන්න ")
 

      console.log(`Session ${sessionId}: Bot connected successfully!`); // Log connection success message
      // console.log(`Logged in as: ${usersnum}`); // Log phone number
    }
  
   if (qr) {
    // Option 1: Using qrcode.generate (if you want to render directly to DOM)
    qrcode.generate(qr, { small: true });
    
    // Option 2: Using QRCode.toDataURL (if you want a data URL)
    const generateQRImgTag = async (text) => {
        try {
            const qrDataUrl = await QRCode.toDataURL(text, {
                scale: 8,
                margin: 2,
            });
            return qrDataUrl; // Return the data URL
        } catch (err) {
          
            console.error('Error generating QR code:', err);
            return null;
        }
    };
    
    // Properly handle the async function
    generateQRImgTag(qr).then(dataUrl => {
      
    
app.get("/qrencode", (req, res) => {
    res.json({ 
   imgurl: dataUrl || 'null', 
   
    });
});

    });
}



    if (lastDisconnect?.error) {
      console.error(`Session ${sessionId}: Connection error:`, lastDisconnect.error); // Log connection error
    }
  });

  cron.schedule("0 0 * * *", () => {

if (!birthdayChecked) {
    birthday_system(sock); 
    birthdayChecked = true; 
}
}
);

  sock.ev.on("messages.upsert", async (message) => {
    try {
      let msg = message.messages[0]; // Get the first message

      // Check if message or its content is null/undefined
      if (!msg || !msg.message) {
        console.log("Message object or content is null/undefined."); // Log null/undefined message
        return;
      }


      const from = msg.key.remoteJid; // Get sender ID
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""; // Get message text
      const pushName = msg.pushName || "there"; // Fallback if pushName is not available

      // Ignore broadcast or newsletter messages
      if (from.includes("status@broadcast") || from.includes("@newsletter")) {
        return;
      }
if (text.includes("> BOT NEXUS")) {
  console.log("Bot's message detected.");1
  
  return;
  
}

      const ISallow = getSettings(); // Get settings
      const perfix = ISallow.perfix; // Get prefix
      if (text.toLowerCase().startsWith('br')) {
          birthday_system(sock);

      }
      // console.log(map.get(from));

      // Handle "alive" command
      if (text.toLowerCase().startsWith(perfix + 'alive')) {
        const uptime = Date.now() - botStartTime; // Calculate total uptime in milliseconds

        const hours = Math.floor(uptime / 3600000); // Calculate hours
        const minutes = Math.floor((uptime % 3600000) / 60000); // Calculate remaining minutes
        const seconds = Math.floor((uptime % 60000) / 1000); // Calculate remaining seconds

        const statusMessage = `Bot is online! ✅\n${hours} hours, ${minutes} minutes, ${seconds} seconds`; // Create status message
        await sendQuotedMessage(from, statusMessage, msg, sock); // Send status message
        sendReactMessage(from, "👋", msg, sock); // Send reaction message
      }

      const currentDate = new Date(); // Get current date
      const isJanuary1 = currentDate.getDate() === 2 && currentDate.getMonth() === 0; 

      // Handle birthday or congratulatory messages
      if (
        msg.key.fromMe === false &&  text.toLowerCase().startsWith('happy')&&
        text.toLowerCase().includes("birthday") ||

          text.toLowerCase().includes("celebrate")
        
       
        
        // New keyword
      ) {
        if (isJanuary1) {
          const replyText = `🎉 Thank you, ${pushName}! I really appreciate it. 😊`; // Create reply text

          await sendQuotedMessage(from, replyText, msg, sock); // Send reply message
          sendReactMessage(from, "🎉", msg, sock); // Send reaction message
          return;
        } else {
          const replyText = `❌ Today is not my birthday, but thank you for the kind words! 😊`; // Create reply text
          await sendQuotedMessage(from, replyText, msg, sock); // Send reply message
          sendReactMessage(from, "❌", msg, sock); // Send reaction message
          return;
        }
      }

      
// YouTube Download
if (
  ISallow.ytdownload === "true" &&
  text.toLowerCase().startsWith(perfix + 'yt')
) {
  const videoLink = text.split(" ")[1];
 
  if (!videoLink) {
    await sendQuotedMessage(
      from,
      "🔹 Example: .yt https://www.youtube.com/watch?v=75HsNjYr7mI",
      msg,
      sock
    );
    await sendReactMessage(from, "❓", msg, sock);
    return;
  }

  const videoInfos = await getVideoInfo(videoLink, 'download', 'yt');
  await youtube(from, msg, sock, videoInfos);
}

// Facebook Download
 if (
  ISallow.fbdownload === "true" &&
  text.toLowerCase().startsWith(perfix + 'fb')
) {
  const videoLink = text.split(" ")[1];

  if (!videoLink) {
    await sendQuotedMessage(
      from,
      "🔹 Example: .fb https://web.facebook.com/reel/1785899365480917",
      msg,
      sock
    );
    await sendReactMessage(from, "❓", msg, sock);
    return;
  }

  const videoInfos = await getVideoInfo(videoLink, 'download', 'fb');
  await facebook(from, msg, sock, videoInfos);
}

// TikTok Download
 if (
  ISallow.tiktokdownload === "true" &&
  (text.toLowerCase().startsWith(perfix + 'tiktok') ||
   text.toLowerCase().includes('https://tiktok.com'))
) {
  const videoLink = text.split(" ")[1];

  if (!videoLink) {
    await sendQuotedMessage(
      from,
      "🔹 Example: .tiktok https://vt.tiktok.com/ZS6r8xQbm/",
      msg,
      sock
    );
    await sendReactMessage(from, "❓", msg, sock);
    return;
  }

  const videoInfos = await getVideoInfo(videoLink, 'download', 'tiktok');
  await tiktok(from, msg, sock, videoInfos);
}

// Facebook Auto Link Detection
 if (
  ISallow.autodetectlink === "true" &&
  (text.toLowerCase().includes('facebook.com') ||
   text.toLowerCase().includes('fb.watch'))
) {
  const videoLink = text;

  const videoInfos = await getVideoInfo(videoLink, 'download', 'fb');
  await facebook(from, msg, sock, videoInfos);
} if (
  ISallow.autodetectlink === "true" &&
  (text.toLowerCase().includes('https://') && text.toLowerCase().includes('youtube.com') ||
   text.toLowerCase().includes('youtu.be'))
) {
  const videoLink = text;

  const videoInfos = await getVideoInfo(videoLink, 'download', 'yt');
  await youtube(from, msg, sock ,videoInfos);
  return;
}

      // Access the quoted message context
      const quotedMessage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage; // Get quoted message

      // Ensure the message is a reply to the bot
      if (quotedMessage) {
        const quotedMessageContext = msg.message?.extendedTextMessage?.contextInfo; // Get quoted message context
        const quotedMessageId = quotedMessageContext?.stanzaId; // Get quoted message ID
        const currentMessageId = map.get(from); // Get current message ID
        const isQuotedMessageSame = currentMessageId && currentMessageId.msg === quotedMessageId; // Check if quoted message is the same


if ( currentMessageId && currentMessageId.platform === 'fb') {

          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendquality(from, msg, sock); // Send quality message
            return;
          } else           if (["2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendReactMessage(from, "🆗", msg, sock); // Send reaction message

          
          }
          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 2) {
            await selectquality(from, msg, sock, text); // Select quality
            return;
          }
          if (["1h"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendVideo(from, msg, sock, map.get(from).hd); // Send video
            return;
          }
         if (["1s"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendVideo(from, msg, sock, map.get(from).sd); // Send video
            return;
          }
        
        }

if ( currentMessageId && currentMessageId.platform === 'yt') {

          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendreqyt(from, msg, sock); // Send quality message
            return;
          } else          
           if (["2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendReactMessage(from, "🆗", msg, sock); // Send reaction message

          
          }
          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 2) {
            await selectqualityyt(from, msg, sock, text); // Select quality
            return;
          }
          if (["1h"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendVideo(from, msg, sock, map.get(from).hd); // Send video
            return;
          }
         if (["1s"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendVideo(from, msg, sock, map.get(from).sd); // Send video
            return;
          }
        
        }

        if (  currentMessageId && currentMessageId.platform === 'tiktok') {
          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendreq(from, msg, sock); // Send request
            return;
          } else           if (["2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendReactMessage(from, "🆗", msg, sock); // Send reaction message
          }
          
          if (["1", "2"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 2) {
            await selectreq(from, msg, sock, text); // Select request
            return;
          }
          if (["11v"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendtiktok(from, msg, sock, map.get(from).video); // Send TikTok video
            return;
          }
          if (["11s"].includes(text.trim()) && isQuotedMessageSame && currentMessageId.step === 1) {
            await sendsound(from, msg, sock, map.get(from).sound); // Send sound
            return;
          }
        }
      }

      
    } catch (error) {
      console.error("An error occurred in the message handler:", error); // Log error
    }
  });
}

// Start Express server
app.listen(PORT, () => {
  // console.log(`Server running at http://localhost:${PORT}`);
});
// Start the bot
startBot(sessionId); // Start the bot with session ID
