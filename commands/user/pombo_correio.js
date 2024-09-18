import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { randomInt } from "crypto";

export const data = new SlashCommandBuilder()
    .setName('pombo_correio')
    .setDescription('Envia uma mensagem para outro jogador.')
    .setContexts(0)
    .addUserOption(option => 
        option.setName('destinatario')
            .setDescription('O jogador para quem você quer enviar a mensagem.')
            .setRequired(true)
    )
    .addStringOption(option => 
        option.setName('mensagem')
            .setDescription('A mensagem que você quer enviar.')
            .setRequired(true)
    )
    .addBooleanOption(option =>
        option.setName('confidencial')
            .setDescription('Indica se a mensagem será confidencial.')
            .setRequired(false)
    );

export async function execute(interaction, userAccount, userDB, infoGameDB, client) {
    await interaction.deferReply({ ephemeral: true });

    const recipient = interaction.options.getUser('destinatario');
    const messageContent = interaction.options.getString('mensagem');
    const isConfidential = interaction.options.getBoolean('confidencial') || false;

    // Verificar se o destinatário existe no banco de dados, está no servidor e está ativo
    const recipientAccount = await userDB.findOne({ id_dc: recipient.id, guild_join: true, 'ficha1.active': true });
    if (!recipientAccount) {
        await interaction.editReply(`O jogador ${recipient.username} não foi encontrado, não está no servidor ou está inativo.`);
        return;
    }

    // Obter os locais do remetente e do destinatário
    const senderLocation = userAccount.ficha1.local;
    const recipientLocation = recipientAccount.ficha1.local;

    // Calcular o tempo de entrega com base nos locais (mínimo 1 hora, máximo 6 horas)
    const deliveryTime = calculateDeliveryTime(senderLocation, recipientLocation);

    if (deliveryTime === 0) { // Entrega imediata
        try {
            const recipientEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Nova mensagem de ${isConfidential ? "desconhecido" : userAccount.ficha1.name} via pombo correio`)
                .setDescription(messageContent);

            await recipient.send({ embeds: [recipientEmbed] });

            // Enviar mensagem de confirmação para o remetente
            const senderEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('Mensagem enviada!')
                .setDescription(`Sua mensagem para ${recipientAccount.ficha1.name} foi entregue imediatamente por estarem no mesmo país!`);

            await interaction.editReply({ embeds: [senderEmbed] });

            return; // Encerrar a execução, pois a mensagem já foi entregue
        } catch (error) {
            console.error(`Erro ao enviar mensagem para ${recipientAccount.ficha1.name}:`, error);
            await interaction.editReply(`Ocorreu um erro ao enviar a mensagem para ${recipientAccount.ficha1.name}.`);
            return;
        }
    }
    else { // Entrega com tempo de espera
        // Criar um objeto para armazenar a mensagem no infoGameDB
        const messageData = {
            sender: isConfidential ? 'desconhecido' : userAccount.ficha1.name,
            senderId: userAccount.id_dc,
            recipient: recipientAccount.ficha1.name,
            recipientId: recipientAccount.id_dc,
            message: messageContent,
            sentAt: new Date(),
            deliveryTime: deliveryTime,
            isConfidential: isConfidential,
        };

        // Salvar a mensagem no infoGameDB
        await infoGameDB.updateOne(
            { name: 'pomboCorreio' },
            { $push: { messages: messageData } },
            { upsert: true }
        );

        // Enviar mensagem de confirmação para o remetente com o tempo de espera estimado
        const senderEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Mensagem enviada!')
            .setDescription(`Sua mensagem para ${recipientAccount.ficha1.name} foi enviada com sucesso!\nO pombo correio levará aproximadamente ${deliveryTime} ${deliveryTime === 1 ? "hora" : "horas"} para entregar. Aguarde pacientemente!`)

        await interaction.editReply({ embeds: [senderEmbed] });
    }
}

function calculateDeliveryTime(senderLocation, recipientLocation) {
    const locationDistances = {
        'Folha': { 'Nuvem': [1, 3], 'Névoa': [2, 4], 'Som': [3, 5] },
        'Nuvem': { 'Folha': [1, 3], 'Névoa': [1, 2], 'Som': [2, 4] },
        'Névoa': { 'Folha': [2, 4], 'Nuvem': [1, 2], 'Som': [1, 3] },
        'Som': { 'Folha': [3, 5], 'Nuvem': [2, 4], 'Névoa': [1, 3] }
    };

    if (senderLocation === recipientLocation) {
        return 0; // Entrega instantânea se no mesmo local (mínimo 1 hora)
    }

    const [minTime, maxTime] = locationDistances[senderLocation][recipientLocation];
    return Math.max(1, Math.min(6, randomInt(minTime, maxTime + 1))); 
}