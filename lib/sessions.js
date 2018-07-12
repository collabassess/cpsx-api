
const DatabaseHandler = require("../lib/database").DatabaseHandler;
const DATABASES       = require("../lib/database").DATABASES;

const dbhandler = new DatabaseHandler();

/**
 * A static object containing functions pertaining to individual partnered sessions
 * 
 * @const {Object}
 */
const SessionManager = {
    getPartnerAnswerForProblem: (partnerID, problemID) => {
        let queryStatement = `SELECT state FROM courseware_studentmodule WHERE module_id="${problemID}" AND student_id=${partnerID}`,
            blockPattern   = /problem\+block\@(\w+)/g,
            shortID        = "";
        

        return new Promise((resolve, reject) => {
            let match = blockPattern.exec(problemID);

            if (match != null) {
                shortID = match[1];
            } else {
                return reject(`Could not determine the short ID of block: ${problemID}`);
            }

            dbhandler.connect(DATABASES.EDX)
                .then(connection => dbhandler.query(connection, queryStatement))
                .then((results, fields) => {
                    let validRows = results.filter(row => !!row.correct_map); // Should be of length 1, given that's how edX normally behaves

                    if (validRows.length === 0) {
                        resolve(JSON.stringify(validRows[0].student_answers[`${shortID}_2_1`])); 
                    } else {
                        return reject(`Answer mapping for "${shortID}" not found. Perhaps the partner hasn't submitted yet?`);
                    }
                });
        });
    }
};