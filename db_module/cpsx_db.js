const mysql = require('mysql');

const CPSX_DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'edx',
    database: 'collab_assess'
};

const EDXAPP_DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'edx',
    database: 'edxapp'
};

// First you need to create a connection to the db
// var poolCluster = mysql.createPoolCluster(multipleStatements=true);
// 
// poolCluster.add('CP_AS', CPSX_DB_CONFIG);
// poolCluster.add('edxapp', EDXAPP_DB_CONFIG);

// exports.pool = poolCluster;

// PSANKER AMENDMENTS
const DATABASES = {
    COLLAB_ASSESS: "CP_AS",
    EDX: "edxapp"
};

const DB_CONFIGS = [
    {id: DATABASES.COLLAB_ASSESS, config: CPSX_DB_CONFIG},
    {id: DATABASES.EDX, config: EDXAPP_DB_CONFIG}
];

class DatabaseHandler {
    
    static cluster() {
        // Static reference to pool cluster so no clones of the cluster are made
        if (DatabaseHandler._poolCluster === undefined) {

            // The "multipleStatements" flag is rather self-evident but necessary for chaining queries
            DatabaseHandler._poolCluster = mysql.createPoolCluster({multipleStatements: true});

            for (let db in DB_CONFIGS) {
                DatabaseHandler._poolCluster.add(db.id, db.config);
            }
        }

        return DatabaseHandler._poolCluster;
    }
    
    connect(id) {
        return new Promise((resolve, reject) => {
            DatabaseHandler.cluster().getConnection(id, (err, connection) => {
                if (err) {
                    return reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }

    query(connection, statement, args = []) {
        return new Promise((resolve, reject) => {
            connection.query(statement, args, (err, results, fields) => {
                if (err) {
                    return reject(err);
                } else {
                    // Return connection to pool after use
                    connection.release();
                    resolve(results, fields);
                }
            });
        });
    }

    queryNoRelease(connection, statement, args = []) {
        return new Promise((resolve, reject) => {
            connection.query(statement, args, (err, results, fields) => {
                if (err) {
                    return reject(err);
                } else {
                    // Return connection as well so it's still available for use
                    resolve(connection, results, fields);
                }
            });
        });
    }
}

exports.DatabaseHandler = DatabaseHandler;
exports.DATABASES = DATABASES;
