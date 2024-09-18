import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('usar')
    .setDescription('Usa itens do inventário. Caso o item tenha efeitos especiais, chame um STAFF antes de usar.')

    .addNumberOption(option =>
        option.setName('slot')
            .setDescription('Qual o slot do item que deseja usar?')
            .setRequired(true)
            .setMaxValue(10)
            .setMinValue(1)
    )

    .addNumberOption(option =>
        option.setName('quantidade')
            .setDescription('Qual a quantidade do item que usará?')
            .setRequired(true)
            .setMaxValue(5)
            .setMinValue(1)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, jutsuDB, itemDB, infoGameDB) {
    await interaction.deferReply({ ephemeral: true });

    const slotNumber = interaction.options.getNumber('slot');
    const amount = interaction.options.getNumber('quantidade');

    if (userAccount.ficha1.inventario[`slot${slotNumber}`].nome === "Vazio") {
        return await interaction.editReply({ content: `O **slot ${slotNumber}** não possui nenhum item para ser usado.` });
    }

    else if (userAccount.ficha1.inventario[`slot${slotNumber}`].nome.startsWith("Pergaminho - Jutsu Rank")) {
        return await interaction.editReply({ content: `O **slot ${slotNumber}** contém um Pergaminho de Jutsu. Para utilizá-lo, use /pergaminho. Caso queira se desfazer, use /vender.` });
    }

    else if (userAccount.ficha1.inventario[`slot${slotNumber}`].nome === "Bloqueado") {
        return await interaction.editReply({ content: `O **slot ${slotNumber}** está bloqueado.` });
    }

    else if (userAccount.ficha1.inventario[`slot${slotNumber}`].quantia < amount) {
        return await interaction.editReply({ content: `Você não pode usar **x${amount}** do item **${userAccount.ficha1.inventario[`slot${slotNumber}`].nome}** porque só possui **x${userAccount.ficha1.inventario[`slot${slotNumber}`].quantia}**.` });
    }

    else if (userAccount.ficha1.inventario[`slot${slotNumber}`].quantia === 1 || userAccount.ficha1.inventario[`slot${slotNumber}`].quantia <= amount) {
        await userDB.updateOne({ "id_dc": interaction.user.id }, 
            {
                $set: {
                    [`ficha1.inventario.slot${slotNumber}.nome`]: "Vazio",
                    [`ficha1.inventario.slot${slotNumber}.quantia`]: 0,
                    [`ficha1.inventario.slot${slotNumber}.zeroValueSale`]: false,
                    [`ficha1.inventario.slot${slotNumber}.isStealable`]: true,
                    [`ficha1.inventario.slot${slotNumber}.isSellable`]: true,
                    [`ficha1.inventario.slot${slotNumber}.maxQuantity`]: 1
                },
            }
        );

        return await interaction.editReply({ content: `O item **${userAccount.ficha1.inventario[`slot${slotNumber}`].nome}** foi utilizado e descontado em -${amount}.` });
    }

    else {
        await userDB.updateOne({ "id_dc": interaction.user.id }, 
            {
                $inc: {
                    [`ficha1.inventario.slot${slotNumber}.quantia`]: -amount,
                }
            }
        );

        return await interaction.editReply({ content: `O item **${userAccount.ficha1.inventario[`slot${slotNumber}`].nome}** foi utilizado e descontado em -${amount}.` });
    }
}