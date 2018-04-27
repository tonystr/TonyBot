/* eslint-disable max-depth */

// Meta
const Discord = require('discord.js');
const auth    = require('./src/auth.json');
const bot     = new Discord.Client();
const http	  = require('http');
const websitelinks = require('./commands/websitelinks.js');

const prefix      = '.';
const paramPrefix = '-';

let scripts = {
	newline: () => '--------------------------------------------------------------------------------------------------------------',
	palette: require('./commands/palette.js'),
	call: callFunction,
	math: require('./commands/stringMath.js'),
	link: link,
	blog: require('./commands/linkBlog.js'),
	resize: require('./commands/resize.js'),
	lospec: require('./commands/lospec.js'),
	miniboss: require('./commands/miniboss.js'),
	marketplace: require('./commands/marketplace.js'),
	quote: require('./commands/quote.js'),
	haste: haste,
	github: require('./commands/gmgithub.js')
};
scripts.website = scripts.link;
scripts.palettes = scripts.palette;
scripts['palette-list'] = () => 'Here\'s a list of useful palettes:\nhttps://lospec.com/palette-list';
scripts['='] = scripts.math;

let funcs = {
	fizzbuzz: fizzbuzz
};

let params = {
	show: paramShow,
	embed: paramEmbed
};

// 438048 886687 531009

function command(message) {
	if (!message.author || !message.author.equals(bot.user)) return;
	if (message.content.indexOf('```') === 0) {
		let match = message.content.match(/^```?\s*([hp])aste(bin)?\s*/i);
		if (match) {
			let end = message.content.match(/[^`]```?/i);
			end = end ? end.index : message.content.length;
			haste(message, message.content.slice(match[0].length, end + 1));
		}
		return;
	} else if (message.content.match(/"\d{18}"/)) {
		message.channel.send(scripts.quote(message.channel, message.content.match(/"\d{18}"/)[0].slice(1, -1))).catch(() => {});
		return;
	}
	if (message.content.charAt(0) !== prefix) return;
	console.log('============================================');

	let args = message.content.slice(prefix.length).split(/\s+/);
	let out = '';
	console.log(args);

	switch (args[0].toLowerCase()) {
		case 'fizzbuzzrepeat': out = sendRepeat(fizzbuzz, message, args[1]); break;
		default: out = callScript(message, args); break;
	}

	if (out && (out.del || out.delete)) message.delete().catch(() => {});
}

function haste(message, string) {
	let options = {
		hostname: 'haste.gmcloud.org',
		path: '/documents',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Length': string.length
		}
	};

	let resStr = '';
	let req = http.request(options, res => {
		res.setEncoding('utf8');
		res.on('data', (chunk) => { resStr += chunk });
		res.on('end', () => {
			message.channel.send(`http://haste.gmcloud.org/${JSON.parse(resStr).key}`);
			message.delete().catch(() => {});
		});
	});

	req.on('error', e => {
		console.log('Problem with request: ', e.message);
	});

	req.write(string);
	req.end();
}

function link(message, args, sites = websitelinks) {
	if (args.length < 1) return { del: false };
	let input = message.content.slice(args[0].length + 2); // 2: white space & prefix

	sites.some((com) => {
		com.matches.some((match) => {
			if (input.toLowerCase().match(match)) {
				console.log(com.link);
				return { message: com.link };
			}
		});
	});
}

