import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('up')
    .setDescription('Promove um jogador e/ou personagem.')

    .addStringOption(option =>
        option.setName('type_up')
          .setDescription('Qual o tipo de promoção deseja fazer?')
          .setRequired(true)
          .addChoices(
              { name: `STAFF`, value: 'staff' },
              { name: `Patente`, value: 'patente' },
          )
    )

    .addUserOption(option =>
        option.setName('target')
          .setDescription('Quem receberá a promoção?')
          .setRequired(true)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
    await interaction.deferReply({ ephemeral: true })
    if (userAccount.staff < 4) return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas o Dono.` });

    const typeUp = interaction.options.getString('type_up')
    const target = interaction.options.getUser('target')
    let targetAccount = await userDB.findOne({ "id_dc": target.id });
    if (!targetAccount || !targetAccount.ficha1.active) return await interaction.editReply({ content: `*${target}* não é um alvo válido ou ele não possuí uma conta/personagem.`, ephemeral: true});

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

    if (typeUp === "patente") {
        let patenteRoleID = '';
        let patenteRoleIDOld = '';
        const guildMember = await interaction.guild.members.fetch(target.id);
        if (targetAccount.ficha1.patenteType === 0) { // Shinobi
            switch (targetAccount.ficha1.patenteNvl) {
                case 1:
                    targetAccount.ficha1.patenteNvl = 2;
                    targetAccount.ficha1.patente = "Chuunin";
                    targetAccount.ficha1.atb.pontosLivres += 50;
                    targetAccount.ficha1.ryou += 5000;
                    targetAccount.ficha1.atb.ptn = 2;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694669918212096';
                    patenteRoleIDOld = '1164694771860783145';
                    await updateLevel(targetAccount, 3000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 2:
                    targetAccount.ficha1.patenteNvl = 3;
                    targetAccount.ficha1.patente = "Jounin";
                    targetAccount.ficha1.atb.pontosLivres += 60;
                    targetAccount.ficha1.ryou += 7000;
                    targetAccount.ficha1.atb.ptn = 2;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694582555062324';
                    patenteRoleIDOld = '1164694669918212096';
                    await updateLevel(targetAccount, 6000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 3:
                    targetAccount.ficha1.patenteNvl = 4;
                    targetAccount.ficha1.patente = "Jounin de Elite";
                    targetAccount.ficha1.atb.pontosLivres += 70;
                    targetAccount.ficha1.ryou += 9000;
                    targetAccount.ficha1.atb.ptn = 3;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694506948546591';
                    patenteRoleIDOld = '1164694582555062324';
                    await updateLevel(targetAccount, 10000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 4:
                    targetAccount.ficha1.patenteNvl = 5;
                    targetAccount.ficha1.patente = "Jounin Hanchou";
                    targetAccount.ficha1.atb.pontosLivres += 80;
                    targetAccount.ficha1.ryou += 10000;
                    targetAccount.ficha1.atb.ptn = 3;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694297086541845';
                    patenteRoleIDOld = '1164694506948546591';
                    await updateLevel(targetAccount, 20000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 5:
                    return await interaction.editReply({ content: `O personagem **${targetAccount.ficha1.name}** já atingiu a patente máxima.` });
                    default:
                break;
            }
        } 
        else if (targetAccount.ficha1.patenteType === 1) { // Nukenin
            switch (targetAccount.ficha1.patenteNvl) {
                case 1:
                    targetAccount.ficha1.patenteNvl = 2;
                    targetAccount.ficha1.patente = "Nukenin Rank C";
                    targetAccount.ficha1.atb.pontosLivres += 50;
                    targetAccount.ficha1.ryou += 5000;
                    targetAccount.ficha1.atb.ptn = 2;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694669918212096';
                    patenteRoleIDOld = '1164694771860783145';
                    await updateLevel(targetAccount, 3000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 2:
                    targetAccount.ficha1.patenteNvl = 3;
                    targetAccount.ficha1.patente = "Nukenin Rank B";
                    targetAccount.ficha1.atb.pontosLivres += 60;
                    targetAccount.ficha1.ryou += 7000;
                    targetAccount.ficha1.atb.ptn = 2;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694582555062324';
                    patenteRoleIDOld = '1164694669918212096';
                    await updateLevel(targetAccount, 6000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 3:
                    targetAccount.ficha1.patenteNvl = 4;
                    targetAccount.ficha1.patente = "Nukenin Rank A";
                    targetAccount.ficha1.atb.pontosLivres += 70;
                    targetAccount.ficha1.ryou += 9000;
                    targetAccount.ficha1.atb.ptn = 3;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694506948546591';
                    patenteRoleIDOld = '1164694582555062324';
                    await updateLevel(targetAccount, 10000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 4:
                    targetAccount.ficha1.patenteNvl = 5;
                    targetAccount.ficha1.patente = "Nukenin Rank S";
                    targetAccount.ficha1.atb.pontosLivres += 80;
                    targetAccount.ficha1.ryou += 10000;
                    targetAccount.ficha1.atb.ptn = 3;
                    targetAccount.ficha1.atb.energia += 10;
                    targetAccount.ficha1.atb.energiaTemp += 10;
                    targetAccount.ficha1.atb.hp += 75;
                    targetAccount.ficha1.atb.hpTemp += 75;
                    patenteRoleID = '1164694297086541845';
                    patenteRoleIDOld = '1164694506948546591';
                    await updateLevel(targetAccount, 20000);
                    await guildMember.roles.remove(patenteRoleIDOld);
                    await guildMember.roles.add(patenteRoleID);
                break;

                case 5:
                    return await interaction.editReply({ content: `O personagem **${targetAccount.ficha1.name}** já atingiu a patente máxima.` });
                    default:
                break;
            }
        }

        function sortearElemento(elementos) {
            const todosElementos = ["Estilo Raio", "Estilo Fogo", "Estilo Terra", "Estilo Vento", "Estilo Água"];
            const elementosDisponiveis = todosElementos.filter(elemento => !elementos.includes(elemento));
            if (elementosDisponiveis.length === 0) {
                return null;
            }
            const indice = Math.floor(Math.random() * elementosDisponiveis.length);
            const elementoSorteado = elementosDisponiveis[indice];
            return elementoSorteado;
        }
        
        // Atualiza os valores baseados no nível usando $set e $switch
        await userDB.updateOne(
            { "id_dc": target.id },
            { 
                $set: { 
                    "ficha1.patenteNvl": targetAccount.ficha1.patenteNvl,
                    "ficha1.patente": targetAccount.ficha1.patente,
                    "ficha1.atb.pontosLivres": targetAccount.ficha1.atb.pontosLivres,
                    "ficha1.ryou": targetAccount.ficha1.ryou,
                    "ficha1.atb.ptn": targetAccount.ficha1.atb.ptn,
                    "ficha1.atb.energia": targetAccount.ficha1.atb.energia,
                    "ficha1.atb.energiaTemp": targetAccount.ficha1.atb.energiaTemp,
                    "ficha1.atb.hp": targetAccount.ficha1.atb.hp,
                    "ficha1.atb.hpTemp": targetAccount.ficha1.atb.hpTemp
                }
            }
        );

        targetAccount = await userDB.findOne({ "id_dc": target.id });

        let message = `O STAFF <@${userAccount.id_dc}> promoveu seu personagem para a patente **${targetAccount.ficha1.patente}**.`

        // Se a patente for 3, sorteie um novo elemento e atualize o banco de dados
        if (targetAccount.ficha1.patenteNvl === 3) {
            const elementos = targetAccount.ficha1.elementos;
            const novoElemento = sortearElemento(elementos);
            if (novoElemento) {
                elementos.push(novoElemento);
                await userDB.updateOne(
                    { "id_dc": target.id },
                    { $set: { "ficha1.elementos": elementos } }
                );
            }
            message += `\n**Novo elemento:** ${novoElemento}`;
        }

        await interaction.editReply({ content: `O personagem **${targetAccount.ficha1.name}** foi evoluído com sucesso.\n**Patente nova:** ${targetAccount.ficha1.patente}` });

        return await client.users.send(targetAccount.id_dc, { content: message });
    }

    else if (typeUp === "staff") {
        if (target.staff === 3) {
            await client.users.send(targetAccount.id_dc, { content: `O STAFF <@${targetAccount.id_dc}> atingiu o nível (Sx) máximo na equipe.` });
            return; // Saia da função se o nível máximo for alcançado
        }
    
        // Atualiza o nível de STAFF do jogador
        await userDB.updateOne(
            { "id_dc": target.id },
            { $inc: { "staff": 1 } }
        );
    
        // Recupera a conta atualizada
        targetAccount = await userDB.findOne({ "id_dc": target.id });
    
        // Define o ID do cargo com base no nível
        const roleMap = {
            1: "1164693196488589312", // S1 nível 1
            2: "1164692967055949925", // S2 nível 2
            3: "1164690504953385042"  // S3 nível 3
        };
    
        const roleId = roleMap[targetAccount.staff === 0 ? 1 : targetAccount.staff];
        if (roleId) {
            const guildMember = await interaction.guild.members.fetch(targetAccount.id_dc);
            if (guildMember) {
                // Remove cargos antigos (caso existam)
                const oldRoleIds = Object.values(roleMap).filter(id => id !== roleId);
                for (const oldRoleId of oldRoleIds) {
                    const oldRole = guildMember.roles.cache.get(oldRoleId);
                    if (oldRole) {
                        await guildMember.roles.remove(oldRole);
                    }
                }

                await guildMember.roles.add(roleId);
            } else {
                console.error(`Membro do servidor com ID ${targetAccount.id_dc} não encontrado.`);
            }
        } else {
            console.error(`ID de cargo não encontrado para o nível STAFF ${targetAccount.staff}.`);
        }
    
        // Responde à interação
        await interaction.editReply({ content: `O jogador **${target}** foi promovido com sucesso e agora é STAFF **Nível ${targetAccount.staff}**.` });
    
        // Notifica o STAFF promovido
        await client.users.send(targetAccount.id_dc, { content: `O STAFF <@${userAccount.id_dc}> lhe promoveu para STAFF **Nível ${targetAccount.staff}**.` });
    }
}