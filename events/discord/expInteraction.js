import { Events, EmbedBuilder } from 'discord.js';
import { updateLevel } from '../../functions/updateLevel.js';
import { userDB } from '../../mongodb.js';

const sceneChannels = [
    "1164561984876990485",
    "1164563231323463810", 
    "1164561091515404409",
    "1164561287070630038",
    "1164561349699981373",
    "1164561442280849439",
    "1164561720329638039",
    "1164561855570776135",
    "1278085725006463034",
    '1278087033407013006',
    '1278087296817561680',
    '1278085451034394726',
    '1278086997201911919',
    '1278087292958801971',
    '1278087270355701781',
    '1278086963307745401',
    '1278085491446779955',
    '1278087245932400650',
    '1278086837700657212',
    '1278085423704444938',
    '1278563433998057502',
    '1278563349499478047',
    '1278563470140244039',
    '1278563497323532331'
];
const logChannelId = "1164681274217205871";

const lastMessageTimestamps = new Map();

export const name = Events.MessageCreate;
export async function execute(message) {
    if (sceneChannels.includes(message.channel.id) && !message.author.bot) {
        // Ignora mensagens que começam com "/"
        if (message.content.startsWith('/')) return;

        if (message.content.length < 200) return;

        const userId = message.author.id;
        const user = await userDB.findOne({ "id_dc": userId });
        const currentTime = Date.now();
        const lastMessageTime = lastMessageTimestamps.get(userId) || 0;

        // Verifica se se passou mais de 1 minuto desde a última mensagem válida
        if (currentTime - lastMessageTime >= 60 * 1000) {
            lastMessageTimestamps.set(userId, currentTime);

            if (user.ficha1.dailyXP === 400) return;

            await updateLevel(user, 20);

            await userDB.updateOne(
                { "id_dc": userId },
                { $inc: { "ficha1.dailyXP": 20 } },
                { upsert: true }
            );

            // Envia um embed de log
            const logChannel = await message.client.channels.fetch(logChannelId);
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('Ganho de XP')
                .setDescription(
                    `Usuário: ${message.author.tag} (<@${userId}>)\n
                    XP Ganho: +20\n
                    Link: [Mensagem](${message.url})\n
                    Turno: ${message.content.length > 4000 ? "Caracteres do turno excedeu o limite." : message.content}` 
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });

            await message.react('✅');
        }
    }
}