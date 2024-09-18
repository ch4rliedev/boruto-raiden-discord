import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('calc')
    .setDescription('Calcula uma operação matemática simples.')
    .addStringOption(option =>
        option.setName('expressao')
            .setDescription('A expressão matemática a ser calculada (ex: 4+4, 4*4, 4/4, 4-4, 4+10%, 4-10%).')
            .setRequired(true)
    )
    .setContexts(0)

export async function execute(interaction) {
    const expressao = interaction.options.getString('expressao');
    let resultado;

    try {
        // Remove espaços desnecessários
        const expressaoLimpa = expressao.replace(/\s+/g, '');

        // Limita o número de operações a 10
        if ((expressaoLimpa.match(/[+\-*/%]/g) || []).length > 10) {
            throw new Error('Número máximo de operações é 10.');
        }

        // Substitui porcentagens pela operação correspondente
        const expressaoConvertida = expressaoLimpa
            .replace(/(\d+(?:\.\d+)?)\s*([+\-])\s*(\d+(?:\.\d+)?)%/g, (match, p1, op, p2) => {
                if (op === '+') {
                    return `(${p1}*(1+${p2}/100))`;
                } else { // op === '-'
                    return `(${p1}*(1-${p2}/100))`;
                }
            });

        // Se ainda houver porcentagens isoladas, substitui-las
        const expressaoFinal = expressaoConvertida.replace(/(\d+(?:\.\d+)?)%/g, (match, p1) => {
            return `(${p1}/100)`;
        });

        // Avalia a expressão com segurança
        const expressaoSegura = expressaoFinal.replace(/[^0-9+\-*/().]/g, '');
        resultado = eval(expressaoSegura);

        // Formata o resultado para duas casas decimais
        const resultadoFormatado = resultado.toFixed(2);

        // Verifica se o resultado é um número válido
        if (isNaN(resultado) || !isFinite(resultado)) throw new Error('Resultado inválido.');

        // Envia o resultado
        const resultEmbed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Resultado do Cálculo')
            .addFields(
                { name: 'Expressão', value: expressao, inline: true },
                { name: 'Resultado', value: resultadoFormatado, inline: true }
            );

        await interaction.reply({ embeds: [resultEmbed] });
    } catch (error) {
        await interaction.reply(`Erro ao calcular a expressão: ${error.message}`);
    }
}