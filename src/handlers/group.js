const CONFIG = require('../config');
const logger = require('../utils/logger');
const PollHandler = require('./poll');

class GroupHandler {
    constructor() {
        this.pollHandler = new PollHandler();
    }

    async handleGroupMessage(sock, from, text) {
        const lowerText = text.toLowerCase().trim();
        
        // Comandos de enquete manual
        if (await this.pollHandler.handleManualPollCommand(sock, from, lowerText)) {
            return;
        }
        
        // Outros comandos do grupo
        if (lowerText.includes('@bot') || lowerText === 'ajuda') {
            await this.sendGroupHelp(sock, from);
        } else if (lowerText.includes('@bot unidades')) {
            await this.sendUnitsInfo(sock, from);
        } else if (lowerText.includes('@bot horarios')) {
            await this.sendAllSchedules(sock, from);
        } else if (lowerText.includes('@bot valores')) {
            await this.sendAllPrices(sock, from);
        } else if (lowerText.includes('@bot recreio')) {
            await this.sendUnitDetails(sock, from, 0);
        } else if (lowerText.includes('@bot bangu')) {
            await this.sendUnitDetails(sock, from, 1);
        } else if (lowerText.includes('@bot experimental')) {
            await this.sendExperimentalInfo(sock, from);
        } else if (lowerText.includes('@bot plataformas')) {
            await this.sendPlatformsInfo(sock, from);
        }
        
        // Log do ID do grupo se for comando de ajuda
        if (lowerText === 'ajuda' || lowerText.includes('@bot')) {
            logger.info(`📍 ID do Grupo: ${from}`);
        }
    }

    async handleParticipantUpdate(sock, update) {
        const { id, participants, action } = update;
        if (action === 'add') {
            for (const participant of participants) {
                await sock.sendMessage(id, {
                    text: `⚽ Bem-vindo(a) ao grupo do CT LK Futevôlei, @${participant.split('@')[0]}! 🏐⚡`,
                    mentions: [participant]
                });
            }
        }
    }

    async sendGroupHelp(sock, from) {
        await sock.sendMessage(from, {
            text: `🏐 *Comandos CT LK Futevôlei no Grupo:*\n\n` +
                  `• @bot unidades - Informações das unidades\n` +
                  `• @bot horarios - Horários das aulas\n` +
                  `• @bot valores - Preços e planos\n` +
                  `• @bot recreio - Info da unidade Recreio\n` +
                  `• @bot bangu - Info da unidade Bangu\n` +
                  `• @bot experimental - Agendar aula experimental\n` +
                  `• @bot plataformas - Apps de check-in aceitos\n\n` +
                  `📊 *Comandos de Enquete (Admin):*\n` +
                  `• @bot enquete recreio - Criar enquete Recreio\n` +
                  `• @bot enquete bangu - Criar enquete Bangu\n` +
                  `• @bot enquete sabado - Criar enquete aulão`
        });
    }

    // Adicione aqui todos os métodos de grupo que estavam no arquivo original
    // (sendUnitsInfo, sendAllSchedules, sendAllPrices, etc.)
}

module.exports = GroupHandler;