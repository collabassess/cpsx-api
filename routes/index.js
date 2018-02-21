var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express, Ajay' });
});

const mysql = require('mysql');

// First you need to create a connection to the db
const collab = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'edx',
    database: 'collab_assess'
});
function collab_connect(collab){
  console.log("here")
  collab.connect((err) => {
        if(err){
            console.log("Error connecting to db"+err);
            return;
        }else{
            console.log("connection established");
        }
    });
}

function collab_destroy(collab){
    collab.end()
}



/* POST users room. */
router.post('/getRoom', function(req, res, next) {
    collab_connect(collab);
    var curr_user = req.body.curr_user;
    console.log(curr_user);
    query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?'
    collab.query(query_statment,[curr_user,curr_user],(err,rows)=>{
        console.log(rows);
        if(err){
            console.log(err);
            throw err;
        }else{
            rows.forEach( (row) =>{
                var room = "room"+row.session_id+row.course_id;
                collab_destroy(collab);
                res.send(room);
            });
        }

    });

});

router.get('/getRoom', function(req, res, next) {
    collab_connect(collab);
    var curr_user = req.query.curr_user;
    console.log(curr_user);
    query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?'
    collab.query(query_statment,[curr_user,curr_user],(err,rows)=>{
        console.log("rows: "+rows);
        if(err){
            console.log(err);
            throw err;
        }else{
            console.log("rows: "+rows);
            rows.forEach( (row) =>{

                var room = "room"+row.session_id+row.course_id;
                collab_destroy(collab);
                res.send(room);
            });
        }

    });

});

module.exports = router;
