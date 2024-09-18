import { userDB, itemDB } from "../mongodb.js";
import { randomInt } from "crypto";

export async function fragmentChakraBijuu(doc, type) {
    if (doc.ficha1.level < 15 && !type) return false
    const fragmentChakraBijuuRandom = type === "drawPrize" ? randomInt(1, 101) : randomInt(1, 201);
    const fragmentChakraBijuuNumbers = [67, 17]

    doc.vip === 3 ? fragmentChakraBijuuNumbers.push(19) : null
    
    let fragmentChakraBijuuResult = `Empty`
    let bonusPass = false;
    if (fragmentChakraBijuuNumbers.includes(fragmentChakraBijuuRandom) || type === "drawPrize") {
        const fragmentChakraBijuuNumbers = [
            "Fragmento de Chakra - Shukaku", 
            "Fragmento de Chakra - Matatabi", 
            "Fragmento de Chakra - Isobu",
            "Fragmento de Chakra - Son Gokuu",
            "Fragmento de Chakra - Kokuou",
            "Fragmento de Chakra - Saiken",
            "Fragmento de Chakra - Choumei",
            "Fragmento de Chakra - Gyuuki",
            "Fragmento de Chakra - Kurama",
        ]
        
        fragmentChakraBijuuResult = fragmentChakraBijuuNumbers[randomInt(0,9)]
    
        const inventorySlots = Object.keys(doc.ficha1.inventario)
        const item = await itemDB.findOne({ "nome": fragmentChakraBijuuResult });
        
        if (fragmentChakraBijuuResult !== "Empty") {
            for (let i = 1; i <= inventorySlots.length; i++) {
                const slot = doc.ficha1.inventario[`slot${i}`];
                if (slot.nome === fragmentChakraBijuuResult && slot.quantia < item.maxQuantity) {
                    if (slot.quantia + 1 > item.maxQuantity) return false

                    bonusPass = true;
                    await userDB.updateOne(
                        { "idAccount": doc.idAccount },
                        { $inc: { 
                            [`ficha1.inventario.slot${i}.quantia`]: 1,
                            } 
                        }
                    );
                    if (type === "drawPrize") return `${fragmentChakraBijuuResult}`
                    return `\n\n**- Item Raro:** ${fragmentChakraBijuuResult}\n\nUse os fragmentos do Chakra das Bijuus para tornar-se Pseudo-Jinchuuriki delas.\nCaso não deseje o item, não é possível transferi-ló, apenas vende-lo pelo /vender ou excluir do inventário pelo /usar.`
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
                                [`ficha1.inventario.slot${i}.nome`]: fragmentChakraBijuuResult,
                                [`ficha1.inventario.slot${i}.quantia`]: 1,
                                } 
                            }
                        );
                        if (type === "drawPrize") return `${fragmentChakraBijuuResult}`
                        return `\n\n**- Item Raro:** ${fragmentChakraBijuuResult}\n\nUse os fragmentos do Chakra das Bijuus para tornar-se Pseudo-Jinchuuriki delas.\nCaso não deseje o item, não é possível transferi-ló, apenas vende-lo pelo /vender ou excluir do inventário pelo /usar.`
                    }
                }
            }
        }
    }
    else {
        return false
    }
}