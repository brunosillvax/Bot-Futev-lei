// src/index.js - Arquivo principal de entrada
require('dotenv').config();
const logger = require('./utils/logger');
const WhatsAppService = require('./services/whatsapp');
const TelegramService = require('./services/telegram');

async function startApplication() {
    try {
        logger.info('🚀 Iniciando Bot CT LK Futevôlei...');
        
        // Iniciar serviço WhatsApp
        const whatsappService = new WhatsAppService();
        await whatsappService.start();
        
        // Iniciar serviço Telegram
        const telegramService = new TelegramService();
        telegramService.start();
        
        logger.info('✅ Todos os serviços iniciados com sucesso!');
        
        // Tratamento de encerramento gracioso
        process.on('SIGINT', async () => {
            logger.info('⏹️ Encerrando aplicação...');
            await whatsappService.stop();
            process.exit(0);
        });
        
    } catch (error) {
        logger.error('❌ Erro ao iniciar aplicação:', error);
        process.exit(1);
    }
}

startApplication();