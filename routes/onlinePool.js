var express = require('express');
var router = express.Router();

var mysql = require('../db_module/cpsx_db').pool;


//add users to user_pool(user_status table)
function addToUserPool(user, callback) {
    var query_statement = 'INSERT INTO user_status(user_id) values(?) ON DUPLICATE KEY UPDATE status="online", last_online=Now(), grouped=False';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
            callback(false);
        }else{
            conn.query(query_statement,[user], function (err, result) {
                conn.release();
                if (err) {
                    console.log(err);
                    callback(false);
                }else{
                    console.log(result);
                    console.log("1 record inserted/updated");
                    callback(true);
                }
            });
        }
    });
}

//update user_pool status of user as grouped, so that he doesn't show as available
function UserPoolToGrouped(curr_user,callback) {
    var query_statement = 'update user_status set grouped=True where user_id=? AND status="online"';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,result) => {
                conn.release();
                if (err) {
                    callback(false);
                }else{
                    console.log(result.affectedRows + " record(s) updated");
                    callback(true);
                }
            });
        }
    });
}

//remove user from user_pool online; In user_status table, turn the status to offline
function UserPoolToOffline(curr_user,callback) {
    var query_statement = 'update user_status set status="offline" where user_id=? AND status="online"';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,result) => {
                conn.release();
                if (err) {
                    callback(false);
                }else{
                    console.log(result.affectedRows + " record(s) updated");
                    callback(true);
                }
            });
        }
    });
}

//return available users in user_pool(user_status table), who are available to be connected
function getUserPool(callback) {
    var query_statement = 'select * from get_available_partners';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,(err,rows) => {
                conn.release();
                if (err) {
                    callback(0);
                }else if(rows.length > 0){
                    callback(JSON.stringify(rows));
                }else{
                    callback(0);
                }
            });
        }
    });
}

//update last online activity of user
function updateLastOnlineUserPool(curr_user,callback) {
    var query_statement = 'update user_status set last_online=Now() where user_id=? AND status="online"';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,result) => {
                conn.release();
                if (err) {
                    callback(false);
                }else{
                    console.log(result.affectedRows + " record(s) updated");
                    callback(true);
                }
            });
        }
    });
}

//get demo shark jet variable for the curr_user
function getDemoSharkJet(curr_user,callback) {
    var query_statement = 'select demo_shark_jet from user_info where user_id=? ';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,rows) => {
                conn.release();
                if (err) {
                    throw err;
                }else{
                    if(rows.length == 0){
                        callback(0);
                    }else{
                        console.log("inside getDemoSharkJet function:"+rows);
                        callback(rows[0].demo_shark_jet);
                    }
                }
            });
        }
    });
}

//matching users based on who is online and the matching criteria,same gender
function getDemoSharkJetBasedPair_Homogeneous(curr_user,callback) {
    getDemoSharkJet(curr_user,function (sharkjet) {
        if(sharkjet !== 0){
            var sharkjet_partner = '';
            if(sharkjet === 'jet'){
                sharkjet_partner = 'jet';
            }else{
                sharkjet_partner = 'shark';
            }
            var query_statement = 'select * from get_available_partners where demo_shark_jet=? AND user_id!=?';
            mysql.getConnection('CP_AS',function (err,conn) {
                if(err){
                    console.log("connection failed");
                }else{
                    conn.query(query_statement,[sharkjet_partner,curr_user],(err,rows) => {
                        conn.release();
                        if (err) {
                            callback("err");
                        }else{
                            if(rows.length == 0){
                                callback("err");
                            }else{
                                console.log(rows);
                                callback(JSON.stringify(rows));
                            }
                        }
                    });
                }
            });
        }else{
            callback("user not present in database");
        }
    });
}

//matching users based on who is online and the matching criteria,opposite gender
function getDemoSharkJetBasedPair_Heterogeneous(curr_user,callback) {
    getDemoSharkJet(curr_user,function (sharkjet) {
        if(sharkjet !== 0){
            var sharkjet_partner = '';
            if(sharkjet === 'jet'){
                sharkjet_partner = 'shark';
            }else{
                sharkjet_partner = 'jet';
            }
            var query_statement = 'select * from get_available_partners where demo_shark_jet=? AND user_id!=?';
            mysql.getConnection('CP_AS',function (err,conn) {
                if(err){
                    console.log("connection failed");
                }else{
                    conn.query(query_statement,[sharkjet_partner,curr_user],(err,rows) => {
                        conn.release();
                        if (err) {
                            callback("err");
                        }else{
                            if(rows.length == 0){
                                callback("err");
                            }else{
                                console.log(rows);
                                callback(JSON.stringify(rows));
                            }
                        }
                    });
                }
            });
        }else{
            callback("user not present in database");
        }
    });
}

