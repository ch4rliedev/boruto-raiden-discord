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
  ...Object.values(countryRoles),
  ...Object.values(vilaRoles)
]);

async function updateNicknamesAndRoles() {
  try {
    const guild = await client.guilds.fetch(guildId);
    const allMembers = await guild.members.fetch();
    const dbUsers = await userDB.find({
      id_dc: { $exists: true },
      guild_join: true
    }, { projection: { id_dc: 1, ficha1: 1, vip: 1 } }).toArray();

    const dbUserIds = new Set(dbUsers.map(user => user.id_dc));

    for (const [memberId, member] of allMembers) {
      try {
        const user = dbUsers.find(u => u.id_dc === memberId);
        let newNickname = null;
        const rolesToAdd = new Set();
        const rolesToRemove = new Set(allManagedRoles);

        if (user && user.ficha1 && user.ficha1.active) {
          newNickname = user.ficha1.titleActive
            ? `[${user.ficha1.titleActive}] ${user.ficha1.name}`
            : `${user.ficha1.name}`;

          // VIP role
          const vipRole = vipRoles[user.vip];
          if (vipRole) rolesToAdd.add(vipRole);

          // Patente and Vila roles
          const patenteRole = patenteRoles[user.ficha1.patenteNvl];
          const vilaRole = vilaRoles[user.ficha1.vila];
          if (patenteRole) rolesToAdd.add(patenteRole);
          if (vilaRole) rolesToAdd.add(vilaRole);

          // Shinobi/Nukenin roles
          rolesToAdd.add(user.ficha1.patenteType === 0 ? shinobiRole : nukeninRole);

          // Country role
          const countryRole = countryRoles[user.ficha1.localCountry];
          if (countryRole) rolesToAdd.add(countryRole);

        } else {
          newNickname = null; // Reset nickname if user not in DB or ficha not active
        }

        // Update nickname
        if (member.nickname !== newNickname && member.id !== "395675410765185026") {
          try {
            await member.setNickname(newNickname);
          } catch (error) {
            if (error.code !== 50013) {
              console.error(`Erro ao atualizar o apelido de ${member.user.username} (${member.id}):`, error);
            }
          }
        }

        // Remove roles that should not be added
        rolesToAdd.forEach(role => rolesToRemove.delete(role));

        // Filter roles to actually remove
        const rolesToRemoveArray = Array.from(rolesToRemove).filter(role => member.roles.cache.has(role));

        // Add and remove roles
        if (rolesToAdd.size > 0) await member.roles.add(Array.from(rolesToAdd));
        if (rolesToRemoveArray.length > 0) await member.roles.remove(rolesToRemoveArray);

      } catch (error) {
        console.error(`Erro ao processar membro ${memberId}:`, error);
      }
    }
  } catch (error) {
    console.error("Erro na verificação dos usuários:", error);
  }
}

const checkJob = new CronJob('* * * * *', updateNicknamesAndRoles, null, true, 'America/Sao_Paulo');