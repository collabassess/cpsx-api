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
        let queryStatement = "SELECT user1, user2 FROM user_groups WHERE (user1=? OR user2=?) AND status=\"valid\"",
            args           = [userID, userID];

        return new Promise((resolve, reject) => {
            DatabaseHandler.connect(DATABASES.COLLAB_ASSESS)
                .then(connection => DatabaseHandler.query(connection, queryStatement, args))
                .then((results, fields) => {
                    debug(`Successfully executed partner search query for user "${userID}"`);

                    if (results.length === 0) {
                        return reject("No active session found!");
                    } else {
                        let u1 = parseInt(results[0].user1),
                            u2 = parseInt(results[0].user2);
                        
                        resolve(userID === u1 ? u2 : u1);
                    }
                })
                .catch(err => {
                    return reject(err);
                });
        });
    },

    getUserAnswerForProblem: (userID, problemID) => SessionManager._userAnswerFetch(userID, problemID),

    getPartnerAnswerForProblem: (partnerID, problemID) => SessionManager._userAnswerFetch(partnerID, problemID),

    _userAnswerFetch: (userID, problemID) => {
        let queryStatement = "SELECT state FROM courseware_studentmodule WHERE module_id=? AND student_id=?",
            args           = [problemID, userID];

        return new Promise((resolve, reject) => {
            let shortID = getProblemShortID(problemID);

            if (shortID.length === 0) {
                return reject(`Could not determine the short ID of block: ${problemID}`);
            }

            DatabaseHandler.connect(DATABASES.EDX)
                .then(connection => DatabaseHandler.query(connection, queryStatement, args))
                .then((results, fields) => {
                    debug(`Query for user "${userID}" answer executed safely`);

                    let states = [];
                    results.forEach(row => {
                        states.push(JSON.parse(row.state));
                    });

                    // This will sort through all the results to find the correct row, the one with "correct_map" as a valid key
                    let validRows = states.filter(state => !!state.correct_map);
                    debug(`Valid rows: ${JSON.stringify(validRows)}`);

                    if (validRows.length !== 0) {
                        resolve(JSON.stringify(validRows[0].student_answers[`${shortID}_2_1`])); 
                    } else {
                        return reject(`Answer mapping for "${shortID}" not found. Perhaps the you or your partner hasn't submitted yet?`);
                    }
                })
                .catch(err => {
                    return reject(err);
                });
        });
    },

    _testInsertMockAnswers: (user1, ans1, user2, ans2, courseID, problemID) => {
        let problemShortID = getProblemShortID(problemID);

        if (problemShortID.length === 0) {
            return Promise.reject("Malformatted problem ID");
        }

        let state = {
            correct_map: {},
            student_answers: {}
        };

        state.correct_map[`${problemShortID}_2_1`] = {thing: "stuff", anotherThing: "moreStuff"};

        // Deep copy state without keeping references
        let user1State = JSON.parse(JSON.stringify(state)),
            user2State = JSON.parse(JSON.stringify(state));
        
        user1State.student_answers[`${problemShortID}_2_1`] = ans1;
        user2State.student_answers[`${problemShortID}_2_1`] = ans2;

        return new Promise((resolve, reject) => {
            let stateString1 = JSON.stringify(user1State),
                stateString2 = JSON.stringify(user2State);

            let queryStatement = "INSERT INTO courseware_studentmodule (module_type, module_id, course_id, state, done, created, modified, student_id) values(\"problem\", ?, ?, ?, \"na\", Now(), Now(), ?) ON DUPLICATE KEY UPDATE state=?, modified=Now();",
                args1          = [problemID, courseID, stateString1, user1, stateString1];

            DatabaseHandler.connect(DATABASES.EDX)
                .then(connection => DatabaseHandler.queryNoRelease(connection, queryStatement, args1))
                .then((connection, results, fields) => {
                    debug(`Successfully inserted state for user "${user1}"`);

                    let args2 = [problemID, courseID, stateString2, user2, stateString2];

                    return DatabaseHandler.query(connection, queryStatement, args2);
                })
                .then((results, fields) => {
                    debug(`Successfully inserted state for user "${user2}"`);
                    resolve();
                })
                .catch(err => {
                    return reject(err);
                });
        });
    }
};

module.exports = SessionManager;