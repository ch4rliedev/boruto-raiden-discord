import { SlashCommandBuilder } from 'discord.js';
import { jutsuDB } from '../../mongodb.js';

export const data = new SlashCommandBuilder()
    .setName('pp')
    .setDescription('Exibe os dados de um personagem.')

    .addSubcommand(subcommand => //principal
    subcommand
      .setName('principal')
      .setDescription('Exibe os dados principais do personagem.')

      .addStringOption(option =>
        option.setName('personagem_selecionado')
            .setDescription('Qual personagem deseja visualizar os dados? O padrão é "Personagem Principal"')
            .addChoices(
                { name: `Personagem Principal`, value: 'normal' },
                { name: `Invocação [S1]`, value: 'invs1' },
                { name: 'Invocação [S2]', value: 'invs2' },
                { name: 'Invocação [S3]', value: 'invs3' })
      )

    .addUserOption(option =>
      option.setName('outro_jogador')
        .setDescription('[OPCIONAL] Deseja ver os dados de outro personagem?')
        .setRequired(false)
    )
    )

    .addSubcommand(subcommand => //jutsus
    subcommand
      .setName('jutsus')
      .setDescription('Exibe os jutsus de um personagem.')

      .addUserOption(option =>
        option.setName('outro_jogador')
          .setDescription('[OPCIONAL] Deseja ver os jutsus de outro personagem?')
          .setRequired(false)
      )
    )

    .addSubcommand(subcommand => //talentos
    subcommand
      .setName('talentos')
      .setDescription('Exibe os talentos ninja de um personagem.')

      .addUserOption(option =>
        option.setName('outro_jogador')
          .setDescription('[OPCIONAL] Deseja ver os talentos de outro personagem?')
          .setRequired(false)
      )
    )

    .addSubcommand(subcommand => //trades
    subcommand
      .setName('trades')
      .setDescription('Exibe os trades de um personagem.')

      .addUserOption(option =>
        option.setName('outro_jogador')
          .setDescription('[OPCIONAL] Deseja ver os trades de outro personagem?')
          .setRequired(false)
      )
    )

    .addSubcommand(subcommand => //extras
    subcommand
      .setName('extras')
      .setDescription('Exibe as informações extras de um personagem.')

      .addUserOption(option =>
        option.setName('outro_jogador')
          .setDescription('[OPCIONAL] Deseja ver os extras de outro personagem?')
          .setRequired(false)
      )
    )

    .setContexts(0)

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply({ ephemeral: true })
    const typeCommand = interaction.options.getSubcommand();
    let targetAccount = interaction.options.getUser('outro_jogador')

    if (targetAccount && targetAccount.id !== userAccount?.id_dc) {
        if (userAccount.staff >= 1) {
            let targetAccountDB = await userDB.findOne({"id_dc": targetAccount.id})
            if (!targetAccountDB?.ficha1?.active) return await interaction.editReply({ content: `**<@${targetAccount.id}>** não é um alvo válido ou ele não possuí um personagem ativo.`});
            userAccount = targetAccountDB
        }
        else {
            return await interaction.editReply(`Você não tem permissão de usar esse comando, apenas S1 ou superior.`)
        }
    }

    if (typeCommand === "principal") {
        const characterSelected = interaction.options.getString('personagem_selecionado') ? interaction.options.getString('personagem_selecionado') : 'normal';
        const characterType = characterSelected.slice(0, -1);
        const characterSlot = characterSelected.slice(-1);

        let mochilaContent = '';
        const inventorySlots = Object.keys(userAccount.ficha1.inventario)
        for (let i = 1; i <= inventorySlots.length; i++) {
          const slot = userAccount.ficha1.inventario[`slot${i}`];
          if (slot) {
            mochilaContent += `> S${i}: ${slot.nome} (x${slot.quantia})\n`;
          }
        }

        const ppNinja = `> **- 📜 ID Ninja:** ${userAccount.ficha1.idNinja}
> **- ✏️ Nome:** ${userAccount.ficha1.name}
> **- 🚻 Sexo:** ${userAccount.ficha1.gender}
> **- ⬆️ Nível:** ${userAccount.ficha1.level} (${userAccount.ficha1.xpCurrent}/${userAccount.ficha1.xpNextFix})
> **- ❤️‍🔥 Status:** ${userAccount.ficha1.state} ${userAccount.ficha1.tempo.finish > new Date() ? `**(Fim: ${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR')})**` : ""}

> **- 🧭 Local:** ${userAccount.ficha1.local}
> **- 🀄 Clã:** ${userAccount.ficha1.cla}
> **- 📆 Idade:** ${userAccount.ficha1.age}

> **- 📚 PJ:** ${userAccount.ficha1.pointsJutsus}/6
> **- 🎯 MS:** ${userAccount.ficha1.ms.state ? "✅" : "❌"}
> **- 🏋️ TD:** ${userAccount.ficha1.td ? "✅" : "❌"}
> **- 🏃‍♂️ TS:** ${userAccount.ficha1.ts ? "✅" : "❌"}
> **- 🤸‍♂️ TQ:** ${userAccount.ficha1.tq ? "✅" : "❌"}
> **- 💪 TM:** ${userAccount.ficha1.tm ? "✅" : "❌"}
> **- 📚 TC:** ${userAccount.ficha1.tc.state ? "✅" : "❌"}

> **- 🧬 KKG:** ${userAccount.ficha1.kkg || "Nenhuma"}

> **- 🔱 Modos:**
>   Oito Portões: ${userAccount.ficha1.modos?.oito_p ?? 0}/8
>   Modo Biju: ${userAccount.ficha1.modos?.biju ?? 0}/4
>   Modo Eremita: ${userAccount.ficha1.modos?.eremita ?? 0}/2
>   Karma: ${userAccount.ficha1.modos?.karma ?? 0}/5

> **- 👁️ Doujutsus (Nível):**
>   Byakugan: ${userAccount.ficha1.doujutsus.byakugan}
>   Sharingan: ${userAccount.ficha1.doujutsus.sharingan}
>   Ketsuryugan: ${userAccount.ficha1.doujutsus.ketsuryuugan}
>   Tenseigan: ${userAccount.ficha1.doujutsus.tenseigan}
>   Rinnegan: ${userAccount.ficha1.doujutsus.rinnegan}

> **- 🩸 TS:** ${userAccount.ficha1.bloodType}
> **- Invocações:**
>   🦁 S1: ${userAccount.ficha1.invs.slot1.nome}
>   🐯 S2: ${userAccount.ficha1.invs.slot2.nome}

> **- 🌀 Elementos:** ${userAccount.ficha1.elementos}
> **- 🌍 Vila:** ${userAccount.ficha1.vila}

> **- Atributos**
>   🫀 HP: ${userAccount.ficha1.atb.hpTemp}/${userAccount.ficha1.atb.hp}
>   🔷 CK: ${userAccount.ficha1.atb.ckTemp}/${userAccount.ficha1.atb.ck}
>   ⚡ Energia: ${userAccount.ficha1.atb.energiaTemp}/${userAccount.ficha1.atb.energia}

>   🔵 N: ${userAccount.ficha1.atb.nTemp}/${userAccount.ficha1.atb.n}
>   🧠 G: ${userAccount.ficha1.atb.gTemp}/${userAccount.ficha1.atb.g}
>   🦾 T: ${userAccount.ficha1.atb.tTemp}/${userAccount.ficha1.atb.t}

>   🛡️ DN: ${userAccount.ficha1.atb.dnTemp}/${userAccount.ficha1.atb.dn}
>   🛡️ DG: ${userAccount.ficha1.atb.dgTemp}/${userAccount.ficha1.atb.dg}
>   🛡️ DT: ${userAccount.ficha1.atb.dtTemp}/${userAccount.ficha1.atb.dt}

>   🔥 DC: ${userAccount.ficha1.atb.dcTemp}/${userAccount.ficha1.atb.dc}
>   🔥 DR: ${userAccount.ficha1.atb.drTemp}/${userAccount.ficha1.atb.dr}
>   🔥 MU: ${userAccount.ficha1.atb.muTemp}/${userAccount.ficha1.atb.mu}

> **- 🌳 PTN Livres (${userAccount.ficha1.atb.ptnTotal}/20):** ${userAccount.ficha1.atb.ptn}
> **- 🆓 Pontos Livres:** ${userAccount.ficha1.atb.pontosLivres}
> **- 🔥 Pontos Totais:** ${userAccount.ficha1.atb.pontosTotais} (Sem bônus: ${userAccount.ficha1.atb.pontosTotaisSemBonus})

> **- 💰 Ryou:** ${userAccount.ficha1.ryou.toLocaleString('pt-BR')}
> **- 🎖️ Patente:** ${userAccount.ficha1.patente}

> **- 🎒 Mochila**\n${mochilaContent}

> **- 🎯 Total de Missões:**
>   Rank D: ${userAccount.ficha1.stacs.missions.d}
>   Rank C: ${userAccount.ficha1.stacs.missions.c}
>   Rank B: ${userAccount.ficha1.stacs.missions.b}
>   Rank A: ${userAccount.ficha1.stacs.missions.a}
>   Rank S: ${userAccount.ficha1.stacs.missions.s}

> **- 🏋️ Total de Treinos:**
>   Diário: ${userAccount.ficha1.stacs.td}
>   Semanal: ${userAccount.ficha1.stacs.ts}
>   Quinzenal: ${userAccount.ficha1.stacs.tq}
>   Mensal: ${userAccount.ficha1.stacs.tm}
>   Chakra: ${userAccount.ficha1.stacs.tc}/4`
        
        if (characterSelected === "normal") {
            await interaction.editReply({ content: ppNinja }); 
        }
        else {
            if (userAccount.ficha1[characterType][`slot${characterSlot}`].nome === "Vazio") return await interaction.editReply({ content: `Você não possui um personagem "${characterType}" no S${characterSlot}. Use **/pp** e verifique.` }); 
            const ppOther = `> **- ✏️ Nome:** ${userAccount.ficha1[characterType][`slot${characterSlot}`].nome}
            
> **- Atributos**
>   🔵 Ninjutsu: ${userAccount.ficha1[characterType][`slot${characterSlot}`].nTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].n}
>   🧠 Genjutsu: ${userAccount.ficha1[characterType][`slot${characterSlot}`].gTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].g}
>   🦾 Taijutsu: ${userAccount.ficha1[characterType][`slot${characterSlot}`].tTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].t}

