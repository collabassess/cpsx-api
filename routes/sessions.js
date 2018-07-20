const express = require("express"),
      debug   = require("debug")("cpsx-api:server"),
      router  = express.Router(),
      
      SessionManager = require("../lib/sessionmanager");

router.post("/getPartner", (req, res) => {
    let currentUser = req.body.curr_user,
        retval      = {};
    
    SessionManager.getPartner(currentUser)
        .then(partnerID => {
            retval.partner = partnerID;
            res.send(JSON.stringify(retval));
        })
        .catch(err => {
            debug(err);
            retval.err = err;
            res.send(JSON.stringify(retval));
        });
});

router.post("/getPartnerAnswerForProblem", (req, res) => {
    let currentUser = req.body.curr_user,
        problemID   = req.body.problem_id,
        retval      = {};
    
    SessionManager.getPartner(currentUser)
        .then(partnerID => SessionManager.getPartnerAnswerForProblem(partnerID, problemID))
        .then(answer => {
            retval.ans = answer;
            res.send(JSON.stringify(retval));
        })
        .catch(err => {
            debug(err);
            retval.err = err;
            res.send(JSON.stringify(retval));
        });
});

router.post("/testInsertValues", (req, res) => {
    let user1    = req.body.user1,
        user2    = req.body.user2,
        ans1     = req.body.ans1,
        ans2     = req.body.ans2,
        course   = req.body.course_id,
        moduleId = req.body.module_id;
    
    SessionManager._testInsertMockAnswers(user1, ans1, user2, ans2, course, moduleId)
        .then(() => {
            // Yay successfully inserted
            res.send(JSON.stringify({success: true}));
        })
        .catch(err => {
            debug(err);
            res.send(JSON.stringify({success: false}));
        });
});

module.exports = router;