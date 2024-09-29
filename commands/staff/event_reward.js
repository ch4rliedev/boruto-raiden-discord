import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from "crypto";

export const data = new SlashCommandBuilder()
    .setName('event_reward')
    .setDescription('Concede recompensas para eventos com base no nível de dificuldade.')

    .addSubcommand(subcommand =>
        subcommand
            .setName('easy')
            .setDescription('Concede recompensas para eventos de dificuldade Fácil.')
            .addUserOption(option => option.setName('vencedor1').setDescription('Selecione o vencedor').setRequired(true))
            .addUserOption(option => option.setName('vencedor2').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor3').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor4').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor5').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor6').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor7').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor8').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor9').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor10').setDescription('Selecione o vencedor'))
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName('medium')
            .setDescription('Concede recompensas para eventos de dificuldade Médio.')
            .addUserOption(option => option.setName('vencedor1').setDescription('Selecione o vencedor').setRequired(true))
            .addUserOption(option => option.setName('vencedor2').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor3').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor4').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor5').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor6').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor7').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor8').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor9').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor10').setDescription('Selecione o vencedor'))
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName('hard')
            .setDescription('Concede recompensas para eventos de dificuldade Díficil.')
            .addUserOption(option => option.setName('vencedor1').setDescription('Selecione o vencedor').setRequired(true))
            .addUserOption(option => option.setName('vencedor2').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor3').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor4').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor5').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor6').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor7').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor8').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor9').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor10').setDescription('Selecione o vencedor'))
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName('ultimate')
            .setDescription('Concede recompensas para eventos de dificuldade Ultimate.')
            .addUserOption(option => option.setName('vencedor1').setDescription('Selecione o vencedor').setRequired(true))
            .addUserOption(option => option.setName('vencedor2').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor3').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor4').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor5').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor6').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor7').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor8').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor9').setDescription('Selecione o vencedor'))
            .addUserOption(option => option.setName('vencedor10').setDescription('Selecione o vencedor'))
    )

    .addSubcommand(subcommand =>
        subcommand
            .setName('offline')
            .setDescription('Concede recompensas para eventos offline.')
            .addUserOption(option => option.setName('gold').setDescription('Selecione o primeiro lugar 🥇').setRequired(true))
            .addUserOption(option => option.setName('silver').setDescription('Selecione o segundo lugar 🥈').setRequired(true))
            .addUserOption(option => option.setName('bronze').setDescription('Selecione o terceiro lugar 🥉').setRequired(true))
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply();

    async function raidRandom(doc, type) {
        if (doc.ficha1.level < 10 && !type) return false
        if (doc.ficha1.blockRaid && (type !== "drawPrize" && type !== "eventReward")) return false
        const raidPassRandom = type === "drawPrize" ? randomInt(1, 101) : type === "eventReward" ? randomInt(1, 11) : randomInt(1, 251);
        const raidPassNumbers = type === "eventReward" ? [7] : [14];
    
        doc.vip === 3 ? raidPassNumbers.push(41, 94) : null
        doc.vip === 2 ? raidPassNumbers.push(33) : null
    
        let raidPassResult = `Empty`
        let bonusPass = false;
        if (raidPassNumbers.includes(raidPassRandom)) {
            const raidPassPorcent = randomInt(1, 101);
            const raidPassNumbers = {
                "Passe de Raid - Bijuu (Escolha)": [88, 3, 77],
                "Passe de Raid - Bijuu (Semanal)": [21, 45, 32, 89, 12, 67, 55],
                "Passe de Raid - Bijuu (Aleatório)": [92, 14, 51, 25, 70, 8, 36, 60, 19, 40],
                "Passe de Raid - Invocação (Escolha)": [95, 23, 18, 69, 50, 10, 86, 47],
                "Passe de Raid - Invocação (Semanal)": [49, 33, 83, 15, 57, 31, 6, 78, 22, 61, 7, 91],
                "Passe de Raid - Invocação (Aleatório)": [72, 24, 28, 29, 48, 56, 62],
                "Passe de Raid - Jutsu (Escolha)": [9, 16, 27, 42, 96,100],
                "Passe de Raid - Jutsu (Semanal)": [64 ,68 ,37 ,54 ,1 ,59 ,46 ,35 ,43 ,79 ,73 ,63 ,13],
                "Passe de Raid - Jutsu (Aleatório)": [30 ,41 ,53 ,65 ,99 ,17 ,34 ,74 ,5],
                "Passe de Raid - Item Especial (Escolha)": [81 ,82 ,98 ,84 ,85 ,87 ,58],
                "Passe de Raid - Item Especial (Semanal)": [76 ,38 ,4 ,71 ,93 ,80 ,26 ,90 ,20 ,11 ,94 ,97],
                "Passe de Raid - Item Especial (Aleatório)": [52 ,75 ,2 ,66 ,44 ,39]               
            };
            
            raidPassResult = Object.keys(raidPassNumbers).find(key => raidPassNumbers[key].includes(raidPassPorcent)) || "Empty";
        
            if (raidPassResult !== "Empty") {
                const typeMapping = {
                    "Bijuu": "bijuus",
                    "Invocação": "invs",
                    "Jutsu": "jutsus",
                    "Item Especial": "items"
                };
                
                const raidType = raidPassResult.substring( //Jutsu, Invocação, Bijuu ou Item
                    raidPassResult.lastIndexOf("-") + 1,
                    raidPassResult.lastIndexOf("(")
                ).trim();
    
                const match = raidPassResult.match(/\((.*?)\)/);
                const itemType = match ? match[1] : ''; //Semanal, Escolha ou Aleatório
                
                let item;
                if (itemType === "Semanal") {
                    const weeklyItems = await infoGameDB.findOne({ "name": "raidWeek" });
                    item = weeklyItems[typeMapping[raidType]].slice(0, -1);
                } else if (itemType === "Aleatório") {
                    const items = await infoGameDB.findOne({ "name": "raidList" });
                    item = items[typeMapping[raidType]][randomInt(0, items[typeMapping[raidType]].length)];
                } else if (itemType === "Escolha") item = "Escolha"
                
                raidPassResult = `Passe de Raid - ${raidType}: "${item}"`;
                
                const inventorySlots = Object.keys(doc.ficha1.inventario)
                const itemRaid = await itemDB.findOne({ "nome": "Passe de Raid" });
    
                for (let i = 1; i <= inventorySlots.length; i++) {
                    const slot = doc.ficha1.inventario[`slot${i}`];
                    if (slot.nome === raidPassResult && slot.quantia < itemRaid.maxQuantity) {
    
                        bonusPass = true;
                        await userDB.updateOne(
                            { "idAccount": doc.idAccount },
                            { $inc: { 
                                [`ficha1.inventario.slot${i}.quantia`]: 1,
                                } 
                            }
                        );
                        if (type === "drawPrize") return `${raidPassResult}`
                        return `\n\n- Item Raro: ${raidPassResult}\n\nUse Passes de Raids para obter jutsus, invocações, bijus e itens exclusivos por meio de um combate.\nCaso não deseje o item, não é possível vender, envie o comando /usar e selecione o slot do item e a quantia.`
                    }
                }
    
                if (!bonusPass) {
                    for (let i = 1; i <= inventorySlots.length; i++) {
                        const slot = doc.ficha1.inventario[`slot${i}`];
                        if (slot.nome === "Vazio") {
                            bonusPass = true;
                            await userDB.updateOne(
                                { "idAccount": doc.idAccount },
                                { $set: { 
                                    [`ficha1.inventario.slot${i}.nome`]: raidPassResult,
                                    [`ficha1.inventario.slot${i}.quantia`]: 1,
                                    } 
                                }
                            );
                            if (type === "drawPrize") return `${raidPassResult}`
                            return `\n\n- Item Raro: ${raidPassResult}\n\nUse Passes de Raids para obter jutsus, invocações, bijus e itens exclusivos por meio de um combate.\nCaso não deseje o item, não é possível vender, envie o comando /usar e selecione o slot do item e a quantia.`
                        }
                    }
                }
            }
        }
        else {
            return false
        }
    }

    if (userAccount.staff < 1) {
        return await interaction.editReply({ content: 'Você não tem permissão para usar esse comando, apenas Ajudante ou superior.' });
    }

    const subcommand = interaction.options.getSubcommand();

    const lastUsed = userAccount.ficha1.lastCommandStaffUsed?.[subcommand];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera as horas, minutos, segundos e milissegundos para comparar apenas a data

    if (lastUsed && lastUsed >= today) {
        return await interaction.editReply({ content: `Você já usou o comando \`/${interaction.commandName} ${subcommand}\` hoje. Tente novamente amanhã.` });
    }

    async function updateLevel(doc, xpGained) {
        let currentLevel = doc.ficha1.level;
        let currentXP = doc.ficha1.xpCurrent + xpGained;
        let xpNextFix = 200 * currentLevel; // XP fixo para o próximo nível
        let pontosLivresGanho = 0;
      
        if (xpGained > 0) {
            while (currentXP >= xpNextFix) {
                currentXP -= xpNextFix; // Subtrai o XP necessário para o nível atual
                currentLevel++; // Aumenta o nível
                xpNextFix += 200;
      
                // Calcula a recompensa de pontos livres para cada nível subido
                if (currentLevel <= 15) {
                    pontosLivresGanho += 10;
                } else if (currentLevel <= 25) {
                    pontosLivresGanho += 20;
                } else if (currentLevel <= 50) {
                    pontosLivresGanho += 30;
                } else if (currentLevel <= 100) {
                    pontosLivresGanho += 40;
                } else if (currentLevel <= 200) {
                    pontosLivresGanho += 50;
                } else if (currentLevel <= 300) {
                    pontosLivresGanho += 60;
                } else if (currentLevel <= 400) {
                    pontosLivresGanho += 70;
                } else {
                    pontosLivresGanho += 80;
                }
            }
        } else {
            while (currentXP < 0) {
                if (currentLevel > 1) {
                    xpNextFix -= 200;
                    if (currentLevel <= 15) {
                        pontosLivresGanho -= 10;
                    } else if (currentLevel <= 25) {
                        pontosLivresGanho -= 20;
                    } else if (currentLevel <= 50) {
                        pontosLivresGanho -= 30;
                    } else if (currentLevel <= 100) {
                        pontosLivresGanho -= 40;
                    } else if (currentLevel <= 200) {
                        pontosLivresGanho -= 50;
                    } else if (currentLevel <= 300) {
                        pontosLivresGanho -= 60;
                    } else if (currentLevel <= 400) {
                        pontosLivresGanho -= 70;
                    } else {
                        pontosLivresGanho -= 80;
                    }
                    
                    currentLevel--;
                    currentXP += xpNextFix;
                }
            }
            if (currentXP < 0) {
                currentXP = 0;
            }
        }
      
        if (currentLevel > 500) {
            currentLevel = 500;
            currentXP = 0;
            xpNextFix = 200 * currentLevel;
        }
      
        const xpNext = xpNextFix - currentXP;
      
        await userDB.updateOne(
            { idAccount: doc.idAccount },
            {
                $set: {
                    'ficha1.level': currentLevel,
                    'ficha1.xpCurrent': currentXP,
                    'ficha1.xpNext': xpNext,
                    'ficha1.xpNextFix': xpNextFix,
                },
                $inc: { 
                    'ficha1.atb.pontosLivres': pontosLivresGanho,
                    'ficha1.xpTotal': xpGained,
                },
            }
        );
      
        let levelUpMessage;
        if (currentLevel > doc.ficha1.level || xpGained < 0) {
            const user = await client.users.fetch(doc.id_dc);
            levelUpMessage = `## Seu nível foi atualizado para ${currentLevel}!\n**XP Atual:** ${currentXP}/${xpNextFix} (Faltam **${xpNext}**)\n\n${pontosLivresGanho >= 0 ? `+${pontosLivresGanho} pontos livres adicionados.` : `${Math.abs(pontosLivresGanho)} pontos livres removidos.`}`;
            
            try {
                await user.send(levelUpMessage);
            } catch (error) {
                console.error(`Erro ao enviar mensagem para o usuário ${doc.idAccount}: ${error}`);
            }
        }
      
        return xpGained;
    }

    const organizerReward = {
        easy: { pl: 15, ryous: 700, exp: 525 },
        medium: { pl: 20, ryous: 1050, exp: 945 },
        hard: { pl: 25, ryous: 1400, exp: 1225 },
        ultimate: { pl: 30, ryous: 1750, exp: 2100 },
        offline: { pl: 7, ryous: 350, exp: 350 }
    };

    const rewardData = {
        easy: {
            pl: 25,
            ryous: 2000,
            exp: 1500,
            difficulty: "FÁCIL"
        },
        medium: {
            pl: 30,
            ryous: 3000,
            exp: 2700,
            difficulty: "MÉDIO"
        },
        hard: {
            pl: 40,
            ryous: 4000,
            exp: 3500,
            difficulty: "DIFÍCIL"
        },
        ultimate: {
            pl: 50,
            ryous: 5000,
            exp: 6000,
            difficulty: "UNIÃO DE NAÇÃO"
        },
        offline: {
            gold: {
                pl: 15,
                ryous: 600,
                exp: 800,
            },
            silver: {
                pl: 10,
                ryous: 400,
                exp: 600
            },
            bronze: {
                pl: 5,
                ryous: 200,
                exp: 400
            }
        }
    };

    if (subcommand === 'offline') {
        const podium = ['gold', 'silver', 'bronze'];

        for (const place of podium) {
            const winner = interaction.options.getUser(place);
            if (!winner) continue;

            let targetAccount = await userDB.findOne({ "id_dc": winner.id });

            if (!targetAccount) {
                await interaction.editReply({ content: `O usuário ${winner.username} não foi encontrado no banco de dados.` });
                continue;
            }

            if (!targetAccount.ficha1?.active) {
                await interaction.editReply({ content: `O usuário ${winner.username} não possui um personagem ativo.` });
                continue;
            }

            const reward = rewardData.offline[place];
            let resultPassRaid;
            if (place === "gold") {
                const docWinnerGold = await userDB.findOne({ "id_dc": winner.id });
                resultPassRaid = await raidRandom(docWinnerGold, "eventReward");
                if (!resultPassRaid) {
                    // Buscar o item com ID 122 no banco de dados
                    const item = await itemDB.findOne({ idItem: 122 });
                    
                    if (!item) {
                        console.error("Item com ID 122 não encontrado no banco de dados.");
                        return;
                    }
            
                    const inventorySlots = Object.keys(docWinnerGold.ficha1.inventario);
                    let itemAdded = false;
            
                    // Verificar se o item já existe no inventário
                    for (let i = 1; i <= inventorySlots.length; i++) {
                        if (docWinnerGold.ficha1.inventario[`slot${i}`].nome === item.nome) {
                            if (docWinnerGold.ficha1.inventario[`slot${i}`].quantia + 1 > item.maxQuantity) {
                                resultPassRaid = `Não foi possível ganhar o item ${item.nome} ao inventário de ${winner.username}. Limite de quantidade atingido`
                                return;
                            } else {
                                await userDB.updateOne(
                                    { "id_dc": winner.id },
                                    { $inc: { [`ficha1.inventario.slot${i}.quantia`]: 1 } }
                                );
                                itemAdded = true;
                                resultPassRaid = `${item.nome} foi adicionado ao inventário de ${winner.username} como recompensa alternativa por não ganhar o Passe de Raid no sorteio.`;
                                break;
                            }
                        }
                    }
            
                    // Se o item não existe no inventário, adicionar em um slot vazio
                    if (!itemAdded) {
                        for (let i = 1; i <= inventorySlots.length; i++) {
                            if (docWinnerGold.ficha1.inventario[`slot${i}`].nome === "Vazio") {
                                await userDB.updateOne(
                                    { "id_dc": winner.id },
                                    {
                                        $set: {
                                            [`ficha1.inventario.slot${i}.nome`]: item.nome,
                                            [`ficha1.inventario.slot${i}.maxQuantity`]: item.maxQuantity,
                                            [`ficha1.inventario.slot${i}.isSellable`]: item.isSellable,
                                            [`ficha1.inventario.slot${i}.isStealable`]: item.isStealable,
                                            [`ficha1.inventario.slot${i}.quantia`]: 1
                                        }
                                    }
                                );
                                itemAdded = true;
                                resultPassRaid = `${item.nome} foi adicionado ao inventário de ${winner.username} como recompensa alternativa por não ganhar o Passe de Raid no sorteio.`;
                                break;
                            }
                        }
                    }
                }
            }
            const updates = {
                $inc: {
                    "ficha1.atb.pontosLivres": reward.pl,
                    "ficha1.ryou": reward.ryous,
                }
            };

            await userDB.updateOne({ "id_dc": winner.id }, updates);
            await winner.send(`## Você recebeu as seguintes recompensas pelo pódio ${place === 'gold' ? '🥇' : place === 'silver' ? '🥈' : '🥉'} no último evento:
            - **${reward.pl} pontos de atributos**
            - **${reward.ryous} ryou**
            - **${reward.exp} EXP**\n\n${resultPassRaid}`);

            await updateLevel(targetAccount, reward.exp);
        }

        // Recompensa para o organizador
        await userDB.updateOne(
            { idAccount: userAccount.idAccount },
            {
                $inc: {
                    'ficha1.atb.pontosLivres': organizerReward.offline.pl,
                    'ficha1.ryou': organizerReward.offline.ryous,
                }
            }
        );

        await updateLevel(userAccount, organizerReward.offline.exp);

        return await interaction.editReply({ content: `Recompensas distribuídas para os vencedores do evento offline.` });
    }

    const reward = rewardData[subcommand];

    const winners = [];
    for (let i = 1; i <= 10; i++) {
        const winner = interaction.options.getUser(`vencedor${i}`);
        if (winner) winners.push(winner);
    }

    if (winners.length === 0) {
        return await interaction.editReply({ content: 'Nenhum vencedor foi selecionado.' });
    }

    for (const winner of winners) {
        let targetAccount = await userDB.findOne({ "id_dc": winner.id });

        if (!targetAccount) {
            await interaction.editReply({ content: `O usuário ${winner.username} não encontrado no banco de dados.` });
            continue;
        }

        if (!targetAccount.ficha1?.active) {
            await interaction.editReply({ content: `O usuário ${winner.username} não possui um personagem ativo.` });
            continue;
        }

        await userDB.updateOne(
            { "id_dc": winner.id },
            {
                $set: {
                    "ficha1.state": "Livre"
                },
                $inc: {
                    "ficha1.atb.pontosLivres": reward.pl,
                    "ficha1.ryou": reward.ryous,
                }
            }
        );

        await winner.send(`## Você recebeu as seguintes recompensas pela conclusão do evento:
        - **${reward.pl} pontos livres**
        - **${reward.ryous} ryou**
        - **${reward.exp} EXP**`);

        await updateLevel(targetAccount, reward.exp);
    }

    // Recompensa para o organizador
    await userDB.updateOne(
        { idAccount: userAccount.idAccount },
        {
            $inc: {
                'ficha1.atb.pontosLivres': organizerReward[subcommand].pl,
                'ficha1.ryou': organizerReward[subcommand].ryous,
            },
            $set: { [`ficha1.lastCommandStaffUsed.${subcommand}`]: new Date() }
        }
    );

    await updateLevel(userAccount, organizerReward[subcommand].exp);

    await interaction.editReply({ content: `Recompensas distribuídas com sucesso para ${winners.length} jogadores.` });
}