import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('desequipar')
    .setDescription('Desequipa um equipamento em uso.')
    .setContexts(0)
    .addStringOption(option =>
        option.setName('type_equip')
            .setDescription('Qual o tipo de equipamento deseja remover?')
            .setRequired(true)
            .addChoices(
                { name: `Capacete`, value: 'helmet' },
                { name: `Peitoral`, value: 'breastplate' },
                { name: `Calça`, value: 'pants' },
                { name: `Botas`, value: 'boots' },
                { name: `Anel`, value: 'ring' },
                { name: `Cordão`, value: 'cord' },
            )
    );

// Função para calcular o modificador de talento
function calculateTalentModifier(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
    let modifier = 0;

    // Verificar talentos "Engenheiro" e "Ferreiro"
    if (userAccount.ficha1.talentos?.engenheiro?.n >= 1) {
        modifier -= userAccount.ficha1.talentos.engenheiro.n === 1 ? 5 : userAccount.ficha1.talentos.engenheiro.n === 2 ? 7 : 10;
    }
    if (userAccount.ficha1.talentos?.ferreiro?.n >= 1) {
        modifier -= userAccount.ficha1.talentos.ferreiro.n === 1 ? 5 : userAccount.ficha1.talentos.ferreiro.n === 2 ? 7 : 10;
    }

    return baseValue + modifier;
}

// Função para atualizar atributos com modificadores de talentos e de comando /ac
function updateAttributes(attributes, userAccount, itemEquipType, isDown = false) {
    let updates = {};
    for (let prop in attributes) {
        let modifier = calculateTalentModifier(userAccount, attributes[prop], prop);
        if (isDown) modifier = -modifier;

        if (prop === 'ac') {
            // Atualiza o modificador do comando /ac no tipo de equipamento correspondente
            const equipACField = `ficha1.equip.${itemEquipType}ac`;
            updates[equipACField] = (updates[equipACField] || 0) + modifier;
        } else {
            // Atualiza os atributos normais
            updates[`ficha1.atb.${prop}`] = (updates[`ficha1.atb.${prop}`] || 0) + modifier;
            updates[`ficha1.atb.${prop}Temp`] = (updates[`ficha1.atb.${prop}Temp`] || 0) + modifier;
            updates['ficha1.atb.pontosTotais'] = (updates['ficha1.atb.pontosTotais'] || 0) + modifier;
        }
    }
    return updates;
}

export async function execute(interaction, userAccount, userDB) {
    await interaction.deferReply({ ephemeral: true });

    const equipType = interaction.options.getString('type_equip');

    if (!userAccount.ficha1.equip[equipType]) {
        await interaction.editReply({ content: `Você não tem nenhum equipamento do tipo ${equipType} selecionado.` });
        return;
    }

    const itemFound = await itemDB.findOne({ nome: userAccount.ficha1.equip[equipType] });

    if (!itemFound) {
        await interaction.editReply({ content: `Não foi encontrado nenhum equipamento do tipo ${equipType} para desequipar.` });
        return;
    }

    // Calcular os atributos para serem removidos (downs)
    const downs = updateAttributes(itemFound.ups, userAccount, equipType, true);

    let emptySlot = null;
    const inventorySlots = Object.keys(userAccount.ficha1.inventario);
    for (let i = 1; i <= inventorySlots.length; i++) {
        if (userAccount.ficha1.inventario[`slot${i}`].nome === userAccount.ficha1.equip[equipType]) {
            emptySlot = i;
            await userDB.updateOne({ "id_dc": interaction.user.id }, {
                $inc: {
                    [`ficha1.inventario.slot${emptySlot}.quantia`]: 1,
                    ...downs
                },
                $set: {
                    [`ficha1.equip.${equipType}`]: false,
                }
            });
            break;
        }
    }

    if (!emptySlot) {
        for (let i = 1; i <= inventorySlots.length; i++) {
            if (userAccount.ficha1.inventario[`slot${i}`].nome === "Vazio") {
                emptySlot = i;
                await userDB.updateOne({ "id_dc": interaction.user.id }, {
                    $set: {
                        [`ficha1.inventario.slot${emptySlot}`]: {
                            nome: itemFound.nome,
                            quantia: 1
                        },
                        [`ficha1.equip.${equipType}`]: false,
                    },
                    $inc: {
                        ...downs
                    }
                });
                break;
            }
        }
    }

    if (emptySlot) {
        await interaction.editReply({ content: `**${itemFound.nome}** foi desequipado com sucesso e agora está no slot ${emptySlot}.` });
    } else {
        await interaction.editReply({ content: `Não foi possível desequipar **${itemFound.nome}** porque você não tem espaço livre no seu inventário.` });
    }
}