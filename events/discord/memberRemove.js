import { Events } from 'discord.js';
import { userDB } from '../../mongodb.js';
import { client } from "../../index.js";

export const name = Events.GuildMemberRemove;
export async function execute(member) {
    try {
        const channel = client.channels.cache.get('1164407564096770048');

        channel.send({ content: `**${member.displayName}** foi embora...<a:run_naruto:1260394659650342913>\nShibai Ootsutsuki o acompanhe!\n\n||<@&1164693494544224336>||` });

        await userDB.updateOne({ "id_dc": member.id }, 
        {
            $unset: {
                "guild_join": ""
            }
        });
    } catch (err) {
        console.error(err);
    }
}