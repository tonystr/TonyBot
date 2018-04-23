const Discord = require('discord.js');
const https = require('https');
/**
 * Sends an embed containing the latest blog posts on TonyStr.net
 * @param {Message} msg Discord message
 * @param {Array<string>} args Command arguments
*/
module.exports = function(message) {
	let embed = new Discord.RichEmbed().setColor(15810917)
		.setURL('https://tonystr.net/blog/')
		.setTitle('TonyStr.net - Devlog - Currently working on: ATIRAG')
		.addBlankField(true);

	getTitle(1, 3);

	function getTitle(page, max) {
		console.log('called getTitle(' + page + ', ' + max + ')');
		if (page >= max) {
			message.channel.send(embed);
			
		} else {
			https.get('https://tonystr.net/blog/' + page + '.html', (res) => {
				res.on('data', function (chunk) {

					// Turn the data into a string
					let str = chunk.toString();
					// Create a regex to find the <h1 class="page-title">title</h1>
					let match = str.match(/(<\s*h1\s+class="\s*page-title[ "][^>]*>(.+?)<\s*\/\s*h1)>/gi);
					if (match) {
						for (let i = 0; i < match.length; i++) {
							let out = match[i];
							// Slice off the <title> tags, to just get the title
							let pretaglen = out.match(/<\s*h1\s+class="\s*page-title[ "][^>]*>/gi)[0].length;
							let endtaglen = out.slice(pretaglen).match('<\s*\/\s*h1>')[0].length;
							let title     = out.slice(pretaglen, -endtaglen);

							// <h3 id="blogpost-date">2. Mar 2018</h3>
							let datematch = str.match(/(<\s*h3\s+id="\s*blogpost-date[ "][^>]*>(.+?)<\s*\/\s*h3)>/gi);
							if (datematch) {
								out = datematch[0];
								// Slice off the <title> tags, to just get the title
								pretaglen = out.match(/<\s*h3\s+id="\s*blogpost-date[ "][^>]*>/gi)[0].length;
								endtaglen = out.slice(pretaglen).match('<\s*\/\s*h3>')[0].length;
								let date  = out.slice(pretaglen, -endtaglen);

								embed.addField(date, '[' + title + '](https://tonystr.net/blog/' + page + '.html)');
							}
						}
						getTitle(++page, max);
					}
				});
			});
		}
	}
};
