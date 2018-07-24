const express = require("express"),
      debug   = require("debug")("cpsx-api:server"),
      router  = express.Router();

const DatabaseHandler = require("../lib/database").DatabaseHandler,
      DATABASES       = require("../lib/database").DATABASES;

// A dirty fix to fetch the user ID -- TODO: FIND A BETTER ALTERNATIVE
router.post("/fetchUserFromCorrectMap", (req, res) => {
    let cmap    = req.body.correct_map,
        problem = req.body.problem_id;

    let queryStatement = "SELECT student_id FROM courseware_studentmodule WHERE module_id=? AND state=?";

    DatabaseHandler.connect(DATABASES.EDX)
        .then(connection => DatabaseHandler.query(connection, queryStatement, [problem, cmap]))
        .then((results, fields) => {
            if (results.length < 1) {
                res.send(JSON.stringify({err: "No user found!"}));
            } else {
                res.send(JSON.stringify({user: results[0].student_id}));
            }
        })
        .catch(err => {
            res.send(JSON.stringify({err: err}));
        });
});

module.exports = router;