var express = require('express');
var router = express.Router();
const mysql = require('mysql');

// First you need to create a connection to the db
const collab = mysql.createConnection({
    host: '54.156.197.224',
    user: 'edxapp001',
    password: 'password',
    database: 'collab_assess'
});

collab.connect((err) => {
  if(err){
    console.log("Error connecting to db");
    return;
  }else{
      console.log("connection established");
  }
});



/* GET users listing. */
router.post('/getRoom', function(req, res, next) {
  var curr_user = req.body.curr_user;
  var room = 'room'
  query_statment = 'SELECT * from user_groups WHERE user1= ? OR user2= ?'
  collab.query(query_statment,[curr_user,curr_user],(err,rows)=>{
      if(err){
          console.log(err);
          throw err;
      }else{
          rows.forEach( (row) =>{
                room = room+""+row.session_id+row.course_id
              });
      }

  });
});



module.exports = router;
