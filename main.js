// REQUIRES
const _discord = require('discord.js');
const _client  = new _discord.Client();
const _snek = require("snekfetch");
const _fs = require("fs");
const _config = require("./config.json");
// KEYS
const debug    = true;
const prefix   = '!';
const botKey   = _config.bot_key;
const apiKeyK  = "296d3ab6-8259-4a3c-afeb-96a3c778a1c4";
const apiKeyV  = _config.api_key;
const apiLink  = "https://api.fortnitetracker.com/v1/profile";
// CHANNELS
const BR_PC    = (debug ? "412675076433903616" : "362236453771804683");
const BR_PS4   = (debug ? "412675127151427594" : "362676778642178049");
const BR_XB1   = (debug ? "412675141076779018" : "362676808975646732");
const STW_PC   = (debug ? "412675150174224384" : "322852071051231242");
const STW_PS4  = (debug ? "412675159518871552" : "362676713592717314");
const STW_XB1  = (debug ? "412675168499007490" : "362676802642247690");
const TYPES    = [ 'pc', 'ps4', 'xb1' ];
const LABELS   = [ 'pc', 'psn', 'xbl' ];

// STATISTICS COMMAND
const checkUsage = (message) => {
    message.reply("please revise your usage of the statistics command.\n**For example:** `" + prefix + "stats yhSimple` or type `" + prefix + "help` for more information.");
};

const getChannelType = (channel) => {
    switch(channel.id) {
        case BR_PC: case STW_PC:
            return "pc";
        
        case BR_PS4: case STW_PS4:
            return "ps4";
            
        case BR_XB1: case STW_XB1:
            return "xb1";

        default:
            return null;
    }
};

const getApiResponse = async (type, username, callback) => {
    await _snek.get(`${apiLink}/${type}/${username}`)
        .set(apiKeyK, apiKeyV)
        .then((resp) => callback(resp.body));
};

const handleStatType = (type) => {
    switch(type) {
        default: case "stats_solo": return "p2";
        case "stats_duo": return "p10";
        case "stats_squads": return "p9";
    }
}

const handleApiData = (resp, data) => {
    // Each part of data has different types of responses, we'll handle it this way
    switch(data) {
        case "accountId":
        case "platformId":
        case "platformName":
        case "platformNameLong":
        case "epicUserHandle":
            return resp[data];

        case "stats_solo":
        case "stats_duo":
        case "stats_squads":
            {
                let stats = resp['stats'][handleStatType(data)];
                var r = { };
                for(let k in stats) {
                    r[k] = stats[k]['displayValue'];
                }
                return r;
            }
            break;

        case "stats_lifetime":
            {
                let stats = resp['lifeTimeStats'];
                var r = { };
                for(let k in stats) {
                    r[stats[k]['key']] = stats[k]['value'];
                }
                return r;
            }
            break;
    }
}

// MESSAGE
_client.on('message', async (message) => {
    // VALID MESSAGE
    if(message.type !== 'DEFAULT') return;

    // CHECK MESSAGE IS VALID USER
    if(message.author.bot) return;

    // CHECK MESSAGE STARTS WITH PREFIX
    if(message.content.indexOf(prefix) !== 0) return;

    // HANDLE MESSAGE
    else {
        // COMMAND ARGUMENTS
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const handler = message.member;
        const cmd = args.shift().toLowerCase();
        
        // HELP COMMAND
        if(['help', 'info', 'information'].indexOf(cmd) >= 0) {
            message.reply("Usage details");
        }

        // STATISTICS COMMAND
        if(['stats', 'stat', 'track', 'me'].indexOf(cmd) >= 0) {
            let channelType = getChannelType(message.channel);

            switch(channelType) {
                case "pc":
                    {
                        
                    }
                    break;
                case "ps4":
                    {
                        
                    }
                    break;
                case "xb1":
                    {

                    }
                    break;
                default:
                    {
                        // ARGUMENT CHECK
                        if(args.length > 0) {
                            // USER DETAILS
                            let type = (args.length >= 2 ? args.shift() : channelType);
                            let username = args.join(" ").toLowerCase();

                            // CHECKS
                            if(type === null || TYPES.indexOf(type.toLowerCase()) !== 0) return checkUsage(message);

                            // GET API RESPONSE
                            var userHandle, lifetimeStats, soloStats, duoStats, squadStats, error = false;
                            const apiResponse = await getApiResponse(type, username, (resp) => {
                                // Check for error
                                if(resp.error) {
                                    error = true;
                                    return message.reply("Unable to find Epic Games User '**" + username + "**'.\nAre you sure you're using their Epic Games Username and not their display name (gamertag/psn/steam name)?")
                                }

                                // Handle Data
                                userId = handleApiData(resp, "accountId");
                                userHandle = handleApiData(resp, "epicUserHandle");
                                lifetimeStats = handleApiData(resp, "stats_lifetime");
                                soloStats = handleApiData(resp, "stats_solo");
                                duoStats = handleApiData(resp, "stats_duo");
                                squadStats = handleApiData(resp, "stats_squads");
                                console.log(lifetimeStats);
                            }).then(() => {
                                // Check error status
                                if(error) return;

                                // GET EMBED
                                let ebd = new _discord.RichEmbed();
                                ebd.setAuthor(`Tracking '${userHandle}'`, _client.user.avatarURL);
                                ebd.setThumbnail(_client.user.avatarURL);
                                ebd.addField("Lifetime", `Wins: **${lifetimeStats['Wins']}** - K/D: **${lifetimeStats['K/d']}** - Playtime: **${lifetimeStats['Time Played']}**\nTop 3: **${lifetimeStats['Top 3s']}** - Top 5: **${lifetimeStats['Top 5s']}** - Top 6: **${lifetimeStats['Top 6s']}** - Top 12: **${lifetimeStats['Top 12s']}** - Top 25: **${lifetimeStats['Top 25s']}**`);
                                ebd.addField("Solo", `Wins: **${soloStats['top1']}** - K/D: **${soloStats['kd']}** - Playtime: **${soloStats['minutesPlayed']}**`);
                                ebd.addField("Duo", `Wins: **${duoStats['top1']}** - K/D: **${duoStats['kd']}** - Playtime: **${duoStats['minutesPlayed']}**`);
                                ebd.addField("Squads", `Wins: **${squadStats['top1']}** - K/D: **${squadStats['kd']}** - Playtime: **${squadStats['minutesPlayed']}**`);
                                ebd.setFooter(`Requested By: ${message.author.tag} | Created By Simps#0001`);
                                message.channel.send({ embed: ebd });
                            });
                        }
                        else return checkUsage(message);
                    }
                    break;
            }
        }
    }
});

// READY
_client.on('ready', () => {
    _client.user.setUsername("Fortnite Tracker");
  console.log(`Logged in as ${_client.user.tag}!`);
});

// LOGIN
_client.login(NTYyMzIyOTAyNDEwNTkyMjc2.XKJHow.1JydCfHq21_7WZuPNHg8RIMSCoQ);
