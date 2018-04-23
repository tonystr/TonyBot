/* eslint-disable max-depth */

const Discord = require('discord.js');
const http = require('http');
const keywords = require('./miniboss.keywords.js');

/**
 * Sends a miniboss pixelart reference
 * @param {Message} msg Discord message
 * @param {Array<string>} args Command arguments
*/
module.exports = function(msg, args) {

	// Create link- and help- message
	let link = 'Here\'s a list of useful pixelart references:\n' +
							'<http://blog.studiominiboss.com/pixelart>\n';
	let help = '\nYou can use ``!miniboss <image number>`` or ``!miniboss <image name>`` ' +
							'(without the <>) to get a specific post with image from the site.\n' +
							'If the post has more than one image attached, you can use ``!miniboss <post> ' +
							'<index>`` to link a specific image (where <post> is one of the commands above)';

	// Send both link and help if no arguments are provided
	if (args.length <= 1) {
			msg.channel.send(link + help);
			msg.delete().catch(() => {});
			return;

	// Check for custom help and link commands. Send the corresponding message.
	} else if (args[1].match(/help|usage|command|link|(web)?(page|site)/i)) {
		let out = '';
		let arg = args[1] + ' ' + args[args.length];
		if (arg.match(/link|(web)?(page|site)/i) !== null) out += link;
		if (arg.match(/help|usage|command/i)	 !== null) out += help;

		msg.channel.send(out);
		msg.delete().catch(() => {});
		return;
	}

	// find image index
	let index = (args[args.length - 1].match(/^-[0-9]+$/)) ? Number(args.pop().slice(1)) : 1;

	// Find name of referenece.
	let bossName = matchKeyword(args.splice(1).reduce((acc, val) => acc + ' ' + val).replace('<', '&lt;'));

	// Create the embed, with default text.
	let embed = new Discord.RichEmbed()
		.setColor(2236468)
		.setTitle('Miniboss Image Not Found');

	// Get the wepage to check if the image exists
	http.get('http://blog.studiominiboss.com/pixelart', (res) => {
		let imageFound = false;
		/* eslint-disable complexity */
		res.on('data', function (chunk) {
			if (!imageFound) {

				// Turn the data into a string
				let str = chunk.toString().replace(/&nbsp;/g, ' ');

				// create an array containing all <p> paragraphs
				let match = str.match(/<\s*p[^>]*>(.+?)<\/p>/gi);
				if (match) {
					let matchFound = false;
					let matchIndex = 0;

					// Loop through all the <p> paragraphs
					for (let i = 0; i < match.length; i++) {
						// Match reference name, case insensitively
						let ind = match[i].toUpperCase().indexOf(bossName.toUpperCase());
						while (ind >= 0) {
							// Make sure match is not part of a larger word
							if ((ind + 1) && (match[i].slice(ind - 1, ind + bossName.length + 1).match(/^\W[\s\S]*(\W[\s\S]?|s\W)$/))) {
								// Use raw string name. Check if name is end-of-word
								matchIndex = i;
								matchFound = true;
								break;
							}
							// Find the next refrence name in the <p> paragraph, if there're any more left
							ind = match[i].toUpperCase().indexOf(bossName.toUpperCase(), ind + bossName.length);
						}
						if (matchFound) break;
					}

					if (!matchFound) return;

					// Store found <p> paragraph
					let out = match[matchIndex];

					// Find <a> anchor tag surrounding image title (and sometimes image,
					// because this website is very inconsistent).
					let titleTag = out.match(/<\s*a\b[^>]*>.*?<\/a>/gi);
					if (!titleTag) return;

					titleTag = titleTag[0];
					let imageType = '';

					// Find the title
					let tag	 = titleTag.match(/>[^<]+/i);
					if (tag === null) return;
					let title = tag[0].slice(1).replace('&lt;', '<');
					// The title 'Firearm Design' is split up over two <a> tags for whatever reason...
					if (title === 'Firearm ') title += ' Design';

					// Find URL masked by the title, and put it in the embed
					let linkTag = titleTag.match(/^<\s*a\b[^>]*>/i)[0].match(/href\s*=\s*(["'])(?:(?!\1).)*\1/i);
					if (linkTag) {
						linkTag = linkTag[0];
						let offset = linkTag.match(/href\s*=\s*["']/)[0].length;
						embed.setURL(linkTag.slice(offset, -1).replace('&amp;', '&'));
					}

					let i = 0;
					let imageIndex = index;
					// This will loop from the current <p> paragraph, look for images,
					// and end up with the image specified by the index argument (default: -1)
					while (index > 0) {
					if (matchIndex + i > match.length) break;

					// Search for image, using RegEx
					if (match[matchIndex + i]) {
						let img = match[matchIndex + i].match(/<img\b.*?\bsrc\s*=\s*(['"])(?:(?!\1).)*\1/i);
						if (img) {
							// If an image was found, decrement index, then continue if the index does not reach 0.
							// (That's how the index argument works. It's really just an offset, starting at 1)
							index--;
							if (index <= 0) {
								// Find the image link, set the image link, remember that an image was found, and
								// store the file extension of the image/gif/whatever-it-is.
								let imgLink = img[0].slice(img[0].match(/<img\b.*?\bsrc\s*=\s*['"]/i)[0].length, -1);
								embed.setImage(imgLink);
								imageFound = true;
								imageType	= imgLink.match(/\.[^.]+$/)[0].slice(1).toUpperCase();
							}
						}
					}

					// If i has gone too far, halt the loop to avoid a potentual infinite loop
					if (i++ > 32) {
						// Guess what. We are NOT breaking out of the whole script and saying 'error'
						// Why, you might ask? Well, the user can for example type
						// !miniboss #6 2000
						// This is a user error, or potentual attempted exploitation.
						console.log('Error getting miniboss image (miniboss.js): image loop extended 32');
						// We're not even giving them the satisfaction of being told their
						// command usage was (probably) wrong.
						embed.setDescription('Could not find image');
					}
				}

				// Find the number of the image, and put it in a string
				let number = out.match(/#[0-9]+\b/i);
				number = number ? number[0] + ' - ' : '';
				// Add index to the string if it is not 1
				let footer = imageType + ((parseInt(imageIndex) !== 1) ? ' - Index: ' + imageIndex : '') + ' - blog.studiominiboss.com/pixelart';

				// Finally, set the title
				embed.setTitle('MiniBoss Pixelart - ' + number + title);
				if (footer) embed.setFooter(footer, 'http://i.imgur.com/y4c0rPv.png');
			}
		}
	}).on('end', () => {
		// Send the embed which should (hopefully) contain both an image,
		// a title, and a link. (and a color) (and maybe a footer)
		msg.channel.send(embed);
		msg.delete().catch(() => {});
		// Pat yourself on the back, and buy yourself an ice cream
	}).on('error', crucialError);
}).on('error', crucialError);

	// Error function.
	function crucialError(err, emeg = msg) {
		console.log('Error getting miniboss image (miniboss.js): ' + err.message);
		emeg.channel.send('An error ocurred trying to find the specified miniboss image. Please check your input for human error. If the input is flawless, please contact an admin.');
		emeg.delete().catch(() => {});
	}
}

/**
 * Attempts to match the input string against a keyword, and returns related tag
 * @param {String} string message string
*/
function matchKeyword(string) {
	// Remove 's' from end of string, and lowercase it.
	const str = (string.match(/s$/i) ? string.slice(0, -1) : string).toLowerCase();

	// Attempt to match any keyword against the string
	for (let keyword of keywords) {
		let match = str.match(keyword.match);
		if (match) {
			let val = keyword.value;
			// Apply optional keyword function
			if (keyword.hasOwnProperty('action')) {
				val += keyword.action(str, match);
			}
			// Return value associated with matched keyword
			return val;
		}
	}
	// Return input string if no keyword matched
	return string;
}
