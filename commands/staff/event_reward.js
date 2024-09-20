import { SlashCommandBuilder } from 'discord.js';

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

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
    await interaction.deferReply();

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
            - **${reward.exp} EXP**`);

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