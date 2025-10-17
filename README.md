# 🏐 Bot CT LK Futevôlei v2.0

Bot inteligente de atendimento automático via WhatsApp e Telegram para o CT LK Futevôlei, desenvolvido por **brunosillvax**.

## 🚀 Sobre o Projeto

Sistema completo de automação para gestão de agendamentos, atendimento ao cliente e comunicação em grupos do CT LK Futevôlei. O bot oferece uma experiência integrada entre WhatsApp e Telegram para facilitar o agendamento de aulas experimentais e gerenciamento de turmas.

## ✨ Funcionalidades Principais

### 🤖 Atendimento Automático WhatsApp
- **Menu interativo** com 9 opções principais
- **Agendamento de aulas experimentais** com validação de horários
- **Informações completas** sobre unidades, preços e horários
- **FAQ inteligente** com respostas automáticas
- **Rate limiting** para prevenir spam

### 📱 Gestão de Grupos WhatsApp
- **Enquetes automáticas** para confirmação de presença
- **Nomes dinâmicos** para enquetes por dia da semana
- **Comandos específicos** para grupos (@bot ajuda, @bot enquete)
- **Notificações** de novos agendamentos

### 📞 Integração Telegram
- **Comandos administrativos** para gestão de agendamentos
- **Notificações em tempo real** para administradores
- **Backup automático** de dados
- **Múltiplos tokens** para diferentes unidades

### 🏢 Gestão Multi-Unidades
- **Unidade Recreio**: Praia do Recreio, Posto 11
- **Unidade Califórnia**: Jardim Bangu
- **Horários diferenciados** por unidade
- **Preços específicos** por localização

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime principal
- **Baileys** - Biblioteca WhatsApp Web
- **Telegram Bot API** - Integração Telegram
- **Winston** - Sistema de logs avançado
- **Node Schedule** - Agendamento de tarefas
- **Axios** - Requisições HTTP
- **QRCode Terminal** - Autenticação WhatsApp

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 16+ 
- NPM ou Yarn
- Conta WhatsApp Business
- Bot Token do Telegram

### Instalação Rápida

```bash
# Clonar repositório
git clone https://github.com/brunosillvax/Bot-Futev-lei.git
cd Bot-Futev-lei

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com seus tokens reais

# Iniciar o bot
npm start
```

### Configuração do .env

**⚠️ IMPORTANTE**: Nunca commite o arquivo `.env` com tokens reais!

1. **Copie o template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure suas variáveis**:
   ```env
   # Telegram Tokens (obtenha em @BotFather)
   TELEGRAM_RECREIO_TOKEN=seu_token_recreio_aqui
   TELEGRAM_BANGU_TOKEN=seu_token_bangu_aqui
   TELEGRAM_NOTIFICATION_CHAT_IDS=id1,id2,id3
   
   # WhatsApp Groups
   WHATSAPP_RECREIO_GROUP=120363208643524067@g.us
   WHATSAPP_BANGU_GROUP=120363419544998924@g.us
   ```

3. **Obtenha os tokens**:
   - Telegram: Acesse [@BotFather](https://t.me/BotFather)
   - WhatsApp Groups: Adicione o bot ao grupo e veja os logs

## 🎯 Comandos Disponíveis

### WhatsApp (Chat Privado)
- `menu` - Exibe menu principal interativo
- `1-9` - Seleciona opções do menu
- `ajuda` - Lista de comandos disponíveis

### WhatsApp (Grupos)
- `@bot ajuda` - Comandos para grupos
- `@bot enquete recreio` - Cria enquete para Recreio
- `@bot enquete bangu` - Cria enquete para Bangu

### Telegram (Administrativo)
- `/add DD/MM HH:mm Nome` - Adiciona agendamento
- `/cancel DD/MM HH:mm Nome` - Cancela agendamento
- `/status DD/MM` - Status do dia específico
- `/backup` - Força backup manual

## 🏢 Unidades e Horários

### Unidade Recreio dos Bandeirantes
- **Local**: Praia do Recreio, Posto 11
- **Horários**: 17:30-18:30 | 18:30-19:30 | 19:30-20:30
- **Aulão**: Sábado 7h-8h
- **Preços**: R$ 100-250/mês | R$ 30 avulsa

### Unidade Califórnia - Jardim Bangu
- **Local**: Rua Selene de Medeiros, 112
- **Horários**: 7h-22h (diferentes níveis)
- **Dias**: Segunda, Quarta e Sexta
- **Preços**: R$ 100-150/mês | R$ 30 avulsa

## 📊 Monitoramento e Logs

O sistema possui logging avançado com Winston:

```
logs/
├── error.log      # Apenas erros críticos
├── combined.log   # Todas as operações
└── access.log     # Acessos e comandos
```

### Métricas Disponíveis
- Agendamentos por dia/semana
- Taxa de conversão de aulas experimentais
- Uso de comandos por usuário
- Performance do sistema

## 🔐 Segurança e Boas Práticas

- ✅ **Rate Limiting**: Máximo 10 requests/minuto por usuário
- ✅ **Validação de Entrada**: Todos os dados são validados
- ✅ **Tokens Seguros**: Armazenados apenas em variáveis de ambiente
- ✅ **Arquivo .env.example**: Template seguro para configuração
- ✅ **Gitignore Protegido**: Arquivos .env nunca são commitados
- ✅ **Backup Automático**: Diário às 23:00
- ✅ **Sessões Timeout**: 30 minutos de inatividade
- ✅ **Logs Detalhados**: Rastreamento completo de operações

### 🚨 Importante sobre Tokens

- **NUNCA** commite tokens reais no código
- **SEMPRE** use o arquivo `.env.example` como template
- **RENOVE** tokens se acidentalmente expostos
- **MANTENHA** o arquivo `.env` no `.gitignore`

## 🚀 Scripts Disponíveis

```bash
npm start          # Inicia o bot em produção
npm run dev        # Modo desenvolvimento com nodemon
npm test           # Executa testes (em desenvolvimento)
```

## 📈 Roadmap e Melhorias Futuras

- [ ] **Dashboard Web** para administração
- [ ] **Integração com pagamentos** online
- [ ] **Sistema de avaliações** de aulas
- [ ] **Relatórios automáticos** por WhatsApp
- [ ] **IA para sugestões** de horários
- [ ] **App mobile** complementar

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte e Contato

- **Desenvolvedor**: brunosillvax
- **CT LK Futevôlei**: [Informações de contato]
- **Issues**: [GitHub Issues](https://github.com/brunosillvax/Bot-Futev-lei/issues)

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Agradecimentos

- CT LK Futevôlei pela oportunidade
- Comunidade Node.js
- Desenvolvedores das bibliotecas utilizadas

---

**Desenvolvido com ❤️ por brunosillvax para CT LK Futevôlei**

*Versão 2.0 - Janeiro 2025*