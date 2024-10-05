import { client } from "../../index.js";
import { userDB } from "../../mongodb.js";
import { CronJob } from 'cron';

const guildId = '1164398692283990046';
const shinobiRole = "1164695162958655601";
const nukeninRole = "1164695226414268458";

const vilaRoles = {
  "Folha": "1279655911442612274", 
  "Nuvem": "1279656075473326122",
  "Névoa": "1279656080103968830",
  "Som": "1279656078044303441"
}

const vipRoles = {
  1: "1197284132527554631", // VIP Genin
  2: "1197755278079295539", // VIP Chuunin
  3: "1166499194517848104"  // VIP Jounin
};

const patenteRoles = {
  1: "1164694771860783145",
  2: "1164694669918212096",
  3: "1164694582555062324",
  4: "1164694506948546591",
  5: "1164694297086541845"
};

// Adicione aqui os IDs dos cargos para cada país
const countryRoles = {
  "País da Água": "1292190335052677212",
  "País do Relâmpago": "1292190366392389705",
  "País do Fogo": "1292190300294483999",
  "País do Vento": "1292190532084301958",
  "País da Terra": "1292190449330552863",
  "País dos Rios": "1292190563734519919",
  "País do Som": "1292191782007738499"
};

const allManagedRoles = new Set([
  shinobiRole,
  nukeninRole,
  ...Object.values(patenteRoles),
  ...Object.values(vipRoles),
  ...Object.values(countryRoles)
]);

async function updateNicknamesAndRoles() {
  try {
    const guild = await client.guilds.fetch(guildId);
    const cursor = await userDB.find({
      id_dc: { $exists: true },
      guild_join: true
    }, { projection: { id_dc: 1, ficha1: 1, vip: 1 } });

    await cursor.forEach(async (user) => {
      try {
        const member = await guild.members.fetch(user.id_dc);
        let newNickname = null;
        const rolesToAdd = new Set();
        const rolesToRemove = new Set();

        if (user.ficha1 && user.ficha1.active) {
          newNickname = user.ficha1.titleActive
            ? `[${user.ficha1.titleActive}] ${user.ficha1.name}`
            : `${user.ficha1.name}`;

          // Verificar se o apelido já está correto
          if (member.nickname !== newNickname && member.id !== "395675410765185026") {
            try {
              await member.setNickname(newNickname);
            } catch (error) {
              if (error.code !== 50013) { // Ignorar erro de permissão
                console.error(`Erro ao atualizar o apelido de ${user?.ficha1?.name || user?.username} (${member.id}):`, error);
              }
            }
          }

          // Verificar cargo de VIP
          const vipRole = vipRoles[user.vip];
          if (vipRole) {
            if (!member.roles.cache.has(vipRole)) {
              rolesToAdd.add(vipRole);
            }
            
            Object.values(vipRoles).forEach(role => {
              if (role !== vipRole && member.roles.cache.has(role)) {
                rolesToRemove.add(role);
              }
            });
          } else {
            Object.values(vipRoles).forEach(role => {
              if (member.roles.cache.has(role)) {
                rolesToRemove.add(role);
              }
            });
          }

          // Verificar cargos de patente e vila
          const patenteRole = patenteRoles[user.ficha1.patenteNvl];
          const vilaRole = vilaRoles[user.ficha1.vila];

          if (patenteRole && !member.roles.cache.has(patenteRole)) {
            rolesToAdd.add(patenteRole);
          }

          if (vilaRole && !member.roles.cache.has(vilaRole)) {
            rolesToAdd.add(vilaRole);
          }

          // Definir cargos de Shinobi/Nukenin conforme a patente
          if (user.ficha1.patenteType === 0) {
            if (!member.roles.cache.has(shinobiRole)) {
              rolesToAdd.add(shinobiRole);
            }
            rolesToRemove.add(nukeninRole);
          } else {
            if (!member.roles.cache.has(nukeninRole)) {
              rolesToAdd.add(nukeninRole);
            }
            rolesToRemove.add(shinobiRole);
          }

          // Verificar e atualizar o cargo do país
          const countryRole = countryRoles[user.ficha1.localCountry];
          if (countryRole) {
            if (!member.roles.cache.has(countryRole)) {
              rolesToAdd.add(countryRole);
            }
            
            Object.values(countryRoles).forEach(role => {
              if (role !== countryRole && member.roles.cache.has(role)) {
                rolesToRemove.add(role);
              }
            });
          } else {
            Object.values(countryRoles).forEach(role => {
              if (member.roles.cache.has(role)) {
                rolesToRemove.add(role);
              }
            });
          }
        } else {
          // Remover cargos se a ficha1 não estiver ativa
          rolesToRemove.add(shinobiRole);
          rolesToRemove.add(nukeninRole);
          Object.values(patenteRoles).forEach(role => rolesToRemove.add(role));
          Object.values(vilaRoles).forEach(role => rolesToRemove.add(role));
          Object.values(vipRoles).forEach(role => rolesToRemove.add(role));
          Object.values(countryRoles).forEach(role => rolesToRemove.add(role));
        }

        // Filtrar roles a remover que o usuário realmente possui
        const memberRolesToRemove = member.roles.cache.filter(role => allManagedRoles.has(role.id));
        const rolesToRemoveArray = Array.from(rolesToRemove).filter(role => memberRolesToRemove.has(role));

        // Filtrar roles a adicionar que o usuário ainda não possui
        const rolesToAddArray = Array.from(rolesToAdd).filter(role => !member.roles.cache.has(role));

        // Adicionar os novos cargos apenas se necessário
        if (rolesToAddArray.length > 0) {
          await member.roles.add(rolesToAddArray);
        }

        // Remover cargos obsoletos apenas se necessário
        if (rolesToRemoveArray.length > 0) {
          await member.roles.remove(rolesToRemoveArray);
        }

      } catch (error) {
        // Pode ignorar o erro por usuário se não conseguir buscar o membro
      }
    });
  } catch (error) {
    console.error("Erro na verificação dos usuários:", error);
  }
}

const checkJob = new CronJob('* * * * *', updateNicknamesAndRoles, null, true, 'America/Sao_Paulo');