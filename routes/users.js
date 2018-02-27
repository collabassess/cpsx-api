var express = require('express');
var router = express.Router();

var mysql = require('../db_module/cpsx_db').pool;


function getUserRoom(curr_user,callback){
    var room = "";
    query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?';
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
                } else {
                    rows.forEach((row) => {
                        room = "room" +"_"+ row.session_id +"_"+ row.course_id;
                        conn.release();
                        callback(room);
                    });
                    callback("NaN");
                }
            });
        }
    });
}

function upsertRoomUser(curr_user,callback) {
    query_statment = 'SELECT * from user_groups\n' +
        '                           WHERE user1 IS NULL OR user2 IS NULL';
    console.log("here1");
    mysql.getConnection(function (err, conn) {
        if(err){
            console.log("connection failed");
            throw err;
        }
        else {
            console.log("here2");
            conn.query(query_statment, (err, rows) => {
                console.log(rows);
                if (err) {
                    console.log("error:", err);
                    throw err;
                }else if(rows.length == 0){
                    console.log("new row will be created");

                    conn.query("INSERT INTO user_groups(course_id,user1)\n"+
                                        " VALUES (?,?)", ['1',curr_user]);

                    conn.release();
                    callback("new room");
                }else{
                    console.log("old row updated");
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
                        temp_room = "room" + session_id + course_id;
                        callback(temp_room);
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
    getUserRoom(curr_user,function (room_value) {
        var final_room = room_value;
        if(room_value === "NaN"){
            upsertRoomUser(curr_user,function (response) {
                final_room = response;
            });
        }
        res.send(final_room);
    });
});

module.exports = router;