>   🛡️ Defesa Ninjutsu: ${userAccount.ficha1[characterType][`slot${characterSlot}`].dnTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].dn}
>   🛡️ Defesa Genjutsu: ${userAccount.ficha1[characterType][`slot${characterSlot}`].dgTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].dg}
>   🛡️ Defesa Taijutsu: ${userAccount.ficha1[characterType][`slot${characterSlot}`].dtTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].dt}

>   🫀 HP: ${userAccount.ficha1[characterType][`slot${characterSlot}`].hpTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].hp}
>   🔷 Chakra: ${userAccount.ficha1[characterType][`slot${characterSlot}`].ckTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].ck}
>   ⚡ Energia: ${userAccount.ficha1[characterType][`slot${characterSlot}`].energiaTemp}/${userAccount.ficha1[characterType][`slot${characterSlot}`].energia}`
        await interaction.editReply({ content: ppOther }); 
        }
    }

    if (typeCommand === "jutsus") {
      let jutsusList = `**Jutsus do ${userAccount.ficha1.name}**\n\n`;
      
      if (userAccount.ficha1.jutsus.length === 0) {
        jutsusList += 'Nenhum jutsu treinado.';
        return await interaction.editReply({ content: jutsusList });
      } 
      else {
        const jutsuIds = userAccount.ficha1.jutsus;
        const lastJutsuId = Number(jutsuIds [jutsuIds.length - 1]);
        let messageToSend = '';
        
        for (let i = 0; i < jutsuIds.length; i++) {
          const jutsuId = Number(jutsuIds[i]);
          const jutsuDesc = await jutsuDB.findOne({ idJutsu: jutsuId });
      
          let tempMessage = `**• Nome:** ${jutsuDesc.nome} **(${jutsuDesc.rank})**\n`;
          tempMessage += `**• ID:** ${jutsuId}\n`;
          tempMessage += `**• Desc:** ${jutsuDesc.desc}\n\n`;
          
          if ((messageToSend + tempMessage).length > 2000) {
            await interaction.followUp({ content: messageToSend, ephemeral: true });
            messageToSend = '';
          }

          messageToSend += tempMessage;

          if (jutsuId === lastJutsuId) {
            await interaction.followUp({ content: messageToSend, ephemeral: true });
          }
        }
      }
    }

    if (typeCommand === "talentos") {
        function criarCampoTalentos(talentosObj) {
            const maxNivel = 4; // Nível máximo padrão dos talentos
            const talentos = Object.keys(talentosObj);
          
            if (talentos.length === 0) {
              return "> » Nenhum";
            } else {
              const talentosTexto = talentos
                .map((talento) => {
                  const nome = talentosObj[talento].name;
                  const nivel = talentosObj[talento].n || 1; // Caso o nível não esteja definido, usa 1 como padrão
                  return `> » ${nome} **(Nível ${nivel}/${maxNivel})**`;
                })
                .join("\n");
          
              return talentosTexto;
            }
        }
        const talentosObj = userAccount.ficha1.talentos || {};
        const talentosString = criarCampoTalentos(talentosObj);
        const talentsList = `**Talentos Ninja do ${userAccount.ficha1.name}**\n\n${talentosString}`
    
        await interaction.editReply({ content: talentsList }); 
    }

    if (typeCommand === "trades") {
        const ppTrades = `**Trades do ${userAccount.ficha1.name}**