function callFunction(message, args) {
	/* eslint complexity: ["error", 22] */
	if (args[1] in funcs) {

		let paramCount = 0;
		let out = {
			message: '',
			pretag: '``',
			endtag: '``',
			embed: {
				image: '',
				link: '',
				blank: false
			}
		};

		for (let i = args.length - 1; i > 0; i--) {
			if (!(args[i].charAt(0) === paramPrefix && args[i].slice(1) in params)) break;
			let param = args[i].slice(1);
			paramCount++;

			params[param](message, args, out);
		}

		args.splice(args.length - paramCount, paramCount);

		let i = 2;

		switch (args.length - 2) {
			case 0: out += funcs[args[1]](); break;
			case 1: out += funcs[args[1]](args[i++]); break;
			case 2: out += funcs[args[1]](args[i++], args[i++]); break;
			case 3: out += funcs[args[1]](args[i++], args[i++], args[i++]); break;
			case 4: out += funcs[args[1]](args[i++], args[i++], args[i++], args[i++]); break;
			case 5: out += funcs[args[1]](args[i++], args[i++], args[i++], args[i++], args[i++]); break;
			case 6: out += funcs[args[1]](args[i++], args[i++], args[i++], args[i++], args[i++], args[i++]); break;
			case 7: out += funcs[args[1]](args[i++], args[i++], args[i++], args[i++], args[i++], args[i++], args[i++]); break;
			case 8: out += funcs[args[1]](args[i++], args[i++], args[i++], args[i++], args[i++], args[i++], args[i++], args[i++]); break;
			case 9: out += funcs[args[1]](args[i++], args[i++], args[i++], args[i++], args[i++], args[i++], args[i++], args[i++], args[i++]); break;
			default: out += funcs[args[1]](); break;
		}

		if (out) {
			if (out.embed) {
				if (out.pretag + out.message + out.endtag) out.embed.setTitle(out.pretag + out.message + out.endtag);
				if (out.embed.blank)    out.embed.addBlankField(true);
				if (out.embed.image)    out.embed.setImage(out.embed.image);
				if (out.embed.link)     out.embed.setLink(out.embed.link);

				message.channel.send(out.embed);
			} else if (out.message) message.channel.send(out.pretag + out.message + out.endtag);
		} else console.log('No return message from function (index.js:120)');
	} else message.channel.send('Function not listed');
}

function callScript(message, args) {
	if (args[0] in scripts) {

		let paramCount = 0;
		let msgParams = [];

		for (let i = args.length - 1; i > 0; i--) {
			if (!(args[i].charAt(0) === paramPrefix && args[i].slice(1) in params)) break;

			msgParams[paramCount++] = args[i].slice(1);
		}

		args.splice(args.length - paramCount, paramCount);

		let out = scripts[args[0]](message, args);

		for (let i = paramCount - 1; i >= 0; i--) {
			params[msgParams[i]](message, args, out);
		}

		if (out) {
			if (typeof out !== 'object') {
				message.channel.send(out);
			} else {
				if (out.embed) {
					if (out.pretag + out.message + out.endtag) out.embed.setTitle(out.pretag + out.message + out.endtag);
					if (out.embed.blank)    out.embed.addBlankField(true);
					if (out.embed.image)    out.embed.setImage(out.embed.image);
					if (out.embed.link)     out.embed.setLink(out.embed.link);

					message.channel.send(out.embed);
				} else {
					try {
						out.then((prom) => { if (prom !== undefined) console.log(`Script call recieved promise: ${prom}`); });
					} catch(e) {
						let msg = '';
						if (out.pretag)  msg += out.pretag;
						if (out.message) msg += out.message;
						if (out.endtag)  msg += out.endtag;
						if (msg) message.channel.send(msg);
					}
				}
				return { del: out.del || out.delete || true };
			}
		}
		return { del: true };
	}
	return { del: false };
}

function paramShow(message, args, out) {
	let paramLength = 1;
	for (let i = args.length - 1; i > 0; i--) {
		console.log(args[i]);
		if (!(args[i].charAt(0) === paramPrefix && args[i].slice(1) in params)) break;
		paramLength += args[i].length;
	}
	out.pretag += `${message.content.slice(args[0].length + 1, -paramLength)}\`\` = \`\``;
	console.log(`paramShow(${args})`);
}

function paramEmbed(message) {
	let color = 7506394; // Discord default blue
	if (message.guild && message.guild.available) {
		let roles = message.member.roles.array();
		let pos = -1;

		for (let i = 0; i < roles.length; i++) {
			if (pos < roles[i].calculatedPosition) {
				if (roles[i].color !== 0) {

					color = roles[i].color;
					pos = roles[i].calculatedPosition;
				}
			}
		}
	}
	return { embed: new Discord.RichEmbed().setColor(color) };
}

function sendRepeat(callback, message, times) {
	if (!times) return message.channel.send('You must specify a count');

	let out = '';
	for (let i = 0; i < times; i++) {
		out += `${callback(i)}\n`;
	}

	message.channel.send(out);
}

function fizzbuzz(num) {
	let fizz = (num % 3 === 0) && 'Fizz';
	let buzz = (num % 5 === 0) && 'Buzz';
	return (!buzz && fizz) || (!fizz && buzz) || (fizz + buzz) || num;
}

bot.on('ready', () => console.log('Bot Ready'));
bot.on('message', command);
bot.on('error', err => console.log(`Bot Handled Error: ${err}`));

bot.login(auth.Token);
