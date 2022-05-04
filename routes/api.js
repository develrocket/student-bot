/* eslint-disable global-require, func-names */

const studentCont = require('../app/controllers/Api/studentCont')();

module.exports = function (app) {
    // home
    app.use('/api', require('../app/controllers/Api/home'));

    app.use('/api/import-excel', require('../app/controllers/Api/importExcel'));

    app.get('/api/student_result', studentCont.filter);
    app.get('/api/sort_student', studentCont.sort);
    app.get('/api/up_rank', studentCont.upRank);
    app.get('/api/student_info', studentCont.getInfo);
    app.get('/api/get_all_fortuna', studentCont.getAllFortuna);
    app.get('/api/fetch-session', studentCont.fetchSession);
};
