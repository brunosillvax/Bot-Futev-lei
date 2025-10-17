const CONFIG = require('../config');
const logger = require('../utils/logger');
const BookingHandler = require('./booking');
const MenuHandler = require('./menu');
const SessionManager = require('../utils/sessionManager');
const pauseManager = require('../utils/pauseManager');

class MessageHandler {
    constructor() {
        this.bookingHandler = new BookingHandler();
        this.menuHandler = new MenuHandler();
        this.sessionManager = new SessionManager();
    }

    async handlePrivateMessage(sock, from, text) {
        const lowerText = text.toLowerCase().trim();
        let session = this.sessionManager.getSession(from);

       // Verificar se está pausado
    if (pauseManager.isPaused(from)) {
        if (text.toLowerCase().trim() === 'menu') {
            pauseManager.resumeBot(from);
            // Continuar para mostrar menu
        } else {
            return; // Ignorar mensagem se pausado
        }
    }

        // Comando para voltar ao menu
        if (lowerText === 'menu') {
            session.state = 'menu';
            await sock.sendMessage(from, { text: CONFIG.menuPrincipal });
            this.sessionManager.updateSession(from, session);
            return;
        }

        // Processar baseado no estado atual
        switch (session.state) {
            case 'menu':
                await this.menuHandler.handleMenuOption(sock, from, lowerText, session);
                break;
            case 'units':
                await this.menuHandler.handleUnitsOption(sock, from, lowerText, session);
                break;
            case 'prices':
                await this.menuHandler.handlePricesOption(sock, from, lowerText, session);
                break;
            case 'faq':
                await this.menuHandler.handleFAQOption(sock, from, lowerText, session);
                break;
            // Estados do agendamento experimental
            case 'experimental_unit':
            case 'experimental_date':
            case 'experimental_time':
            case 'experimental_name':
            case 'experimental_companion':
            case 'experimental_companion_name':
            case 'experimental_confirm':
                await this.bookingHandler.handleBookingFlow(sock, from, text, session);
                break;
            case 'waiting_message':
                logger.info(`Mensagem do usuário ${from}: ${text}`);
                break;
            default:
                await sock.sendMessage(from, { text: CONFIG.menuPrincipal });
                session.state = 'menu';
        }

        this.sessionManager.updateSession(from, session);
    }
}

module.exports = MessageHandler;