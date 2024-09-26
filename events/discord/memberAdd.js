import { Events } from 'discord.js';
import { userDB } from '../../mongodb.js';

export const name = Events.GuildMemberAdd;
export async function execute(member) {
    try {
        // Tenta enviar a mensagem na DM do usuário
        await member.send({
            content: `# Olá, <@${member.id}> <:naruto_joinha:1260398351413809185>

## Seja bem vindo(a) ao RPG semi-automático textual **Boruto Raiden**, a melhor comunidade RPG de Naruto x Boruto no Discord.
## Sou a Eida Ootsutsuki, a coordenadora geral do BR no servidor!
Acesse nosso site [clicando aqui](<https://borutoraiden.com/user/register>) para criar sua conta e logo em seguida seu personagem.
Veja nosso instagram [clicando aqui](<https://www.instagram.com/borutoraiden.oficial/>) e nos siga para participar de sorteios e cupons de desconto na loja, assim como também nosso canal no YouTube [clicando aqui](<https://www.youtube.com/@borutoraiden.oficial>).

Não esqueça de verificar nosso **Guia para Iniciantes** [clicando aqui](<https://borutoraiden.com/tutorials/guide>) para as principais perguntas já respondidas.
### Vincule sua conta do Discord em nosso site para não ficar impedido de jogar.
### Para quaisquer outras dúvidas, contate a <@&1164693494544224336> no canal <#1164563905557839944>. (Pode mencionar eles 😉)
`,
        });

        // Atualiza a entrada do usuário no banco de dados
        await userDB.updateOne({ "id_dc": member.id },
        {
            $set: {
                "guild_join": true
            }
        });
    } catch (err) {
        console.error(err);
        
        // Se não conseguir enviar a DM, manda a mensagem no canal com ID 1164407564096770048
        const channel = member.guild.channels.cache.get('1164407564096770048');
        if (channel) {
            try {
                await channel.send({
                    content: `Olá, <@${member.id}>! <:naruto_joinha:1260398351413809185> 

Infelizmente, não consegui te enviar a mensagem de boas-vindas diretamente na sua DM, então estou enviando por aqui no chat do servidor.

## Seja bem-vindo(a) ao RPG semi-automático textual **Boruto Raiden**, a melhor comunidade RPG de Naruto x Boruto no Discord!
Acesse nosso site [clicando aqui](<https://borutoraiden.com/user/register>) para criar sua conta e logo em seguida seu personagem.
Veja nosso Instagram [clicando aqui](<https://www.instagram.com/borutoraiden.oficial/>) e nos siga para participar de sorteios e cupons de desconto na loja, assim como também nosso canal no YouTube [clicando aqui](<https://www.youtube.com/@borutoraiden.oficial>).

Não se esqueça de verificar nosso **Guia para Iniciantes** [clicando aqui](<https://borutoraiden.com/tutorials/guide>) para as principais perguntas já respondidas.

### Vincule sua conta do Discord em nosso site para não ficar impedido de jogar.
### Para quaisquer outras dúvidas, contate a <@&1164693494544224336> no canal <#1164563905557839944>. (Pode mencionar eles 😉)
`,
                });
            } catch (channelErr) {
                console.error(`Falha ao enviar mensagem no canal: ${channelErr}`);
            }
        }
    }
}