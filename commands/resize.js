// Node libs
const jimp = require('jimp');
const Discord = require('discord.js');

/**
 * Resizes an attached image of a discord message
 * @param {Message} msg Discord message
 */
function resize(msg, args) {

	// Ensure an argument was passed
	if (args.length < 2) {
		msg.channel.send('Invalid command usage! Proper usage: `!resize [scale_factor]`');
		return;
	}

	// Get the size factor
	let scaleFactor = args[1];
	scaleFactor = parseFloat(scaleFactor);

	// Make sure they didn't enter something stupid
	if (!scaleFactor || scaleFactor <= 0 || scaleFactor > 10) {
		msg.channel.send('Invalid scale factor! Please use a number >0 and <=10.');
		return;
	}

	// Check for bilinear scaling
	let useBilinear = !!(~args.indexOf('-b'));
	let uploadOriginal = !!(~args.indexOf('-o'));

	// Get all message attachments
	let attachments = Array.from(msg.attachments.values());

	// Ensure an attachment exists
	if (!attachments.length) {
		msg.channel.send('Invalid command usage! You must upload an image with your message when using the resize command.');
		return;
	}

	// Loop through each image
	attachments.forEach(image => {

		// Download the image serverside
		jimp.read(image.url, (err, jimpImage) => {
			if (err !== null || jimpImage === undefined) {
				msg.channel.send(`There was an error reading ${image.filename}!`);
				return;
			}

			// Determine scaling mode
			let mode = useBilinear ? jimp.RESIZE_BILINEAR : jimp.RESIZE_NEAREST_NEIGHBOR;

			// Scale and readout to buffer
			jimpImage.scale(scaleFactor, mode).getBuffer(jimp.MIME_PNG, (jimpErr, buffer) => {
				if (jimpErr) {
					msg.channel.send(`There was an error scaling ${image.filename}!`);
					return;
				}

				// Create a discord attachment
				let newImage = new Discord.Attachment(buffer, image.filename);

				// Send the image to the channel
				msg.channel.send(`Here's your image, ${msg.author.username}. Scaled by ${scaleFactor}x.`, newImage).then(() => {
					if (uploadOriginal) {
						msg.channel.send(`Here's the original image: ${image.url}`);
					}
				});
			});
		});
	});
}

module.exports = resize;
