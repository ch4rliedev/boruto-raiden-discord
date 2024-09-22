import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from 'crypto';
import { clanDB } from '../../mongodb.js';

export const data = new SlashCommandBuilder()
    .setName('raid_change')
    .setDescription('Gerencia raids no servidor')
    .addSubcommand(subcommand =>
        subcommand
            .setName('start')
            .setDescription('Inicia uma nova raid')
            .addStringOption(option =>
                option.setName('room')
                    .setDescription('Qual sala de Raid irá iniciar?')
                    .setRequired(true)
                    .addChoices(
                        { name: `Sala 1`, value: '1168340876418883694' },
                        { name: `Sala 2`, value: '1168340971533115442' },
                        { name: `Sala 3`, value: '1206835828270043137' },
                        { name: `Sala 4`, value: '1206835880841580564' },
                    )
            )
            .addUserOption(option =>
                option.setName('leader')
                    .setDescription('Líder da Raid')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option.setName('member2')
                    .setDescription('Membro 2 da Raid (opcional)')
            )
            .addUserOption(option =>
                option.setName('member3')
                    .setDescription('Membro 3 da Raid (opcional)')
            )
            .addBooleanOption(option =>
                option.setName('bijuu')
                    .setDescription('É uma bijuu?')
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('finish')
            .setDescription('Encerra uma raid em andamento')
            .addStringOption(option =>
                option.setName('room')
                    .setDescription('Qual sala de Raid irá encerrar?')
                    .setRequired(true)
                    .addChoices(
                        { name: `Sala 1`, value: '1201596901758341270' },
                        { name: `Sala 2`, value: '1201596869105692753' },
                        { name: `Sala 3`, value: '1206835449209946122' },
                        { name: `Sala 4`, value: '1206835482726502401' },
                    )
            )
            .addStringOption(option =>
                option.setName('state_raid')
                    .setDescription('Estado da Raid')
                    .setRequired(true)
                    .addChoices(
                        { name: `Vitória`, value: 'Vitória' },
                        { name: `Derrota`, value: 'Derrota' },
                    )
            )
            .addUserOption(option =>
                option.setName('leader')
                    .setDescription('Líder da Raid')
                    .setRequired(true)
            )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply({ ephemeral: true });

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

    if (userAccount.staff < 1) {
        return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Ajudante ou superior.` });
    }

    if (interaction.options.getSubcommand() === 'start') {
        const room = interaction.options.getString('room');
        const leader = interaction.options.getUser('leader');
        const member2 = interaction.options.getUser('member2');
        const member3 = interaction.options.getUser('member3');
        const isBijuu = interaction.options.getBoolean('bijuu');

        const leaderAccount = await userDB.findOne({ "id_dc": leader.id });

        if (leaderAccount.ficha1.ryou < 4000) {
            return await interaction.editReply({ content: `O líder da Raid, ${leader}, não tem ryou suficiente para iniciar uma.\n**Custo necessário:** 4.000 ryou.` });
        }
    
        const guild = client.guilds.cache.get("1164398692283990046");
        const role = guild.roles.cache.get(room);
        const members = [leader, member2, member3].filter(Boolean);
        await guild.members.fetch();
    
        let roleRaid = guild.roles.cache.get(role.id).members.map(m => m.user.id);

        if (roleRaid.size > 0) {
            return await interaction.editReply({ content: `A sala já está ocupada por uma raid em andamento. Por favor, escolha outra sala.` });
        }
    
        let member_power = null;
        let maxPontosTotais = -1;

        for (const member of members) {
            if (member) {
                const memberAccount = await userDB.findOne({ "id_dc": member.id });
                if (memberAccount.ficha1.level < 10) {
                    return await interaction.editReply({ content: `O jogador ${member} não pode participar da Raid porque não atingiu o nível mínimo 10.` });
                }

                if (memberAccount.ficha1.state !== "Livre") {
                    return await interaction.editReply({ content: `O jogador ${member} está ocupado em um evento e não poderá participar da Raid até que ela termine. Todos os outros jogadores selecionados continuam inalterados.` });
                }
            } else {
                return await interaction.editReply({ content: `O jogador ${member} não foi encontrado no servidor.` });
            }
        }

        for (const member of members) {
            if (member) {
                await userDB.updateOne({ "id_dc": member.id }, { "ficha1.state": "Raid" })
            }
        }

        for (const member of members) {
            if (member) {
                let memberDB = await userDB.findOne({ "id_dc": member.id });
        
                // Atualiza o membro mais forte com base em pontosTotais
                const pontosTotais = memberDB.ficha1.atb.pontosTotais;
                if (pontosTotais > maxPontosTotais) {
                    maxPontosTotais = pontosTotais;
                    member_power = member; // Atualiza o membro mais forte
                }
            } else {
                return await interaction.editReply({ content: `O jogador ${member} não foi encontrado no servidor.` });
            }
        }

        let npcPatente;
        // Após encontrar o membro mais forte (member_power), faça a verificação dos atributos dele
        if (member_power) {
            const memberPowerDB = await userDB.findOne({ "id_dc": member_power.id });

            // Verifica se o membro mais forte tem pelo menos 70 pontos em cada atributo
            const attributesBelow70 = ['n', 't', 'g', 'dt', 'dg', 'dn'].filter(attribute => 
                memberPowerDB.ficha1.atb[attribute] < 70
            );

            if (attributesBelow70.length > 0) {
                return await interaction.editReply({ content: `O membro mais forte, ${member_power}, deve ter pelo menos 70 pontos em cada atributo para iniciar a raid.` });
            }

            // Adiciona a patente do NPC
            const patenteType = memberPowerDB.ficha1.patenteType;
            const patenteNvl = memberPowerDB.ficha1.patenteNvl + 1;
            const patenteMap = {
                1: patenteType === 0 ? 'Genin' : 'Nukenin Rank D',
                2: patenteType === 0 ? 'Chuunin' : 'Nukenin Rank C',
                3: patenteType === 0 ? 'Jounin' : 'Nukenin Rank B',
                4: patenteType === 0 ? 'Jounin de Elite' : 'Nukenin Rank A',
                5: patenteType === 0 ? 'Jounin Hanchou' : 'Nukenin Rank S'
            };
            npcPatente = patenteMap[patenteNvl] || 'Desconhecida';

        } else {
            return await interaction.editReply({ content: `Não foi possível encontrar o membro mais forte.` });
        }

        let targetAccount = await userDB.findOne({ "id_dc": member_power.id });

        const clansdb = await clanDB.find({}, { projection: { nome: 1, _id: 0 } }).toArray();
        const clans = clansdb.map(clan => clan.nome);        
        const elements = ['Estilo Vento', 'Estilo Fogo', 'Estilo Água', 'Estilo Terra', 'Estilo Raio'];

        const selectedClan = clans[randomInt(clans.length)];
        const selectedElements = [];
        for (let i = 0; i < 3; i++) {
            const index = randomInt(elements.length);
            selectedElements.push(elements[index]);
            elements.splice(index, 1);
        }    

        const percentageIncrease = isBijuu ? 100 : randomInt(40,71);

        const attributes = ['energia', 'ck', 'hp', 'n', 't', 'g', 'dt', 'dg', 'dn'];
        let npc = {};
        attributes.forEach(attribute => {
            npc[attribute] = Math.round(targetAccount.ficha1.atb[attribute] + targetAccount.ficha1.atb[attribute] * percentageIncrease / 100);
            npc[attribute + 'Temp'] = Math.round(targetAccount.ficha1.atb[attribute + 'Temp'] + targetAccount.ficha1.atb[attribute + 'Temp'] * percentageIncrease / 100);
        });

        let talentosString = "# Talentos Ninja do NPC\n";
        if (targetAccount.ficha1.talentos) {
            const talentos = targetAccount.ficha1.talentos;
            if (Object.keys(talentos).length === 0) {
                talentosString += "> Nenhum\n";
            } else {
                for (let talento in talentos) {
                    if (talentos.hasOwnProperty(talento)) {
                        talentosString += `> **${talentos[talento].name}:** ${talentos[talento].n === 4 ? talentos[talento].n : talentos[talento].n + 1}/4\n`;
                    }
                }
            }
        }
        else {
            talentosString += "> Nenhum\n";
        }

        const objRoomsRoleRaid = {
            "1168340876418883694": "1201596901758341270",
            "1168340971533115442": "1201596869105692753",
            "1206835828270043137": "1206835449209946122",
            "1206835880841580564": "1206835482726502401"
        }

        // Sorteia a ordem dos membros se houver mais de um
        let turnOrder = [];
        if (members.length > 1) {
            turnOrder = [...members];
            turnOrder = turnOrder.sort(() => Math.random() - 0.5); // Embaralha a ordem
        } else {
            turnOrder = members;
        }
        // Adiciona o NPC ao final da ordem
        turnOrder.push('NPC');

        // Constrói a string da ordem dos turnos
        const turnOrderString = `# Ordem dos Turnos\n${turnOrder.map((member, index) => member === 'NPC' ? `**NPC**` : `**Turno ${index + 1}:** <@${member.id}>`).join('\n')}`;

        const channel = client.channels.cache.get(objRoomsRoleRaid[room]);
        await channel.send({ content: `A Raid foi iniciada pelo STAFF <@${interaction.user.id}>, preparem-se e boa sorte!\n\n||@everyone @here||` });
        await channel.send({ content: `# Raid iniciada!
**Clã:** ${selectedClan}
**Patente do NPC:** ${npcPatente}
**Elementos:** ${selectedElements.join(' - ')}
${talentosString}
# Atributos do NPC:
- **🫀 HP:** ${npc.hp}/${npc.hp}
- **🔷 Chakra:** ${npc.ck}/${npc.ck}
- **⚡ Energia:** ${npc.energia}/${npc.energia}

- **🔵 Ninjutsu:** ${npc.n}/${npc.n}
- **🧠 Genjutsu:** ${npc.g}/${npc.g}
- **🦾 Taijutsu:** ${npc.t}/${npc.t}

- **🛡️ Defesa Ninjutsu:** ${npc.dn}/${npc.dn}
- **🛡️ Defesa Genjutsu:** ${npc.dg}/${npc.dg}
- **🛡️ Defesa Taijutsu:** ${npc.dt}/${npc.dt}

## Todos os atributos do NPC foram baseados no membro mais forte, <@${targetAccount.id_dc}>, e aumentados em **+${percentageIncrease}%** que varia entre **40% ~ 70%**, exceto Bijuu que sempre é **+100%**.

${turnOrderString}` });
    
        // Atualiza ficha1.leaderRaid para o líder da raid
        await userDB.updateOne(
            { "id_dc": leader.id },
            { $inc: { "ficha1.ryou": -4000 }, $set: { "ficha1.leaderRaid": true } }
        );
    
        await interaction.editReply({ content: `Raid iniciada com sucesso na sala <#${objRoomsRoleRaid[room]}>.` });
    }

    else if (interaction.options.getSubcommand() === 'finish') {
        const objRoleRoomsRaid = {
            "1201596901758341270": "1168340876418883694",
            "1201596869105692753": "1168340971533115442",
            "1206835449209946122": "1206835828270043137",
            "1206835482726502401": "1206835880841580564"
        }
    
        const guild = await client.guilds.cache.get("1164398692283990046");
        const room = interaction.options.getString('room');
        const stateRaid = interaction.options.getString('state_raid');
        const channel = guild.channels.cache.get(room);
        const roleRaidId = objRoleRoomsRaid[room];
        const roleBlockRaid = "1206753515649769574";
        await guild.members.fetch();
    
        let roleRaid = await guild.roles.cache.get(roleRaidId).members.map(m => m.user.id);
    
        if (roleRaid.size === 0) {
            return interaction.editReply('Não há membros com este cargo no servidor.');
        }
    
        // Envia a mensagem de raid encerrada para cada membro na DM
        const members = guild.members.cache.filter(member => member.roles.cache.has(roleRaidId));
        for (const member of members.values()) {
            await member.send(`A Raid foi encerrada pelo STAFF <@${interaction.user.id}>. Você foi removido da sala e bloqueado de futuras raids até o próximo domingo.`);
        }
    
        // Remove o cargo de todos os membros da sala e atualiza o banco de dados
        for (const member of members.values()) {
            await member.roles.remove(roleRaidId);
            await member.roles.add(roleBlockRaid);
            await userDB.updateOne(
                { "id_dc": member.id },
                { $set: { "ficha1.state": "Livre", "ficha1.blockRaid": true }, $unset: { "ficha1.leaderRaid": "" } }
            );
        }
    
        async function deleteAllMessages(channel) {
            let fetched;
            do {
                fetched = await channel.messages.fetch({ limit: 100 });
                if (fetched.size > 0) {
                    await channel.bulkDelete(fetched);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } while (fetched.size >= 1);
        }
    
        await deleteAllMessages(channel);
    
        if (stateRaid === 'Vitória') {
            // Recompensas para vitória
            const leader = interaction.options.getUser('leader')
            const leaderDB = await userDB.findOne({ "id_dc": leader.id });
            await userDB.updateOne(
                { "id_dc": leader.id },
                { 
                    $inc: { "ficha1.atb.pontosLivres": 15 },
                    $unset: { "ficha1.leaderRaid": "" }
                }
            );

            await updateLevel(leaderDB, 1000);
    
            for (const memberId of roleRaid) {
                if (memberId !== leader.id) {
                    await userDB.updateOne(
                        { "id_dc": memberId },
                        { 
                            $inc: { "ficha1.atb.pontosLivres": 25, "ficha1.ryou": 1000 },
                            $set: { "ficha1.state": "Livre", "ficha1.blockRaid": true },
                        }
                    );

                    await updateLevel(await userDB.findOne({ "id_dc": memberId }), 2500);
                }
            }
    
            await channel.send({ content: `A Raid foi concluída com vitória! Parabéns a todos os participantes!` });
        }
    
        await interaction.editReply({ content: `A Raid foi encerrada pelo STAFF <@${interaction.user.id}>. Todos os membros da sala foram removidos e o líder, se presente, foi bloqueado de Raids até o próximo domingo.` });
    }    
}