const axios = require('axios');
const CONFIG = require('../config');
const logger = require('../utils/logger');

class NotificationService {
    async sendTelegramNotification(bookingDetails) {
        const { unidade, name, companion, selectedDate, selectedTime } = bookingDetails;
        const date = selectedDate.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });

        let message = `🔔 *Novo Agendamento Experimental* 🔔\n\n`;
        message += `👤 *Nome:* ${name}\n`;
        if (companion) {
            message += `👥 *Acompanhante:* ${companion}\n`;
        }
        message += `📍 *Unidade:* ${unidade}\n`;
        message += `📅 *Data:* ${date}\n`;
        message += `⏰ *Horário:* ${selectedTime.split(' ')[0]}\n`;

        const token = unidade === 'RECREIO' 
            ? CONFIG.telegram.recreioToken 
            : CONFIG.telegram.banguToken;
            
        const messageIds = {};

        for (const chatId of CONFIG.telegram.notificationChatIds) {
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            try {
                const response = await axios.post(url, {
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                });
                
                if (response.data.ok) {
                    messageIds[chatId] = response.data.result.message_id;
                }
                logger.info(`✅ Notificação enviada para o Telegram (Chat ID: ${chatId})`);
            } catch (error) {
                logger.error(`❌ Falha ao enviar notificação para o Telegram (Chat ID: ${chatId}):`, error.message);
            }
        }
        return messageIds;
    }
}

module.exports = NotificationService;