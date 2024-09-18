import { EventEmitter } from 'events'; EventEmitter.defaultMaxListeners = 20;
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

const client = new Client({
	intents:[GatewayIntentBits.Guilds, 
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages, 
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions ]
});

export { client };

client.commands = new Collection();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const fileURL = pathToFileURL(filePath);
		const command = await import(fileURL);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

function readEvents(dir) {
	const files = readdirSync(dir);
	for (const file of files) {
	  const filePath = join(dir, file);
	  if (statSync(filePath).isDirectory()) {
		readEvents(filePath);
	  } else if (file.endsWith('.js')) {
		const fileURL = pathToFileURL(filePath);
		import(fileURL).then(event => {
		  if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		  } else {
			client.on(event.name, (...args) => event.execute(...args));
		  }
		});
	  }
	}
} 
readEvents(join(__dirname, 'events'));

await client.login(process.env.DISCORD_BOT_TOKEN);