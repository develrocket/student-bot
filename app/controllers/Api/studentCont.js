const express = require('express');
const router = express.Router();

const StudentResultModel = require('../../models/studentResult');
const SessionModel = require('../../models/sessionResult');

module.exports = function(){

    return {
        filter: async function (req, res) {
            const {telegramId, term} = req.query;
            let filterQuery = {telegramId: telegramId};
            const results = await StudentResultModel.find(filterQuery).populate("session").sort({session_no: -1});

            if (term && term !== "") {
                let delta = term === "lastday" ? 1 : term === "lastweek" ? 7 : term === "lastmonth" ? 30 :
                    term === "last3months" ? 90 : 0;
                const now = new Date();
                const from = now.setDate(now.getDate() - delta);
                const filteredData = results.filter((item) => {
                    return item.session.session_start > from;
                });

                return res.json({result: "success", data: filteredData});
            } else {
                return res.json({result: "success", data: results});
            }
        },

        getAllFortuna: async function (req, res) {
            const results = await StudentResultModel.find().sort({session_no: -1});

                // merge all stu
                const studentResult = [];
                for (const item of results) {
                    const filteredId = studentResult.findIndex((stuItem) => item.telegramId === stuItem.telegramId);
                    if (filteredId < 0) {
                        const temp = {
                            username: item.username,
                            telegramId: item.telegramId,
                            title: item.title,
                            total_fortuna_user: item.total_fortuna_user,
                        };
                        studentResult.push(temp);
                    }
                }

                return res.json({result: "success", data: studentResult});
        },

        getInfo: async function (req, res) {
            const {telegramId} = req.query;
            let filterQuery = {telegramId: telegramId};
            const results = await StudentResultModel.findOne(filterQuery).sort({session_no: -1});

            if (results) {
                return res.json({username: results.username, telegramId: results.telegramId, title: results.title,
                    sum_point: results.sum_point});
            }
            return res.json({result: "failed", data: "wrong parameter"});
        },

        upRank: async function (req, res) {
            const {telegramId, term} = req.query;
            let filterQuery = {telegramId: telegramId};
            const results = await StudentResultModel.find(filterQuery).populate("session").sort({session_no: -1});
            if (results.length === 0) {
                return res.json({result: "success", data: []});
            }
            const latestDate = new Date(results[0].session.session_start);
            let currentRank = results[0].session_rank;
            let averageRank = 0;
            let sumRank = 0;

            if (term && term !== "") {
                let delta = term === "lastday" ? 1 : term === "lastweek" ? 7 : term === "lastmonth" ? 30 :
                    term === "last3months" ? 90 : 0;
                const from = latestDate.setDate(latestDate.getDate() - delta);
                const filteredData = results.filter((item) => {
                    return item.session.session_start > from;
                });

                for (const item of filteredData) {
                    sumRank += item.session_rank;
                }
                averageRank = Math.round(sumRank / filteredData.length);

                return res.json({result: "success", data: (currentRank - averageRank)});
            } else {
                return res.json({result: "failed", data: 'wrong parameter'});
            }
        },

        sort: async function (req, res) {
            const {term} = req.query;
            const results = await StudentResultModel.find().populate("session");

            if (term && term !== "") {
                // filter with term
                let delta = term === "lastday" ? 1 : term === "lastweek" ? 7 : term === "lastmonth" ? 30 :
                    term === "last3months" ? 90 : 0;
                const now = new Date();
                const from = now.setDate(now.getDate() - delta);
                const filteredData = results.filter((item) => {
                    return item.session.session_start > from;
                });

                // merge & sum all stu point
                const studentResult = [];
                for (const item of filteredData) {
                    const filteredId = studentResult.findIndex((stuItem) => item.telegramId === stuItem.telegramId);
                    if (filteredId < 0) {
                        const temp = {
                            no: item.no,
                            username: item.username,
                            telegramId: item.telegramId,
                            session: item.session,
                            session_no: item.session_no,
                            total_points: item.session_points,
                            session_rank: item.session_rank,
                            fortuna_points: item.fortuna_points,
                            title: item.title,
                            total_fortuna_user: item.total_fortuna_user,
                        };
                        studentResult.push(temp);
                    } else {
                        studentResult[filteredId].total_points = studentResult[filteredId].total_points + item.session_points;
                    }
                }

                // sort records
                studentResult.sort((a, b) => b.total_points - a.total_points);

                return res.json({result: "success", data: studentResult});
            } else {
                return res.json({result: "failed", data: "wrong parameter"});
            }
        },
    };

};
