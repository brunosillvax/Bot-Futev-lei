const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

const CONFIG = require('../config');
const logger = require('../utils/logger');
const MessageHandler = require('../handlers/message');
const GroupHandler = require('../handlers/group');
const PollHandler = require('../handlers/poll');
const SessionManager = require('../utils/sessionManager');
const pauseManager = require('../utils/pauseManager');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.messageHandler = new MessageHandler();
        this.groupHandler = new GroupHandler();
        this.pollHandler = new PollHandler();
        this.sessionManager = new SessionManager();
    }

    async start() {
        const { state, saveCreds } = await useMultiFileAuthState(CONFIG.paths.auth);
        
        this.sock = makeWASocket({
            auth: state
        });

        this.setupEventHandlers(saveCreds);
    }

    setupEventHandlers(saveCreds) {
        // Conexão
        this.sock.ev.on('connection.update', (update) => {
            this.handleConnectionUpdate(update);
        });

        // Salvar credenciais
        this.sock.ev.on('creds.update', saveCreds);

        // Mensagens
        this.sock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify') return;
            await this.handleMessage(m);
        });

        // Participantes do grupo
        this.sock.ev.on('group-participants.update', async (update) => {
            await this.groupHandler.handleParticipantUpdate(this.sock, update);
        });
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            logger.info('QR Code recebido, exibindo...');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.error('Conexão fechada:', lastDisconnect?.error);
            
            if (shouldReconnect) {
                logger.info('Reconectando...');
                await this.start();
            }
        } else if (connection === 'open') {
            logger.info('✅ Bot CT LK Futevôlei conectado com sucesso!');
            this.pollHandler.schedulePolls(this.sock);
            this.sessionManager.startCleanupTimer();
        }
    }

    async handleMessage(m) {
        const msg = m.messages[0];
        if (!msg.message) return;

        const from = msg.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || '';

        // Verificar se é mensagem do próprio bot (atendimento humano)
      if (msg.key.fromMe && !isGroup) {
    // Lista de comandos que o bot usa
    const botCommands = ['menu', '1', '2', '3', '4', '5', '6', '7', 'sim', 'não', 'nao', 's', 'n'];
    const textLower = text.toLowerCase().trim();
    
    // Verificar se é comando do bot
    const isCommand = botCommands.includes(textLower);
    
    // Só pausar se NÃO for comando E ainda não estiver pausado
    if (!isCommand && text.length > 0 && !pauseManager.isPaused(from)) {
        // Pausar o bot para este contato
        pauseManager.pauseBot(from);
        
        // Enviar aviso após 2 segundos
        setTimeout(async () => {
            try {
                await this.sock.sendMessage(from, {
                    text: '_💬 Atendimento manual ativado._\n' +
                          '_Digite "menu" quando quiser voltar ao bot automático._'
                });
            } catch (error) {
                logger.error('Erro ao enviar aviso de pausa:', error);
            }
        }, 2000);
    }
            
            return; // Sempre retornar para não processar mensagens próprias
        }

        // Processar mensagem
        if (isGroup) {
            await this.groupHandler.handleGroupMessage(this.sock, from, text);
        } else {
            await this.messageHandler.handlePrivateMessage(this.sock, from, text);
        }
    }

    async stop() {
        if (this.sock) {
          try {
            // Só faz logout se estiver conectado
            if (this.sock.user) {
                await this.sock.logout();
            }
        } catch (error) {
            logger.warn('Erro ao fazer logout:', error.message);
        }
        }
        this.sessionManager.stopCleanupTimer();
        logger.info('WhatsApp service stopped');
    }
}

module.exports = WhatsAppService;