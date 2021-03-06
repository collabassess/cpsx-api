var express = require('express');
var router = express.Router();

var mysql = require('../db_module/cpsx_db').pool;


//add users to user_pool(user_status table)
function addToUserPool(user, callback) {
    var query_statement = 'INSERT INTO user_status(user_id) values(?) ON DUPLICATE KEY UPDATE status="online", last_online=Now(), grouped=False';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
            callback(false);
        }else{
            conn.query(query_statement,[user], function (err, result) {
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
function updateUserPoolAsGrouped(curr_user,callback) {
    var query_statement = 'update user_status set grouped=True where user_id=? AND status="online"';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,result) => {
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
function removeFromUserPool(curr_user,callback) {
    var query_statement = 'update user_status set status="offline" where user_id=? AND status="online"';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,result) => {
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
function returnUserPool(callback) {
    var query_statement = 'select * from user_status where grouped=0 AND status="online"';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,(err,rows) => {
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
function updateLastOnline(curr_user,callback) {
    var query_statement = 'update user_status set last_online=Now() where user_id=? AND status="online"';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,result) => {
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

//get user gender
function getGender(curr_user,callback) {
    var query_statement = 'select gender from user_info where user_id=? ';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[curr_user],(err,rows) => {
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

//matching users based on who is online and the matching criteria, currently only gender
function getGenderBasedPair(curr_user,callback) {
    getGender(curr_user,function (gender) {
        if(gender !== 0){
            var gender_partner = '';
            if(gender === 'male'){
                gender_partner = 'female';
            }else{
                gender_partner = 'male';
            }
            var query_statement = 'select user_id from get_available_partners where gender=?';
            mysql.getConnection(function (err,conn) {
                if(err){
                    console.log("connection failed");
                }else{
                    conn.query(query_statement,[gender_partner],(err,rows) => {
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

//function to assign opposite cohorts to users
function assignOppositCohorts(user1,user2,callback){

}

//function to assign default cohorts to users
function assignDefaultCohorts(user,callback){

}

//function to pair users
function pairUsers(user1,user2,callback) {
    var query_statement = 'INSERT INTO user_groups(course_id,user1,user2) values(1,?,?)';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
        }else{
            conn.query(query_statement,[user1,user2],(err,result) => {
                if (err) {
                    callback("error");
                }else{
                    console.log("1 new paired session created between "+user1+" and "+user2);

                    callback("success");
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
    updateUserPoolAsGrouped(curr_user,function (result) {
        if(result){
            res.send("success");
        }else{
            res.send("failure");
        }
    });
});

router.post('/UserPoolToOffline',function (req,res) {
    var curr_user = req.body.curr_user;
    removeFromUserPool(curr_user,function (result) {
        if(result){
            res.send("success");
        }else{
            res.send("failure");
        }
    });
});

router.post('/getUserPool',function (req,res) {

    returnUserPool(function (result) {
        if(result !== 0){
            res.send(result);
        }
    });

});

router.post('/getPairId',function (req,res) {
    var curr_user = req.body.curr_user;
    getGenderBasedPair(curr_user, function (result) {
        if(result === "err"){
            res.send("no partner available");
        }else{
            console.log(result);
            res.send(result.toString());
        }
    });

});

router.post('/updateLastOnlineUserPool',function (req,res) {
    var curr_user = req.body.curr_user;
    updateLastOnline(curr_user,function (result) {
        if(result){
            res.send("success");
        }else{
            res.send("failure");
        }
    });
});

router.post('pairUser',function (req,res) {
    var user1 = req.body.user1;
    var user2 = req.body.user2;
    pairUser(user1,user2,function (result) {
        res.send(result);
    });
});

//pending functions
// 1. /pairUser(user1,user2)
// 2. /changeCohortForPair(user1,user2)
// 3. /changeCohortDefault(user1)

module.exports = router;
