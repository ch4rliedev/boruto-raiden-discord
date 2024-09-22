import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('event_change')
    .setDescription('Gerencia eventos de jogadores.')

    .addSubcommand(subcommand =>
        subcommand
            .setName('block')
            .setDescription('Bloqueia um jogador de usar comandos devido a um evento.')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Qual usuário bloquear?')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('event_reason')
                    .setDescription('Motivo do bloqueio do jogador.')
                    .setRequired(true)
            )
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName('unblock')
            .setDescription('Desbloqueia um jogador do seu evento atual.')
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Qual usuário desbloquear?')
                    .setRequired(true)
            )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
    await interaction.deferReply({ ephemeral: true });

    if (userAccount.staff < 1) {
        return await interaction.editReply({ content: `Você não tem permissão para usar este comando. Apenas staff Ajudante ou superior pode usá-lo.` });
    }

    const eventReason = interaction.options.getString('event_reason');

    if (interaction.options.getSubcommand() === 'block') {
        const target = interaction.options.getUser('target');

        let targetAccount = await userDB.findOne({ "id_dc": target.id });
        if (!targetAccount || !targetAccount?.ficha1?.active) {
            return await interaction.editReply({ content: `**${target}** não é um alvo válido ou não possui uma conta/personagem.`, ephemeral: true });
        }

        if (targetAccount.ficha1.state !== "Livre") {
            return await interaction.editReply({ content: `O jogador **${target}** já está bloqueado no evento **${targetAccount.ficha1.state}**. Aguarde a conclusão antes de alterar o dele.` });
        }

        // Bloqueia o jogador por 1 ano
        const dateNow = new Date();
        const dateFuture = new Date(dateNow.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano a partir de agora

        await userDB.updateOne({ "id_dc": target.id }, {
            $set: {
                "ficha1.state": eventReason,
                "ficha1.tempo.start": dateNow,
                "ficha1.tempo.finish": dateFuture,
            }
        });

        targetAccount = await userDB.findOne({ "id_dc": target.id });

        await interaction.editReply({ content: `O jogador **${target}** está agora bloqueado devido ao evento **${eventReason}**.` });

        await target.send({ content: `STAFF <@${userAccount.id_dc}> bloqueou você de usar comandos devido ao evento **${eventReason}**. Você está restrito até ser desbloqueado.` });
    }

    if (interaction.options.getSubcommand() === 'unblock') {
        const target = interaction.options.getUser('target');

        let targetAccount = await userDB.findOne({ "id_dc": target.id });
        if (!targetAccount) {
            return await interaction.editReply({ content: `**${target}** não é um alvo válido ou não possui uma conta/personagem.`, ephemeral: true });
        }

        if (targetAccount.ficha1.state === "Livre") {
            return await interaction.editReply({ content: `O jogador **${target}** não está bloqueado no momento.` });
        }

        // Desbloqueia o jogador
        await userDB.updateOne({ "id_dc": target.id }, {
            $set: {
                "ficha1.state": "Livre",
                "ficha1.tempo.start": new Date(),
                "ficha1.tempo.finish": new Date(),
            }
        });

        targetAccount = await userDB.findOne({ "id_dc": target.id });

        await interaction.editReply({ content: `O jogador **${target}** foi desbloqueado do seu evento atual.` });

        await target.send({ content: `STAFF <@${userAccount.id_dc}> desbloqueou você do seu evento atual. Agora você está livre para usar todos os comandos.` });
    }
}