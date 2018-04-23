const Discord = require('discord.js');
const palette = require('./palette.js');
const https   = require('https');

module.exports = function (msg, args) {
	if (args[1].match(/^pal(l?ett?es?)?$/i)) {
		args.shift();
		return palette(msg, args);

	} else if (args[1].match(/^t[uo]+t[uo]+rials?$/i)) {
		args.shift();
		return tutorial(msg, args);

	} else {
		msg.channel.send('Here\'s a list of useful palettes:\nhttps://lospec.com/palette-list');
	}
};

// / Tutorial links
function tutorial(msg, args) {
	// Remove the command "!lospec-tutorial" from the args array
	args.shift(-1);

	if (args.length < 1) {
		let rnd = ((Math.random() < 1 / 16) && ', ya dingus') || '';
		msg.delete().catch(() => {});
		msg.channel.send('Invalid command usage' + rnd + '! Proper usage: ``!lospec-tutorial [tutorial name]``');
		return;
	}

	// Find name of palette, spaces changed to dashes, for link purposes. Lowercased.
	let tagstr = (args.reduce((acc, val) => acc + ',' + val)).toLowerCase();
	console.log(tagstr);

	// Create the embed
	let embed = new Discord.RichEmbed()
		.setTitle('Tutorial Not Found')
		.setURL('https://lospec.com/pixel-art-tutorials/');

	// Get the wepage to check if the palette exists

	let resStr = '';

	https.get('https://lospec.com/pixel-art-tutorials/tags/' + tagstr, (res) => {


		res.on('data', function(chunk) {
			// resStr += chunk.toString();
			// console.log(resStr);

			resStr += chunk.toString();

		});

		res.on('end', function(content = resStr) {

			/* let atag = content.match(/<\s*a\s+.*?href\s*=\s*(['"])(.*?)\1[^>]*>/);
                if (atag) embed.setURL(atag[2].replace('&#x3D;', '='));
                console.log(atag[2]);*/

			// 'https://lospec.com/pixel-art-tutorials/load?&page=1'

			let li = content.match(/<\s*ul\b.*?id\s*=\s*(["'])[^>]*?\bresults-countainer\b[^>]*?\1[^>]*>[\s\S]*?<\s*li\b[^>]*>[\s\S]*?<\s*\/\s*li\s*>/i);
			if (li) {
				content = li[0];
				console.log('content -------------------------------------> li[0] (yay!)');
			}

			let thumbnail = content.match(/<\s*div\b.*?class\s*=\s*(['"]).*?\bthumbnail\b.*?\1.*?style\s*=\s*['"].*?\bbackground-image\s*:\s*url\s*\((['"])(.*?\b)\2/i);
			if (!thumbnail) thumbnail = content.match(/<\s*div\b.*?style\s*=\s*(['"]).*?\bbackground-image\s*:\s*url\s*\((['"])(.*?\b)\2\);?\1.*?class\s*=\s*(['"]).*?\bthumbnail\b.*?\1/i);
			if (thumbnail) {
				embed.setURL('https://lospec.com/pixel-art-tutorials/' +  thumbnail[3].match(/\/[^/]+$/i)[0].slice(1, -thumbnail[3].match(/\.[^/]+$/i)[0].length));
				if (!thumbnail[3].match(/^https?:\//i)) {
					thumbnail[3] = 'https://lospec.com' + thumbnail[3];
				}
				embed.setImage(thumbnail[3]);
			}
			// console.log(thumbnail[3]);

			let title = content.match(/<\s*div\s*class\s*=\s*(['"]).*?\blisting\b.*?\1[^>]*>[\s\S]*?<\s*h1\b.*?>\s*(.*?)\s*<\s*\/\s*h1\s*>/i);
			if (title) embed.setTitle(title[2]);
			// console.log(title[2]);

			let description = content.match(/<\s*p\s*>([^<]+)<\s*\/\s*p\s*>/i);
			description = (description && description[1]) || '-';

			let author = content.match(/<\s*span\b.*?>[\s\S]*?<\s*a\b.*?href\s*=\s*(['"])\s*?(.*?)\1.*?\bclass\s*=\s*(['"]).*?\bauthor-link\b.*?\3[^>]*>\s*(.*?)\s*</i);

			if (author) {
				if (!author[2].match(/^https?:\//i)) {
					author[2] = 'https://lospec.com' + author[2];
				}
				embed.addField(description, 'by [' + author[4] + '](' + author[2] + ')');
			}
			// console.log(author[4] + ' | ' +  author[2]);


			// update title of embed, send embed, delete command message
			msg.channel.send({ embed });
			msg.delete().catch(() => {});

			console.log(embed);


		});
	}).on('error', (err) => {
		// Oh god. Oh man. This should not happen.
		console.log('Error getting lospec page (palette.js): ' + err.message);
		// Send the embed anyway. It should say "Palette Not Found"
		msg.channel.send({ embed });
		msg.delete().catch(() => {});


	});
}
