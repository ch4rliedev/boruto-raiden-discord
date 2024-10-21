import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('negociar')
    .setDescription('Negocia itens seus com outros jogadores.')

    .addUserOption(option =>
        option.setName('outro_jogador')
            .setDescription('Com quem você irá negociar?')
            .setRequired(true)
    )

    .addNumberOption(option =>
        option.setName('slot')
            .setDescription('Qual o slot no seu inventário do item que irá negociar de 1 a 10?')
            .setRequired(true)
            .setMaxValue(10)
            .setMinValue(1)
    )

    .addNumberOption(option =>
        option.setName('quantidade')
            .setDescription('Qual a quantia do item que irá negociar de 1 a 5?')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(5)
    )

    .addNumberOption(option =>
        option.setName('ryou')
            .setDescription('Qual o preço do item que irá negociar de 500 a 10.000 ryou?')
            .setRequired(true)
            .setMinValue(100)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
    await interaction.deferReply({ ephemeral: true });

    if (userAccount.ficha1.state !== "Livre") return await interaction.editReply({ content: `Você está no evento **"${userAccount.ficha1.state}"**, aguarde a conclusão em **${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.**` });
    
    const target = interaction.options.getUser('outro_jogador');
    const targetAccount = await userDB.findOne({ "id_dc": target.id });

    if (!targetAccount.ficha1.active) {
        await interaction.editReply({ content: `*${target}* não é um alvo válido ou ele não possuí um personagem.`, ephemeral: true });
        return;
    }

    if (target.id == interaction.user.id) {
        return await interaction.editReply({ content: `Você não pode negociar consigo mesmo.` });
    }

    const slot = interaction.options.getNumber('slot');
    const amount = interaction.options.getNumber('quantidade');
    let ryou = interaction.options.getNumber('ryou');
    const item = userAccount.ficha1.inventario[`slot${slot}`];

    if (item.nome === "Vazio" || item.nome === "Bloqueado") {
        await interaction.editReply({ content: "O slot que você selecionou não tem nenhum item ou não existe." });
        return;
    }

    if (amount > item.quantia) {
        return await interaction.editReply({ content: `Você tem **x${item.quantia}** do item **${item.nome}**, não pode negociar uma quantidade maior como **x${amount}**.` });
    }

    // Busca o item correspondente em itemsData
    const itemInfo = await itemDB.findOne({ "nome": item.nome });

    if (!itemInfo) {
        return await interaction.editReply({ content: `O item **${item.nome}** não foi encontrado na base de dados de itens.` });
    }

    // Calcula o preço mínimo permitido para venda (50% do custo por unidade)
    const minSellPricePerUnit = Math.floor(itemInfo.custo * 0.5);

    // Calcula o preço mínimo permitido para a quantidade total
    const minSellPriceTotal = minSellPricePerUnit * amount;

    // Calcula o preço máximo permitido para venda (até 105% do custo por unidade)
    const maxSellPricePerUnit = Math.ceil(itemInfo.custo * 1.05);

    // Calcula o preço máximo permitido para a quantidade total
    const maxSellPriceTotal = maxSellPricePerUnit * amount;

    const totalPrice = ryou;

    if (totalPrice > maxSellPriceTotal) {
        await interaction.editReply({ 
            content: `O preço total de venda para **${itemInfo.nome}** é ${totalPrice} ryou, que está acima do máximo permitido de ${maxSellPriceTotal} ryou para ${amount} unidades. Por favor, ajuste o preço de venda dentro deste limite.` 
        });
        return;
    }

    if (totalPrice < minSellPriceTotal) {
        await interaction.editReply({ 
            content: `O preço total de venda para **${itemInfo.nome}** é ${totalPrice} ryou, que está abaixo do mínimo permitido de ${minSellPriceTotal} ryou para ${amount} unidades. Por favor, ajuste o preço de venda dentro deste limite.` 
        });
        return;
    }

    let tradeVazio = false;
    for (let i = 1; i <= 10 ; i++) {
        const trade = targetAccount.ficha1.trades[`trade${i}`];
        if (trade.nomeItem === "Vazio") {
            await userDB.updateOne({ "id_dc": target.id }, {
                $set: {
                    [`ficha1.trades.trade${i}.nomeItem`]: `${item.nome}`,
                    [`ficha1.trades.trade${i}.nomeJogador`]: `${userAccount.username}`,
                    [`ficha1.trades.trade${i}.nomePersonagem`]: `${userAccount.ficha1.name}`,
                    [`ficha1.trades.trade${i}.quantia`]: amount,
                    [`ficha1.trades.trade${i}.custo`]: ryou,
                    [`ficha1.trades.trade${i}.slot`]: slot,
                    [`ficha1.trades.trade${i}.id_dc`]: interaction.user.id
                }
            });

            await interaction.editReply({ content: `**Oferta enviada com sucesso! ✅**

**Item ofertado:** ${item.nome} (x${amount})
**Preço:** ${ryou} ryou
**Jogador:** <@${targetAccount.id_dc}>
**Personagem:** ${targetAccount.ficha1.name}` });

            await client.users.send(targetAccount.id_dc, `**Uma nova oferta foi enviada para você! ❓**

**Jogador:** <@${userAccount.id_dc}>
**Personagem:** ${userAccount.ficha1.name}

**Item ofertado:** ${item.nome} (x${amount})
**Preço:** ${ryou} ryou

Use **/oferta** para aceitar ou recusar esta.`);
            tradeVazio = true;
            break;
        }
    }

    if (!tradeVazio) {
        await interaction.editReply({ content: `Não foi encontrado nenhum espaço de trade vazio no jogador **<@${target.id}>**, peça-o que libere algum aceitando ou recusando uma oferta enviada para ele.` });
    }
}