//get user gender
function getGender(curr_user,callback) {
    var query_statement = 'select gender from user_info where user_id=? ';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,rows) => {
                conn.release();
                if (err) {
                    throw err;
                }else{
                    if(rows.length == 0){
                        callback(0);
                    }else{
                        console.log("inside getGender function:"+rows);
                        callback(rows[0].gender);
                    }
                }
            });
        }
    });
}

//matching users based on who is online and the matching criteria,same gender
function getGenderBasedPair_Homogeneous(curr_user,callback) {
    getGender(curr_user,function (gender) {
        if(gender !== 0){
            var gender_partner = '';
            if(gender === 'male'){
                gender_partner = 'male';
            }else{
                gender_partner = 'female';
            }
            var query_statement = 'select * from get_available_partners where gender=? AND user_id!=?';
            mysql.getConnection('CP_AS',function (err,conn) {
                if(err){
                    console.log("connection failed");
                }else{
                    conn.query(query_statement,[gender_partner,curr_user],(err,rows) => {
                        conn.release();
                        if (err) {
                            callback("err");
                        }else{
                            if(rows.length == 0){
                                callback("err");
                            }else{
                                console.log(rows);
                                callback(JSON.stringify(rows));
                            }
                        }
                    });
                }
            });
        }else{
            callback("user not present in database");
        }
    });
}

//matching users based on who is online and the matching criteria,opposite gender
function getGenderBasedPair_Heterogeneous(curr_user,callback) {
    getGender(curr_user,function (gender) {
        if(gender !== 0){
            var gender_partner = '';
            if(gender === 'male'){
                gender_partner = 'female';
            }else{
                gender_partner = 'male';
            }
            var query_statement = 'select * from get_available_partners where gender=? AND user_id!=?';
            mysql.getConnection('CP_AS',function (err,conn) {
                if(err){
                    console.log("connection failed");
                }else{
                    conn.query(query_statement,[gender_partner,curr_user],(err,rows) => {
                        conn.release();
                        if (err) {
                            callback("err");
                        }else{
                            if(rows.length == 0){
                                callback("err");
                            }else{
                                console.log(rows);
                                callback(JSON.stringify(rows));
                            }
                        }
                    });
                }
            });
        }else{
            callback("user not present in database");
        }
    });
}

//matching users based on who is online and the matching criteria, fist come first serve(fcfs)
function getPair_FCFS(curr_user,callback) {
    var query_statement = 'select * from get_available_partners where user_id!=?';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,rows) => {
                conn.release();
                if (err) {
                    callback("err");
                }else{
                    if(rows.length == 0){
                        callback("err");
                    }else{
                        console.log(rows);
                        callback(JSON.stringify(rows));
                    }
                }
            });
        }
    });
}

//function to check if cohort assignment is available for the current course
function checkCohortSetting(course_id,callback){
    var query_statement = "SELECT is_cohorted FROM course_groups_coursecohortssettings WHERE course_id = ?";
    mysql.getConnection('edxapp',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[course_id],(err,rows) => {
                conn.release();
                if (err) {
                    throw err;
                }else{
                    if(rows[0].is_cohorted === 1){
                        callback(true);
                    }else{
                        callback(false);
                    }
                }
            });
        }
    });
}

//function to get available cohort ids for a particular course
function getCohortIDs(course_id, callback){
    var query_statement = "SELECT id FROM course_groups_courseusergroup WHERE course_id = ?";
    mysql.getConnection('edxapp',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[course_id],(err,rows) => {
                conn.release();
                if (err) {
                    throw err;
                }else{
                    var cohorts = {cohort0:rows[0].id,cohort1:rows[1].id, cohort2:rows[2].id};
                    callback(JSON.stringify(cohorts));
                }
            });
        }
    });
}

