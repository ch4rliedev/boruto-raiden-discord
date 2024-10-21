import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('give')
    .setDescription('Dar qualquer coisa para outro jogador.')

    .addSubcommand(subcommand => //item
      subcommand
        .setName('item')
        .setDescription('Dar um item.')

        .addUserOption(option =>
          option.setName('target')
            .setDescription('Quem irá presentear?')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option.setName('id_give')
            .setDescription('Qual o ID do item?')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(999)
        )

        .addNumberOption(option =>
          option.setName('amount')
            .setDescription('Qual a quantia do item presenteará?')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(10)
        )

        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Qual o motivo de estar dando esse item?')
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand => //jutsu
      subcommand
        .setName('jutsu')
        .setDescription('Dar um jutsu.')

        .addUserOption(option =>
          option.setName('target')
            .setDescription('Quem irá presentear?')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option.setName('id_give')
            .setDescription('Qual o ID do jutsu?')
            .setRequired(true)
        )

        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Qual o motivo de estar dando esse jutsu?')
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand => //invocação
      subcommand
        .setName('invs')
        .setDescription('Dar uma invocação.')

        .addUserOption(option =>
          option.setName('target')
            .setDescription('Quem irá presentear?')
            .setRequired(true)
        )

        .addNumberOption(option =>
          option.setName('id_give')
            .setDescription('Qual o ID da invocação?')
            .setRequired(true)
        )

        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Qual o motivo de estar dando essa invocação?')
            .setRequired(true)
        )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
  await interaction.deferReply()
  if (userAccount.staff < 3) return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Administrador ou superior.` });
  const typeGive = interaction.options.getSubcommand();
  const amount = interaction.options.getNumber('amount')
  const idGive = interaction.options.getNumber('id_give')
  const target = interaction.options.getUser('target')
  const reason = interaction.options.getString('reason')

  const targetAccount = await userDB.findOne({ "id_dc": target.id });
  if (!targetAccount || !targetAccount?.ficha1?.active) return await interaction.editReply({ content: `**${target}** não é um alvo válido ou ele não possuí uma conta/personagem.`, ephemeral: true});

  if (typeGive === "item") {
    const item = await itemDB.findOne({ idItem: idGive });
    if (!item) return await interaction.editReply({ content: `O item com o **ID ${idGive}** não existe.` });

    let itemCheck;
    const inventorySlots = Object.keys(targetAccount.ficha1.inventario)

    for (let i = 1; i <= inventorySlots.length; i++) {
      const slot = targetAccount.ficha1.inventario[`slot${i}`];
      if (slot.nome == item.nome) {
        slot.quantia += amount;
        itemCheck = true
        await userDB.updateOne(
          { "id_dc": target.id },
          { $set: targetAccount }
        );
        break;
      }
    }
  
    if (!itemCheck) {
      for (let i = 1; i <= inventorySlots.length; i++) {
        const slot = targetAccount.ficha1.inventario[`slot${i}`];
        if (slot.nome == "Vazio") {
          slot.nome = item.nome;
          slot.quantia = amount;
          itemCheck = true
          await userDB.updateOne(
            { "id_dc": target.id },
            { $set: targetAccount }
          );
          break;
        }
      }
    }

    if (itemCheck) {
      await interaction.editReply({ content: `Você deu o item **${item.nome} x${amount}** para o jogador **${target}** pela razão:\n\n**${reason}**` });
      return await client.users.send(targetAccount.id_dc, { content: `O STAFF **<@${userAccount.id_dc}>** lhe presentou com o item **${item.nome} x${amount}** pela razão:\n\n**${reason}**`});
    }
    else {
      return await interaction.editReply({ content: `O jogador **${target}** não tem espaço disponível no inventário.` });
    }
  }

  else if (typeGive === "jutsu") {
    const jutsu = await jutsuDB.findOne({ idJutsu: idGive });
    if (!jutsu) return await interaction.editReply({ content: `O jutsu com o **ID ${idDel}** não existe.` });

    const jutsus = targetAccount.ficha1.jutsus;

    if (jutsus.includes(jutsu.idJutsu)) {
      return await interaction.editReply({ content: `O personagem selecionado já possui o jutsu **${jutsu.nome} - Rank ${jutsu.rank}**.` });
    }
    
    jutsus.push(jutsu.idJutsu);
    
    await userDB.updateOne(
      { "id_dc": target.id },
      { $set: targetAccount }
    );      

    await interaction.editReply({ content: `Você deu o jutsu **${jutsu.nome} - Rank ${jutsu.rank}** para o jogador **${target}** pela razão:\n\n**${reason}**` });

    return await client.users.send(targetAccount.id_dc, { content: `O STAFF **<@${userAccount.id_dc}>** lhe presentou com o jutsu **${jutsu.nome} - Rank ${jutsu.rank}** pela razão:\n\n**${reason}**`});
  }

  else if (typeGive === "invs") {
    const inv = await invDB.findOne({ idInv: idGive });
    if (!inv) return await interaction.editReply({ content: `A invocação com o **ID ${idGive}** não existe.` });
    
    let invSlotFree;
    const invsSlots = Object.keys(targetAccount.ficha1.invs)

    for (let i = 1; i <= invsSlots.length; i++) {
        let slot = targetAccount.ficha1.invs[`slot${i}`];
        if (slot.nome === "Vazio") {
          slot.nome = inv.nome

          slot.t = Math.floor(targetAccount.ficha1.atb.t / 4);
          slot.tTemp = Math.floor(targetAccount.ficha1.atb.t / 4);
          slot.g = Math.floor(targetAccount.ficha1.atb.g / 4);
          slot.gTemp = Math.floor(targetAccount.ficha1.atb.g / 4);
          slot.n = Math.floor(targetAccount.ficha1.atb.n / 4);
          slot.nTemp = Math.floor(targetAccount.ficha1.atb.n / 4);

          slot.dt = Math.floor(targetAccount.ficha1.atb.dt / 4);
          slot.dtTemp = Math.floor(targetAccount.ficha1.atb.dt / 4);
          slot.dg = Math.floor(targetAccount.ficha1.atb.dg / 4);
          slot.dgTemp = Math.floor(targetAccount.ficha1.atb.dg / 4);
          slot.dn = Math.floor(targetAccount.ficha1.atb.dn / 4);
          slot.dnTemp = Math.floor(targetAccount.ficha1.atb.dn / 4);

          slot.hp = Math.floor(targetAccount.ficha1.atb.hp / 4);
          slot.hpTemp = Math.floor(targetAccount.ficha1.atb.hp / 4);
          slot.ck = Math.floor(targetAccount.ficha1.atb.ck / 4);
          slot.ckTemp = Math.floor(targetAccount.ficha1.atb.ck / 4);
          slot.energia = 15
          slot.energiaTemp = 15

          invSlotFree = true;
          await userDB.updateOne(
            { "id_dc": target.id },
            { $set: targetAccount }
          );
          break;
        }
    }

    if (invSlotFree) {
      await interaction.editReply({ content: `Você deu a invocação **${inv.nome}** para o jogador **${target}** pela razão:\n\n**${reason}**` });

      return await client.users.send(targetAccount.id_dc, { content: `O STAFF **<@${userAccount.id_dc}>** lhe presentou com a invocação **${inv.nome}** pela razão:\n\n**${reason}**`});
    }
    else {
      await interaction.editReply({ content: `Não foi possível dar a invocação **${inv.nome}** porque o jogador **${target}** não tem slot disponível.` });
    }
  }
}