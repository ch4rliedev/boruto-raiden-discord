import { SlashCommandBuilder } from 'discord.js';
import { itemDB } from '../../mongodb.js';

export const data = new SlashCommandBuilder()
    .setName('vender')
    .setDescription('Vende qualquer item do inventário para a loja por metade do preço.')
    .addNumberOption(option =>
        option.setName('slot')
            .setDescription('Qual slot do inventário do item que quer vender?')
            .setRequired(true)
            .setMinValue(1)
    )
    .addNumberOption(option =>
        option.setName('quantidade')
            .setDescription('Qual a quantidade do item que deseja vender entre 1-5 por vez?')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
    )
    .setContexts(0);

export async function execute(interaction, userAccount, userDB, jutsuDB, infoGameDB) {
    await interaction.deferReply({ ephemeral: true });

    if (userAccount.ficha1.state !== "Livre") {
        return await interaction.editReply({ content: `Você está no evento **"${userAccount.ficha1.state}"**, aguarde a conclusão em **${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.**` });
    }

    const slotNumber = interaction.options.getNumber('slot');
    const amount = interaction.options.getNumber('quantidade');

    const slot = userAccount.ficha1.inventario[`slot${slotNumber}`];
    if (slot.nome === "Vazio") {
        return await interaction.editReply({ content: `Não há itens para serem vendidos no slot ${slotNumber}.` });
    }

    const item = await itemDB.findOne({ nome: slot.nome });
    if (!item && !slot.nome.startsWith("Passe de Raid")) {
        return await interaction.editReply({ content: `O item no slot ${slotNumber} **${slot.nome}** não existe mais no jogo, contate um Staff.` });
    }

    if (amount > slot.quantia) {
        return await interaction.editReply({ content: `O item **${slot.nome}** só tem **${slot.quantia} quantidade(s)** e você está tentando vender **${amount}**.` });
    }

    const salePrice = slot.zeroValueSale ? 0 : (item.custo / 2);
    const totalSalePrice = salePrice * amount;

    await userDB.updateOne({ "id_dc": interaction.user.id }, 
        {
            $inc: {
                [`ficha1.inventario.slot${slotNumber}.quantia`]: -amount,
                "ficha1.ryou": totalSalePrice
            }
        }
    );

    if (slot.quantia === amount) {
        await userDB.updateOne({ "id_dc": interaction.user.id }, 
            {
                $set: {
                    [`ficha1.inventario.slot${slotNumber}.nome`]: "Vazio",
                    [`ficha1.inventario.slot${slotNumber}.zeroValueSale`]: false,
                    [`ficha1.inventario.slot${slotNumber}.isStealable`]: true,
                    [`ficha1.inventario.slot${slotNumber}.isSellable`]: true,
                    [`ficha1.inventario.slot${slotNumber}.maxQuantity`]: 1
                }
            }
        );
    }

    await interaction.editReply({ content: `O item **${slot.nome}** x${amount} foi vendido por **${totalSalePrice} ryou** com sucesso.${slot.zeroValueSale ? `\n\nO item **${slot.nome}** não tem valor de venda pois foi obtido através de uma negociação com outro jogador ou obtido gratuitamente do jogo.` : ""}` });
}