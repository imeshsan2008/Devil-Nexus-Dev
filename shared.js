const fs = require("fs");
const path = require("path");
const figlet = require('figlet');

const settingsPath = path.join(__dirname, "db/settings/settings.json");

function getSettings() {
  const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  const { badword, autodetectlink, fbdownload, perfix, tiktokdownload, bot_name } = currentSettings;
  return { badword, autodetectlink, fbdownload, perfix, tiktokdownload, bot_name };
}

const bot_name = getSettings().bot_name;

figlet(bot_name, { font: 'Standard' }, (err, data) => {
  if (err) {
    console.error('Error generating font art:', err);
    return;
  }
  console.log(data);
});


module.exports = { getSettings, settingsPath,bot_name };