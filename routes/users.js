var express = require('express');
var router = express.Router();

var mysql = require('../lib/database').pool;

// PSANKER AMENDMENT
const DatabaseHandler = require("../lib/database").DatabaseHandler;
const DATABASES       = require("../lib/database").DATABASES;

function getUserRoom(curr_user,callback){
    var room = '';
    var query_statment = 'SELECT * from user_groups WHERE (user1= ? OR user2= ?) AND status="valid"';
    mysql.getConnection('CP_AS',function (err, conn) {
        if(err){
            console.log("connection failed");
            throw err;
        }
        else {
            conn.query(query_statment, [curr_user, curr_user], (err, rows) => {
                conn.release();
                if (err) {
                    console.log("error: ", err);
                    throw err;
                }else if(rows.length >0) {
                    callback(String(rows[0].session_id));
                }else{
                    callback("NaN");
                }
            });
        }
    });
}

// PSANKER AMENDMENT
function getUserRoomPromise(currentUser) {
    let queryStatement = "SELECT * from user_groups WHERE (user1= ? OR user2= ?) AND status=\"valid\""; 
    let room = "";

    return new Promise((resolve, reject) => {
        DatabaseHandler.connect(DATABASES.COLLAB_ASSESS)
            .then((connection) => DatabaseHandler.query(connection, queryStatement, [currentUser, currentUser]))
            .then((rows, fields) => {
                if (rows.length > 0) {
                    resolve(String(rows[0].session_id));
                } else {
                    resolve("NaN");
                }
            })
            .catch(err => {
                return reject(err);
            });
    });
}

function upsertRoomUser(curr_user,callback) {
    query_statment = 'SELECT * from user_groups\n' +
        '                           WHERE user1 IS NULL OR user2 IS NULL';
    console.log("upsert function: step 1");
    mysql.getConnection('CP_AS',function (err, conn) {
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

// PSANKER AMENDMENT
function upsertRoomUserPromise(currentUser) {
    let queryStatement = "SELECT * FROM user_group WHERE user1 IS NULL OR user2 IS NULL";

    return new Promise((resolve, reject) => {
        DatabaseHandler.connect(DATABASES.COLLAB_ASSESS)
            .then((connection) => DatabaseHandler.queryNoRelease(connection, queryStatement))
            .then((connection, rows, fields) => {
                let nextQuery = "",
                    args      = [];

                if (rows.length === 0) {
                    nextQuery = "INSERT INTO user_groups(course_id,user1) VALUES (?,?)"; 
                    args = ["1", currentUser];
                } else {
                    rows.forEach((row) => {
                        if (row.user1 === null){
                            nextQuery += "UPDATE user_groups SET user1=? WHERE session_id=? && course_id=?;\n";
                            args.concat([currentUser, row.session_id, row.course_id]);
                        } else {
                            nextQuery += "UPDATE user_groups SET user2=? WHERE session_id=? && course_id=?;\n";
                            args.concat([currentUser, row.session_id, row.course_id]);
                        }
                    });
                }

                return DatabaseHandler.query(connection, nextQuery, args);
            })
            .then((results, fields) => {
                resolve("init");
            })
            .catch((err) => {
                return reject(err);
            });
    });
}

/* POST users room. */
router.post('/getRoom', function(req, res) {
    var curr_user = req.body.curr_user;
    getUserRoom(curr_user,function (room_value) {
        res.send(room_value);
    });
});

// PSANKER AMENDMENT -- Will not fire until #postPromise is renamed to #post
// router.postPromise("/getRoom", (req, res) => {
//     let curr_user = req.body.curr_user;
// 
//     getUserRoomPromise(curr_user)
//         .then(response => {
//             res.send(response);
//         }, err => {
//             console.log(err); 
//         });
// });

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

module.exports = router;
