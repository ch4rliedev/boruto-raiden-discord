import { Events } from 'discord.js';
import { client } from "../../index.js";
import { userDB, infoGameDB } from '../../mongodb.js'
let userAccount;

export const name = Events.InteractionCreate;
export async function execute(interaction) {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) return console.error(`Nenhum comando correspondente a ${interaction.commandName} foi encontrado.`);

	userAccount = await userDB.findOne({ "id_dc": interaction.user.id })

    if (!userAccount) {
        return interaction.reply({ content: 'Você não está cadastrado em nossa base de dados.', ephemeral: true });
    }

    if (!userAccount?.emailConfirmed) {
        return interaction.reply({ content: 'Confirme sua conta antes de executar este comando.', ephemeral: true });
    }

    if (!userAccount?.id_dc) {
        return interaction.reply({ content: 'Vincule sua conta do site para nosso servidor do Discord antes de executar este comando.', ephemeral: true });
    }

    if (!userAccount?.ficha1?.active && userAccount?.staff === 0) {
        return interaction.reply({ content: 'Crie um personagem antes de executar este comando.', ephemeral: true });
    }

	try {
		await command.execute(interaction, userAccount, userDB, infoGameDB, interaction.client);

		const reply = await interaction.fetchReply();
		const replyContent = reply.content;

		const logEmbed = {
			color: 0x0099ff,
			title: "Log de Comando",
			author: {
				name: 'Boruto Raiden RPG',
			},
			description: `**Usuário:** ${interaction.user.username} - ${interaction.user.id}\n**Comando:** ${interaction.commandName}\n**Resposta:** ${replyContent}`,
			timestamp: new Date().toISOString(),
		}

		const channel = await client.channels.fetch('1164681274217205871');
		await channel.send({ embeds: [logEmbed] });

		await userDB.updateOne(
			{ "id_dc": interaction.user.id },
			{ 
				$set: {
					'lastCommand': new Date()
				}
			}
		);
	}
	catch (error) {
		await interaction.editReply({ 
            content: 'Ocorreu um erro ao executar este comando! Consulte a equipe STAFF.',
            ephemeral: true 
        });
        
        console.error(`Erro ao executar /${interaction.commandName}`);
        console.error(error);
	}
}