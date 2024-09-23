import { SlashCommandBuilder } from 'discord.js';
import { randomInt } from "crypto";

export const data = new SlashCommandBuilder()
    .setName('st')
    .setDescription('Sorteia números.')

    .addNumberOption(option =>
        option.setName('numero_menor')
          .setDescription('Qual o número mínimo?')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(9999)
    )

    .addNumberOption(option =>
        option.setName('numero_maior')
          .setDescription('Qual o número máximo?')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(9999)
    )

    .addStringOption(option =>
        option.setName('tipo_sorteio')
          .setDescription('[OPCIONAL] Qual o tipo de sorteio fará? O padrão é 1.')
          .addChoices(
              { name: `1 número aleatório`, value: '1' },
              { name: `2 números aleatórios`, value: '2' },
              { name: `3 números aleatórios`, value: '3' },
              { name: `4 números aleatórios`, value: '4' },
              { name: `5 números aleatórios`, value: '5' },
              { name: `VS`, value: 'vs' },
          )
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply();
    const typeDraw = interaction.options.getString('tipo_sorteio') ?? '1'; // Certificar que é string
    const maxValue = interaction.options.getNumber('numero_maior');
    const minValue = interaction.options.getNumber('numero_menor');

    let result;
    if (typeDraw === "vs") {
        let numbers = [];
        for (let i = minValue; i <= maxValue; i++) {
            numbers.push(i);
        }

        let pairs = [];
        while (numbers.length > 1) {parseInt
            let firstIndex = randomInt(0, numbers.length);
            let firstNumber = numbers.splice(firstIndex, 1)[0];
            let secondIndex = randomInt(0, numbers.length);
            let secondNumber = numbers.splice(secondIndex, 1)[0];
            pairs.push([firstNumber, secondNumber]);
        }
        if (numbers.length === 1) {
            pairs.push([numbers[0], "**[?]**"]);
        }

        let messageText = "";
        messageText += `**Lista de Chaves**\n\n`;
        for (let i = 0; i < pairs.length; i++) {
            let pair = pairs[i];
            messageText += `${pair[0]} x ${pair[1]}`;
            if (i < pairs.length - 1) {
                messageText += "\n";
            }
        }
        return await interaction.editReply({ content: messageText });
    }
    else {
        if (minValue >= maxValue) {
            return await interaction.editReply({ content: `O número mínimo deve ser menor que o número máximo.` });
        }

        let numberOfDraws = parseInt(typeDraw); // Converte o tipo sorteio para número
        let drawnNumbers = [];

        for (let i = 0; i < numberOfDraws; i++) {
            let randomNum = randomInt(minValue, maxValue + 1);
            drawnNumbers.push(randomNum);
        }

        return await interaction.editReply({ content: `O(s) número(s) sorteado(s) entre **${minValue}** e **${maxValue}** é(são): ${drawnNumbers.join(', ')}` });
    }
}