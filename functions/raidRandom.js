import { userDB, infoGameDB, itemDB } from "../mongodb.js";
import { randomInt } from "crypto";

export async function raidRandom(doc, type) {
    if (doc.ficha1.level < 10 && !type) return false
    if (doc.ficha1.blockRaid && (type !== "drawPrize" && type !== "eventReward")) return false
    const raidPassRandom = type === "drawPrize" ? randomInt(1, 101) : type === "eventReward" ? randomInt(1, 11) : randomInt(1, 251);
    const raidPassNumbers = type === "eventReward" ? [7] : [14];

    doc.vip === 3 ? raidPassNumbers.push(41, 94) : null
    doc.vip === 2 ? raidPassNumbers.push(33) : null

    let raidPassResult = `Empty`
    let bonusPass = false;
    if (raidPassNumbers.includes(raidPassRandom)) {
        const raidPassPorcent = randomInt(1, 101);
        const raidPassNumbers = {
            "Passe de Raid - Bijuu (Escolha)": [88, 3, 77],
            "Passe de Raid - Bijuu (Semanal)": [21, 45, 32, 89, 12, 67, 55],
            "Passe de Raid - Bijuu (Aleatório)": [92, 14, 51, 25, 70, 8, 36, 60, 19, 40],
            "Passe de Raid - Invocação (Escolha)": [95, 23, 18, 69, 50, 10, 86, 47],
            "Passe de Raid - Invocação (Semanal)": [49, 33, 83, 15, 57, 31, 6, 78, 22, 61, 7, 91],
            "Passe de Raid - Invocação (Aleatório)": [72, 24, 28, 29, 48, 56, 62],
            "Passe de Raid - Jutsu (Escolha)": [9, 16, 27, 42, 96,100],
            "Passe de Raid - Jutsu (Semanal)": [64 ,68 ,37 ,54 ,1 ,59 ,46 ,35 ,43 ,79 ,73 ,63 ,13],
            "Passe de Raid - Jutsu (Aleatório)": [30 ,41 ,53 ,65 ,99 ,17 ,34 ,74 ,5],
            "Passe de Raid - Item Especial (Escolha)": [81 ,82 ,98 ,84 ,85 ,87 ,58],
            "Passe de Raid - Item Especial (Semanal)": [76 ,38 ,4 ,71 ,93 ,80 ,26 ,90 ,20 ,11 ,94 ,97],
            "Passe de Raid - Item Especial (Aleatório)": [52 ,75 ,2 ,66 ,44 ,39]               
        };
        
        raidPassResult = Object.keys(raidPassNumbers).find(key => raidPassNumbers[key].includes(raidPassPorcent)) || "Empty";
    
        if (raidPassResult !== "Empty") {
            const typeMapping = {
                "Bijuu": "bijuus",
                "Invocação": "invs",
                "Jutsu": "jutsus",
                "Item Especial": "items"
            };
            
            const raidType = raidPassResult.substring( //Jutsu, Invocação, Bijuu ou Item
                raidPassResult.lastIndexOf("-") + 1,
                raidPassResult.lastIndexOf("(")
            ).trim();

            const match = raidPassResult.match(/\((.*?)\)/);
            const itemType = match ? match[1] : ''; //Semanal, Escolha ou Aleatório
            
            let item;
            if (itemType === "Semanal") {
                const weeklyItems = await infoGameDB.findOne({ "name": "raids" });
                item = weeklyItems.typeRaid[typeMapping[raidType]];
            } else if (itemType === "Aleatório") {
                const items = await infoGameDB.findOne({ "name": "raidList" });
                item = items[typeMapping[raidType]][randomInt(0, items[typeMapping[raidType]].length)];
            } else if (itemType === "Escolha") item = "Escolha"
            
            raidPassResult = `Passe de Raid - ${raidType}: "${item}"`;
            
            const inventorySlots = Object.keys(doc.ficha1.inventario)
            const itemRaid = await itemDB.findOne({ "nome": "Passe de Raid" });

            for (let i = 1; i <= inventorySlots.length; i++) {
                const slot = doc.ficha1.inventario[`slot${i}`];
                if (slot.nome === raidPassResult && slot.quantia < itemRaid.maxQuantity) {

                    bonusPass = true;
                    await userDB.updateOne(
                        { "idAccount": doc.idAccount },
                        { $inc: { 
                            [`ficha1.inventario.slot${i}.quantia`]: 1,
                            } 
                        }
                    );
                    if (type === "drawPrize") return `${raidPassResult}`
                    return `\n\n- Item Raro: ${raidPassResult}\n\nUse Passes de Raids para obter jutsus, invocações, bijus e itens exclusivos por meio de um combate.\nCaso não deseje o item, não é possível vender, envie o comando /usar e selecione o slot do item e a quantia.`
                }
            }

            if (!bonusPass) {
                for (let i = 1; i <= inventorySlots.length; i++) {
                    const slot = doc.ficha1.inventario[`slot${i}`];
                    if (slot.nome === "Vazio") {
                        bonusPass = true;
                        await userDB.updateOne(
                            { "idAccount": doc.idAccount },
                            { $set: { 
                                [`ficha1.inventario.slot${i}.nome`]: raidPassResult,
                                [`ficha1.inventario.slot${i}.quantia`]: 1,
                                } 
                            }
                        );
                        if (type === "drawPrize") return `${raidPassResult}`
                        return `\n\n- Item Raro: ${raidPassResult}\n\nUse Passes de Raids para obter jutsus, invocações, bijus e itens exclusivos por meio de um combate.\nCaso não deseje o item, não é possível vender, envie o comando /usar e selecione o slot do item e a quantia.`
                    }
                }
            }
        }
    }
    else {
        return false
    }
}