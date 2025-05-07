
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { buscarPromocoesSteam } = require('./lojas/steam');
const fs = require('fs');
const path = require('path');

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const MEMORIA_PERSISTENTE = process.env.MEMORIA_PERSISTENTE === 'true'; // true/false no .env
const MEMORIA_PATH = path.join(__dirname, 'memoria_promocoes.json');
const LOTES_POR_ENVIO = 5;
const INTERVALO_HORAS = 6;
const DELAY_ENTRE_MENSAGENS_MS = 3000; // 3 segundos

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Memória em RAM (para modo não persistente)
let memoriaRAM = [];

// Carrega ou inicializa a memória de promoções já enviadas
function carregarMemoria() {
    if (MEMORIA_PERSISTENTE) {
        if (fs.existsSync(MEMORIA_PATH)) {
            try {
                return JSON.parse(fs.readFileSync(MEMORIA_PATH, 'utf8'));
            } catch (e) {
                return [];
            }
        }
        return [];
    } else {
        return memoriaRAM;
    }
}

// Salva a memória de promoções já enviadas
function salvarMemoria(memoria) {
    if (MEMORIA_PERSISTENTE) {
        fs.writeFileSync(MEMORIA_PATH, JSON.stringify(memoria, null, 2), 'utf8');
    } else {
        memoriaRAM = memoria;
    }
}

// Gera um identificador único para cada promoção (pode ser o link ou id do app)
function idPromocao(promo) {
    return promo.link;
}

// Função para formatar a mensagem simples com emojis
function formatarMensagemSimples(promo) {
    // Extrai valores do texto do preço
    // Exemplo: "De ~R$99.99~ por **R$49.99** (-50%)"
    const regex = /De ~R\$(.*?)~ por \*\*R\$(.*?)\*\* \(-(\d+)%\)/;
    const match = promo.preco.match(regex);

    let original = '', desconto = '', porcentagem = '';
    if (match) {
        original = match[1];
        desconto = match[2];
        porcentagem = match[3];
    } else {
        // fallback se não bater o regex
        original = '';
        desconto = promo.preco.replace(/[^\d,\.]/g, '');
        porcentagem = '';
    }

    return `🎮 **${promo.titulo}**
💸 Valor original: R$${original}
🔥 Valor com desconto: R$${desconto}
📉 Desconto: ${porcentagem}%
🔗 [Abrir na Steam](${promo.link})`;
}

// Função utilitária para delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function enviarPromocoes(channel) {
    let memoria = carregarMemoria();
    const promocoes = await buscarPromocoesSteam();

    const novasPromocoes = promocoes.filter(promo => !memoria.includes(idPromocao(promo)));

    if (!novasPromocoes.length) {
        // Não envia mensagem se não houver promoções novas
        return;
    }

    const lotes = [];
    for (let i = 0; i < novasPromocoes.length; i += LOTES_POR_ENVIO) {
        lotes.push(novasPromocoes.slice(i, i + LOTES_POR_ENVIO));
    }

    const loteAtual = lotes[0];
    for (const promo of loteAtual) {
        const mensagem = formatarMensagemSimples(promo);
        await channel.send(mensagem);
        memoria.push(idPromocao(promo));
        await delay(DELAY_ENTRE_MENSAGENS_MS);
    }
    salvarMemoria(memoria);

    if (lotes.length > 1) {
        fs.writeFileSync(path.join(__dirname, 'lotes_pendentes.json'), JSON.stringify(lotes.slice(1), null, 2), 'utf8');
    } else {
        const pendentesPath = path.join(__dirname, 'lotes_pendentes.json');
        if (fs.existsSync(pendentesPath)) fs.unlinkSync(pendentesPath);
    }
}

async function enviarLotePendente(channel) {
    const pendentesPath = path.join(__dirname, 'lotes_pendentes.json');
    if (!fs.existsSync(pendentesPath)) return false;
    let memoria = carregarMemoria();
    let lotesPendentes = JSON.parse(fs.readFileSync(pendentesPath, 'utf8'));
    if (!lotesPendentes.length) return false;

    const loteAtual = lotesPendentes.shift();
    for (const promo of loteAtual) {
        if (!memoria.includes(promo.link)) {
            const mensagem = formatarMensagemSimples(promo);
            await channel.send(mensagem);
            memoria.push(promo.link);
            await delay(DELAY_ENTRE_MENSAGENS_MS);
        }
    }
    salvarMemoria(memoria);

    if (lotesPendentes.length) {
        fs.writeFileSync(pendentesPath, JSON.stringify(lotesPendentes, null, 2), 'utf8');
    } else {
        fs.unlinkSync(pendentesPath);
    }
    return true;
}

client.once('ready', async () => {
    console.log(`Bot conectado como ${client.user.tag}`);
    const channel = await client.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) {
        console.log('Canal não encontrado. Verifique o ID do canal.');
        return;
    }

    let enviouPendente = await enviarLotePendente(channel);
    if (!enviouPendente) {
        await enviarPromocoes(channel);
    }

    setInterval(async () => {
        let enviouPendente = await enviarLotePendente(channel);
        if (!enviouPendente) {
            await enviarPromocoes(channel);
        }
    }, INTERVALO_HORAS * 60 * 60 * 1000);
});

client.login(DISCORD_TOKEN);
