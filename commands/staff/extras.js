import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('extras')
    .setDescription('Salva informações extras do personagem.')

    .addUserOption(option =>
        option.setName('jogador')
          .setDescription('Qual jogador você modificará as informações extras?')
          .setRequired(true)
    )

    .addStringOption(option =>
        option.setName('extra')
          .setDescription('ATENÇÃO: Isso vai deletar os extras atuais, tenha cuidado. Quais extras quer salvar? ')
          .setRequired(true)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
    await interaction.deferReply({ ephemeral: true })

    const target = interaction.options.getUser('jogador')
    const targetAccount = await userDB.findOne({ "id_dc": target.id });
    if (!targetAccount || !targetAccount?.ficha1?.active) return await interaction.editReply({ content: `*${target}* não é um alvo válido ou ele não possuí uma conta/personagem.`, ephemeral: true});

    if (userAccount.staff < 2) return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Moderador ou superior.` });

    await userDB.updateOne({ "id_dc": target.id },
        {
        $set: {
            "ficha1.extras": interaction.options.getString("extra"),
            }
        }
    );
    
    await interaction.editReply({ content: `As informações extras do personagem foram salvas com sucesso.` });
}