//function to assign opposite cohorts to users
// this function assumes 2 cohorts other than default cohort
function assignOppositeCohorts(user1,user2,course_id,callback){

    checkCohortSetting(course_id, function (result) {
        if(result){
            getCohortIDs(course_id, function (id_string) {
                var user1_group,user2_group;
                var IDs = JSON.parse(id_string);
                if(user1<user2){
                    user1_group = IDs.cohort1;
                    user2_group = IDs.cohort2;
                }else{
                    user1_group = IDs.cohort2;
                    user2_group = IDs.cohort1;
                }
                console.log(user1_group+"m"+user2_group);
                var success = false;
                assignCohort(user1,user1_group, function (result) {
                    if(result){
                        console.log("success added user1");
                        assignCohort(user2, user2_group, function (result) {
                            if(result){
                                console.log("success added user2");
                                callback(true);
                            }
                            else{
                                callback(false);
                            }
                        });
                    }
                    else{
                        callback(false);
                    }
                });
            });
        }
    });
}

//function to assign default cohorts to users
function assignCohort(user,cohort_id,callback){
    console.log("setting "+user+" to cohort "+cohort_id);
    var update_query = "update course_groups_cohortmembership set course_user_group_id=? where user_id=?";
    var update_query1 = "update course_groups_courseusergroup_users set courseusergroup_id=? where user_id=?";

    mysql.getConnection('edxapp',function (err,conn) {
        if(err){
            console.log("connection failed");
        }
        else{
            conn.query(update_query,[cohort_id,user],(err,result) => {
                if (err) {
                    throw err;
                }else{
                    conn.query(update_query1,[cohort_id,user],(err,result) => {
                        console.log(result);
                        conn.release();
                        if (err) {
                            throw err;
                        }else{
                            callback(true);
                        }
                    });
                }

            });
        }
    });
}

//function check if users are already paired, before pairing; if paired, return session_id
function getSession(user1,user2,course_id, callback) {
    var query_statement = "SELECT * from user_groups where course_id=? AND ((user1=? AND user2=?) OR (user1=? AND user2=?)) AND status='valid'";
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[course_id,user1,user2,user2,user1],(err,rows) => {
                conn.release();
                if (err) {
                    callback("error");
                }else{
                    if(rows.length>0){
                        callback(rows[0].session_id);
                    }else{
                        callback(false);
                    }
                }
            });
        }
    });
}


//function to mark two matched users as grouped in user_pool(user_status) table
function markAsGrouped(user1,user2,callback){
    UserPoolToGrouped(user1, function (result) {
        if(result){
            UserPoolToGrouped(user2,function (result1) {
                if(result1){
                    callback(true);
                }else{
                    callback(false);
                }
            })
        }else{
            callback(false);
        }
    });
}

//function to pair users
function pairUsers(user1,user2,course_id, callback) {
    console.log("inside pairUsers");
    getSession(user1,user2,course_id, function(valid){
        if(valid === false){
            console.log("inside pair Users, insert query");
            var query_statement123 = "INSERT INTO user_groups(course_id,user1,user2) values(?,?,?)";
            mysql.getConnection('CP_AS',function (err,conn) {
                if(err){
                    console.log("connection failed");
                }else{
                    console.log(query_statement123);
                    conn.query(query_statement123,[course_id,user1,user2],(err,result) => {
                        conn.release();
                        if (err) {
                            callback(false);
                        }else{
                            console.log(result);
                            console.log("1 new paired session created between "+user1+" and "+user2);
                            markAsGrouped(user1,user2, function (result1) {
                                if(result1){
                                    assignOppositeCohorts(user1,user2,course_id, function (result2) {
                                        if(result2){
                                            callback(true);
                                        }else{
                                            callback(false);
                                        }
                                    });
                                }else{
                                    callback(false);
                                }
                            });
                        }
                    });
                }
            });
        }
        else{
            callback(valid);
        }
    });
}

//function destroySession
function destroySession(user1, user2, course_id, callback){
    var query_statement = 'update user_groups set status="invalid" where course_id=? AND user1=? AND user2=? AND status="valid"';
    mysql.getConnection('CP_AS',function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[course_id,user1,user2],(err,result) => {
                conn.release();
                if (err) {
                    callback(false);
                }else{
                    callback(true);
                }
            });
        }
    });
}

