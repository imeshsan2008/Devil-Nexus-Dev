const fs = require("fs");
const path = require("path");
const figlet = require('figlet');

const settingsPath = path.join(__dirname, "db/settings/settings.json");

const usrdbPath = path.join(__dirname, "db/usr_db/contacts.json");


function getSettings() {
  const currentSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  const { badword, autodetectlink, fbdownload, perfix, tiktokdownload, bot_name, ytdownload ,api_key} = currentSettings;
  return { badword, autodetectlink, fbdownload, perfix, tiktokdownload, bot_name, ytdownload,api_key };
}
const bot_name = getSettings().bot_name;
const apikey = getSettings().api_key;

console.log(apikey);

figlet(bot_name, { font: 'Standard' }, (err, data) => {
  if (err) {
    console.error('Error generating font art:', err);
    return;
  }
  console.log(data);
});


module.exports = { getSettings, settingsPath, usrdbPath, bot_name,apikey };