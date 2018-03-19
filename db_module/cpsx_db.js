const mysql = require('mysql');

const cpsx_db_config = {
    host: 'localhost',
    user: 'root',
    password: 'edx',
    database: 'collab_assess'
};

const edxapp_db_config = {
    host: 'localhost',
    user: 'root',
    password: 'edx',
    database: 'edxapp'
}
// First you need to create a connection to the db
var poolCluster = mysql.createPoolCluster(multipleStatements=true);

poolCluster.add('CP_AS',cpsx_db_config);
poolCluster.add('edxapp',edxapp_db_config);

exports.pool = poolCluster;