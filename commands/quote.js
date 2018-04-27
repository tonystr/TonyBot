
const Discord = require('discord.js');

// Example ID: 438048886687531009

module.exports = function(channel, string) {
    channel.fetchMessage(string).then((msg) => {

        if (msg && msg !== {}) {
            console.log(`Fetched message: ${msg}`);

            let nick = msg.member && msg.member.nickname;
            let color = msg.member.colorRole.color;
            console.log(color);

            let embed = new Discord.RichEmbed()
                    .setAuthor((nick ? nick : msg.author.username), msg.author.avatarURL)
                    .setDescription(msg.content)
                    .setColor(color)
                    .setFooter(msg.createdAt);

            channel.send(embed).catch(() => {});
        } else {
            console.log(`Error fetching message: ${msg} from: ${string} in channel: ${channel}`);
            
        }
    }).catch(err => console.log(err));
}
