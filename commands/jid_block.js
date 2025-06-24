const fs = require('fs');
const path = require('path');

const blocked_jids_Path = path.join(__dirname, '../db/usr_db/blocked_jids.json');

// Ensure file exists and load list
function loadBlockedJids() {
  try {
    if (!fs.existsSync(blocked_jids_Path)) {
      fs.writeFileSync(blocked_jids_Path, JSON.stringify([]), 'utf8');
    }
    const data = fs.readFileSync(blocked_jids_Path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading blocked JIDs:", err.message);
    return [];
  }
}

// Check if blocked
function isBlocked(from) {
  const blockedJids = loadBlockedJids();
  return blockedJids.includes(from);
}

// Add JID to block list
function addBlockedJid(jid) {
  const blockedJids = loadBlockedJids();

  if (!blockedJids.includes(jid)) {
    blockedJids.push(jid);
    try {
      fs.writeFileSync(blocked_jids_Path, JSON.stringify(blockedJids, null, 2), 'utf8');
      console.log(`Added ${jid} to blocked list.`);
    } catch (err) {
      console.error("Failed to write blocked_jids.json:", err.message);
    }
  } else {
    console.log(`${jid} is already in blocked list.`);
  }
}
// ❌ Remove a JID from the block list
function removeBlockedJid(jid) {
  let blockedJids = loadBlockedJids();

  if (blockedJids.includes(jid)) {
    blockedJids = blockedJids.filter(item => item !== jid);
    try {
      fs.writeFileSync(blocked_jids_Path, JSON.stringify(blockedJids, null, 2), 'utf8');
      console.log(`🗑️ Removed ${jid} from blocked list.`);
    } catch (err) {
      console.error("❌ Failed to update blocked_jids.json:", err.message);
    }
  } else {
    console.log(`ℹ️ ${jid} not found in blocked list.`);
  }
}


// // To block someone manually:
// addBlockedJid('123456789@s.whatsapp.net');
module.exports = { isBlocked, addBlockedJid,removeBlockedJid };