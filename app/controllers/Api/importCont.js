const express = require('express');
const path = require('path');
const router = express.Router();
const axios = require("axios");

const ResultModel = require('../../models/studentResult');
const SessionModel = require('../../models/sessionResult');
const TitleModel = require('../../models/studentTitle');
const Utils = require('../../helpers/utils');

const reader = require('xlsx');
const excel_file = __dirname + "/Situation.xlsx";

module.exports = function() {
    return {
        importExcel: async function (req, res) {
            const sessionResults = [];
            const studentsResults = [];
            const studentInfo = [];
            let temp = null;

            try {
                const file = reader.readFile(excel_file);

                temp = reader.utils.sheet_to_json(file.Sheets["students_results"]);
                const isDuplicate = await ResultModel.findOne({telegramId: temp[0]["Telegram ID"], session_no: res["Session_no"]});

                if (isDuplicate) {
                    return res.json({state: "failed", data: "already exist!"});
                }

                temp = reader.utils.sheet_to_json(file.Sheets["student_titles"]);
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
                return res.json({state: "failed", data: "server error"});
            }

            return res.json({state: "success"});
        },

        getSessionData: async function (req, res) {
            const sessionData = req.body.sessionData;
            const totalData = await SessionModel.find();
            let addedCount = 0;

            for (const sessionItem of sessionData) {
                if (!totalData.find((item) => item.session_no == sessionItem.session_no)) {
                    addedCount ++;
                    const newSessionItem = new SessionModel();
                    newSessionItem.language = sessionItem.language;
                    newSessionItem.session_type = sessionItem.session_type;
                    newSessionItem.session_name = sessionItem.session_name;
                    newSessionItem.session_no = sessionItem.session_no;
                    newSessionItem.session_start = sessionItem.session_started;
                    newSessionItem.questions_no = sessionItem.questions_no;
                    const result = await newSessionItem.save();
                    totalData.push(result);
                }
            }

            return res.json({state: "success", data: `${addedCount} rows created successfully.`});
        }
    }
};
