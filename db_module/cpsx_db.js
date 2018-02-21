const mysql = require('mysql');

// First you need to create a connection to the db
var pool  = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'edx',
    database: 'collab_assess'
});

var getConnection = function(callback) {
    pool.getConnection(function(err, connection) {
        callback(err, connection);
    });
};

exports.pool = getConnection;

