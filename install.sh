#!/bin/bash

echo "🚀 Instalando Bot CT LK Futevôlei..."

# Instalar dependências
npm install

# Criar estrutura de diretórios
mkdir -p data backups logs auth_info

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Arquivo .env criado. Configure suas variáveis de ambiente!"
fi

# Inicializar arquivos de agenda
echo "{}" > data/agenda_recreio.json
echo "{}" > data/agenda_bangu.json

echo "✅ Instalação concluída!"
echo "📝 Configure o arquivo .env com seus tokens"
echo "🏃 Execute 'npm start' para iniciar o bot"