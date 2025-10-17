const logger = require('./logger');

class SessionManager {
    constructor() {
        this.userSessions = new Map();
		this.pausedChats = new Set(); // ADICIONAR ESTA LINHA
        this.cleanupTimer = null;
    }

    getSession(userId) {
        if (!this.userSessions.has(userId)) {
            this.userSessions.set(userId, {
                state: 'menu',
                isPaused: false,
                lastActivity: Date.now()
            });
        }
        
        const session = this.userSessions.get(userId);
        session.lastActivity = Date.now();
        return session;
    }

    updateSession(userId, session) {
        session.lastActivity = Date.now();
        this.userSessions.set(userId, session);
    }

     

    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            const now = Date.now();
            const timeout = 30 * 60 * 1000; // 30 minutos
            
            for (const [userId, session] of this.userSessions.entries()) {
                if (session.lastActivity && (now - session.lastActivity > timeout)) {
                    this.userSessions.delete(userId);
                    logger.info(`Session cleaned for user: ${userId}`);
                }
            }
        }, 5 * 60 * 1000); // Verificar a cada 5 minutos
    }

    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
    }
}

module.exports = SessionManager;