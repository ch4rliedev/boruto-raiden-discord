import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from "crypto";

export const data = new SlashCommandBuilder()
    .setName('habclan')
    .setDescription('Executa habilidades especiais dos clãs.')
    .setContexts(0)

    .addSubcommand(subcommand =>
        subcommand
          .setName('hebi')
          .setDescription('Passiva do clã Hebi.')
    )

export async function execute(interaction, userAccount, userDB, jutsuDB, itemDB, infoGameDB) {
    await interaction.deferReply()

    const typeHabClan = interaction.options.getSubcommand();

    if (typeHabClan === "hebi") {
        if (userAccount.ficha1.cla !== "Hebi") return await interaction.editReply({ content: `Você não é do clã Hebi.` });
    
        if (randomInt(100) <= 20) return await interaction.editReply({ content: `Seu Chakra foi totalmente carregado.` });
        else return await interaction.editReply({ content: `Seu Chakra não foi carregado, passiva reiniciada.` });
    }
}