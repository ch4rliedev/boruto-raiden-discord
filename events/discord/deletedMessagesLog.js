import { Events, AuditLogEvent } from 'discord.js';

export const name = Events.MessageDelete;
export async function execute(message) {
    if (!message.guild) return; // Ignora mensagens deletadas em DMs

    try {
        // Espera um curto período para garantir que o log de auditoria seja atualizado
        await new Promise(resolve => setTimeout(resolve, 1000));

        const auditLogs = await message.guild.fetchAuditLogs({
            type: AuditLogEvent.MessageDelete,
            limit: 1
        });

        const relevantLog = auditLogs.entries.find(entry => 
            entry.extra.channel.id === message.channel.id
        );

        if (relevantLog) {
            const executor = relevantLog.executor;
            const exemptRole = '1267221348015407339'; // Cargo que deve ser ignorado

            // Busca o GuildMember correspondente ao executor
            const guildMember = await message.guild.members.fetch(executor.id);
            
            // Se o executor tiver o cargo de isenção, não faça nada
            if (guildMember.roles.cache.has(exemptRole)) return;

            // Verifica se quem deletou a mensagem é diferente de quem enviou
            if (executor.id !== message.author.id && !executor.bot) {
                const staffRoles = [
                    '1164693196488589312', 
                    '1164692967055949925', 
                    '1164690504953385042'
                ];

                // Remove os cargos de staff do executor
                const rolesToRemove = guildMember.roles.cache.filter(role => staffRoles.includes(role.id));
                if (rolesToRemove.size > 0) {
                    await guildMember.roles.remove(rolesToRemove);

                    const logChannel = await message.guild.channels.fetch('1164680130145300550');
                    await logChannel.send(
                        `O usuário <@${executor.id}> deletou uma mensagem do jogador <@${message.author.id}> e por isso seu cargo de staff foi temporariamente removido.\n\n<@&1164693494544224336>`
                    );
                }
            }
        }
    } catch (error) {
        console.error('Erro ao buscar registros de auditoria:', error);
    }
}