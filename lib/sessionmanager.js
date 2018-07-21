const mysql = require("mysql"),
      debug = require("debug")("cpsx-api:server");

const DatabaseHandler = require("../lib/database").DatabaseHandler;
const DATABASES       = require("../lib/database").DATABASES;

function getProblemShortID(moduleID) {
    let blockPattern = /problem\+block\@(\w+)/g,
        shortID      = "";
    
    let match = blockPattern.exec(moduleID);

    if (match != null) {
        shortID = match[1];
    }

    return shortID;
}

/**
 * A static object containing functions pertaining to individual partnered sessions
 * 
 * @const {Object}
 */
const SessionManager = {
    getPartner: (userID) => {
        let queryStatement = String.raw`SELECT user1, user2 FROM user_groups WHERE (user1=${userID} OR user2=${userID}) AND status="valid"`;

        return new Promise((resolve, reject) => {
            DatabaseHandler.connect(DATABASES.COLLAB_ASSESS)
                .then(connection => DatabaseHandler.query(connection, queryStatement))
                .then((results, fields) => {
                    debug(`Successfully executed partner search query for user "${userID}"`);

                    if (results.length === 0) {
                        return reject("No active session found -- cannot grade problem!");
                    } else {
                        let u1 = results[0].user1,
                            u2 = results[0].user2;
                        
                        resolve(userID === u1 ? u2 : u1);
                    }
                })
                .catch(err => {
                    return reject(err);
                });
        });
    },

    getPartnerAnswerForProblem: (partnerID, problemID) => {
        let queryStatement = String.raw`SELECT state FROM courseware_studentmodule WHERE module_id="${problemID}" AND student_id=${partnerID}`;

        return new Promise((resolve, reject) => {
            let shortID = getProblemShortID(problemID);

            if (shortID.length === 0) {
                return reject(`Could not determine the short ID of block: ${problemID}`);
            }

            DatabaseHandler.connect(DATABASES.EDX)
                .then(connection => DatabaseHandler.query(connection, queryStatement))
                .then((results, fields) => {
                    debug(`Query for partner "${partnerID}" answer executed safely`);

                    // This will sort through all the results to find the correct row, the one with "correct_map" as a valid key
                    let validRows = results.filter(row => !!row.correct_map);

                    if (validRows.length !== 0) {
                        resolve(JSON.stringify(validRows[0].student_answers[`${shortID}_2_1`])); 
                    } else {
                        return reject(`Answer mapping for "${shortID}" not found. Perhaps the partner hasn't submitted yet?`);
                    }
                })
                .catch(err => {
                    return reject(err);
                });
        });
    },

    _testInsertMockAnswers: ((user1, ans1, user2, ans2, courseID, problemID) => {
        let state = {};
        state.correct_map = {};

        let problemShortID = getProblemShortID(problemID);

        if (problemShortID.length === 0) {
            return Promise.reject("Malformatted problem ID");
        }

        state.correct_map[`${problemShortID}_2_1`] = {thing: "stuff", anotherThing: "moreStuff"};
        state.student_answers = {};
        
        let user1State = Object.assign({}, state);
        user1State[`${problemShortID}_2_1`] = mysql.escape(ans1);

        let user2State = Object.assign({}, state);
        user2State[`${problemShortID}_2_1`] = mysql.escape(ans2);

        return new Promise((resolve, reject) => {
            let stateString1 = JSON.stringify(user1State),
                stateString2 = JSON.stringify(user2State);

            let query1 = String.raw`INSERT INTO courseware_studentmodule (module_type, module_id, course_id, state, done, created, modified, student_id) values("problem", "${problemID}", "${courseID}", "${stateString1}", "na", Now(), Now(), ${user1}) ON DUPLICATE KEY UPDATE state="${stateString1}", modified=Now();`;

            DatabaseHandler.connect(DATABASES.EDX)
                .then(connection => DatabaseHandler.queryNoRelease(connection, query1))
                .then((connection, results, fields) => {
                    debug(`Successfully inserted state for user "${user1}"`);

                    let query2 = String.raw`INSERT INTO courseware_studentmodule (module_type, module_id, course_id, state, done, created, modified, student_id) values("problem", "${problemID}", "${courseID}", "${stateString2}", "na", Now(), Now(), ${user2}) ON DUPLICATE KEY UPDATE state="${stateString2}", modified=Now();`;

                    return DatabaseHandler.query(connection, query2);
                })
                .then((results, fields) => {
                    debug(`Successfully inserted state for user "${user2}"`);
                    resolve();
                })
                .catch(err => {
                    return reject(err);
                });
        });
    })
};

module.exports = SessionManager;