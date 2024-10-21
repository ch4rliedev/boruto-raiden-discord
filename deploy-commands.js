import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para carregar comandos de uma pasta
async function loadCommands(dir) {
    const commands = [];
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js') || fs.lstatSync(path.join(dir, file)).isDirectory());
    for (const file of commandFiles) {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            commands.push(...await loadCommands(filePath));
        } else {
            const fileURL = pathToFileURL(filePath);
            const command = await import(fileURL);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
    return commands;
}

// Carregar comandos globais
const globalCommandsPath = path.join(__dirname, 'commands', 'global');
const globalCommands = await loadCommands(globalCommandsPath);

// Carregar comandos privados
const privateCommandsPath = path.join(__dirname, 'commands', 'private');
const privateCommands = await loadCommands(privateCommandsPath);

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        // Atualizar comandos globais
        console.log(`Started refreshing ${globalCommands.length} global application (/) commands.`);
        const globalData = await rest.put(
            Routes.applicationCommands("1086422474121547826"),
            { body: globalCommands }
        );
        console.log(`Successfully reloaded ${globalData.length} global application (/) commands.`);

        // Atualizar comandos privados (para o servidor específico)
        const guildId = '1164398692283990046'; // ID do servidor Boruto Raiden
        console.log(`Started refreshing ${privateCommands.length} guild application (/) commands.`);
        const guildData = await rest.put(
            Routes.applicationGuildCommands("1086422474121547826", guildId),
            { body: privateCommands }
        );
        console.log(`Successfully reloaded ${guildData.length} guild application (/) commands.`);
        
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();