var express = require('express');
var router = express.Router();

var mysql = require('../db_module/cpsx_db');


/* POST users room. */
router.post('/getRoom', function(req, res, next) {
    var curr_user = req.body.curr_user;
    console.log(curr_user);
    query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?'
    mysql(function(err, conn){
        conn.query(query_statment,[curr_user,curr_user],(err,rows)=>{
            console.log(rows);
            if(err){
                console.log(err);
                throw err;
            }else{
                rows.forEach( (row) =>{
                    var room = "room"+row.session_id+row.course_id;
                    collab_destroy(collab);
                    mysql.release()
                    res.send(room);
                });
            }

        });
    });
});

router.get('/getRoom', function(req, res, next) {
    var curr_user = req.query.curr_user;
    console.log(curr_user);
    query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?'
    mysql(function(err, conn){
        conn.query(query_statment,[curr_user,curr_user],(err,rows)=>{
            console.log(rows);
            if(err){
                console.log(err);
                throw err;
            }else{
                rows.forEach( (row) =>{
                    var room = "room"+row.session_id+row.course_id;
                    collab_destroy(collab);
                    mysql.release()
                    res.send(room);
                });
            }

        });
    });

});

module.exports = router;
