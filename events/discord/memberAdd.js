import { Events } from 'discord.js';
import { userDB } from '../../mongodb.js';

export const name = Events.GuildMemberAdd;

export async function execute(member) {
    const serverId = member.guild.id;
    let welcomeMessage;

    // Definir a mensagem de boas-vindas com base no ID do servidor
    if (serverId === '1164398692283990046') { //Boruto Raiden
        welcomeMessage = `# Olá, <@${member.id}> <:naruto_joinha:1260398351413809185>
## Seja bem vindo(a) ao RPG semi-automático textual **BORUTO RAIDEN**, a melhor comunidade do gênero de Naruto x Boruto.
## Sou a Eida Ootsutsuki, a aplicação mestra no servidor!
Acesse nosso site [clicando aqui](<https://borutoraiden.com/>) baixar o aplicativo oficial e conhecer mais do nosso projeto.

**Instagram:** <https://www.instagram.com/borutoraiden.oficial>
**YouTube:** <https://www.youtube.com/@borutoraiden.oficial>
**X/Twitter:** <https://x.com/borutoraidenofc>
**Facebook:** <https://www.facebook.com/borutoraiden.oficial>

Confira nosso Guia para Iniciantes: <https://borutoraide.com/tutorials/guide>

### Para quaisquer outras dúvidas, contate a <@&1164693494544224336> no canal <#1164563905557839944>. (Pode mencionar eles)`;
    }

    else if (serverId === '847874223900065869') { //Wiki Naruto e outros
        welcomeMessage = `# Olá, <@${member.id}>, bem-vindo(a) à **${member.guild.name}**!

Sou a Eida Ootsutsuki, a aplicação mestra do Boruto Raiden, um MMORPG semi-automático textual de Naruto/Boruto e **parceira deste servidor!**

Confira nosso site [aqui](<https://borutoraide.com>) para mais informações sobre o nosso jogo como download, ou se preferir um contato mais direto, acesse nosso servidor [clicando aqui](<https://discord.gg/2PRXvbxwjr>), te aguardamos! 🥰`;
    }

    else { //Qualquer outro servidor
        welcomeMessage = `# Olá, <@${member.id}>!
Vi que você entrou no servidor **${member.guild.name}**. Acabei de verificar e ele não está na minha lista de servidores parceiros, mas fui adicionado aqui mesmo assim!

Caso queira saber de onde eu vim, eu sou do RPG Boruto Raiden, a melhor comunidade do gênero de Naruto x Boruto.

Se quiser saber mais sobre o projeto, acesse nosso site [clicando aqui](<https://borutoraiden.com/>) e baixe o aplicativo oficial ou acesse nosso servidor [clicando aqui](<https://discord.gg/2PRXvbxwjr>).`;
    }

    try {
        // Tenta enviar a mensagem na DM do usuário
        await member.send({ content: welcomeMessage });
    }
    catch (err) {
        console.error(err);
        
        // Se não conseguir enviar a DM, manda a mensagem no canal com ID 1164407564096770048
        const channel = member.guild.channels.cache.get('1164407564096770048');
        if (channel && serverId === '1164398692283990046') {
            try {
                await channel.send({ content: `Olá, <@${member.id}>! Infelizmente, não consegui te enviar a mensagem de boas-vindas diretamente na sua DM, então estou enviando por aqui no chat do servidor. ${welcomeMessage}` });
            } catch (channelErr) {
                console.error(`Falha ao enviar mensagem no canal: ${channelErr}`);
            }
        }
    }
    finally {
        if (serverId === "1164398692283990046") await userDB.updateOne({ "id_dc": member.id }, { $set: { "guild_join": true } });
    }
}