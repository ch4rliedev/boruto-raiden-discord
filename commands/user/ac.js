import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { randomInt } from "crypto";

export const data = new SlashCommandBuilder()
    .setName('ac')
    .setDescription('Inicia uma tentativa de AC.')
    .setContexts(0)
    .addNumberOption(option =>
        option.setName('buff_debuff')
            .setDescription('[OPCIONAL] Qual o total de buffs/debuffs em /ac, se houver?')
            .setMinValue(-30)
            .setMaxValue(30)
    );

export async function execute(interaction, userAccount, userDB, infoGameDB, itemDB, jutsuDB, invDB, clanDB, client) {
    await interaction.deferReply();

    let buff_debuff = interaction.options.getNumber('buff_debuff') ?? 0;
    if (userAccount.ficha1.patenteNvl === 1 && buff_debuff > 10) buff_debuff = 10
    if (userAccount.ficha1.patenteNvl === 2 && buff_debuff > 15) buff_debuff = 15
    if (userAccount.ficha1.patenteNvl === 3 && buff_debuff > 20) buff_debuff = 20
    if (userAccount.ficha1.patenteNvl === 4 && buff_debuff > 25) buff_debuff = 25
    if (userAccount.ficha1.patenteNvl === 5 && buff_debuff > 30) buff_debuff = 30
    let numberRandom1 = randomInt(16);
    let numberRandom2 = randomInt(16);
    let numberRandomOld = numberRandom1 + numberRandom2;

    let modifiers = [];
    
    if (userAccount.ficha1.disease === "Doença do sistema respiratório" && buff_debuff > 10) {
        buff_debuff = 10;
        modifiers.push("⚠️ Buff/Debuff limitado a 10 devido à Doença do sistema respiratório.");
    }

    if (userAccount.ficha1.disease === "ATTR-CM") {
        numberRandomOld -= 3;
        modifiers.push("⚠️ Resultado diminuído em 3 devido à ATTR-CM.");
    }

    if (userAccount.ficha1.cla === "Hyuuga") {
        numberRandomOld += 3;
        modifiers.push("⚠️ Resultado aumentado em 3 devido ao clã Hyuuga.");
    } else if (userAccount.ficha1.cla === "Kaminarimon") {
        numberRandomOld += 4;
        modifiers.push("⚠️ Resultado aumentado em 4 devido ao clã Kaminarimon.");
    }

    /*
    if (userAccount.ficha1.talentos.mag) {
        numberRandomOld += userAccount.ficha1.talentos.mag.n;
        modifiers.push(`⚠️ Resultado aumentado em ${userAccount.ficha1.talentos.mag.n} devido ao talento ninja Mestre da Agilidade.`);
    }

    const equipmentModifiers = {
        helmet: { name: userAccount.ficha1.equip.helmet , value: userAccount.ficha1.equip.helmetac },
        boots: { name: userAccount.ficha1.equip.boots , value: userAccount.ficha1.equip.bootsac },
        breastplate: { name: userAccount.ficha1.equip.breastplate, value: userAccount.ficha1.equip.breastplateac },
        pants: { name: userAccount.ficha1.equip.pants, value: userAccount.ficha1.equip.pantsac },
        ring: { name: userAccount.ficha1.equip.ring, value: userAccount.ficha1.equip.ringac },
        cord: { name: userAccount.ficha1.equip.cord, value: userAccount.ficha1.equip.cordac },
      };
    
    // Verificar se o usuário tem o talento plus_buff e aplicar o bônus
    const plusBuffTalent = userAccount.ficha1.talentos.plus_buff;
    if (plusBuffTalent && plusBuffTalent.n > 0) {
        const bonusPercentage = [0, 10, 15, 20, 30][plusBuffTalent.n]; // Mapear o nível do talento à porcentagem de bônus

        for (const [key, { name, value }] of Object.entries(equipmentModifiers)) {
            if (value !== 0 && value > 0) { // Aplicar o bônus apenas a buffs positivos
                const bonusValue = Math.ceil(value * (bonusPercentage / 100)); // Calcular o bônus e arredondar para cima
                numberRandomOld += value + bonusValue;
                modifiers.push(`⚠️ Resultado aumentado em ${value} (base) + ${bonusValue} (bônus de ${bonusPercentage}% do **Aprimoramento de Buff ${plusBuffTalent === 4 ? "IV" : plusBuffTalent === 3 ? "III" : plusBuffTalent === 2 ? "II" : "I"}**) devido ao(a) ${name}.`);
            }
            else if (value !== 0) { 
                numberRandomOld += value;
                modifiers.push(`⚠️ Resultado diminuído em ${Math.abs(value)} devido ao(a) ${name}.`);
            }
        }
    }
    else {
        // Se o talento não existir ou tiver nível 0, aplicar a lógica original
        for (const [key, { name, value }] of Object.entries(equipmentModifiers)) {
            if (value !== 0) {
                if (value > 0) {
                    numberRandomOld += value;
                    modifiers.push(`⚠️ Resultado aumentado em ${value} devido ao(a) ${name}.`);
                } else {
                    numberRandomOld += value;
                    modifiers.push(`⚠️ Resultado diminuído em ${Math.abs(value)} devido ao(a) ${name}.`);
                }
            }
        }
    }
    */

    numberRandomOld += buff_debuff;

    let numberRandom = numberRandomOld;

    numberRandom = numberRandom < 0 ? 0 : numberRandom;

    const atkSucessEmbed = new EmbedBuilder()
        .setColor(0x90EE90)
        .setTitle(`AC de ${userAccount.ficha1.name}`)
        .addFields(
            { name: 'Informações Gerais', value: `\n
        **🎲 Números Sorteados:** ${numberRandom1} + ${numberRandom2}
        **💪🏻 Buffs/Debuffs:** ${buff_debuff}\n
        **📊 Resultado Final:** ${numberRandom >= 60 ? "60/60 - **MOVIMENTO ULTIMATE**" : `${numberRandom}/60`}
        ` }
        );

    if (modifiers.length > 0) {
        atkSucessEmbed.addFields(
            { name: 'Modificadores Externos', value: modifiers.join('\n') }
        );
    }

    await interaction.editReply({ embeds: [atkSucessEmbed] });
}
