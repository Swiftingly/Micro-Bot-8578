const Discord = require('discord.js');
const bot = new Discord.Client();
const fs = require('fs');

const config = require('./config.json');
bot.token = config.token;

bot.errMsg = function (message) {
	message.channel.send('Syntax Error');
}
bot.permMsg = function (message) {
	message.channel.send('You do not have permission to use this command');
}

bot.commands = new Discord.Collection();

fs.readdir('./cmds/', (err, files) => {
	if (err) throw err;
	
	let jsFiles = files.filter(f => f.split('.').pop() === 'js');
	
	console.log(`Loading ${jsFiles.length} commands`);
	
	jsFiles.forEach(f => {
		let props = require(`./cmds/${f}`);
		bot.commands.set(props.help.name, props);
	});
});

bot.on('ready', () => {
	console.log(`Bot ${bot.user.username} is on`);
	bot.user.setPresence({game:{name:`for @Micro Bot#8578 prefix`, type:'WATCHING'}});
});

bot.on('message', (message) => {
	if (message.author.bot) return;
	if (message.channel.type === 'dm') return;
	
	fs.readFile('./config.json', (err, content) => {
		if (err) throw err;
		
		let parseJson = JSON.parse(content);
		
		if (parseJson[message.guild.id]) {
			if (parseJson[message.guild.id].chatPrefix) {
				bot.prefix = parseJson[message.guild.id].chatPrefix;
			}
			else {
				bot.prefix = 'mb:';
			}
		}
		else {
			bot.prefix = 'mb:';
		}
		
		if (message.content.substring(0, bot.prefix.length) === bot.prefix) {
			let args = message.content.substring(bot.prefix.length).trim().split(/ +/g);
			
			let cmd = bot.commands.get(args[0].toLowerCase());
			
			if (cmd) cmd.run(bot, message, args);
		}
		else {
			if (!message.mentions.users.first()) return;
			if (message.content.substring(0, ('<@409431405039321098>').length) === '<@409431405039321098>') {
				let cmd = message.content.substring(('<@409431405039321098>').length+1).trim().split(/ +/g);
				if (cmd[2]) {
					bot.errMsg(message);
					return;
				}
				if (cmd[0].toUpperCase() === 'PREFIX') {
					if (cmd[1]) {
						if (message.member.hasPermission('MANAGE_GUILD', true, true)) {
							fs.readFile('./config.json', (err, content) => {
								if (err) throw err;
								
								let parseJson = JSON.parse(content);
								
								if (!parseJson[message.guild.id]) parseJson[message.guild.id] = {};
								
								parseJson[message.guild.id].chatPrefix = cmd[1];
								
								fs.writeFile('./config.json', JSON.stringify(parseJson, null, '\t'), (err) => {
									if (err) throw err;
								});
								
								message.channel.send('Sucessfully changed prefix from `' + bot.prefix + '` to `' + cmd[1] + '`');
							});
						}
						else {
							bot.permMsg(message);
						}
					}
					else {
						message.channel.send('The current prefix for Micro Bot is `' + bot.prefix + '`\nDo `' + bot.prefix + 'help` to get help with commands');
					}
				}
			}
		}
	});
});

bot.login(bot.token);