const DatabaseHandler = require("../lib/database").DatabaseHandler,
      DATABASES       = require("../lib/database").DATABASES;

const dbhandler = new DatabaseHandler(),
      PATTERN   = /\w+\=\w+/gi;

function parseBoolean(str) {
    const TRUE = ["true", "yes"];

    if (TRUE.includes(str.toLowerCase())) {
        return true;
    } else {
        return false;
    }
}

/**
 * Parse the CPSX settings
 * 
 * @param {string} algorithmRequest The requested algortihm from the CPSXBlock
 * @returns An array of key-value pairs (k, v): k is column name, v is boolean flag for homogeneous pairing on k
 */
function parseAlgorithm(algorithmRequest) {
    let match   = PATTERN.exec(algorithmRequest),
        mapping = [];

    while (match != null) {
        let tuple   = match[0].split("="),
            payload = {};
        
        payload[tuple[0]] = tuple[1];
        mapping.push(payload);

        match = PATTERN.exec(algorithmRequest);
    }

    return mapping;
}

/**
 * Manages the waiting pool as well as handling pairing
 * 
 * @const {Object} 
 */
const UserPoolManager = {
    currentPool: () => {
        let queryStatement = "select * from get_available_partners";
        let response = "";

        return new Promise((resolve, reject) => {
            dbhandler.connect(DATABASES.COLLAB_ASSESS)
                .then((connection) => dbhandler.query(connection, queryStatement))
                .then((rows, fields) => {
                    if (rows.length > 0) {
                        response = JSON.stringify(rows);
                    }

                    resolve(response);
                })
                .catch((err) => {
                    return reject(err);
                });
        });
    },

    addUser: (user) => {
        let queryStatement = "INSERT INTO user_status(user_id) values(?) ON DUPLICATE KEY UPDATE status=\"online\", last_online=Now(), grouped=False";

        return new Promise((resolve, reject) => {
            dbhandler.connect(DATABASES.COLLAB_ASSESS)
                .then((connection) => dbhandler.query(connection, queryStatement, [user]))
                .then((results, fields) => {
                    console.log(results);
                    console.log("1 record inserted/updated");
                    resolve(true);
                })
                .catch((err) => {
                    // No rejections, just boolean flag. Error gets logged and application stays active.
                    console.log(err);
                    resolve(false);
                });
        });
    },

    updateLastOnline: (currentUser) => {
        let queryStatement = "update user_status set last_online=Now() where user_id=? AND status=\"online\"";

        return new Promise((resolve, reject) => {
            dbhandler.connect(DATABASES.COLLAB_ASSESS)
                .then((connection) => dbhandler.query(connection, queryStatement, [currentUser]))
                .then((results, fields) => {
                    console.log(`${results.affectedRows} record${results.affectedRows !== 1 ? "s" : ""} updated`);
                    resolve(true);
                })
                .catch((err) => {
                    // No rejections, just boolean flag. Error gets logged and application stays active.
                    console.log(err);
                    resolve(false);
                });
        });
    },

    setOffline: (currentUser) => {
        let queryStatement = "update user_status set status=\"offline\" where user_id=? AND status=\"online\"";

        return new Promise((resolve, reject) => {
            dbhandler.connect(DATABASES.COLLAB_ASSESS)
                .then((connection) => dbhandler.query(connection, queryStatement, [currentUser]))
                .then((results, fields) => {
                    console.log(`${results.affectedRows} record${results.affectedRows !== 1 ? "s" : ""} updated`);
                    resolve(true);
                })
                .catch((err) => {
                    // No rejections, just boolean flag. Error gets logged and application stays active.
                    console.log(err);
                    resolve(false);
                });
        });
    }
};

module.exports = UserPoolManager;