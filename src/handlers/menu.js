const CONFIG = require('../config');
const logger = require('../utils/logger');

class MenuHandler {
    constructor() {}

    async handleMenuOption(sock, from, text, session) {
        switch (text) {
            case '1':
                session.state = 'units';
                await this.sendUnitsMenu(sock, from);
                break;
            case '2':
                await this.sendAllSchedules(sock, from);
                break;
            case '3':
                session.state = 'prices';
                await this.sendPricesMenu(sock, from);
                break;
            case '4':
                session.state = 'experimental_unit';
                const BookingHandler = require('./booking');
                const bookingHandler = new BookingHandler();
                await bookingHandler.sendExperimentalUnitSelection(sock, from);
                break;
            case '5':
                await this.sendPlatformsInfo(sock, from);
                break;
            case '6':
                await this.sendLocations(sock, from);
                break;
            case '7':
                await this.sendLevelsInfo(sock, from);
                break;
            case '8':
                session.state = 'faq';
                await this.sendFAQMenu(sock, from);
                break;
            case '9':
                await this.connectToAgent(sock, from);
                session.state = 'waiting_message';
                break;
            default:
                await sock.sendMessage(from, {
                    text: `❌ Opção inválida. Por favor, escolha uma opção de 1 a 9.\n\n${CONFIG.menuPrincipal}`
                });
        }
    }

