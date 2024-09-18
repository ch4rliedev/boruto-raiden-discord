import { Events } from 'discord.js';

const targetRoleId = '1269381221599678464';

export const name = Events.GuildMemberUpdate;
export async function execute(oldMember, newMember) {
    // Verifica se o membro recebeu o cargo específico
    if (!oldMember.roles.cache.has(targetRoleId) && newMember.roles.cache.has(targetRoleId)) {
        try {
            // Expulsa o membro
            await newMember.kick('Recebeu o cargo de expulsão');
        } catch (error) {
            console.error(`Erro ao expulsar o membro ${newMember.user.tag}:`, error);
        }
    }
}