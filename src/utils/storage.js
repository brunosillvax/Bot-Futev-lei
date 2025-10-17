const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
const CONFIG = require('../config');

class Storage {
    constructor() {
        this.initDirectories();
    }

    async initDirectories() {
        const dirs = [CONFIG.paths.data, CONFIG.paths.backups];
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                logger.error('Erro ao criar diretório:', error);
            }
        }
    }

    async readAgenda(filePath) {
        try {
            await fs.access(filePath);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.info(`Arquivo não encontrado: ${filePath}, criando novo...`);
            return {};
        }
    }

    async writeAgenda(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 4));
            logger.info(`Agenda salva: ${filePath}`);
        } catch (error) {
            logger.error('Erro ao salvar agenda:', error);
            throw error;
        }
    }

    async backup(unit) {
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
            const sourcePath = CONFIG.jsonFilePaths[unit];
            const backupPath = path.join(
                CONFIG.paths.backups, 
                `${unit}_${timestamp}.json`
            );
            
            const data = await this.readAgenda(sourcePath);
            await fs.writeFile(backupPath, JSON.stringify(data, null, 2));
            
            logger.info(`Backup criado: ${backupPath}`);
            
            // Limpar backups antigos (manter últimos 30 dias)
            await this.cleanOldBackups(unit, 30);
            
            return backupPath;
        } catch (error) {
            logger.error('Erro ao criar backup:', error);
            throw error;
        }
    }

    async cleanOldBackups(unit, daysToKeep) {
        try {
            const files = await fs.readdir(CONFIG.paths.backups);
            const now = Date.now();
            const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
            
            for (const file of files) {
                if (file.startsWith(unit)) {
                    const filePath = path.join(CONFIG.paths.backups, file);
                    const stats = await fs.stat(filePath);
                    
                    if (now - stats.mtime.getTime() > maxAge) {
                        await fs.unlink(filePath);
                        logger.info(`Backup antigo removido: ${file}`);
                    }
                }
            }
        } catch (error) {
            logger.error('Erro ao limpar backups:', error);
        }
    }
}

module.exports = new Storage();