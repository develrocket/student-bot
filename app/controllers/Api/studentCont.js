const express = require('express');
const router = express.Router();

const StudentResultModel = require('../../models/studentResult');
const SessionModel = require('../../models/sessionResult');
const axios = require('axios').default;

const fetchSession = async function() {
    let sessions = await SessionModel.find().sort({session_no: -1}).limit(1);
    let lastId = sessions[0].session_no;
    try {
        let res = await axios.get('https://fortunaenglish.com/api/fetch/livesession?lastId=' + lastId);

        for (const sessionItem of res.data) {
            const newSessionItem = new SessionModel();
            newSessionItem.language = sessionItem.language;
            newSessionItem.session_type = sessionItem.type;
            newSessionItem.session_name = sessionItem.session_name;
            newSessionItem.session_no = sessionItem.id;
            newSessionItem.session_start = sessionItem.start_time;
            newSessionItem.questions_no = sessionItem.questions;
            await newSessionItem.save();
        }
        console.log('insert-new-session:', res.data.length);
    } catch (err) {
        console.log(err);
    }
}

module.exports = function(){

    return {
        fetchSession: async function(req, res) {
            await fetchSession();
            return res.json({result: "success"});
        },

        filter: async function (req, res) {
            const {telegramId, term} = req.query;
            let filterQuery = {telegramId: telegramId};
            const results = await StudentResultModel.find(filterQuery).sort({session_no: -1}).populate("session");

            if (results.length === 0) {
                return res.json({result: "success", data: []});
            }

            if (term && term !== "") {
                let delta = term === "lastday" ? 1 : term === "lastweek" ? 7 : term === "lastmonth" ? 30 :
                    term === "last3months" ? 90 : 0;
                const now = new Date(results[0].session.session_start);
                const from = now.setDate(now.getDate() - delta);
                const filteredData = results.filter((item) => {
                    return item.session.session_start > from;
                });

                return res.json({result: "success", data: filteredData});
            } else {
                return res.json({result: "success", data: results});
            }
        },

        upRank: async function (req, res) {
            const {telegramId, term} = req.query;
            let filterQuery = {telegramId: telegramId};
            const results = await StudentResultModel.find(filterQuery).sort({session_no: -1}).populate("session");
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
            const results = await StudentResultModel.find(filterQuery).sort({session_no: -1});

            if (results.length > 0) {
                return res.json({username: results[0].username, telegramId: results[0].telegramId, title: results[0].title,
                    sum_point: results[0].sum_point});
            }
            return res.json({result: "failed", data: "wrong parameter"});
        },

        sort: async function (req, res) {
            const {term} = req.query;
            const results = await StudentResultModel.find().sort({session_no: -1}).populate("session");

            if (results.length === 0) {
                return res.json({result: "success", data: []});
            }

            if (term && term !== "") {
                // filter with term
                let delta = term === "lastday" ? 1 : term === "lastweek" ? 7 : term === "lastmonth" ? 30 :
                    term === "last3months" ? 90 : 0;
                const now = new Date(results[0].session.session_start);
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
