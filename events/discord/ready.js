export const name = "ready"
export const once = true;
export async function execute(client) {
    await client.user.setActivity(`Boruto Raiden - Temporada 1`);
    console.log(`Online - ${client.user.tag}`);
}