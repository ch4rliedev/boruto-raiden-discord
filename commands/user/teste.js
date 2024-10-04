import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { randomInt } from "crypto";

export const data = new SlashCommandBuilder()
    .setName('teste')
    .setDescription('Inicia um teste de procura ou clones.')
    .addSubcommand(subcommand =>
        subcommand.setName('procura')
            .setDescription('Inicia um teste de procura.')
            .addNumberOption(option =>
                option.setName('buff_debuff')
                    .setDescription('[OPCIONAL] Qual o total de buffs/debuffs em /teste procura?')
                    .setMinValue(-10)
                    .setMaxValue(10)
            )
    )
    .addSubcommand(subcommand =>
        subcommand.setName('clone')
            .setDescription('Inicia um teste de clones.')
            
            .addNumberOption(option =>
                option.setName('quantidade')
                    .setDescription('Número total de clones + 1 (inimigo)')
                    .setRequired(true)
            )

            .addNumberOption(option =>
                option.setName('buff_debuff')
                    .setDescription('[OPCIONAL] Qual o total de buffs/debuffs em /teste clone?')
                    .setMinValue(-10)
                    .setMaxValue(10)
            )

    );

export async function execute(interaction) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    let buff_debuff = interaction.options.getNumber('buff_debuff') ?? 0;

    let result;
    let description = '';
    let maxRange = 6;

    if (subcommand === 'procura') {
        // Teste de procura
        const fixedNumber = 3;  // Definindo o número fixo para o sucesso (você pode alterar conforme necessidade)
        maxRange = maxRange - buff_debuff > 1 ? maxRange - buff_debuff : 1;  // Diminui o range com base no buff/debuff

        result = randomInt(1, maxRange + 1);  // Sorteia de 1 até o novo maxRange ajustado

        description = `**🎯 Teste de Procura:** Sorteado ${result}/6 com buff/debuff ${buff_debuff}\n`;

        if (result === fixedNumber) {
            description += '**Resultado:** **SUCESSO!** Encontrou a localização.\n';
        } else {
            description += '**Resultado:** **FRACASSO!** Não encontrou a localização.\n';
        }
    } else if (subcommand === 'clone') {
        // Teste de clone
        const totalClones = interaction.options.getNumber('quantidade');  // Clones + 1 (inimigo)
        const fixedNumber = randomInt(1, totalClones + 1);  // Sorteia um número fixo para ser o verdadeiro

        maxRange = totalClones - buff_debuff > 1 ? totalClones - buff_debuff : 1;  // Ajusta o range com buff/debuff

        result = randomInt(1, maxRange + 1);  // Sorteia o número do teste entre 1 e maxRange ajustado

        description = `**🎯 Teste de Clones:** Sorteado ${result}/${totalClones} com buff/debuff ${buff_debuff}\n`;

        if (result === fixedNumber) {
            description += '**Resultado:** **SUCESSO!** Encontrou o verdadeiro clone.\n';
        } else {
            description += `**Resultado:** **FRACASSO!** O verdadeiro clone estava no ${fixedNumber}.\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0x90EE90)
        .setTitle(`Teste de ${subcommand === 'procura' ? 'Procura' : 'Clones'}`)
        .setDescription(description);

    await interaction.editReply({ embeds: [embed] });
}