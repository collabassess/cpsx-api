var express = require('express');
var router = express.Router();

var mysql = require('../db_module/cpsx_db').pool;


//add users to user_pool(user_status table)
function addToUserPool(user, callback) {
    var query_statement = 'INSERT INTO user_status(user_id) values(?)' +
        'ON DUPLICATE KEY UPDATE status="online", last_online=Now(), grouped=False';
    mysql.getConnection(function (err,conn) {
        if(err){
            console.log("connection failed");
            callback(false);
        }else{
            conn.query(query_statement, function (err, result) {
                if (err) callback(false);
                console.log("1 record inserted/updated");
                callback(true);
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
            conn.query(query_statement,[curr_user],(err,rows) => {
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

function getUserRoom(curr_user,callback){
    var room = '';
    var query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?';
    mysql.getConnection(function (err, conn) {
        if(err){
            console.log("connection failed");
            throw err;
        }
        else {
            conn.query(query_statment, [curr_user, curr_user], (err, rows) => {
                if (err) {
                    console.log("error: ", err);
                    throw err;
                } else if(rows.length >0) {
                    rows.forEach((row) => {
                        room = "room" +"_"+ row.session_id +"_"+ row.course_id;
                        callback(room);
                    });
                }else{
                    callback("NaN");
                }
            });
        }
    });
}

function upsertRoomUser(curr_user,callback) {
    query_statment = 'SELECT * from user_groups\n' +
        '                           WHERE user1 IS NULL OR user2 IS NULL';
    console.log("upsert function: step 1");
    mysql.getConnection(function (err, conn) {
        if(err){
            console.log("connection failed");
            throw err;
        }
        else {
            console.log("upsert function: step 2");
            conn.query(query_statment, (err, rows) => {
                if (err) {
                    console.log("error:", err);
                    throw err;
                }else if(rows.length == 0){
                    console.log("upsert function: step 3: new row will be created");

                    conn.query("INSERT INTO user_groups(course_id,user1)\n"+
                                        " VALUES (?,?)", ['1',curr_user]);

                    conn.release();
                    callback("init");
                }else{
                    console.log("upsert function: step 3: old row updated");
                    rows.forEach((row) => {
                        session_id = row.session_id;
                        course_id = row.course_id;
                        user1 = row.user1;
                        user2 = row.user2;
                        if(user1 ==null){
                            conn.query("UPDATE user_groups\n" +
                                "SET user1=?\n" +
                                "WHERE session_id=? && course_id=?",
                                [curr_user, session_id, course_id],(err) => {
                                    if (err) {
                                        console.log("old row error");
                                        throw err;
                                    }
                                });
                        }else{
                            conn.query("UPDATE user_groups\n" +
                                "SET user2=?\n" +
                                "WHERE session_id=? && course_id=?",
                                [curr_user, session_id, course_id],(err) => {
                                    if (err) {
                                        console.log("old row error");
                                        throw err;
                                    }
                                });
                        }
                        conn.release();
                        callback("init");
                    });

                }
            });
        }

    });

}
/* POST users room. */
router.post('/getRoom', function(req, res) {
    var curr_user = req.body.curr_user;
    getUserRoom(curr_user,function (room_value) {
        res.send(room_value);
    });
});

router.post("/initializeRoom",function (req,res) {
    var curr_user = req.body.curr_user;
    var final_room ="dsaas";
    getUserRoom(curr_user,function (room_value) {
        console.log("Entered first getUserRoom function"+room_value);
        if(room_value === "NaN"){
            console.log("got inside this if condition: room value is NaN, upserting");
            upsertRoomUser(curr_user,function (response) {
                console.log("upsert:"+response);
                getUserRoom(curr_user,function (room_value) {
                    final_room = room_value;
                    console.log(final_room);
                    console.log("final statement");
                    res.send(final_room);
                });
            });
        }else{
            res.send(room_value);
        }
    });

});

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
        for(i in result){
           console.log(i);
        }
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
