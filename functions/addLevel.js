import { userDB } from "../mongodb.js";
import { client } from "../index.js";

export async function addLevels(doc, levelsToAdd) {
    let currentLevel = doc.ficha1.level;
    let currentXP = doc.ficha1.xpCurrent;
    let xpTotal = doc.ficha1.xpTotal;
    let xpNextFix = 200 * currentLevel;
    let plDifference = 0;

    if (levelsToAdd > 0) {
        // Adiciona níveis
        for (let i = 0; i < levelsToAdd; i++) {
            xpTotal += xpNextFix;
            currentLevel++;
            xpNextFix += 200;

            // Calcular a diferença de pontos livres com base no nível atual
            if (currentLevel <= 15) {
                plDifference += 10;
            } else if (currentLevel <= 25) {
                plDifference += 20;
            } else if (currentLevel <= 50) {
                plDifference += 30;
            } else if (currentLevel <= 100) {
                plDifference += 40;
            } else if (currentLevel <= 200) {
                plDifference += 50;
            } else if (currentLevel <= 300) {
                plDifference += 60;
            } else if (currentLevel <= 400) {
                plDifference += 70;
            } else {
                plDifference += 80;
            }

            if (currentLevel > 500) {
                currentLevel = 500;
                currentXP = 0;
                break;
            }
        }
    } else {
        // Remove níveis
        for (let i = 0; i < Math.abs(levelsToAdd); i++) {
            // Verifica se o nível está abaixo do mínimo permitido
            if (currentLevel <= 1) break;
            
            // Reduz o nível e atualiza xpNextFix
            plDifference -= (currentLevel <= 15 ? 10 :
                             currentLevel <= 25 ? 20 :
                             currentLevel <= 50 ? 30 :
                             currentLevel <= 100 ? 40 :
                             currentLevel <= 200 ? 50 :
                             currentLevel <= 300 ? 60 :
                             currentLevel <= 400 ? 70 : 80);

            xpNextFix -= 200;
            xpTotal -= xpNextFix;
            currentLevel--;

            if (currentLevel < 1) {
                currentLevel = 1;
                break;
            }
        }
    }

    const xpNext = xpNextFix - currentXP;

    await userDB.updateOne(
        { idAccount: doc.idAccount },
        {
            $set: {
                'ficha1.level': currentLevel,
                'ficha1.xpTotal': xpTotal,
                'ficha1.xpNext': xpNext,
                'ficha1.xpNextFix': xpNextFix,
                'ficha1.xpCurrent': currentXP // Atualizar o XP atual no banco de dados
            },
            $inc: { 'ficha1.atb.pontosLivres': plDifference },
        }
    );

    const user = await client.users.fetch(doc.id_dc);
    let levelChangeMessage = `## Você agora está no **nível ${currentLevel}!**\n**XP Atual:** ${currentXP}/${xpNextFix} (Faltam **${xpNext}**)\n\n`;

    if (plDifference > 0) {
        levelChangeMessage += `+${plDifference} pontos livres adicionados.`;
    } else if (plDifference < 0) {
        levelChangeMessage += `${plDifference} pontos livres removidos.`;
    }

    try {
        await user.send(levelChangeMessage);
    } catch (error) {
        console.error(`Erro ao enviar mensagem para o usuário ${doc.idAccount}: ${error}`);
    }
}