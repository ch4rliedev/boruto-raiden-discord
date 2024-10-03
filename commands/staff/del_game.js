import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('del_game')
    .setDescription('Deleta qualquer coisa do banco de dados do jogo.')

    .addSubcommand(subcommand => //Deletar conta
        subcommand
            .setName('cc')
            .setDescription('Deletar uma conta de usuário.')
    
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Quem é o usuário que terá a conta deletada?')
                    .setRequired(true)
            )

            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Qual o motivo está deletando a conta dele?')
                    .setRequired(true)
            )
    )

    .addSubcommand(subcommand => //Deletar personagem
        subcommand
            .setName('pp')
            .setDescription('Deletar um personagem.')
    
            .addUserOption(option =>
                option.setName('target')
                    .setDescription('Quem é o usuário que terá o personagem deletado?')
                    .setRequired(true)
            )

            .addStringOption(option =>
                option.setName('reason')
                    .setDescription('Qual o motivo está deletando o personagem dele?')
                    .setRequired(true)
            )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
    await interaction.deferReply()
    if (userAccount.staff < 3) return await interaction.editReply({ content: `Você não tem permissão de usar esse comando, apenas Administrador ou superior.` });
    const typeGive = interaction.options.getSubcommand();
    const reason = interaction.options.getString('reason')

    if (typeGive === "cc") {
        const target = interaction.options.getUser('target')
        const targetAccount = await userDB.findOne({ id_dc: target.id });
        if (!targetAccount) return await interaction.editReply({ content: `**${target}** não é um alvo válido ou ele não possuí uma conta/personagem.`, ephemeral: true});
        if (targetAccount.ficha1?.active) return await interaction.editReply({ content: `O jogador ${target} possui um personagem ativo, delete-o antes de excluir a conta.` });
        
        await client.users.send(target.id, { content: `O STAFF **<@${userAccount.id_dc}>** deletou sua conta pela razão:\n\n${reason}`});

        await userDB.deleteOne({ id_dc: target.id });

        return await interaction.editReply({ content: `A conta do jogador **${target}** foi removida do jogo com sucesso.` });
    }

    else if (typeGive === "pp") {
        const target = interaction.options.getUser('target')
        const targetAccount = await userDB.findOne({ id_dc: target.id });
        if (!targetAccount?.ficha1?.active) return await interaction.editReply({ content: `Usuário mencionado não possui um personagem.` });

        await infoGameDB.updateOne(
            { name: "villagesCount" },
            { $inc: {  [`${targetAccount.ficha1.vila}.count`]: -1 } }
        );

        await userDB.updateOne(
            { id_dc: target.id },
            { 
                $unset: { ficha1: "" },
                $inc: { ninjas: -1 }
            }
        );
        
        await client.users.send(target.id, { content: `O STAFF **<@${userAccount.id_dc}>** deletou seu personagem pela razão:\n\n${reason}`});

        return await interaction.editReply({ content: `O personagem do jogador **${target}** foi removido do jogo com sucesso.` });
    }
}