//API requests
router.post('/addToUserPool',function (req,res) {
    var curr_user = req.body.curr_user;
    addToUserPool(curr_user,function (result) {
        if(result){
            res.send("success");
        }else{
            res.send("failure");
        }
    });
});

router.post('/UserPoolToGrouped',function (req,res) {
    var curr_user = req.body.curr_user;
    UserPoolToGrouped(curr_user,function (result) {
        if(result){
            res.send("success");
        }else{
            res.send("failure");
        }
    });
});

router.post('/UserPoolToOffline',function (req,res) {
    var curr_user = req.body.curr_user;
    UserPoolToOffline(curr_user,function (result) {
        if(result){
            res.send("success");
        }else{
            res.send("failure");
        }
    });
});

router.post('/getUserPool',function (req,res) {

    getUserPool(function (result) {
        if(result !== 0){
            res.send(result);
        }else{
            res.send("Pool empty");
        }
    });

});

router.post('/getAvailablePartners',function (req,res) {
    var curr_user = req.body.curr_user;
    var pairing_type = req.body.pairing_type;
    if(pairing_type === "demoSharkJet-homogeneous"){
        getDemoSharkJetBasedPair_Homogeneous(curr_user, function (result) {
            if(result === "err"){
                res.send("no partner available");
            }else{
                console.log(result);
                res.send(result.toString());
            }
        });
    }
    else if(pairing_type === "demoSharkJet-homogeneous"){
        getDemoSharkJetBasedPair_Heterogeneous(curr_user, function (result) {
            if(result === "err"){
                res.send("no partner available");
            }else{
                console.log(result);
                res.send(result.toString());
            }
        });
    }
    else if(pairing_type === "gender-homogeneous"){
        getGenderBasedPair_Homogeneous(curr_user, function (result) {
            if(result === "err"){
                res.send("no partner available");
            }else{
                console.log(result);
                res.send(result.toString());
            }
        });
    }
    else if(pairing_type === "gender-heterogeneous"){
        getGenderBasedPair_Heterogeneous(curr_user, function (result) {
            if(result === "err"){
                res.send("no partner available");
            }else{
                console.log(result);
                res.send(result.toString());
            }
        });
    }
    else{// pairing_type == "FCFS"
        getPair_FCFS(curr_user, function (result) {
            if(result === "err"){
                res.send("no partner available");
            }else{
                console.log(result);
                res.send(result.toString());
            }
        });
    }
});

router.post('/updateLastOnlineUserPool',function (req,res) {
    var curr_user = req.body.curr_user;
    updateLastOnlineUserPool(curr_user,function (result) {
        if(result){
            res.send("success");
        }else{
            res.send("failure");
        }
    });
});

router.post('/pairUsers',function (req,res) {
    var user1 = req.body.user1;
    var user2 = req.body.user2;
    var course_id = req.body.course_id;
    pairUsers(user1,user2,course_id, function (result) {
        if(result === true){
            getSession(user1,user2,course_id, function (session_id) {
                if(session_id !== false){
                    res.send(String(session_id));
                }else{
                    res.send("NaN");
                }
            });
        }else if(result === false){
            res.send("something went wrong");
        }else{
            res.send(String(result));
        }
    });
});

router.post('/updateToDefaultCohort',function (req,res) {
    var user = req.body.curr_user;
    var course_id = req.body.course_id;
    checkCohortSetting(course_id, function (result) {
        if(result){
            getCohortIDs(course_id, function (id_string) {
                console.log(id_string);
                var IDs = JSON.parse(id_string);
                assignCohort(user,IDs.cohort0, function (result_cohort) {
                    if(result_cohort){
                        res.send("success")
                    }else{
                        res.send("failure")
                    }
                });
            });
        }
    });
});

router.post('/destroySession', function (req,res) {
    var user1 = req.body.user1;
    var user2 = req.body.user2;
    var course_id = req.body.course_id;
    destroySession(user1,user2,course_id, function (result) {
        res.send(result);
    });
});
// router.post('/isCohorted',function (req,res) {
//    var course_id = req.body.course_id;
//    checkCohortSetting(course_id, function (result) {
//        if(result){
//            res.send("available");
//        }else{
//            res.send("not available");
//        }
//    });
// });



module.exports = router;