    async sendUnitsMenu(sock, from) {
        let message = `⚽ *NOSSAS UNIDADES CT LK FUTEVÔLEI* 🏐\n\n`;
        
        CONFIG.unidades.forEach((unidade, index) => {
            message += `${index + 1}️⃣ *${unidade.nome}*\n   📍 ${unidade.local}\n\n`;
        });
        
        message += `Digite o número da unidade para mais informações ou *MENU* para voltar.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async handleUnitsOption(sock, from, text, session) {
        const unitIndex = parseInt(text) - 1;
        
        if (unitIndex >= 0 && unitIndex < CONFIG.unidades.length) {
            await this.sendUnitDetails(sock, from, unitIndex);
            session.state = 'menu';
        } else {
            await sock.sendMessage(from, {
                text: `❌ Opção inválida. Por favor, escolha 1 ou 2.`
            });
        }
    }

    async sendUnitDetails(sock, from, unitIndex) {
        const unidade = CONFIG.unidades[unitIndex];
        
        let message = `⚽ *${unidade.nome}* 🏐\n\n`;
        message += `📍 *Endereço:*\n${unidade.endereco}\n\n`;
        message += `📅 *Dias de Funcionamento:*\n${unidade.diasFuncionamento}\n\n`;
        message += `⏰ *Horários das Aulas:*\n`;
        unidade.horarios.forEach(h => message += `• ${h}\n`);
        
        if (unidade.aulaoSabado) {
            message += `\n🎉 *Especial:* ${unidade.aulaoSabado}\n`;
        }
        
        message += `\n💳 *Formas de Pagamento:*\n`;
        message += `• Wellhub (plano Silver+)\n• TotalPass (plano TP2+)\n• GuruPass (35 créditos)\n`;
        message += `• Mensalidades e avulsas\n\n`;
        message += `Digite *3* para ver os valores ou *MENU* para voltar.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async sendPricesMenu(sock, from) {
        let message = `💰 *VALORES E PLANOS* 💰\n\n`;
        message += `Escolha a unidade:\n\n`;
        message += `1️⃣ Recreio\n`;
        message += `2️⃣ Califórnia (Bangu)\n`;
        message += `3️⃣ Ver todos os valores\n\n`;
        message += `Digite o número ou *MENU* para voltar.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async handlePricesOption(sock, from, text, session) {
        switch(text) {
            case '1':
                await this.sendUnitPrices(sock, from, 0);
                session.state = 'menu';
                break;
            case '2':
                await this.sendUnitPrices(sock, from, 1);
                session.state = 'menu';
                break;
            case '3':
                await this.sendAllPrices(sock, from);
                session.state = 'menu';
                break;
            default:
                await sock.sendMessage(from, {
                    text: `❌ Opção inválida. Escolha 1, 2 ou 3.`
                });
        }
    }

    async sendUnitPrices(sock, from, unitIndex) {
        const unidade = CONFIG.unidades[unitIndex];
        
        let message = `💰 *VALORES - ${unidade.nome}* 💰\n\n`;
        message += `📋 *MENSALIDADES:*\n`;
        
        unidade.precos.mensalidade.forEach(plano => {
            message += `• ${plano.frequencia}: ${plano.valor}\n`;
        });
        
        message += `\n🎾 *AULA AVULSA:* ${unidade.precos.avulsa}\n\n`;
        message += `✅ *PLATAFORMAS ACEITAS:*\n`;
        message += `• Wellhub/Gympass (plano Silver ou superior)\n`;
        message += `• TotalPass (plano TP2 ou superior)\n`;
        message += `• GuruPass (35 créditos por aula)\n`;
        
        message += `\n💡 *Dica:* A primeira aula experimental é gratuita!\n\n`;
        message += `Digite *MENU* para voltar ao menu principal.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async sendAllPrices(sock, from) {
        let message = `💰 *TABELA COMPLETA DE VALORES* 💰\n`;
        
        CONFIG.unidades.forEach(unidade => {
            message += `\n📍 *${unidade.nome}*\n`;
            message += `━━━━━━━━━━━━━━━\n`;
            unidade.precos.mensalidade.forEach(plano => {
                message += `${plano.frequencia}: ${plano.valor}\n`;
            });
            message += `Avulsa: ${unidade.precos.avulsa}\n`;
        });
        
        message += `\n✅ *Todas as unidades aceitam:*\n`;
        message += `• Wellhub/Gympass (a partir do Silver)\n• TotalPass (a partir do TP2)\n• GuruPass (35 créditos)\n\n`;
        message += `Digite *MENU* para voltar.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async sendAllSchedules(sock, from) {
        let message = `⏰ *HORÁRIOS DAS AULAS* ⏰\n`;
        
        CONFIG.unidades.forEach(unidade => {
            message += `\n📍 *${unidade.nome}*\n`;
            message += `📅 ${unidade.diasFuncionamento}\n`;
            message += `━━━━━━━━━━━━━━━\n`;
            unidade.horarios.forEach(h => message += `${h}\n`);
            if (unidade.aulaoSabado) {
                message += `\n${unidade.aulaoSabado}\n`;
            }
        });
        
        message += `\n💡 Chegue 10 min antes do horário!\n\n`;
        message += `Digite *MENU* para voltar.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async sendPlatformsInfo(sock, from) {
        const message = `📱 *PLATAFORMAS DE CHECK-IN* 📱\n\n` +
                       `Aceitamos as principais plataformas:\n\n` +
                       `1️⃣ *Wellhub (antigo Gympass)*\n` +
                       `• ⚠️ Plano mínimo: SILVER\n` +
                       `• Check-in pelo app\n\n` +
                       `2️⃣ *TotalPass*\n` +
                       `• ⚠️ Plano mínimo: TP2\n` +
                       `• Check-in pelo app\n\n` +
                       `3️⃣ *GuruPass*\n` +
                       `• ⚠️ Mínimo: 35 CRÉDITOS\n` +
                       `• Agendamento pelo app\n` +
                       `• Confirme disponibilidade\n\n` +
                       `⚠️ *Importante:*\n` +
                       `Faça o check-in ANTES de entrar na quadra!\n\n` +
                       `Digite *MENU* para voltar.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async sendLocations(sock, from) {
        const unidadeRecreio = CONFIG.unidades[0];
        const unidadeBangu = CONFIG.unidades[1];
        
        await sock.sendMessage(from, {
            text: `📍 *LOCALIZAÇÃO - RECREIO* 📍\n\n` +
                  `${unidadeRecreio.endereco}\n\n` +
                  `🗺️ Google Maps:\n` +
                  `https://maps.google.com/?q=Praia+do+Recreio+Posto+11+Hotel+Atlantico+Sul`
        });
        
        await sock.sendMessage(from, {
            text: `📍 *LOCALIZAÇÃO - BANGU* 📍\n\n` +
                  `${unidadeBangu.endereco}\n\n` +
                  `🗺️ Google Maps:\n` +
                  `https://maps.google.com/?q=Rua+Selene+de+Medeiros+112+Jardim+Bangu`
        });
        
        await sock.sendMessage(from, {
            text: `Digite *MENU* para voltar ao menu principal.`
        });
    }

   async sendLevelsInfo(sock, from) {
    const message = `🏐 *NÍVEIS DAS TURMAS* ⚽\n\n` +
                   `🟢 *INICIANTE A*\n` +
                   `• Introdução à recepção e movimentação\n` +
                   `• Desenvolver posicionamento\n` +
                   `• Aperfeiçoamento de fundamentos\n\n` +
                   `🟢 *INICIANTE B*\n` +
                   `• Nunca jogou futevôlei\n` +
                   `• Aprendizado dos fundamentos\n` +
                   `• Familiarização com a areia\n` +
                   `• Domínio de bola básico\n\n` +
                   `🟡 *INTERMEDIÁRIO*\n` +
                   `• Já domina passes e recepção\n` +
                   `• Desenvolvimento de ataques\n` +
                   `• Aperfeiçoamento técnico\n` +
                   `• Jogadas em dupla\n\n` +
                   `🔴 *AVANÇADO*\n` +
                   `• Jogadores experientes\n` +
                   `• Treino de alto rendimento\n` +
                   `• Preparação para torneios\n\n` +
                   `🆓 *LIVRE*\n` +
                   `• Todos os níveis juntos\n` +
                   `• Prática recreativa\n` +
                   `• Jogos e pontos\n\n` +
                   `Digite *MENU* para voltar.`;
    
    await sock.sendMessage(from, { text: message });
}
    async sendFAQMenu(sock, from) {
        let message = `❓ *PERGUNTAS FREQUENTES* ❓\n\n`;
        
        CONFIG.faq.forEach((item, index) => {
            message += `${index + 1}️⃣ ${item.pergunta}\n\n`;
        });
        
        message += `Digite o número da pergunta ou *MENU* para voltar.`;
        
        await sock.sendMessage(from, { text: message });
    }

    async handleFAQOption(sock, from, text, session) {
        const faqIndex = parseInt(text) - 1;
        
        if (faqIndex >= 0 && faqIndex < CONFIG.faq.length) {
            const item = CONFIG.faq[faqIndex];
            
            await sock.sendMessage(from, {
                text: `❓ *${item.pergunta}*\n\n` +
                      `💡 ${item.resposta}\n\n` +
                      `Tem mais dúvidas? Digite *8* para ver outras perguntas ou *MENU* para voltar.`
            });
            session.state = 'menu';
        } else {
            await sock.sendMessage(from, {
                text: `❌ Opção inválida. Por favor, escolha uma pergunta válida.`
            });
        }
    }

    async connectToAgent(sock, from) {
        const agora = new Date();
        const hora = agora.getHours();
        
        if (hora >= 6 && hora < 21) {
            await sock.sendMessage(from, {
                text: `Aguarde que um professor entrará em contato!\n\n` +
                      `💬 Assunto mais comum?\n` +
                      `• Agendar experimental\n` +
                      `• Dúvida sobre mensalidade\n` +
                      `• Remarcar aula\n` +
                      `• Outros\n\n` +
                      `💡 *Dica:* Para usar o bot novamente, digite *MENU*`
            });
        } else {
            await sock.sendMessage(from, {
                text: `😴 *HORÁRIO DE ATENDIMENTO* 😴\n\n` +
                      `Nosso atendimento funciona das 6h às 21h.\n\n` +
                      `📱 Deixe sua mensagem diretamente neste chat!\n` +
                      `Responderemos assim que possível.\n\n` +
                      `💡 *Dica:* Para usar o bot novamente, digite *MENU*`
            });
        }
        
        return 'menu';
    }
}

module.exports = MenuHandler;