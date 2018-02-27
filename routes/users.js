var express = require('express');
var router = express.Router();

var mysql = require('../db_module/cpsx_db').pool;


function getUserRoom(curr_user){

    query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?';
    mysql.getConnection(function (err, conn) {
        if(err){
            throw err;
        }
        else{
            conn.query(query_statment, [curr_user, curr_user], (err, rows) => {
                console.log("rows length:"+rows.length);
                if (err) {
                    console.log(err);
                    throw err;
                }else if(rows.length>0){
                    rows.forEach((row) => {
                        var room = "room" + row.session_id + row.course_id;
                        conn.release();
                        return room;
                    });
                }else{
                    conn.release();
                    return "NaN";
                }
            });
        }

    });
}
/* POST users room. */
router.post('/getRoom', function(req, res) {
    var curr_user = req.body.curr_user;
    console.log(curr_user);
    var room = getUserRoom(curr_user);
    console.log(room);
    if(room!=="NaN"){
        res.send(room);
    }else{
        res.status(404)        // HTTP status 404: NotFound
            .send('Not found');
    }

});

router.post("/initializeRoom",function (req,res) {
    var curr_user = req.body.curr_user;
    query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?';
    mysql.getConnection(function (err, conn) {
        if(err){
            throw err;
        }
        else{
            conn.query(query_statment, [curr_user, curr_user], (err, rows) => {
                console.log(rows);
                if (err) {
                    console.log(err);
                    throw err;
                } else {
                    rows.forEach((row) => {
                        var room = "room" + row.session_id + row.course_id;
                        conn.release();
                        res.send(room);
                    });
                }

            });
        }

    });

});

module.exports = router;
