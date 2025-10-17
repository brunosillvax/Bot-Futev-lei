const CONFIG = require('../config');
const logger = require('../utils/logger');
const storage = require('../utils/storage');
const validators = require('../utils/validators');
const NotificationService = require('../services/notification');

class BookingHandler {
    constructor() {
        this.experimentalSessions = new Map();
        this.notificationService = new NotificationService();
    }

    async handleBookingFlow(sock, from, text, session) {
        const lowerText = text.toLowerCase().trim();

        switch (session.state) {
            case 'experimental_unit':
                await this.handleExperimentalUnit(sock, from, lowerText, session);
                break;
            case 'experimental_date':
                await this.handleExperimentalDate(sock, from, lowerText, session);
                break;
            case 'experimental_time':
                await this.handleExperimentalTime(sock, from, lowerText, session);
                break;
            case 'experimental_name':
                await this.handleExperimentalName(sock, from, text, session);
                break;
            case 'experimental_companion':
                await this.handleExperimentalCompanion(sock, from, lowerText, session);
                break;
            case 'experimental_companion_name':
                await this.handleExperimentalCompanionName(sock, from, text, session);
                break;
            case 'experimental_confirm':
                await this.handleExperimentalConfirm(sock, from, lowerText, session);
                break;
        }
    }

    async sendExperimentalUnitSelection(sock, from) {
        const message = `🏐 *AGENDAR AULA EXPERIMENTAL* ⚽\n\n` +
            `Ótimo! Vamos agendar sua aula experimental! 🎯\n\n` +
            `Escolha a unidade:\n\n` +
            `1 - RECREIO (Praia, Posto 11)\n` +
            `2 - BANGU (Califórnia)\n\n` +
            `Digite o número da unidade ou *MENU* para voltar.`;
        await sock.sendMessage(from, { text: message });
    }

    async handleExperimentalUnit(sock, from, text, session) {
        const experimental = this.experimentalSessions.get(from) || {};
        let unitType = '';
        
        if (text === '1') {
            experimental.unidade = 'RECREIO';
            experimental.filePath = CONFIG.jsonFilePaths.recreio;
            unitType = 'recreio';
        } else if (text === '2') {
            experimental.unidade = 'BANGU';
            experimental.filePath = CONFIG.jsonFilePaths.bangu;
            unitType = 'bangu';
        } else {
            await sock.sendMessage(from, { text: `❌ Opção inválida. Por favor, escolha 1 ou 2.` });
            return;
        }
        
        this.experimentalSessions.set(from, experimental);
        session.state = 'experimental_date';
        await this.sendExperimentalDateSelection(sock, from, unitType);
    }

    getAvailableDates(unit) {
        const dates = [];
        const today = new Date();
        const daysToShow = 7;
        
        for (let i = 1; dates.length < daysToShow; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = date.getDay();
            
            if (unit === 'recreio' && dayOfWeek >= 1 && dayOfWeek <= 5) {
                dates.push(date);
            } else if (unit === 'bangu' && (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5)) {
                dates.push(date);
            }
        }
        return dates;
    }

    async sendExperimentalDateSelection(sock, from, unit) {
        const dates = this.getAvailableDates(unit);
        const experimental = this.experimentalSessions.get(from);
        experimental.availableDates = dates;
        this.experimentalSessions.set(from, experimental);
        
        const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        let message = `📅 *Unidade ${experimental.unidade} selecionada!* ✅\n\nEscolha o dia:\n\n`;
        
        dates.forEach((date, index) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            message += `${index + 1} - ${daysOfWeek[date.getDay()]} (${day}/${month})\n`;
        });
        
