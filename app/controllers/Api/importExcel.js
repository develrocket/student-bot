const express = require('express');
const path = require('path');
const router = express.Router();

const ResultModel = require('../../models/studentResult');
const SessionModel = require('../../models/sessionResult');
const TitleModel = require('../../models/studentTitle');
const Utils = require('../../helpers/utils');

const reader = require('xlsx');
const excel_file = __dirname + "/Situation.xlsx";

// get home page
router.get('/', async (req, res, next) => {
    const sessionResults = [];
    const studentsResults = [];
    const studentInfo = [];

    try {
        const file = reader.readFile(excel_file);
        let temp = reader.utils.sheet_to_json(file.Sheets["student_titles"]);
        const res0 = await TitleModel.insertMany(temp);

        temp = reader.utils.sheet_to_json(file.Sheets["session_results"]);
        // eslint-disable-next-line no-shadow
        temp.forEach((res) => {
            sessionResults.push({
                no: res["ID"],
                language: res["Language"],
                session_type: res["Session_type"],
                session_name: res["Session_name"],
                session_no: res["Session_no"],
                session_start: Utils.excelDateToJSDate(res["Session_start"]),
                questions_no: res["Questions_no"],
                students_no: res["Students_no"],
            });
        });

        const res1 = await SessionModel.insertMany(sessionResults);

        temp = reader.utils.sheet_to_json(file.Sheets["students_results"]);

        temp.sort((a, b) => a["Session_no"] - b["Session_no"]);

        // eslint-disable-next-line no-shadow
        for (const res of temp) {
            const session = await SessionModel.findOne({session_no: res["Session_no"]});

            const filteredId = studentInfo.findIndex((item) => item.tel_id === (res["Telegram ID"] * 1));
            let title = "";
            let totalFortuna = 0;
            let sumPoint = 0;
            if (filteredId < 0) {
                studentInfo.push({tel_id: res["Telegram ID"], sumPoint: res["Session_points"], sumFortuna: res["Fortuna_points"]});
                totalFortuna = res["Fortuna_points"];
                sumPoint = res["Session_points"];
                title = await Utils.getTitle(res["Session_points"] * 1);
            } else {
                studentInfo[filteredId].sumPoint += res["Session_points"];
                studentInfo[filteredId].sumFortuna += res["Fortuna_points"];
                sumPoint = studentInfo[filteredId].sumPoint;
                totalFortuna = studentInfo[filteredId].sumFortuna;
                title = await Utils.getTitle(studentInfo[filteredId].sumPoint);
            }

            studentsResults.push({
                no: res["ID"],
                username: res["Username"],
                telegramId: res["Telegram ID"],
                session: session._id,
                session_no: res["Session_no"],
                session_points: res["Session_points"],
                session_rank: res["Session_rank"],
                fortuna_points: res["Fortuna_points"],
                title: title,
                sum_point: sumPoint,
                total_fortuna_user: totalFortuna,
            });
        }

        const res2 = await ResultModel.insertMany(studentsResults);
    } catch (e) {
        console.log(e);
        return res.json("failed");
    }

    return res.json("success");
});

module.exports = router;
