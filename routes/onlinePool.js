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
                    callback(rows);
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


router.post('/removeFromUserPool',function (req,res) {
    var curr_user = req.body.curr_user;
    updateUserPoolAsGrouped(curr_user,function (result) {
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



module.exports = router;
