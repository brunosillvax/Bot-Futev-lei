const winston = require('winston');
const path = require('path');
const fs = require('fs');
const CONFIG = require('../config');

// Criar diretório de logs se não existir
if (!fs.existsSync(CONFIG.paths.logs)) {
    fs.mkdirSync(CONFIG.paths.logs, { recursive: true });
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'bot-futevolei' },
    transports: [
        // Arquivo para erros
        new winston.transports.File({ 
            filename: path.join(CONFIG.paths.logs, 'error.log'), 
            level: 'error' 
        }),
        // Arquivo para todas as logs
        new winston.transports.File({ 
            filename: path.join(CONFIG.paths.logs, 'combined.log') 
        })
    ]
});

// Se não estiver em produção, log no console também
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;