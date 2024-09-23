import { SlashCommandBuilder } from 'discord.js';

const worldLocales = [
    { id: 1, name: `Vila Oculta da Folha`, value: 'Folha', role: "1164698430921261096", channel: "1164561091515404409", status: "Pass" },
    { id: 4, name: `Vila Oculta da Nuvem`, value: 'Nuvem', role: "1164700284409364510", channel: "1164561442280849439", status: "Pass" },
    { id: 5, name: `Vila Oculta da Névoa`, value: 'Névoa', role: "1164700409722581093", channel: "1164561720329638039", status: "Pass" },
    { id: 6, name: `Vila Oculta da Chuva`, value: 'Chuva', role: "1164700612143886447", channel: "1164561855570776135", status: "Blocked" },
    { id: 7, name: `Vila Oculta da Grama`, value: 'Grama', role: "1135408467369283754", status: "Blocked" },
    { id: 8, name: `Cachoeira`, value: 'Cachoeira', role: "1135408319704608768", status: "Blocked" },
    { id: 9, name: `Vila Oculta do Som`, value: 'Som', role: "1135408348557230160", status: "Pass" },
    { id: 10, name: `Vila Oculta nos Vales`, value: 'Vales', role: "1135408351514206351", status: "Blocked" },
    { id: 11, name: `Rocha`, value: 'Rocha', role: "1135408349882626048", status: "Blocked" },
    { id: 12, name: `Vila Oculta das Fontes Termais`, value: 'Termais', role: "1135408352525033572", status: "Blocked" },
    { id: 13, name: `Vila Nagare (Redaku)`, value: 'Nagare', role: "1135409259987873813", status: "Blocked" },
    { id: 14, name: `Vila Oculta na Geada`, value: 'Geada', role: "1135408353519087646", status: "Blocked" },
    { id: 15, name: `Ilha da Tartaruga`, value: 'tartaruga', role: "", status: "Blocked" },
];
  
export const data = new SlashCommandBuilder()
    .setName('viajar')
    .setDescription('Inicia uma viagem para qualquer lugar.')

    .addStringOption(option =>
        option.setName('transporte')
          .setDescription('Qual o meio de transporte?')
          .setRequired(true)
          .addChoices(
            { name: `A pé`, value: 'foot' },
            { name: `Trem`, value: 'train' },
            { name: `Dirígivel`, value: 'airship' },
            { name: `Dirígivel Deluxe`, value: 'luxuryAirship' },
        )
    )

    .addNumberOption(option =>
        option.setName('destino')
          .setDescription(`Qual o ID do seu destino?`)
          .setRequired(true)
          .setMinValue(1)
    )

    .setContexts(0);

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, client) {
    await interaction.deferReply({ ephemeral: true });
    
    if (userAccount.ficha1.state !== "Livre") {
        return await interaction.editReply({ content: `Você está no evento **"${userAccount.ficha1.state}"**, aguarde a conclusão em **${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.**` });
    }
    
    const transport = interaction.options.get('transporte').value;
    const destinyId = interaction.options.getNumber('destino');
    const destiny = worldLocales.find(item => item.id === destinyId);
    
    if (!destiny) {
        return await interaction.editReply({ content: `O destino com ID **${destinyId}** não existe.` });
    }
    
    if (destiny.status === "Blocked") {
        return await interaction.editReply({ content: `O destino **${destiny.name}** está temporariamente indisponível para viagens.` });
    }
    
    const transportType = {
        foot: { price: 0, reduce: 0 },
        train: { price: 2000, reduce: 0.3 },
        airship: { price: 3000, reduce: 0.4 },
        luxuryAirship: { price: 5000, reduce: 0.6 },
    };
    
    const travelTime = 4;
    const reducedTravelTime = travelTime - transportType[transport].reduce;
    
    const dateNow = new Date();
    const dateFuture = new Date(dateNow.getTime() + reducedTravelTime * 60 * 60 * 1000);
    
    await userDB.updateOne({ "id_dc": interaction.user.id }, {
        $set: {
            "ficha1.tempo.start": dateNow,
            "ficha1.tempo.finish": dateFuture,
            "ficha1.state": `Viajando para a ${destiny.name}`,
            "ficha1.nextLocal": destiny.value, // Update the next location
        },
        $inc: {
            "ficha1.ryou": -transportType[transport].price
        }
    });
    
    userAccount = await userDB.findOne({ "id_dc": interaction.user.id }); // Refresh userAccount
    
    await interaction.editReply({ content: `**Viagem para o(a) ${destiny.name} iniciada com sucesso.**\n**Conclusão:** ${userAccount.ficha1.tempo.finish.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n\nEnquanto estiver em viagem, não poderá iniciar missões, aprender jutsus, iniciar treinos etc, mas fica despreocupado, eu irei te avisar e te liberar automaticamente quando acabar e também pode cenar normalmente, exceto em eventos e exames, e sem fugir da rota do seu personagem. 😉` });
}