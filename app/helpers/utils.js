const TitleModel = require('../models/studentTitle');

module.exports = {
    randomString(length) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHUJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < length; i += 1) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    excelDateToJSDate(excelDate) {
        const date = new Date(Math.round((excelDate - (25567 + 1)) * 86400 * 1000));
        const converted_date = date.toISOString().split('T')[0];
        return converted_date;
    },

    async getTitle(sumPoint) {
        const titles = await TitleModel.find();
        for (let i = 0; i < titles.length; i++) {
            if (sumPoint < titles[i].limit) {
                return titles[i - 1].title;
            }
        }
        return "";
    }
};
