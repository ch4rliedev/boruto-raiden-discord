import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('vips')
    .setDescription('Utiliza benefícios VIPs')

    .addSubcommand(subcommand =>
        subcommand.setName('reset_atb')
          .setDescription('Reseta os atributos do seu personagem')
    )
    /*.addSubcommand(subcommand =>
        subcommand.setName('change_village')
          .setDescription('Muda a vila do seu personagem')
          .addStringOption(option =>
            option.setName('vila')
              .setDescription('Para qual vila você quer ir?')
              .setRequired(true)
              .addChoices(
                { name: `Vila Oculta da Folha`, value: 'Folha' },
                { name: `Vila Oculta da Nuvem`, value: 'Nuvem' },
                { name: `Vila Oculta do Som`, value: 'Som' },
                { name: `Vila Oculta da Névoa`, value: 'Névoa' },
            )
        )
    )*/
    .addSubcommand(subcommand =>
      subcommand.setName('change_ninja_name')
          .setDescription('Muda o nome do seu personagem')
          .addStringOption(option => 
              option.setName('novo_nome')
                  .setDescription('Digite o novo nome do seu personagem')
                  .setRequired(true)
          )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply({ ephemeral: true })

    if (userAccount.ficha1.state !== "Livre") {
        return await interaction.editReply({ content: `Você está no evento **"${userAccount.ficha1.state}"**, aguarde a conclusão em **${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.**` });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'reset_atb') {
        if (userAccount?.vip < 3) {
            return await interaction.editReply({ content: `Você não é um jogador VIP Jounin para usar este comando.` });
        }
        if (userAccount?.ficha1?.vips?.reset_atb) {
            return await interaction.editReply({ content: `Você já utilizou este benefício neste personagem.` });
        }

        const equipSlots = ['helmet', 'breastplate', 'pants', 'boots', 'ring', 'cord'];
        const hasEquippedItems = equipSlots.some(slot => userAccount.ficha1.equip[slot] !== false);

        if (hasEquippedItems) {
            return await interaction.editReply({ content: `Você não pode resetar seus atributos enquanto tiver equipamentos equipados. Por favor, desequipe todos os itens antes de usar este comando.` });
        }

        let pontosFreeNew = userAccount.ficha1.atb.pontosTotaisSemBonus + userAccount.ficha1.atb.pontosLivres;

        await userDB.updateOne({ "id_dc": userAccount.id_dc }, {
            $set: {
                "ficha1.atb.pontosLivres": pontosFreeNew,
                "ficha1.atb.pontosTotais": 0,
                "ficha1.atb.pontosTotaisSemBonus": 0,
                "ficha1.atb.n": 0,
                "ficha1.atb.nTemp": 0,
                "ficha1.atb.g": 0,
                "ficha1.atb.gTemp": 0,
                "ficha1.atb.t": 0,
                "ficha1.atb.tTemp": 0,
                "ficha1.atb.dt": 0,
                "ficha1.atb.dtTemp": 0,
                "ficha1.atb.dn": 0,
                "ficha1.atb.dnTemp": 0,
                "ficha1.atb.dg": 0,
                "ficha1.atb.dgTemp": 0,
                "ficha1.atb.dc": 20,
                "ficha1.atb.dcTemp": 20,
                "ficha1.atb.dr": 20,
                "ficha1.atb.drTemp": 20,
                "ficha1.atb.mu": 10,
                "ficha1.atb.muTemp": 10,
                "ficha1.vips.reset_atb": true,
            }
        });

        await interaction.editReply({ content: `Todos os seus atributos, exceto Chakra, HP e Energia, foram resetados e devolvidos. Não será mais possível utilizar este benefício.` });
    }

    else if (subcommand === 'change_village') {
      if (userAccount?.vip < 3) {
          return await interaction.editReply({ content: `Você não é um jogador VIP Jounin para usar este comando.` });
      }
      if (userAccount?.ficha1?.vips?.change_village) {
          return await interaction.editReply({ content: `Você já utilizou este benefício neste personagem.` });
      }

      let villagesCountDoc = await infoGameDB.findOne({ name: "villagesCount" });

      if (!villagesCountDoc) {
          return interaction.editReply({ content: `Erro ao obter informações das vilas.` });
      }

      const villageData = villagesCountDoc[userAccount.ficha1.vila];

      if (!villageData) {
          return interaction.editReply({ content: `Vila inválida.` });
      }

      if (villageData.count >= villageData.maxCount) {
          return interaction.editReply({ content: `A Vila d${village === "Som" ? "o" : "a"} ${village} está no limite de vagas. Por favor, selecione outra aldeia.` });
      }

      const optionVillage = interaction.options.getString('vila');
      if (!optionVillage) {
          return await interaction.editReply({ content: `Você deve selecionar uma vila antes.` });
      }
      if (userAccount.ficha1.vila !== "Som" && optionVillage === "Som") {
          return await interaction.editReply({ content: `Você é um Shinobi e não pode mudar-se para a Vila Oculta do Som. O único método é tornando-se Nukenin ao cometer qualquer crime como fugir de sua vila.` });
      }
      if (userAccount.ficha1.vila === "Som") {
          return await interaction.editReply({ content: `Você é um Nukenin e não pode mudar sua vila.` });
      }

      const oldVillage = userAccount.ficha1.vila;

      // Update user data in the database
      await userDB.updateOne({ "id_dc": userAccount.id_dc }, {
          $set: {
              "ficha1.vila": optionVillage,
              "ficha1.local": optionVillage, // Update the current location directly
              "ficha1.vips.change_village": true,
          }
      });

      await interaction.editReply({ content: `Você não pertence mais a Vila Oculta da ${oldVillage}, e sim a Vila Oculta da ${optionVillage}.` });
    }

    else if (subcommand === 'change_ninja_name') {
      if (userAccount?.vip < 2) {
          return await interaction.editReply({ content: `Você não é um jogador VIP Chuunin ou superior para usar este comando.` });
      }
      if (userAccount?.ficha1?.vips?.change_ninja_name) {
          return await interaction.editReply({ content: `Você já utilizou este benefício neste personagem.` });
      }

      const novoNome = interaction.options.getString('novo_nome');

      // Verifica se já existe outro personagem com o mesmo nome (ignorando maiúsculas/minúsculas)
      const existingCharacter = await userDB.findOne({ "ficha1.name": { $regex: new RegExp(`^${novoNome}$`, 'i') } });
      if (existingCharacter) {
          return await interaction.editReply({ content: `Já existe um personagem com o nome "${novoNome}". Por favor, escolha outro nome.` });
      }

      // Atualiza o nome do personagem no banco de dados (mantendo a capitalização original)
      await userDB.updateOne({ "id_dc": userAccount.id_dc }, {
          $set: {
              "ficha1.name": novoNome,
              "ficha1.vips.change_ninja_name": true,
          }
      });

      await interaction.editReply({ content: `O nome do seu personagem foi alterado para "${novoNome}" com sucesso!` });
    }
}