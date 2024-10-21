import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('atb_change')
    .setDescription('Adicione/subtraia pontos em qualquer atributo ou estatística do personagem.')

    .addUserOption(option =>
        option.setName('target')
          .setDescription('Qual jogador será alterado?')
          .setRequired(true)
    )

    .addStringOption(option =>
      option.setName('atb')
        .setDescription('Qual atributo, ryou ou PTN deseja alterar?')
        .setRequired(true)
        .addChoices(
            { name: `Taijutsu`, value: 't' },
            { name: `Ninjutsu`, value: 'n' },
            { name: `Genjutsu`, value: 'g' },
            { name: `Defesa Taijutsu`, value: 'dt' },
            { name: `Defesa Genjutsu`, value: 'dg' },
            { name: `Defesa Ninjutsu`, value: 'dn' },
            { name: `Dano Crítico`, value: 'dc' },
            { name: `Dano Reduzido`, value: 'dr' },
            { name: `Modo Ultimate`, value: 'mu' },
            { name: `HP`, value: 'hp' },
            { name: `Chakra`, value: 'ck' },
            { name: `Energia`, value: 'energia' },
            { name: `Pontos Livres (PL)`, value: 'pontosLivres' },
            { name: `Ryou`, value: 'ryou' },
            { name: `Pontos de Talentos Ninja (PTN)`, value: 'ptn' },
            { name: `Nível`, value: 'level' },
            { name: `EXP`, value: 'exp' },
        )
    )

    .addNumberOption(option =>
        option.setName('amount')
          .setDescription('Qual a quantia positiva ou negativa será alterada?')
          .setRequired(true)
          .setMinValue(-10000)
          .setMaxValue(10000)
    )

    .addStringOption(option =>
        option.setName('reason')
          .setDescription('Qual o motivo de estar alterando este atributo deste jogador?')
          .setRequired(true)
    )

    .setContexts(0);

    const attributeNames = {
        t: 'Taijutsu',
        n: 'Ninjutsu',
        g: 'Genjutsu',
        dt: 'Defesa Taijutsu',
        dg: 'Defesa Genjutsu',
        dn: 'Defesa Ninjutsu',
        dc: 'Dano Crítico',
        dr: 'Dano Reduzido',
        mu: 'Modo Ultimate',
        hp: 'HP',
        ck: 'Chakra',
        energia: 'Energia',
        pontosLivres: 'Pontos Livres',
        ryou: 'Ryou',
        ptn: 'Pontos de Talentos Ninja',
        level: 'Nível',
        exp: 'EXP',
    };

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
    await interaction.deferReply();
    if (userAccount.staff < 3) return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Administrador ou superior.` });

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
       
    async function addLevels(doc, levelsToAdd) {
        let currentLevel = doc.ficha1.level;
        let currentXP = doc.ficha1.xpCurrent;
        let xpTotal = doc.ficha1.xpTotal;
        let xpNextFix = 200 * currentLevel;
        let plDifference = 0;
    
        if (levelsToAdd > 0) {
            // Adiciona níveis
            for (let i = 0; i < levelsToAdd; i++) {
                xpTotal += xpNextFix;
                currentLevel++;
                xpNextFix += 200;
    
                // Calcular a diferença de pontos livres com base no nível atual
                if (currentLevel <= 15) {
                    plDifference += 10;
                } else if (currentLevel <= 25) {
                    plDifference += 20;
                } else if (currentLevel <= 50) {
                    plDifference += 30;
                } else if (currentLevel <= 100) {
                    plDifference += 40;
                } else if (currentLevel <= 200) {
                    plDifference += 50;
                } else if (currentLevel <= 300) {
                    plDifference += 60;
                } else if (currentLevel <= 400) {
                    plDifference += 70;
                } else {
                    plDifference += 80;
                }
    
                if (currentLevel > 500) {
                    currentLevel = 500;
                    currentXP = 0;
                    break;
                }
            }
        } else {
            // Remove níveis
            for (let i = 0; i < Math.abs(levelsToAdd); i++) {
                // Verifica se o nível está abaixo do mínimo permitido
                if (currentLevel <= 1) break;
                
                // Reduz o nível e atualiza xpNextFix
                plDifference -= (currentLevel <= 15 ? 10 :
                                 currentLevel <= 25 ? 20 :
                                 currentLevel <= 50 ? 30 :
                                 currentLevel <= 100 ? 40 :
                                 currentLevel <= 200 ? 50 :
                                 currentLevel <= 300 ? 60 :
                                 currentLevel <= 400 ? 70 : 80);
    
                xpNextFix -= 200;
                xpTotal -= xpNextFix;
                currentLevel--;
    
                if (currentLevel < 1) {
                    currentLevel = 1;
                    break;
                }
            }
        }
    
        const xpNext = xpNextFix - currentXP;
    
        await userDB.updateOne(
            { idAccount: doc.idAccount },
            {
                $set: {
                    'ficha1.level': currentLevel,
                    'ficha1.xpTotal': xpTotal,
                    'ficha1.xpNext': xpNext,
                    'ficha1.xpNextFix': xpNextFix,
                    'ficha1.xpCurrent': currentXP // Atualizar o XP atual no banco de dados
                },
                $inc: { 'ficha1.atb.pontosLivres': plDifference },
            }
        );
    
        const user = await client.users.fetch(doc.id_dc);
        let levelChangeMessage = `## Você agora está no **nível ${currentLevel}!**\n**XP Atual:** ${currentXP}/${xpNextFix} (Faltam **${xpNext}**)\n\n`;
    
        if (plDifference > 0) {
            levelChangeMessage += `+${plDifference} pontos livres adicionados.`;
        } else if (plDifference < 0) {
            levelChangeMessage += `${plDifference} pontos livres removidos.`;
        }
    
        try {
            await user.send(levelChangeMessage);
        } catch (error) {
            console.error(`Erro ao enviar mensagem para o usuário ${doc.idAccount}: ${error}`);
        }
    }
    
    const target = interaction.options.getUser('target');
    const atb = interaction.options.getString('atb');
    const reason = interaction.options.getString('reason');
    const amount = interaction.options.getNumber('amount');

    let targetAccount = await userDB.findOne({ "id_dc": target.id });
    if (!targetAccount || !targetAccount.ficha1.active) return await interaction.editReply({ content: `*${target}* não é um alvo válido ou ele não possui uma conta/personagem.`, ephemeral: true });

    const attributeName = attributeNames[atb];
    const amountText = amount > 0 ? `+${amount}` : `${amount}`;
    let message;

    if (atb === "level") {
        await addLevels(targetAccount, amount);
        targetAccount = await userDB.findOne({ "id_dc": target.id });

        message = amount > 0
            ? `Você adicionou **${amount} níveis** ao personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**. Ele agora está no nível **${targetAccount.ficha1.level}**.`
            : `Você removeu **${Math.abs(amount)} níveis** do personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**. Ele agora está no nível **${targetAccount.ficha1.level}**.`;

    }
    else if (atb === "exp") {
        await updateLevel(targetAccount, amount);
        targetAccount = await userDB.findOne({ "id_dc": target.id });

        message = amount > 0
            ? `Você adicionou **${amount} EXP** ao personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**.`
            : `Você removeu **${Math.abs(amount)} EXP** do personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**.`;

    }
    else if (atb !== "ryou") {
        await userDB.updateOne(
            { "id_dc": target.id },
            { $inc: {
                [`ficha1.atb.${atb}`]: amount,
            }}
        );
    
        const tempAttributes = ['n', 'g', 't', 'dn', 'dg', 'dt', 'hp', 'ck', 'energia'];
        if (tempAttributes.includes(atb)) {
            await userDB.updateOne(
                { "id_dc": target.id },
                { $inc: {
                    [`ficha1.atb.${atb}Temp`]: amount,
                }}
            );
        }
    
        const totalAttributes = ['n', 'g', 't', 'dn', 'dg', 'dt'];
        if (totalAttributes.includes(atb)) {
            await userDB.updateOne(
                { "id_dc": target.id },
                { $inc: {
                    [`ficha1.atb.${atb}Total`]: amount,
                }}
            );
        }

        message = amount > 0
            ? `Você adicionou **${amountText}** pontos em **${attributeName}** para o personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**.`
            : `Você removeu **${amountText}** pontos em **${attributeName}** para o personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**.`;
    }
    else {
        await userDB.updateOne(
            { "id_dc": target.id },
            { $inc: {
                [`ficha1.ryou`]: amount,
            }}
        );

        message = amount > 0
            ? `Você adicionou **${amountText}** ryou para o personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**.`
            : `Você removeu **${amountText}** ryou para o personagem **${targetAccount.ficha1.name}** do jogador **<@${targetAccount.id_dc}>**.`;
    }

    await interaction.editReply({ content: message });
    await client.users.send(targetAccount.id_dc, { content: `O STAFF <@${userAccount.id_dc}> alterou **"${attributeName}"** em **${amountText}** para o seu personagem **${targetAccount.ficha1.name}** pela razão:\n\n${reason}` });
} 