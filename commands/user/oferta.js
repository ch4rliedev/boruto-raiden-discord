import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ofertas')
    .setDescription('Aceita ou recusa uma oferta enviada por outro jogador.')

    .addStringOption(option =>
      option.setName('escolha')
        .setDescription('Você quer aceitar ou recusar uma oferta?')
        .setRequired(true)
        .addChoices(
          { name: `Aceitar`, value: 'ac' },
          { name: 'Recusar', value: 'rc' })
    )

    .addNumberOption(option =>
      option.setName('slot')
        .setDescription('Qual slot você quer aceitar/recusar entre 1 e 5?')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
  await interaction.deferReply({ ephemeral: true })

  if (userAccount.ficha1.state !== "Livre") return await interaction.editReply({ content: `Você está no evento **"${userAccount.ficha1.state}"**, aguarde a conclusão em **${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.**` });

  if (userAccount.ficha1.trades.limit === 5) return await interaction.editReply({ content: `Você atingiu o limite mensal de 5 negociações, aguarde o próximo dia 1.` });

  const choice = interaction.options.getString('escolha')
  const slotNumber = interaction.options.getNumber('slot')
  const trade = userAccount.ficha1.trades[`trade${slotNumber}`];

  if (trade.nomeItem === "Vazio") {
    await interaction.editReply({ content: `Não há ofertas registradas para este trade.`});
    return;
  }

  const targetAccount = await userDB.findOne({ "id_dc": trade.id_dc });
  if (targetAccount.ficha1.trades.limit === 5) return await interaction.editReply({ content: `O jogador <@${targetAccount}> atingiu o limite mensal de negociações dele, aguardem o próximo dia 1.` });

  if (choice === "ac") {
    if (trade.custo > userAccount.ficha1.ryou) {
      await interaction.editReply({ content:  `Você não tem ryou suficiente para aceitar esta oferta.`});
      return;
    }

    const targetAccount = await userDB.findOne({"id_dc": trade.id_dc });
    if (!targetAccount.ficha1?.active) {
      await userDB.updateOne({ "id_dc": interaction.user.id }, {
        $set: {
          [`ficha1.trades.trade.trade${slotNumber}.nomeItem`]: "Vazio",
          [`ficha1.trades.trade.trade${slotNumber}.nomeJogador`]: "Ninguém",
          [`ficha1.trades.trade.trade${slotNumber}.nomePersonagem`]: "Ninguém",
          [`ficha1.trades.trade.trade${slotNumber}.quantia`]: 0,
          [`ficha1.trades.trade.trade${slotNumber}.custo`]: 0,
          [`ficha1.trades.trade.trade${slotNumber}.id_dc`]: "0"
        }
      });
      return await interaction.editReply({ content:  `O jogador da trade não possui mais um personagem.`});
    }
    
    let itemRecebido = false;
    if (targetAccount.ficha1.inventario[`slot${trade.slot}`].nome === trade.nomeItem && targetAccount.ficha1.inventario[`slot${trade.slot}`].quantia >= trade.quantia) {
      const inventorySlots = Object.keys(userAccount.ficha1.inventario)
      for (let i = 1; i <= inventorySlots.length; i++) {
        let slotName = `slot${i}`;
        if (userAccount.ficha1.inventario[slotName].nome === trade.nomeItem) {
          await interaction.editReply({ content: `Oferta aceita com sucesso! ✅ \n**"${trade.nomeItem}" x${trade.quantia}** foi adicionado ao seu inventário pelo custo de **${trade.custo} ryou** comprado do jogador <@${trade.id_dc}>. `});

          await client.users.send(targetAccount.id_dc, `Sua oferta **"${trade.nomeItem}"** pelo valor de **${trade.custo} ryou** foi aceita pelo jogador <@${userAccount.id_dc}> com sucesso! ✅`)

          if (trade.quantia === targetAccount.ficha1.inventario[`slot${trade.slot}`].quantia) {
            await userDB.updateOne({ "id_dc": trade.id_dc }, {
              $set: {
                [`ficha1.inventario.slot${trade.slot}.nome`]: "Vazio",
                [`ficha1.inventario.slot${trade.slot}.quantia`]: 0
              },
              $inc: {
                "ficha1.ryou": trade.custo,
                'ficha1.trades.limit': 1,
              }
            });
          }
          else if (trade.quantia < targetAccount.ficha1.inventario[`slot${trade.slot}`].quantia) {
            await userDB.updateOne({ "id_dc": trade.id_dc }, {
              $inc: {
                "ficha1.ryou": +trade.custo,
                [`ficha1.inventario.slot${trade.slot}.quantia`]: -trade.quantia,
                "ficha1.trades.limit": 1
              }
            });
          }
  
          await userDB.updateOne({ "id_dc": interaction.user.id }, {
            $inc: {
              "ficha1.ryou": -trade.custo,
              [`ficha1.inventario.${slotName}.quantia`]: +trade.quantia,
              "ficha1.trades.limit": 1
            },
            $set: {
              [`ficha1.trades.trade${slotNumber}.nomeItem`]: "Vazio",
              [`ficha1.trades.trade${slotNumber}.nomeJogador`]: "Ninguém",
              [`ficha1.trades.trade${slotNumber}.nomePersonagem`]: "Ninguém",
              [`ficha1.trades.trade${slotNumber}.quantia`]: 0,
              [`ficha1.trades.trade${slotNumber}.custo`]: 0,
              [`ficha1.trades.trade${slotNumber}.slot`]: 0,
              [`ficha1.trades.trade${slotNumber}.id_dc`]: "0",
              [`ficha1.inventario.${slotName}.zeroValueSale`]: true
            },
          });
  
          itemRecebido = true;
          break;
        }
      }

    } 

    if (!itemRecebido) {
      if (targetAccount.ficha1.inventario[`slot${trade.slot}`].nome === trade.nomeItem && targetAccount.ficha1.inventario[`slot${trade.slot}`].quantia >= trade.quantia) {
        const inventorySlots = Object.keys(userAccount.ficha1.inventario)
        for (let i = 1; i <= inventorySlots.length; i++) {
          let slotName = `slot${i}`;
          if (userAccount.ficha1.inventario[slotName].nome === "Vazio") {
            await interaction.editReply({ content: `Oferta aceita com sucesso! ✅ \n**"${trade.nomeItem}" x${trade.quantia}** foi adicionado ao seu inventário pelo custo de **${trade.custo} ryou** comprado do jogador **<@${trade.id_dc}>**. `});

            await client.users.send(targetAccount.id_dc, `Sua oferta **"${trade.nomeItem}"** pelo valor de **${trade.custo} ryou** foi aceita pelo jogador **<@${userAccount.id_dc}>** com sucesso! ✅`)

            if (trade.quantia === targetAccount.ficha1.inventario[`slot${trade.slot}`].quantia) {
              await userDB.updateOne({ "id_dc": trade.id_dc }, {
                $set: {
                  [`ficha1.inventario.slot${trade.slot}.nome`]: "Vazio",
                  [`ficha1.inventario.slot${trade.slot}.quantia`]: 0,
                },
                $inc: {
                  "ficha1.ryou": trade.custo,
                  "ficha1.trades.limit": 1,
                }
              });
            }
            else if (trade.quantia < targetAccount.ficha1.inventario[`slot${trade.slot}`].quantia) {
              await userDB.updateOne({ "id_dc": trade.id_dc }, {
                $inc: {
                  "ficha1.ryou": +trade.custo,
                  [`ficha1.inventario.slot${trade.slot}.quantia`]: -trade.quantia,
                  "ficha1.trades.limit": 1,
                }
              });
            }
    
            await userDB.updateOne({ "id_dc": interaction.user.id }, {
              $inc: {
                "ficha1.ryou": -trade.custo,
                [`ficha1.inventario.${slotName}.quantia`]: +trade.quantia,
                "ficha1.trades.limit": 1,
              },
              $set: {
                [`ficha1.inventario.${slotName}.nome`]: trade.nomeItem,
                [`ficha1.trades.trade${slotNumber}.nomeItem`]: "Vazio",
                [`ficha1.trades.trade${slotNumber}.nomeJogador`]: "Ninguém",
                [`ficha1.trades.trade${slotNumber}.nomePersonagem`]: "Ninguém",
                [`ficha1.trades.trade${slotNumber}.quantia`]: 0,
                [`ficha1.trades.trade${slotNumber}.custo`]: 0,
                [`ficha1.trades.trade${slotNumber}.slot`]: 0,
                [`ficha1.trades.trade${slotNumber}.id_dc`]: "0",
                [`ficha1.inventario.${slotName}.zeroValueSale`]: true
              },
            });
    
            itemRecebido = true;
            break;
          }
        }
      }
    }

    if (!itemRecebido) {
      await interaction.editReply({ content: `Não foi possível concluir a negociação porque não há espaço livre no seu inventário ou o item não está mais acessível com o jogador <@${trade.id_dc}> **(a oferta não está mais está disponível)**.`});

      await client.users.send(targetAccount.id_dc, `Sua oferta **"${trade.nomeItem}"** pelo valor de **${trade.custo} ryou** foi cancelada porque o jogador <@${userAccount.id_dc}> não tem espaço no inventário ou o item não está mais acessível à você.`)

      await userDB.updateOne({ "id_dc": interaction.user.id }, {
        $set: {
          [`ficha1.trades.trade${slotNumber}.nomeItem`]: "Vazio",
          [`ficha1.trades.trade${slotNumber}.nomeJogador`]: "Ninguém",
          [`ficha1.trades.trade${slotNumber}.nomePersonagem`]: "Ninguém",
          [`ficha1.trades.trade${slotNumber}.quantia`]: 0,
          [`ficha1.trades.trade${slotNumber}.custo`]: 0,
          [`ficha1.trades.trade${slotNumber}.slot`]: 0,
          [`ficha1.trades.trade${slotNumber}.id_dc`]: "0"
        }
      });
    }
  }

  if (choice === "rc") {
    const targetAccount = await userDB.findOne({"id_dc": trade.id_dc });
    if (!targetAccount.ficha1?.active) {
      await userDB.updateOne({ "id_dc": interaction.user.id }, {
        $set: {
          [`ficha1.trades.trade${slotNumber}.nomeItem`]: "Vazio",
          [`ficha1.trades.trade${slotNumber}.nomeJogador`]: "Ninguém",
          [`ficha1.trades.trade${slotNumber}.nomePersonagem`]: "Ninguém",
          [`ficha1.trades.trade${slotNumber}.quantia`]: 0,
          [`ficha1.trades.trade${slotNumber}.custo`]: 0,
          [`ficha1.trades.trade${slotNumber}.slot`]: 0,
          [`ficha1.trades.trade${slotNumber}.id_dc`]: "0"
        }
      });
      return await interaction.editReply({ content:  `O jogador da trade não possui mais um personagem.`});
    }

    await interaction.editReply({ content: `Oferta recusada com sucesso.`});

    await client.users.send(targetAccount.id_dc, `Sua oferta **"${trade.nomeItem}"** pelo valor de **${trade.custo} ryou** foi recusada pelo jogador <@${userAccount.id_dc}>.`)

    await userDB.updateOne({ "id_dc": interaction.user.id }, {
      $set: {
        [`ficha1.trades.trade${slotNumber}.nomeItem`]: "Vazio",
        [`ficha1.trades.trade${slotNumber}.nomeJogador`]: "Ninguém",
        [`ficha1.trades.trade${slotNumber}.nomePersonagem`]: "Ninguém",
        [`ficha1.trades.trade${slotNumber}.quantia`]: 0,
        [`ficha1.trades.trade${slotNumber}.custo`]: 0,
        [`ficha1.trades.trade${slotNumber}.slot`]: 0,
        [`ficha1.trades.trade${slotNumber}.id_dc`]: "0"
      }
    });
  }
}