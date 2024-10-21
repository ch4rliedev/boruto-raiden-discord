import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('village')
    .setDescription('Gerenciar sua vila')
    .addSubcommand(subcommand =>
        subcommand
            .setName('senior')
            .setDescription('Escolher um jogador como o novo Sênior da vila.')
            .addUserOption(option => 
                option.setName('jogador')
                    .setDescription('Escolha o jogador para ser o novo Sênior.')
                    .setRequired(true)
            )
    );

export async function execute(interaction, userAccount, userDB, client) {
    await interaction.deferReply({ ephemeral: true });

    // Verifica se o usuário é Kage
    if (!userAccount.ficha1.kage) {
        return await interaction.editReply({ content: 'Somente o Kage pode designar o Sênior da vila.' });
    }

    const selectedUser = interaction.options.getUser('jogador');
    const selectedUserAccount = await userDB.findOne({ id_dc: selectedUser.id });

    // Verifica se o jogador selecionado é da mesma vila que o Kage
    if (userAccount.ficha1.vila !== selectedUserAccount.ficha1.vila) {
        return await interaction.editReply({ content: 'Você só pode escolher um jogador da mesma vila que você.' });
    }

    // Verifica se o jogador já é Sênior
    if (selectedUserAccount.ficha1.senior) {
        return await interaction.editReply({ content: `O jogador **${selectedUserAccount.ficha1.name}** já é o Sênior da vila.` });
    }

    // Remove a chave "senior" de todos os personagens da mesma vila
    await userDB.updateMany({ "ficha1.vila": userAccount.ficha1.vila, "ficha1.senior": true }, { $unset: { "ficha1.senior": "" } });

    // Define o novo Sênior
    await userDB.updateOne({ id_dc: selectedUser.id }, { $set: { "ficha1.senior": true } });

    // Envia mensagem ao antigo Sênior (se houver)
    const previousSenior = await userDB.findOne({ "ficha1.vila": userAccount.ficha1.vila, "ficha1.senior": false });
    if (previousSenior) {
        await client.users.send(previousSenior.id_dc, `Você não é mais o Sênior da vila **${previousSenior.ficha1.vila}**. O novo Sênior agora é **${selectedUserAccount.ficha1.name}**.`);
    }

    // Notifica o novo Sênior
    await client.users.send(selectedUser.id, `Parabéns! Você foi designado o novo Sênior da vila **${selectedUserAccount.ficha1.vila}** pelo Kage **${userAccount.ficha1.name}**.`);

    await interaction.editReply({ content: `**${selectedUserAccount.ficha1.name}** agora é o Sênior da vila **${userAccount.ficha1.vila}**.` });
}