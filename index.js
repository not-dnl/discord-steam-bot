const config = require("./config.json");
const steamUser = require('steam-user');
const Discord = require('discord.js');

require('log-timestamp');

const user = new steamUser();
const client = new Discord.Client();

const steamURL = 'https://store.steampowered.com/sub/'

user.logOn(); // login steam
client.login(config.TOKEN).then(); // login discord

user.on('loggedOn', () => {
    console.info("[steam] -> logged in as " + user.steamID.getSteam3RenderedID());

    user.setOption('enablePicsCache', true); // needed so that changelist event gets called
    user.setOption('changelistUpdateInterval', 4000); // changelist called every 4 seconds
    user.setOption('picsCacheAll', true); // all cache
});

user.on('packageUpdate', (packageid, data) => {
    let message = 'Update! packageid: ' + packageid + ', changenumber: ' + data['changenumber'];

    let packageinfo = data['packageinfo'];
    if (packageinfo == null) {
        message += ', packageinfo: ' + packageinfo + ', missingToken: ' + data['missingToken'];

        console.info(message);

        return;
    }

    let billingtype = packageinfo['billingtype'];
    let licensetype = packageinfo['licensetype'];

    message += ', billingtype: ' + billingtype + ' licensetype: ' + licensetype;

    let extended = packageinfo['extended'];
    if (extended == null) {
        console.info(message);

        return;
    }

    let appids = packageinfo['appids'];
    if (appids == null) {
        return;
    }

    message += ', appids: ';

    for (const appid of appids) {
        message += appid + ',';
    }

    message = message.slice(0, -1); // remove the last ','
    console.info(message);

    let freepromotion = extended['freepromotion'];
    if (freepromotion) {
        let starttime = extended['starttime'];
        let expirytime = extended['expirytime'];

        if (expirytime === 0) {
            console.error('expirytime was 0')

            return;
        }

        let today = new Date();

        let start = new Date(starttime * 1000);
        let end = new Date(expirytime * 1000);

        if (today.getTime() > end.getTime()) {
            console.error("today > end");

            return;
        }

        let diffTime = end.getTime() - start.getTime();
        let diffDays = diffTime / (1000 * 3600 * 24);

        // it might be possible that steam sends the same package twice
        // if it gets updated etc, so to not have duplicate package posts
        // we could store them in a db or simple json and remove once it expired
        let msg = 'Free Package! :)\n'
            + 'StartTime: ' + getTimeString(starttime) + '.\n'
            + 'ExpiryTime: ' + getTimeString(expirytime) + '.\n'
            + 'Ends in: ' + Math.floor(diffDays) + ' days.\n'
            + steamURL + packageid;

        client.channels.fetch(config.CHANNEL_ID)
            .then(channel => channel.send(msg));
    }
});

client.on('ready', () => {
    console.info('[discord] -> logged in as ' + client.user.tag);
});

function getTimeString(timestamp) {
    let a = new Date(timestamp * 1000);

    let months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let year = a.getFullYear();
    let month = months[a.getMonth()];
    let date = a.getDate();
    let hour = a.getHours();
    let min = a.getMinutes();
    let sec = a.getSeconds();

    if (hour < 10)
        hour = '0' + hour;

    if (min < 10)
        min = '0' + min;

    if (sec < 10)
        sec = '0' + sec;

    return date + ' ' + month + ' ' + year + ' - ' + hour + ':' + min + ':' + sec;
}
