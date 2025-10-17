const pausedChats = new Set();

module.exports = {
    pauseBot: (chatId) => {
        pausedChats.add(chatId);
        console.log(`Bot pausado para: ${chatId}`);
    },
    
    isPaused: (chatId) => {
        return pausedChats.has(chatId);
    },
    
    resumeBot: (chatId) => {
        pausedChats.delete(chatId);
        console.log(`Bot retomado para: ${chatId}`);
    }
};