        message += `\n\nDigite o número do dia ou *MENU* para voltar.`;
        await sock.sendMessage(from, { text: message });
    }

    async handleExperimentalDate(sock, from, text, session) {
        const experimental = this.experimentalSessions.get(from);
        const dateIndex = parseInt(text) - 1;

        if (experimental && experimental.availableDates && dateIndex >= 0 && dateIndex < experimental.availableDates.length) {
            experimental.selectedDate = experimental.availableDates[dateIndex];
            this.experimentalSessions.set(from, experimental);
            session.state = 'experimental_time';
            await this.sendExperimentalTimeSelection(sock, from);
        } else {
            await sock.sendMessage(from, { text: `❌ Opção inválida. Por favor, escolha uma data válida.` });
        }
    }

   async sendExperimentalTimeSelection(sock, from) {
    const experimental = this.experimentalSessions.get(from);
    const date = experimental.selectedDate;
    const dateISO = date.toISOString().split('T')[0];
    const agenda = await storage.readAgenda(experimental.filePath);
    const agendaDoDia = agenda[dateISO] || {};

    let message = `⏰ *Data selecionada!* ✅\n\nHorários disponíveis:\n\n`;
    let availableTimes = [];
    
    // ATUALIZADO COM NOVOS HORÁRIOS DE BANGU
    let timeOptions = (experimental.unidade === 'RECREIO') 
        ? ['17:30', '18:30', '19:30'] 
        : ['07:00 LIVRE', '08:00 LIVRE', '09:00 INICIANTES', '18:00 INICIANTE B', '19:00 INICIANTE A', '20:00 LIVRE', '21:00 INTER/AVANÇADO'];

    timeOptions.forEach(time => {
        const timeKey = time.split(' ')[0];
        const spotsTaken = agendaDoDia[timeKey]?.length || 0;
        
        if (experimental.unidade !== 'RECREIO' || spotsTaken < 2) {
            let label = time;
            if (experimental.unidade === 'RECREIO') {
                label += ` (${2 - spotsTaken} vagas)`;
            }
            availableTimes.push({ original: time, label: label });
        }
    });

    if (availableTimes.length === 0) {
        await sock.sendMessage(from, { text: '😕 Poxa, não há mais vagas para esta data. Por favor, escolha outra.' });
        session.state = 'experimental_date';
        await this.sendExperimentalDateSelection(sock, from, experimental.unidade.toLowerCase());
        return;
    }

    experimental.availableTimes = availableTimes.map(t => t.original);
    
    availableTimes.forEach((time, index) => {
        message += `${index + 1} - ${time.label}\n`;
    });

    message += `\nDigite o número do horário ou *MENU* para voltar.`;
    this.experimentalSessions.set(from, experimental);
    await sock.sendMessage(from, { text: message });
}
    async handleExperimentalTime(sock, from, text, session) {
        const experimental = this.experimentalSessions.get(from);
        const timeIndex = parseInt(text) - 1;

        if (experimental && experimental.availableTimes && timeIndex >= 0 && timeIndex < experimental.availableTimes.length) {
            experimental.selectedTime = experimental.availableTimes[timeIndex];
            this.experimentalSessions.set(from, experimental);
            session.state = 'experimental_name';
            await sock.sendMessage(from, { 
                text: `✅ *Horário selecionado: ${experimental.selectedTime}*\n\nPor favor, digite seu nome completo:` 
            });
        } else {
            await sock.sendMessage(from, { text: `❌ Opção inválida. Por favor, escolha um horário válido.` });
        }
    }

    async handleExperimentalName(sock, from, text, session) {
        const sanitizedName = validators.sanitizeName(text);
        
        if (!validators.isFullName(sanitizedName)) {
            await sock.sendMessage(from, { text: `❌ Por favor, digite seu nome completo (nome e sobrenome).` });
            return;
        }
        
        const experimental = this.experimentalSessions.get(from);
        experimental.name = sanitizedName;

        if (experimental.unidade === 'RECREIO') {
            const dateISO = experimental.selectedDate.toISOString().split('T')[0];
            const timeKey = experimental.selectedTime.split(' ')[0];
            const agenda = await storage.readAgenda(experimental.filePath);
            const spotsTaken = agenda[dateISO]?.[timeKey]?.length || 0;

            if (spotsTaken === 0) {
                session.state = 'experimental_companion';
                await sock.sendMessage(from, { 
                    text: `✅ *Nome registrado: ${experimental.name}*\n\nVocê vai trazer alguém para fazer a aula junto?\n\n1 - SIM\n2 - NÃO` 
                });
            } else {
                experimental.companion = null;
                session.state = 'experimental_confirm';
                await this.sendExperimentalSummary(sock, from);
            }
        } else {
            session.state = 'experimental_companion';
            await sock.sendMessage(from, { 
                text: `✅ *Nome registrado: ${experimental.name}*\n\nVocê vai trazer alguém para fazer a aula junto?\n\n1 - SIM\n2 - NÃO` 
            });
        }
        this.experimentalSessions.set(from, experimental);
    }

    async handleExperimentalCompanion(sock, from, text, session) {
        const experimental = this.experimentalSessions.get(from);
        if (text === '1') {
            session.state = 'experimental_companion_name';
            await sock.sendMessage(from, { text: `Digite o nome do acompanhante:` });
        } else if (text === '2') {
            experimental.companion = null;
            session.state = 'experimental_confirm';
            await this.sendExperimentalSummary(sock, from);
        } else {
            await sock.sendMessage(from, { text: `❌ Opção inválida.` });
        }
    }

    async handleExperimentalCompanionName(sock, from, text, session) {
        const experimental = this.experimentalSessions.get(from);
        experimental.companion = validators.sanitizeName(text);
        session.state = 'experimental_confirm';
        await this.sendExperimentalSummary(sock, from);
    }

    async sendExperimentalSummary(sock, from) {
        const experimental = this.experimentalSessions.get(from);
        const date = experimental.selectedDate;
        const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        let message = `📋 *RESUMO DO AGENDAMENTO:*\n\n`;
        message += `👤 *Nome:* ${experimental.name}\n`;
        if (experimental.companion) {
            message += `👥 *Acompanhante:* ${experimental.companion}\n`;
        }
        message += `📍 *Unidade:* ${experimental.unidade}\n`;
        message += `📅 *Data:* ${daysOfWeek[date.getDay()]} (${day}/${month})\n`;
        message += `⏰ *Horário:* ${experimental.selectedTime}\n`;
        message += `💰 *Valor:* GRATUITO\n\n`;
        message += `Confirma os dados?\n1 - CONFIRMAR ✅\n2 - ALTERAR ❌`;
        
        await sock.sendMessage(from, { text: message });
    }

    async handleExperimentalConfirm(sock, from, text, session) {
        if (text === '1') {
            const experimental = this.experimentalSessions.get(from);
            const dateISO = experimental.selectedDate.toISOString().split('T')[0];
            const timeKey = experimental.selectedTime.split(' ')[0];
            
            const agenda = await storage.readAgenda(experimental.filePath);
            if (!agenda[dateISO]) agenda[dateISO] = {};
            if (!agenda[dateISO][timeKey]) agenda[dateISO][timeKey] = [];
            
            const spotsTaken = agenda[dateISO][timeKey].length;
            const spotsNeeded = experimental.companion ? 2 : 1;

            if (experimental.unidade === 'RECREIO' && (spotsTaken + spotsNeeded > 2)) {
                await sock.sendMessage(from, { 
                    text: '😕 Poxa! Alguém agendou nesse horário enquanto você preenchia os dados. As vagas acabaram.\n\nDigite *4* para tentar outro horário.' 
                });
                session.state = 'menu';
                return;
            }

            // Enviar notificação Telegram
            const notificationMessageIds = await this.notificationService.sendTelegramNotification(experimental);

            // Adicionar agendamentos
            const bookingData = { 
                name: experimental.name,
                notificationIds: notificationMessageIds 
            };
            agenda[dateISO][timeKey].push(bookingData);
            
            if (experimental.companion) {
                const companionBookingData = {
                    name: `${experimental.companion} (Acompanhante)`,
                    notificationIds: notificationMessageIds 
                };
                agenda[dateISO][timeKey].push(companionBookingData);
            }

            await storage.writeAgenda(experimental.filePath, agenda);

            await sock.sendMessage(from, {
                text: `✅ *AULA EXPERIMENTAL AGENDADA!*\n\n` +
                      `Seus dados foram enviados para o professor.\n` +
                      `Chegue 10 min antes com roupa confortável e traga água.\n\n` +
                      `Até lá! 🏐⚡\n\n` +
                      `Digite *MENU* para voltar.`
            });
            
            this.experimentalSessions.delete(from);
            session.state = 'menu';

        } else if (text === '2') {
            this.experimentalSessions.delete(from);
            session.state = 'experimental_unit';
            await this.sendExperimentalUnitSelection(sock, from);
        } else {
            await sock.sendMessage(from, { text: `❌ Opção inválida.` });
        }
    }
}

module.exports = BookingHandler;