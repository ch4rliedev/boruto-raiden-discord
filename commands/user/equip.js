import { SlashCommandBuilder } from 'discord.js';
import { itemDB } from '../../mongodb.js';

export const data = new SlashCommandBuilder()
    .setName('equipar')
    .setDescription('Equipa um equipamento do seu inventário.')
    .setContexts(0)
    .addNumberOption(option =>
        option.setName('slot')
            .setDescription('Qual o slot no seu inventário do equipamento que deseja equipar?')
            .setRequired(true)
    );

// Função para calcular o modificador de talento
function calculateTalentModifier(userAccount, baseValue, attributeName) {
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

    const slotNumber = interaction.options.getNumber('slot');
    const itemSlot = userAccount.ficha1.inventario[`slot${slotNumber}`];
    const newEquip = await itemDB.findOne({ nome: itemSlot.nome });

    if (itemSlot.nome === "Vazio" || itemSlot.nome === "Bloqueado" || !newEquip.equip) {
        await interaction.editReply({ content: "O slot que você selecionou não tem nenhum equipamento válido ou está bloqueado." });
        return;
    }

    const oldEquipName = userAccount.ficha1.equip[newEquip.equip]; // Nome do equipamento antigo
    const oldEquip = await itemDB.findOne({ nome: oldEquipName });

    if (oldEquipName === newEquip.nome) {
        const downs = updateAttributes(newEquip.ups, userAccount, newEquip.equip, true);
        const ups = updateAttributes(oldEquip.ups, userAccount, newEquip.equip);

        await userDB.updateOne({ "id_dc": interaction.user.id }, { $inc: downs });
        await userDB.updateOne({ "id_dc": interaction.user.id }, { $inc: ups });

        await interaction.editReply({ content: `O equipamento **${itemSlot.nome}** foi trocado por outro equipamento igual **${oldEquip.nome}**.` });
    } else if (oldEquip) {
        let emptySlot = false;
        const inventorySlots = Object.keys(userAccount.ficha1.inventario);

        for (let i = 1; i <= inventorySlots.length; i++) {
            if (userAccount.ficha1.inventario[`slot${i}`].nome === oldEquipName) {
                await userDB.updateOne({ "id_dc": interaction.user.id }, {
                    $inc: {
                        [`ficha1.inventario.slot${i}.quantia`]: 1,
                    },
                });
                emptySlot = true;
                break;
            }
        }

        if (!emptySlot) {
            for (let i = 1; i <= inventorySlots.length; i++) {
                if (userAccount.ficha1.inventario[`slot${i}`].nome === "Vazio") {
                    await userDB.updateOne({ "id_dc": interaction.user.id }, {
                        $set: {
                            [`ficha1.inventario.slot${i}.nome`]: oldEquipName,
                            [`ficha1.inventario.slot${i}.quantia`]: 1,
                        },
                    });
                    emptySlot = true;
                    break;
                }
            }
        }

        if (!emptySlot) {
            await interaction.editReply({ content: "Não há espaço disponível no seu inventário para trocar os equipamentos." });
            return;
        }

        const downs = updateAttributes(oldEquip.ups, userAccount, oldEquip.equip, true);
        const ups = updateAttributes(newEquip.ups, userAccount, newEquip.equip);

        await userDB.updateOne({ "id_dc": interaction.user.id }, { $inc: downs });
        await userDB.updateOne({ "id_dc": interaction.user.id }, { $inc: ups });

        await userDB.updateOne({ "id_dc": interaction.user.id }, {
            $set: {
                [`ficha1.equip.${newEquip.equip}`]: newEquip.nome,
                [`ficha1.inventario.slot${slotNumber}.nome`]: itemSlot.quantia === 1 ? "Vazio" : itemSlot.nome
            },
        });

        await interaction.editReply({ content: `**${newEquip.nome}** foi equipado com sucesso no lugar de **${oldEquipName}**.` });
    } else {
        const ups = updateAttributes(newEquip.ups, userAccount, newEquip.equip);
        ups[`ficha1.inventario.slot${slotNumber}.quantia`] = -1;

        await userDB.updateOne({ "id_dc": interaction.user.id }, { $inc: ups });
        await userDB.updateOne({ "id_dc": interaction.user.id }, {
            $set: {
                [`ficha1.equip.${newEquip.equip}`]: newEquip.nome,
                [`ficha1.inventario.slot${slotNumber}.nome`]: itemSlot.quantia === 1 ? "Vazio" : itemSlot.nome
            },
        });

        await interaction.editReply({ content: `**${newEquip.nome}** foi equipado com sucesso.` });
    }
}