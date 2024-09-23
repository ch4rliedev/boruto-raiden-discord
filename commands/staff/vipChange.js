import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('vip')
    .setDescription('Gerencia o status VIP dos jogadores.')
    .addSubcommand(subcommand =>
        subcommand.setName('add')
            .setDescription('Adiciona ou atualiza o VIP de um jogador ou todos com VIP ativo.')
            .addIntegerOption(option =>
                option.setName('nivel')
                    .setDescription('Escolha o nível de VIP.')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Genin', value: 1 },
                        { name: 'Chuunin', value: 2 },
                        { name: 'Jounin', value: 3 }
                    )
            )
            .addIntegerOption(option =>
                option.setName('dias')
                    .setDescription('Quantos dias deseja adicionar? (opcional)')
                    .setRequired(false)
                    .setMinValue(1)
                    .setMaxValue(90)
            )
            .addUserOption(option =>
                option.setName('jogador')
                    .setDescription('Selecione o jogador (opcional para afetar todos com VIP ativo).')
                    .setRequired(false)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('reduce')
            .setDescription('Reduz o tempo de VIP de um jogador ou todos com VIP ativo.')
            .addIntegerOption(option =>
                option.setName('dias')
                    .setDescription('Quantos dias deseja reduzir?')
                    .setRequired(true)
                    .setMinValue(1)
                    .setMaxValue(90)
            )
            .addUserOption(option =>
                option.setName('jogador')
                    .setDescription('Selecione o jogador (opcional para afetar todos com VIP ativo).')
                    .setRequired(false)
            )
    );

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply({ ephemeral: true });

    if (userAccount.staff < 3) {
        return await interaction.editReply({ content: 'Você não tem permissão para usar este comando.' });
    }

    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser('jogador');
    const dias = interaction.options.getInteger('dias');
    const vipLevel = interaction.options.getInteger('nivel');

    if (subcommand === 'add') {
        if (target) {
            // Adicionar VIP para um jogador específico com VIP ativo
            const targetAccount = await userDB.findOne({ "id_dc": target.id});
            if (!targetAccount) {
                return await interaction.editReply({ content: `*${target}* não possui uma conta válida.` });
            }

            if (!targetAccount.ficha1?.active) {
                return await interaction.editReply({ content: `*${target}* não possui um personagem ativo.` });
            }

            let updateData = { "vip": vipLevel };

            // Se os dias foram especificados, atualizar a data de expiração
            if (dias) {
                let expirationUpdate = new Date();
                if (targetAccount.vipExpiration) {
                    expirationUpdate = new Date(targetAccount.vipExpiration);
                }
                expirationUpdate.setDate(expirationUpdate.getDate() + dias);
                updateData["vipExpiration"] = expirationUpdate;
            }

            await userDB.updateOne({ "id_dc": target.id }, { $set: updateData });
            await interaction.editReply({ content: `O VIP do jogador foi atualizado para o nível ${vipLevel}.` + (dias ? ` E extendido por ${dias} dias.` : '') });
        } else {
            // Adicionar VIP para todos os jogadores com VIP ativo
            const users = await userDB.find({ "vip": { $ne: false } }).toArray();
            for (const user of users) {
                let updateData = { "vip": vipLevel };

                // Se os dias foram especificados, atualizar a data de expiração
                if (dias) {
                    let expirationUpdate = new Date();
                    if (user.vipExpiration) {
                        expirationUpdate = new Date(user.vipExpiration);
                    }
                    expirationUpdate.setDate(expirationUpdate.getDate() + dias);
                    updateData["vipExpiration"] = expirationUpdate;
                }

                await userDB.updateOne({ "id_dc": user.id_dc }, { $set: updateData });
            }

            await interaction.editReply({ content: `Todos os jogadores com VIP ativo tiveram o nível de VIP atualizado para ${vipLevel}.` + (dias ? ` E receberam ${dias} dias adicionais.` : '') });
        }
    }

    if (subcommand === 'reduce') {
        if (dias) {
            if (target) {
                // Reduzir VIP para um jogador específico com VIP ativo
                const targetAccount = await userDB.findOne({ "id_dc": target.id });
                if (!targetAccount || !targetAccount.vipExpiration) {
                    return await interaction.editReply({ content: `*${target}* não possui data de expiração no VIP.` });
                }

                if (!targetAccount.ficha1?.active) {
                    return await interaction.editReply({ content: `*${target}* não possui um personagem ativo.` });
                }

                let expirationDate = new Date(targetAccount.vipExpiration);
                expirationDate.setDate(expirationDate.getDate() - dias);

                await userDB.updateOne({ "id_dc": target.id }, {
                    $set: { "vipExpiration": expirationDate }
                });

                await interaction.editReply({ content: `O VIP do jogador foi reduzido em ${dias} dias.` });
            } else {
                // Reduzir VIP para todos os jogadores com VIP ativo
                const users = await userDB.find({ "vip": { $ne: false }, "vipExpiration": { $exists: true } }).toArray();
                for (const user of users) {
                    let expirationDate = new Date(user.vipExpiration);
                    expirationDate.setDate(expirationDate.getDate() - dias);

                    await userDB.updateOne({ "id_dc": user.id_dc }, {
                        $set: { "vipExpiration": expirationDate }
                    });
                }

                await interaction.editReply({ content: `O tempo de VIP foi reduzido em ${dias} dias para todos os jogadores com VIP ativo.` });
            }
        } else {
            await interaction.editReply({ content: `Você precisa especificar a quantidade de dias para reduzir o tempo de VIP.` });
        }
    }
}