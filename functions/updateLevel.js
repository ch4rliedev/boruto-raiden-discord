import { client } from "../index.js";
import { userDB } from "../mongodb.js";

export async function updateLevel(doc, xpGained) {
  let currentLevel = doc.ficha1.level;
  let currentXP = doc.ficha1.xpCurrent + xpGained;
  let xpNextFix = 200 * currentLevel; // XP fixo para o próximo nível
  let pontosLivresGanho = 0;

  if (xpGained > 0) {
      while (currentXP >= xpNextFix) {
          currentXP -= xpNextFix; // Subtrai o XP necessário para o nível atual
          currentLevel++; // Aumenta o nível
          xpNextFix += 200;

          // Calcula a recompensa de pontos livres para cada nível subido
          if (currentLevel <= 15) {
              pontosLivresGanho += 10;
          } else if (currentLevel <= 25) {
              pontosLivresGanho += 20;
          } else if (currentLevel <= 50) {
              pontosLivresGanho += 30;
          } else if (currentLevel <= 100) {
              pontosLivresGanho += 40;
          } else if (currentLevel <= 200) {
              pontosLivresGanho += 50;
          } else if (currentLevel <= 300) {
              pontosLivresGanho += 60;
          } else if (currentLevel <= 400) {
              pontosLivresGanho += 70;
          } else {
              pontosLivresGanho += 80;
          }
      }
  } else {
      while (currentXP < 0) {
          if (currentLevel > 1) {
              xpNextFix -= 200;
              if (currentLevel <= 15) {
                  pontosLivresGanho -= 10;
              } else if (currentLevel <= 25) {
                  pontosLivresGanho -= 20;
              } else if (currentLevel <= 50) {
                  pontosLivresGanho -= 30;
              } else if (currentLevel <= 100) {
                  pontosLivresGanho -= 40;
              } else if (currentLevel <= 200) {
                  pontosLivresGanho -= 50;
              } else if (currentLevel <= 300) {
                  pontosLivresGanho -= 60;
              } else if (currentLevel <= 400) {
                  pontosLivresGanho -= 70;
              } else {
                  pontosLivresGanho -= 80;
              }
              
              currentLevel--;
              currentXP += xpNextFix;
          }
      }
      if (currentXP < 0) {
          currentXP = 0;
      }
  }

  if (currentLevel > 500) {
      currentLevel = 500;
      currentXP = 0;
      xpNextFix = 200 * currentLevel;
  }

  const xpNext = xpNextFix - currentXP;

  await userDB.updateOne(
      { idAccount: doc.idAccount },
      {
          $set: {
              'ficha1.level': currentLevel,
              'ficha1.xpCurrent': currentXP,
              'ficha1.xpNext': xpNext,
              'ficha1.xpNextFix': xpNextFix,
          },
          $inc: { 
              'ficha1.atb.pontosLivres': pontosLivresGanho,
              'ficha1.xpTotal': xpGained,
          },
      }
  );

  let levelUpMessage;
  if (currentLevel > doc.ficha1.level || xpGained < 0) {
      const user = await client.users.fetch(doc.id_dc);
      levelUpMessage = `## Seu nível foi atualizado para ${currentLevel}!\n**XP Atual:** ${currentXP}/${xpNextFix} (Faltam **${xpNext}**)\n\n${pontosLivresGanho >= 0 ? `+${pontosLivresGanho} pontos livres adicionados.` : `${Math.abs(pontosLivresGanho)} pontos livres removidos.`}`;
      
      try {
          await user.send(levelUpMessage);
      } catch (error) {
          console.error(`Erro ao enviar mensagem para o usuário ${doc.idAccount}: ${error}`);
      }
  }

  return xpGained;
}