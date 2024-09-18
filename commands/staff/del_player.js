import { SlashCommandBuilder } from 'discord.js';
import { itemDB, jutsuDB, invDB } from '../../mongodb.js';	

export const data = new SlashCommandBuilder()
    .setName('del_player')
    .setDescription('Deleta características do personagem.')
    
    .addSubcommand(subcommand => //Deletar item
        subcommand
          .setName('item')
          .setDescription('Deletar um item de um personagem.')

            .addUserOption(option =>
            option.setName('target')
                .setDescription('Qual jogador será afetado?')
                .setRequired(true)
            )   
  
          .addNumberOption(option =>
            option.setName('id_del')
              .setDescription('Qual o ID do item que deseja deletar do inventário do personagem?')
              .setRequired(true)
          )

          .addNumberOption(option =>
            option.setName('amount')
              .setDescription('Qual a quantia do item deseja excluir?')
              .setRequired(true)
              .setMinValue(1)
          )
  
          .addStringOption(option =>
              option.setName('reason')
                .setDescription('Qual o motivo dessa ação?')
                .setRequired(true)
          )
    )

    .addSubcommand(subcommand => //Deletar jutsu
      subcommand
        .setName('jutsu')
        .setDescription('Deletar um jutsu de um personagem.')

        .addUserOption(option =>
            option.setName('target')
              .setDescription('Qual jogador será afetado?')
              .setRequired(true)
        )

        .addNumberOption(option =>
          option.setName('id_del')
            .setDescription('Qual o ID do jutsu que deseja deletar do personagem?')
            .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('reason')
              .setDescription('Qual o motivo dessa ação?')
              .setRequired(true)
          )
    )

    .addSubcommand(subcommand => //Deletar invocação
        subcommand
          .setName('invs')
          .setDescription('Deletar uma invocação do personagem.')

            .addUserOption(option =>
            option.setName('target')
                .setDescription('Qual jogador será afetado?')
                .setRequired(true)
            )
  
          .addNumberOption(option =>
            option.setName('id_del')
              .setDescription('Qual o ID da invocação que deseja deletar do personagem?')
              .setRequired(true)
          )
  
          .addStringOption(option =>
              option.setName('reason')
                .setDescription('Qual o motivo dessa ação?')
                .setRequired(true)
            )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
  await interaction.deferReply()
  if (userAccount.staff < 3) return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Administrador ou superior.` });

  const typeGive = interaction.options.getSubcommand();
  const idDel = interaction.options.getNumber('id_del')
  const reason = interaction.options.getString('reason')
  const target = interaction.options.getUser('target')
  const targetAccount = await userDB.findOne({ "id_dc": target.id });
  if (!targetAccount.ficha1?.active) return await interaction.editReply({ content: `**${target}** não é um alvo válido ou ele não possuí uma conta/personagem.`, ephemeral: true});
  
  if (typeGive === "item") {
    const item = await itemDB.findOne({ idItem: idDel });
    if (!item) return await interaction.editReply({ content: `O item com o **ID ${idDel}** não existe.` });
    let amount = interaction.options.getNumber('amount')
    
    let checkItem;
    let update = {};
    const inventorySlots = Object.keys(targetAccount.ficha1.inventario)

    for (let i = 1; i <= inventorySlots.length; i++) {
      const slot = targetAccount.ficha1.inventario[`slot${i}`];
      if (slot.nome === item.nome) {
        amount = slot.quantia < amount ? slot.quantia : amount
        if (slot.quantia - amount === 0) {
          update[`ficha1.inventario.slot${i}.nome`] = "Vazio";
        }
        update[`ficha1.inventario.slot${i}.quantia`] = slot.quantia - amount;
        update['ficha1.ryou'] = targetAccount.ficha1.ryou + item.custo;
        checkItem = true;
        break;
      } 
    }        
  
    if (checkItem) {
      await userDB.updateOne(
        { id_dc: target.id },
        { $set: update }
      );
  
      await client.users.send(target.id, { content: `O STAFF <@${userAccount.id_dc}> deletou o item **${item.nome} x${amount}** do seu inventário pela razão:\n\n${reason}`});
  
      await interaction.editReply({ content: `O item **${item.nome} x${amount}** foi removido do jogador ${target}.` });
    } else {
      return await interaction.editReply({ content: `O item **${item.nome}** não existe no inventário do ${target}.` });
    }
  }
  
  else if (typeGive === "jutsu") {
    const jutsu = await jutsuDB.findOne({ idJutsu: idDel });
    if (!jutsu) return await interaction.editReply({ content: `O jutsu com o **ID ${idDel}** não existe.` });
  
    const jutsus = targetAccount.ficha1.jutsus;
    if (!jutsus.includes(jutsu.idJutsu)) return await interaction.editReply({ content: `O jutsu **${jutsu.nome}** não foi aprendido pelo ${target}.` });
  
    let ryouReturn;
    switch (jutsu.rank) {
      case 'E': ryouReturn = 1000; break;
      case 'D': ryouReturn = 1000; break;
      case 'C': ryouReturn = 2000; break;
      case 'B': ryouReturn = 4000; break;
      case 'A': ryouReturn = 6000; break;
      case 'S': ryouReturn = 10000; break;
    }
  
    const updatedJutsus = jutsus.filter(id => id !== jutsu.idJutsu);
    await userDB.updateOne(
      { id_dc: target.id },
      {
        $set: { "ficha1.jutsus": updatedJutsus, "ficha1.ryou": targetAccount.ficha1.ryou + ryouReturn }
      }
    );
  
    await client.users.send(targetAccount.id_dc, { content: `O STAFF <@${userAccount.id_dc}> deletou o jutsu **${jutsu.nome} - Rank ${jutsu.rank}** do seu personagem pela razão:\n\n${reason}`});
  
    await interaction.editReply({ content: `O jutsu **${jutsu.nome}** foi removido do jogador ${target}.` });
  }  

  else if (typeGive === "invs") {
    const inv = await invDB.findOne({ idInv: idDel });
    if (!inv) return await interaction.editReply({ content: `A invocação com o **ID ${idDel}** não existe.` });

    let checkInv;
    let update = {};
    const invsSlots = Object.keys(targetAccount.ficha1.invs)

    for (let i = 1; i <= invsSlots.length; i++) {
      const slot = targetAccount.ficha1.invs[`slot${i}`];
      if (slot.nome === inv.nome) {        
        update[`ficha1.invs.slot${i}`] = { nome: "Vazio" };
        checkInv = true;
        break;
      }
    }

    if (checkInv) {
      await userDB.updateOne(
        { id_dc: target.id },
        { $set: update }
      );

      await client.users.send(targetAccount.id_dc, { content: `O STAFF <@${userAccount.id_dc}> deletou a invocação **${inv.nome}** do seu personagem pela razão:\n\n${reason}`});

      await interaction.editReply({ content: `A invocação **${inv.nome}** foi removida do jogador ${target}.` });
    } 
    else {
      return await interaction.editReply({ content: `A invocação **${inv.nome}** não foi dominada pelo ${target}.` });
    }
  }  
}