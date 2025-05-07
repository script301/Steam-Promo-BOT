#!/bin/bash

echo "Verificando Node.js..."
if ! command -v node &> /dev/null
then
    echo "Node.js não encontrado. Por favor, instale o Node.js manualmente antes de continuar."
    exit 1
fi

echo "Instalando dependências npm..."
npm install discord.js node-fetch dotenv

echo "Pronto! Agora configure seu arquivo .env e rode o bot com:"
echo "node index.js"