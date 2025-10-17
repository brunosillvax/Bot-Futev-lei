const schedule = require('node-schedule');
const CONFIG = require('../config');
const logger = require('../utils/logger');

class PollHandler {
    constructor() {
        this.enqueteNameIndex = {
            segunda: 0,
            terca: 0,
            quarta: 0,
            quinta: 0,
            sexta: 0,
            sabado: 0
        };
        this.pinnedPolls = new Map(); // Armazenar enquetes fixadas
    }

    getEnqueteName(dia) {
        const nomes = CONFIG.nomesEnquetes[dia];
        const nome = nomes[this.enqueteNameIndex[dia]];
        this.enqueteNameIndex[dia] = (this.enqueteNameIndex[dia] + 1) % nomes.length;
        return nome;
    }

    async createPoll(sock, groupId, title, options) {
        try {
            // Verificar se bot é admin antes de tentar fixar
            const groupMetadata = await sock.groupMetadata(groupId).catch(() => null);
            const botId = sock.user?.id;
            const isBotAdmin = groupMetadata?.participants?.find(
                p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin')
            );

            if (!isBotAdmin) {
                logger.warn(`⚠️ Bot não é admin no grupo ${groupId}, enquete será criada mas não fixada`);
            }

            // Envia mensagem temporária para sincronizar
            await sock.sendMessage(groupId, { text: '.' });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Cria a enquete
            const pollMessage = await sock.sendMessage(groupId, {
                poll: {
                    name: title,
                    values: options,
                    selectableCount: 1
                }
            });

            logger.info(`✅ Enquete criada: ${title}`);

            // Tentar fixar apenas se for admin
            if (isBotAdmin) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                try {
                    // Desafixar enquete anterior do mesmo grupo se existir
                    if (this.pinnedPolls.has(groupId)) {
                        const oldPollId = this.pinnedPolls.get(groupId);
                        await sock.groupPinMessage(groupId, oldPollId, false).catch(() => {});
                    }

                    // Fixar nova enquete
                    await sock.groupPinMessage(groupId, pollMessage.key.id, true);
                    this.pinnedPolls.set(groupId, pollMessage.key.id);
                    logger.info(`📌 Enquete fixada no grupo ${groupId}.`);

                    // Agendar desafixar após 24 horas
                    setTimeout(async () => {
                        try {
                            await sock.groupPinMessage(groupId, pollMessage.key.id, false);
                            this.pinnedPolls.delete(groupId);
                            logger.info(`📌 Enquete desafixada automaticamente após 24 horas no grupo ${groupId}.`);
                        } catch (err) {
                            logger.error('Erro ao desafixar mensagem:', err);
                        }
                    }, 86400000); // 24 horas

                } catch (error) {
                    logger.error(`❌ Erro ao fixar enquete: ${error.message}`);
                }
            }

        } catch (error) {
            logger.error(`❌ Erro ao criar enquete no grupo ${groupId}:`, error);
        }
    }

    schedulePolls(sock) {
        // Recreio - Segunda a Sexta às 8h
        schedule.scheduleJob('0 8 * * 1-5', async () => {
            const day = new Date().getDay();
            const dayNames = ['', 'segunda', 'terca', 'quarta', 'quinta', 'sexta'];
            const enqueteName = this.getEnqueteName(dayNames[day]);
            
            if (CONFIG.gruposWhatsApp.recreio) {
                await this.createPoll(sock, CONFIG.gruposWhatsApp.recreio, enqueteName, [
                    "17:30 ⚡",
                    "18:30 ⚡",
                    "19:30 ⚡"
                ]);
            }
        });

        // Bangu - Domingo 20h (para segunda) - ATUALIZADO COM NOVOS HORÁRIOS
        schedule.scheduleJob('0 20 * * 0', async () => {
            const enqueteName = this.getEnqueteName('segunda');
            if (CONFIG.gruposWhatsApp.bangu) {
                await this.createPoll(sock, CONFIG.gruposWhatsApp.bangu, enqueteName, [
                    "07h00 - LIVRE ⚡",
                    "08h00 - LIVRE ⚡",
                    "09h00 - INICIANTES ⚡",
                    "18h00 - INICIANTE A ⚡",
                    "19h00 - INICIANTE B ⚡",
                    "20h00 - LIVRE ⚡",
                    "21h00 - INTERMEDIÁRIO/AVANÇADO ⚡"
                ]);
            }
        });

        // Bangu - Terça 20h (para quarta) - ATUALIZADO COM NOVOS HORÁRIOS
        schedule.scheduleJob('0 20 * * 2', async () => {
            const enqueteName = this.getEnqueteName('quarta');
            if (CONFIG.gruposWhatsApp.bangu) {
                await this.createPoll(sock, CONFIG.gruposWhatsApp.bangu, enqueteName, [
                    "07h00 - LIVRE ⚡",
                    "08h00 - LIVRE ⚡",
                    "09h00 - INICIANTES ⚡",
                    "18h00 - INICIANTE A ⚡",
                    "19h00 - INICIANTE B ⚡",
                    "20h00 - LIVRE ⚡",
                    "21h00 - INTERMEDIÁRIO/AVANÇADO ⚡"
                ]);
            }
        });

        // Bangu - Quinta 20h (para sexta) - ATUALIZADO COM NOVOS HORÁRIOS
        schedule.scheduleJob('0 20 * * 4', async () => {
            const enqueteName = this.getEnqueteName('sexta');
            if (CONFIG.gruposWhatsApp.bangu) {
                await this.createPoll(sock, CONFIG.gruposWhatsApp.bangu, enqueteName, [
                    "07h00 - LIVRE ⚡",
                    "08h00 - LIVRE ⚡",
                    "09h00 - INICIANTES ⚡",
                    "18h00 - INICIANTE A ⚡",
                    "19h00 - INICIANTE B ⚡",
                    "20h00 - LIVRE ⚡",
                    "21h00 - INTERMEDIÁRIO/AVANÇADO ⚡"
                ]);
            }
        });

        // Recreio - Sexta 20h (para sábado)
        schedule.scheduleJob('0 20 * * 5', async () => {
            const enqueteName = this.getEnqueteName('sabado');
            if (CONFIG.gruposWhatsApp.recreio) {
                await this.createPoll(sock, CONFIG.gruposWhatsApp.recreio, enqueteName, [
                    "Treino ⚡",
                    "Treino + Joguinho ⚡"
                ]);
            }
        });

        logger.info('📅 Enquetes automáticas agendadas!');
    }

    async handleManualPollCommand(sock, from, command) {
        const day = new Date().getDay();
        const dayNames = ['', 'segunda', 'terca', 'quarta', 'quinta', 'sexta'];
        
        if (command === '@bot enquete recreio') {
            const enqueteName = this.getEnqueteName(dayNames[day] || 'segunda');
            await this.createPoll(sock, from, enqueteName, [
                "17:30 ⚡",
                "18:30 ⚡",
                "19:30 ⚡"
            ]);
            return true;
        } else if (command === '@bot enquete bangu') {
            const enqueteName = this.getEnqueteName(dayNames[day] || 'segunda');
            // ATUALIZADO COM NOVOS HORÁRIOS
            await this.createPoll(sock, from, enqueteName, [
                "07h00 - LIVRE ⚡",
                "08h00 - LIVRE ⚡",
                "09h00 - INICIANTES ⚡",
                "18h00 - INICIANTE A ⚡",
                "19h00 - INICIANTE B ⚡",
                "20h00 - LIVRE ⚡",
                "21h00 - INTERMEDIÁRIO/AVANÇADO ⚡"
            ]);
            return true;
        } else if (command === '@bot enquete sabado') {
            const enqueteName = this.getEnqueteName('sabado');
            await this.createPoll(sock, from, enqueteName, [
                "Treino ⚡",
                "Treino + Joguinho ⚡"
            ]);
            return true;
        }
        
        return false;
    }
}

module.exports = PollHandler;