> **🤝 1º Oferta**
>   • Nome do item: ${userAccount.ficha1.trades.trade1.nomeItem}
>   • Nome do jogador: ${userAccount.ficha1.trades.trade1.nomeJogador}
>   • Nome do personagem: ${userAccount.ficha1.trades.trade1.nomePersonagem}
>   • Quantidade: ${userAccount.ficha1.trades.trade1.quantia}
>   • Custo: ${userAccount.ficha1.trades.trade1.custo}

> **🤝 2º Oferta**
>   • Nome do item: ${userAccount.ficha1.trades.trade2.nomeItem}
>   • Nome do jogador: ${userAccount.ficha1.trades.trade2.nomeJogador}
>   • Nome do personagem: ${userAccount.ficha1.trades.trade2.nomePersonagem}
>   • Quantidade: ${userAccount.ficha1.trades.trade2.quantia}
>   • Custo: ${userAccount.ficha1.trades.trade2.custo}

> **🤝 3º Oferta:**
>   • Nome do item: ${userAccount.ficha1.trades.trade3.nomeItem}
>   • Nome do jogador: ${userAccount.ficha1.trades.trade3.nomeJogador}
>   • Nome do personagem: ${userAccount.ficha1.trades.trade3.nomePersonagem}
>   • Quantidade: ${userAccount.ficha1.trades.trade3.quantia}
>   • Custo: ${userAccount.ficha1.trades.trade3.custo}`
    
        await interaction.editReply({ content: ppTrades }); 
    }

    if (typeCommand === "extras") {  
      await interaction.editReply({ content: `Informações Extras: ${userAccount.ficha1.extras}` }); 
  }
}