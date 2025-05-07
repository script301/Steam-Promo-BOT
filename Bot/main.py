
import os
import asyncio
import discord
from discord.ext import tasks
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
DISCORD_CHANNEL_ID = os.getenv("DISCORD_CHANNEL_ID")

if not DISCORD_TOKEN or not DISCORD_CHANNEL_ID:
    raise ValueError("DISCORD_TOKEN e DISCORD_CHANNEL_ID devem estar definidos no .env")

DISCORD_CHANNEL_ID = int(DISCORD_CHANNEL_ID)

intents = discord.Intents.default()
client = discord.Client(intents=intents)

# Funções stub para buscar promoções (implemente depois)
async def buscar_promocoes_steam():
    return [
        {"titulo": "Jogo Exemplo Steam", "preco": "R$ 19,99", "link": "https://store.steampowered.com/app/000000"},
    ]

async def buscar_promocoes_ea():
    return [
        {"titulo": "Jogo Exemplo EA", "preco": "R$ 29,99", "link": "https://www.ea.com/pt-br/games"},
    ]

async def buscar_promocoes_epic():
    return [
        {"titulo": "Jogo Exemplo Epic", "preco": "Grátis", "link": "https://www.epicgames.com/store/pt-BR/p/jogo-exemplo"},
    ]

async def buscar_promocoes_gog():
    return [
        {"titulo": "Jogo Exemplo GOG", "preco": "R$ 9,99", "link": "https://www.gog.com/game/jogo_exemplo"},
    ]

async def buscar_promocoes_nuuvem():
    return [
        {"titulo": "Jogo Exemplo Nuuvem", "preco": "R$ 14,99", "link": "https://www.nuuvem.com/item/jogo-exemplo"},
    ]

async def coletar_todas_promocoes():
    promocoes = []
    promocoes += await buscar_promocoes_steam()
    promocoes += await buscar_promocoes_ea()
    promocoes += await buscar_promocoes_epic()
    promocoes += await buscar_promocoes_gog()
    promocoes += await buscar_promocoes_nuuvem()
    return promocoes

async def enviar_promocoes(channel):
    try:
        promocoes = await coletar_todas_promocoes()
        if not promocoes:
            await channel.send("Nenhuma promoção encontrada no momento.")
            return

        # Agrupar promoções em uma única mensagem
        embed = discord.Embed(
            title="Promoções de Jogos nas Lojas BR 🇧🇷",
            description="Confira as melhores ofertas do momento!",
            color=discord.Color.green()
        )
        for promo in promocoes:
            embed.add_field(
                name=promo["titulo"],
                value=f"[Ver na loja]({promo['link']})\nPreço: **{promo['preco']}**",
                inline=False
            )
        await channel.send(embed=embed)
    except Exception as e:
        print(f"Erro ao enviar promoções: {e}")
        await channel.send("Ocorreu um erro ao buscar promoções.")

@client.event
async def on_ready():
    print(f'Bot conectado como {client.user}')
    channel = client.get_channel(DISCORD_CHANNEL_ID)
    if channel:
        await enviar_promocoes(channel)
    else:
        print("Canal não encontrado. Verifique o ID do canal.")

    checar_promocoes.start()

@tasks.loop(hours=1)
async def checar_promocoes():
    channel = client.get_channel(DISCORD_CHANNEL_ID)
    if channel:
        await enviar_promocoes(channel)

if __name__ == "__main__":
    client.run(DISCORD_TOKEN)
