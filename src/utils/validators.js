const validators = {
    isValidPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        return /^\d{11,13}$/.test(cleaned);
    },

    isValidDate: (date) => {
        return date instanceof Date && !isNaN(date);
    },

    isValidTime: (time) => {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    },

    isFullName: (name) => {
        const trimmed = name.trim();
        return trimmed.length >= 3 && trimmed.split(' ').length >= 2;
    },

    sanitizeName: (name) => {
        return name
            .trim()
            .replace(/[<>]/g, '')
            .replace(/\s+/g, ' ')
            .substring(0, 100);
    },

    sanitizeText: (text) => {
        return text
            .trim()
            .replace(/[<>]/g, '')
            .substring(0, 1000);
    }
};

module.exports = validators;