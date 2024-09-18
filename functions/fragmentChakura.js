import { userDB, itemDB } from "../mongodb.js";
import { randomInt } from "crypto";

export async function fragmentChakura(doc, type) {
    if (doc.ficha1.level < 20 && !type) return false
    const fragmentChakuraRandom = type === "drawPrize" ? randomInt(1, 101) : randomInt(1, 201);
    const fragmentChakuraNumbers = [67]
    
    let fragmentChakuraResult = `Empty`
    let bonusPass = false;
    if (fragmentChakuraNumbers.includes(fragmentChakuraRandom)) {
        const fragmentChakuraNumbers = ["Fragmento do Poder de Ashura", "Fragmento do Poder de Indra", "Fragmento do Poder de Hamura"]
        
        fragmentChakuraResult = fragmentChakuraNumbers[randomInt(0, 3)]
    
        const inventorySlots = Object.keys(doc.ficha1.inventario)
        const item = await itemDB.findOne({ "nome": fragmentChakuraResult });
        
        if (fragmentChakuraResult !== "Empty") {
            for (let i = 1; i <= inventorySlots.length; i++) {
                const slot = doc.ficha1.inventario[`slot${i}`];
                if (slot.nome === fragmentChakuraResult && slot.quantia < item.maxQuantity) {
                    if (slot.quantia + 1 > item.maxQuantity) return false

                    bonusPass = true;
                    await userDB.updateOne(
                        { "idAccount": doc.idAccount },
                        { $inc: { 
                            [`ficha1.inventario.slot${i}.quantia`]: 1,
                            } 
                        }
                    );
                    if (type === "drawPrize") return `${fragmentChakuraResult}`
                    return `\n\n- Item Raro: ${fragmentChakuraResult}\n\nUse os fragmentos do poder de Indra e Ashura para recriar o Chakra de Hagoromo (Rinnegan) e o fragmentos do poder de Hamura para recriar o Chakra de Hamura (Tenseigan).\nCaso não deseje o item, não é possível transferi-ló, apenas vende-lo pelo /vender ou excluir do inventário pelo /usar.`
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
                                [`ficha1.inventario.slot${i}.nome`]: fragmentChakuraResult,
                                [`ficha1.inventario.slot${i}.quantia`]: 1,
                                } 
                            }
                        );
                        if (type === "drawPrize") return `${fragmentChakuraResult}`
                        return `\n\n- Item Raro: ${fragmentChakuraResult}\n\nUse os fragmentos do poder de Indra e Ashura para recriar o Chakra de Hagoromo (Rinnegan) e o fragmentos do poder de Hamura para recriar o Chakra de Hamura (Tenseigan).\nCaso não deseje o item, não é possível transferi-ló, apenas vende-lo pelo /vender ou excluir do inventário pelo /usar.`
                    }
                }
            }
        }
    }
    else {
        return false
    }
}