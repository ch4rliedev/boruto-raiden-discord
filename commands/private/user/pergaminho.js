import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('pergaminho')
    .setDescription('Usa o Pergaminho de Jutsus para aprender quase qualquer técnica imediatamente.')
    .addNumberOption(option =>
        option.setName('id_jutsu')
            .setDescription('Qual o ID do jutsu que quer aprender igual ao Rank do pergaminho?')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(999)
    )
    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
    await interaction.deferReply({ ephemeral: true });

    if (userAccount.ficha1.state !== "Livre") {
        return await interaction.editReply({ 
            content: `Você está no evento **"${userAccount.ficha1.state}"**, aguarde a conclusão em **${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.**`
        });
    }

    const idJutsu = interaction.options.get('id_jutsu').value;
    const jutsu = await jutsuDB.findOne({ idJutsu: idJutsu });
    
    if (!jutsu) {
        return await interaction.editReply({ content: `O jutsu de ID **${idJutsu}** não existe.` });
    }

    if (jutsu.hiden !== "Nenhum" && userAccount.ficha1.cla !== jutsu.hiden) {
        return await interaction.editReply({ content: `A técnica **${jutsu.nome}** é hiden do clã **${jutsu.hiden}**, mas você é do clã **${userAccount.ficha1.cla}**.` });
    }

    if (jutsu.blocked) {
        return await interaction.editReply({ content: `A técnica **${jutsu.nome}** está bloqueada para aprendizado.`})
    }

    if (jutsu.raid) {
        return await interaction.editReply({ content: `A técnica **${jutsu.nome}** é uma técnica de Raid e não pode ser aprendida.`})
    }

    // Obtenha invocações e itens do usuário
    let userInvs = [userAccount.ficha1.invs.slot1.nome, userAccount.ficha1.invs.slot2.nome];
    let userItems = [];
    const inventorySlots = Object.keys(userAccount.ficha1.inventario);

    for (let i = 1; i <= inventorySlots.length; i++) {
        userItems.push(userAccount.ficha1.inventario[`slot${i}`].nome);
    }

    // Verifique se o usuário tem todas as invocações necessárias
    for (let inv of jutsu.invs) {
        if (!userInvs.includes(inv) && jutsu.invs[0] !== "Nenhum") {
            return await interaction.editReply({ content: `Você precisa da invocação **${inv}** para aprender este jutsu.` });
        }
    }

    // Verifique se o usuário tem todos os itens necessários
    for (let item of jutsu.items) {
        if (!userItems.includes(item) && jutsu.items[0] !== "Nenhum") {
            return await interaction.editReply({ content: `Você precisa do item **${item}** para aprender este jutsu.` });
        }
    }

    if (!jutsu.elementos.includes("Nenhum") && !jutsu.elementos.every(elemento => userAccount.ficha1.elementos.includes(elemento))) {
        const elementosJutsu = jutsu.elementos.join(" - ");
        const elementosUser = userAccount.ficha1.elementos.join(" - ");
        return await interaction.editReply({ 
            content: `A técnica **${jutsu.nome}** requer os elementos: **${elementosJutsu}**\nVocê possui: **${elementosUser}**`
        });
    }

    if (!jutsu.kkg.includes("Nenhum") && !jutsu.kkg.every((kkg) => userAccount.ficha1.kkg.includes(kkg))) {
        const kkgJutsu = jutsu.kkg.join(" - ");
        const kkgUser = userAccount.ficha1.kkg.join(" - ");
        return await interaction.editReply({ 
            content: `A técnica **${jutsu.nome}** requer as Kekkei Genkai: **${kkgJutsu}**\nVocê possui: **${kkgUser}**`
        });
    }

    const modos = {
        "p1": { nivel: 0, campo: 'oito_p', mensagem: "1º Portão Interno" },
        "p2": { nivel: 1, campo: 'oito_p', mensagem: "2º Portão Interno" },
        "p3": { nivel: 2, campo: 'oito_p', mensagem: "3º Portão Interno" },
        "p4": { nivel: 3, campo: 'oito_p', mensagem: "4º Portão Interno" },
        "p5": { nivel: 4, campo: 'oito_p', mensagem: "5º Portão Interno" },
        "p6": { nivel: 5, campo: 'oito_p', mensagem: "6º Portão Interno" },
        "p7": { nivel: 6, campo: 'oito_p', mensagem: "7º Portão Interno" },
        "p8": { nivel: 7, campo: 'oito_p', mensagem: "8º Portão Interno" },
        "eremita1": { nivel: 1, campo: 'eremita', mensagem: "Modo Eremita Imperfeito" },
        "eremita2": { nivel: 2, campo: 'eremita', mensagem: "Modo Eremita Perfeito" },
        "bijuu1": { nivel: 1, campo: 'bijuu', mensagem: "Modo Bijuu Versão 1" },
        "bijuu2": { nivel: 2, campo: 'bijuu', mensagem: "Modo Bijuu Versão 2" },
        "bijuu3": { nivel: 3, campo: 'bijuu', mensagem: "Modo Bijuu Versão 3 (Final)" },
        "k2": { nivel: 2, campo: 'karma', mensagem: "Karma Fase Dois" },
        "k3": { nivel: 3, campo: 'karma', mensagem: "Karma Fase Três" },
        "k4": { nivel: 4, campo: 'karma', mensagem: "Karma Fase Quatro" },
    };

    let modosValidos = jutsu.modos.filter(modo => modo !== 'Nenhum');
    if (modosValidos.length > 0) {
        for (let i = 0; i < modosValidos.length; i++) {
            let modo = modos[modosValidos[i]];
            if (userAccount.ficha1.modos[modo.campo] <= modo.nivel) {
                return await interaction.editReply({ content: `A técnica ${jutsu.nome} requer o ${modo.mensagem} aprendido.`});
            }
        }
    }

    // Verifique se o usuário já aprendeu o jutsu
    let userJutsus = await jutsuDB.find({
        idJutsu: { $in: userAccount.ficha1.jutsus }
    }).toArray();
    let hasLearnedJutsu = userJutsus.some(jutsuObj => jutsuObj.nome === jutsu.nome);

    if (hasLearnedJutsu) {
        return await interaction.editReply({ content: `Você já aprendeu esse jutsu.` });
    }

    const userJutsuNames = userJutsus.map(jutsu => jutsu.nome);

    // Verifique se o usuário já aprendeu os jutsus necessários
    for (let requiredJutsu of jutsu.jutsuBase) {
        if (requiredJutsu === "Nenhum") continue;

        let hasRequiredJutsu = userJutsuNames.includes(requiredJutsu);

        if (!hasRequiredJutsu) {
            return await interaction.editReply({ content: `Você precisa aprender o jutsu **${requiredJutsu}** antes de poder aprender este.` });
        }
    }

    const tnJutsu = {
        "Fuinjutsu": {
            "letter": "fuinjutsu",
            "B": 1,
            "A": 2,
            "S": 3
        },
        "Bukijutsu": {
            "letter": "bukijutsu",
            "B": 1,
            "A": 2,
            "S": 3
        },
        "Kugutsujutsu": {
            "letter": "kugutsujutsu",
            "B": 1,
            "A": 2,
            "S": 3
        },
        "Taijutsu": {
            "letter": "taijutsu",
            "B": 1,
            "A": 2,
            "S": 3
        },
        "Genjutsu": {
            "letter": "genjutsu",
            "B": 1,
            "A": 2,
            "S": 3
        }
    };

    const typeJutsus = jutsu.tipo.filter(tipo => Object.keys(tnJutsu).includes(tipo));

    if (typeJutsus.length > 0 && !["C", "D", "E"].includes(jutsu.rank)) {
        for (const tipo of typeJutsus) {
            const letter = tnJutsu[tipo].letter;
            const rank = tnJutsu[tipo][jutsu.rank];
            if (!((letter === "taijutsu" && userAccount.ficha1.cla === "Lee") || 
            (userAccount.ficha1.talentos[letter]?.n >= rank))) {
            
            const currentLevel = userAccount.ficha1.talentos[letter]?.n ?? 0;
                return await interaction.editReply({ content: `A técnica ${jutsu.nome} é um ${tipo} e é necessário o TN (Talento Ninja) de ${tipo} em nível ${rank} (você tem nível ${currentLevel}) para iniciar o aprendizado.`});
            }
        }
    }

    let jutsuAproved = false;
    for (let i = 1; i <= inventorySlots.length; i++) {
        if (userAccount.ficha1.inventario[`slot${i}`].nome === `Pergaminho - Jutsu Rank ${jutsu.rank}`) {
            const newJutsuId = jutsu.idJutsu;

            let itemName = `${userAccount.ficha1.inventario[`slot${i}`].quantia === 1 ? "Vazio" : userAccount.ficha1.inventario[`slot${i}`].nome}`;
            const updateQuery = {
                $set: {
                    [`ficha1.inventario.slot${i}.nome`]: itemName,
                },
                $inc: {
                    [`ficha1.inventario.slot${i}.quantia`]: -1
                }
            };

            // Redefinir os campos caso a quantidade do item seja reduzida a 0
            if (userAccount.ficha1.inventario[`slot${i}`].quantia === 1) {
                updateQuery.$set[`ficha1.inventario.slot${i}.zeroValueSale`] = false;
                updateQuery.$set[`ficha1.inventario.slot${i}.isStealable`] = true;
                updateQuery.$set[`ficha1.inventario.slot${i}.isSellable`] = true;
                updateQuery.$set[`ficha1.inventario.slot${i}.maxQuantity`] = 1;
            }

            await userDB.updateOne(
                { "id_dc": interaction.user.id },
                {
                    $push: { "ficha1.jutsus": newJutsuId },
                    ...updateQuery
                }
            );

            jutsuAproved = true;

            await interaction.editReply({ content: `Jutsu **${jutsu.nome}** de **Rank ${jutsu.rank}** aprendido imediatamente com sucesso! Para visualizá-lo, use **/pp jutsus**.` });
            break;
        }
    }      

    if (!jutsuAproved) {
        return await interaction.editReply({ content: `O jutsu que você quer aprender é um rank diferente do seu pergaminho ou você não possui o item.` });
    }
}