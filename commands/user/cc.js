import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('cc')
    .setDescription('Exibe os dados de um jogador.')

    .addUserOption(option =>
      option.setName('outro_jogador')
        .setDescription('[OPCIONAL] Deseja ver os dados de outro jogador?')
        .setRequired(false)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply({ephemeral: true, fetchReply: true})
    let targetAccount = interaction.options.getUser('outro_jogador')
    
    if (targetAccount && targetAccount?.id !== userAccount?.id_dc) {
        if (userAccount.staff >= 1) {
            let targetAccountDB = await userDB.findOne({"id_dc": targetAccount.id})
            if (!targetAccountDB || !targetAccountDB?.id_dc) return await interaction.editReply({ content: `**<@${targetAccount.id}>** não é um alvo válido ou ele não possuí uma conta.`});
            userAccount = targetAccount
        }
        else {
            return await interaction.editReply(`Você não tem permissão de usar esse comando, apenas S1 ou superior.`)
        }
    }

    const account = `**Jogador:** ${userAccount.username}
    
    > **❱ 📝 Nome:** ${userAccount.username}
    > **❱ 🆔 ID Conta:** ${userAccount.idAccount}
    > **❱ 🆔 ID Discord:** ${userAccount.id_dc}
    > **❱ 📅 Criado em:** ${userAccount.register}
    > **❱ 🔒 Status:** ${userAccount.state}
    > **❱ 🤝 Recrutado:** ${userAccount.recruit ? "Sim" : "Não"}
    > **❱ 🙋‍♂️ Jogadores Convidados:** ${userAccount.invites}
    > **❱ ⚙️ Nível Staff:** S${userAccount.staff}
    > **❱ ⚠️ Avisos:** ${userAccount.warns}/3
    > **❱ 💰 VIP:** ${userAccount.vip ? userAccount.vip : "Não"}
    > **❱ 💜 Nitro:** ${userAccount.nitro ? "Sim" : "Não"}`

    await interaction.editReply({ content: account }); 
}