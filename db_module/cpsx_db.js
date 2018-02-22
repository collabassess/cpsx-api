const mysql = require('mysql');

// First you need to create a connection to the db
var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'edx',
    database: 'collab_assess'
});

exports.pool = pool;