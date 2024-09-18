import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('ptt_change')
    .setDescription('Altera o personagem selecionado entre Shinobi e Nukenin')

    .addUserOption(option =>
      option.setName('target')
        .setDescription('Qual jogador terá seu personagem trocado de lado?')
        .setRequired(true)
    )

    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Qual o motivo da alteração?')
        .setRequired(true)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
    await interaction.deferReply()
    if (userAccount.staff < 3) return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Administradores ou superior.` });
    const reason = interaction.options.getString('reason')
    const target = interaction.options.getUser('target')
    let targetAccount = await userDB.findOne({ "id_dc": target.id });
    if (!targetAccount || !targetAccount?.ficha1?.active) return await interaction.editReply({ content: `*${target}* não é um alvo válido ou ele não possuí uma conta/personagem.`, ephemeral: true});

    const SHINOBI_ROLE_ID = "1164695162958655601";
    const NUKENIN_ROLE_ID = "1164695226414268458";

    // Define um objeto com os valores de patente para cada tipo de patente e nível de patente
    const patenteTypes = {
      0: ["Nukenin Rank D", "Nukenin Rank C", "Nukenin Rank B", "Nukenin Rank A", "Nukenin Rank S"],
      1: ["Genin", "Chuunin", "Jounin", "Jounin de Elite", "Jounin Hanchou"]
    };

    // Extrai o nível de patente e o tipo de patente do objeto targetAccount
    const { patenteNvl, patenteType } = targetAccount.ficha1;

    // Verifica se o tipo de patente existe no objeto patenteTypes
    if (patenteTypes[patenteType]) {
      // Atualiza o valor da patente com base no tipo e nível de patente
      targetAccount.ficha1.patente = patenteTypes[patenteType][patenteNvl - 1];
      // Alterna o tipo de patente entre 0 e 1
      targetAccount.ficha1.patenteType = (patenteType + 1) % 2;
    }

    // Atualiza o objeto targetAccount no banco de dados
    await userDB.updateOne(
      { id_dc: target.id },
      { $set: { 
        // Define os novos valores para o nível de patente, a patente e o tipo de patente
        "ficha1.patenteNvl": patenteNvl, 
        "ficha1.patente": targetAccount.ficha1.patente, 
        "ficha1.patenteType": targetAccount.ficha1.patenteType
      } }
    );

    // Atualiza os cargos do usuário no Discord
    const guildMember = await interaction.guild.members.fetch(target.id);
    if (targetAccount.ficha1.patenteType === 0) {
      // Se for Shinobi, remove o cargo de Nukenin e adiciona o cargo de Shinobi
      await guildMember.roles.remove(NUKENIN_ROLE_ID);
      await guildMember.roles.add(SHINOBI_ROLE_ID);
    } 
    else {
      // Se for Nukenin, remove o cargo de Shinobi e adiciona o cargo de Nukenin
      await guildMember.roles.remove(SHINOBI_ROLE_ID);
      await guildMember.roles.add(NUKENIN_ROLE_ID);
    }

    targetAccount = await userDB.findOne({ "id_dc": target.id });

    await interaction.editReply({ content: `O personagem **${targetAccount.ficha1.name}** do jogador ${target} teve sua patente alterada e agora é **${targetAccount.ficha1.patente}**.` });
    await client.users.send(targetAccount.id_dc, { content: `O STAFF <@${userAccount.id_dc}> alterou a patente do seu personagem **${targetAccount.ficha1.name}** e agora ele é **${targetAccount.ficha1.patente}** pela razão:\n\n${reason}`});
}