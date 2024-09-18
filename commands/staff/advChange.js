import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('adv_change')
    .setDescription('Gerencia advertências de jogadores')

    // Subcomando para adicionar uma advertência
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Adiciona uma advertência a um jogador')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Qual usuário será advertido?')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Qual o motivo para advertir este jogador?')
                    .setRequired(true)
            )
    )

    // Subcomando para remover uma advertência
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove uma advertência de um jogador')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Qual usuário terá a advertência removida?')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Qual o motivo para remover a advertência deste jogador?')
                    .setRequired(true)
            )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
    await interaction.deferReply();

    if (userAccount.staff < 1) {
        return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Ajudante ou superior.` });
    }

    // Execução do subcomando "adicionar"
    if (interaction.options.getSubcommand() === 'add') {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        let targetAccount = await userDB.findOne({ "id_dc": target.id });
        if (!targetAccount) {
            return await interaction.editReply({ content: `**${target}** não é um alvo válido ou não possui uma conta/personagem.`, ephemeral: true });
        }
        if (targetAccount.warns === 3) {
            return await interaction.editReply({ content: `**${target}** já tem o máximo de avisos.`, ephemeral: true });
        }

        await userDB.updateOne({ "id_dc": target.id }, {
            $inc: {
                "warns": 1
            }
        });

        targetAccount = await userDB.findOne({ "id_dc": target.id });

        await interaction.editReply({ content: `Advertência ao jogador **${target}** bem sucedida. Agora ele possui **${targetAccount.warns}/3** advertências.` });

        const channel = client.channels.cache.get('1166513977862393967');
        await channel.send({ content: `**Advertência**\n\n**STAFF:** <@${userAccount.id_dc}>\n**Jogador:** ${target}\n**Razão:** ${reason}` });

        return await client.users.send(targetAccount.id_dc, { content: `**O STAFF <@${userAccount.id_dc}> te advertiu pela razão:**\n\n${reason}` });
    }

    // Execução do subcomando "remover"
    if (interaction.options.getSubcommand() === 'remove') {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');

        let targetAccount = await userDB.findOne({ "id_dc": target.id });
        if (!targetAccount) {
            return await interaction.editReply({ content: `**${target}** não é um alvo válido ou não possui uma conta/personagem.`, ephemeral: true });
        }
        if (targetAccount.warns === 0) {
            return await interaction.editReply({ content: `**${target}** não tem advertências a serem removidas.`, ephemeral: true });
        }

        await userDB.updateOne({ "id_dc": target.id }, {
            $inc: {
                "warns": -1
            }
        });

        targetAccount = await userDB.findOne({ "id_dc": target.id });

        await interaction.editReply({ content: `Remoção de advertência do jogador **${target}** bem sucedida.` });

        const channel = client.channels.cache.get('1166513977862393967');
        await channel.send({ content: `**Remoção de Advertência**\n\n**STAFF:** <@${userAccount.id_dc}>\n**Jogador:** ${target}\n**Razão:** ${reason}` });

        return await client.users.send(targetAccount.id_dc, { content: `**O STAFF <@${userAccount.id_dc}> removeu uma advertência sua pela razão:**\n\n${reason}` });
    }
}