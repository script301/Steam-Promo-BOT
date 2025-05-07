const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Busca jogos em promoção na Steam (BR).
 * Retorna até 5 promoções com título, preço e link.
 */
async function buscarPromocoesSteam() {
    const url = 'https://store.steampowered.com/api/featuredcategories/?cc=br&l=portuguese';
    try {
        const res = await fetch(url);
        const data = await res.json();
        // Pega a seção de ofertas especiais
        const ofertas = (data.specials?.items || [])
            .filter(item => item.discount_percent > 0)
            .slice(0, 5) // Limita para não lotar o Discord
            .map(item => ({
                titulo: item.name,
                preco: `De ~R$${item.original_price/100}~ por **R$${item.final_price/100}** (-${item.discount_percent}%)`,
                link: `https://store.steampowered.com/app/${item.id}`
            }));
        console.log('Ofertas Steam:', ofertas);
        return ofertas;
    } catch (err) {
        console.error('Erro ao buscar promoções da Steam:', err);
        return [];
    }
}

module.exports = { buscarPromocoesSteam };
