import { CronJob } from 'cron';
import { infoGameDB } from '../../mongodb.js';
import { client } from "../../index.js";

async function checkWikiUpdates() {
    try {
        const lastChange = await infoGameDB.findOne({ type: 'lastChange' });

        const response = await fetch("https://naruto.fandom.com/pt-br/api.php?action=query&list=recentchanges&rclimit=5&rcprop=title|ids|sizes|flags|user|comment&format=json");
        const data = await response.json();
        const changes = data.query.recentchanges;

        for (const change of changes) {
            if (!lastChange || change.rcid > lastChange.rcid) {
                await infoGameDB.updateOne({ type: 'lastChange' }, { $set: { rcid: change.rcid } }, { upsert: true });

                const pageUrl = `https://naruto.fandom.com/pt-br/wiki/${encodeURIComponent(change.title)}`;
                const diffUrl = `${pageUrl}?diff=${change.revid}&oldid=${change.old_revid}`;
                const userUrl = `https://naruto.fandom.com/pt-br/wiki/User:${encodeURIComponent(change.user)}`;

                let message = `**Página Alterada:** [${change.title}](${pageUrl})\n`;
                message += `**Usuário:** [${change.user}](<${userUrl}>)\n`;
                message += `**Comentário:** ${change.comment || 'Sem comentário'}\n`;
                message += `**Data:** ${new Date().toLocaleString()}\n`;
                message += `**Modificação:** [Clique aqui](<${diffUrl}>)`;

                const channel = await client.channels.fetch("1298075990366617651");
                channel.send(message);
            }
        }
    } catch (error) {
        console.error('Erro ao verificar atualizações na wiki:', error);
    }
}

const checkJob = new CronJob('*/3 * * * * *', checkWikiUpdates, null, true, 'America/Sao_Paulo');