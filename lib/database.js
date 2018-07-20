const mysql          = require('mysql'),
      debug          = require('debug')('cpsx-api:server'),
      DB_CREDENTIALS = require('../db_credentials');

const CPSX_DB_CONFIG = {
    host: DB_CREDENTIALS.host || 'localhost',
    user: DB_CREDENTIALS.user || 'mysql',
    password: DB_CREDENTIALS.password || 'abc123',
    database: 'collab_assess'
};

const EDXAPP_DB_CONFIG = {
    host: DB_CREDENTIALS.host || 'localhost',
    user: DB_CREDENTIALS.user || 'mysql',
    password: DB_CREDENTIALS || 'abc123',
    database: 'edxapp'
};

const DATABASES = {
    COLLAB_ASSESS: "CP_AS",
    EDX: "edxapp"
};

const DB_CONFIGS = [
    {id: DATABASES.COLLAB_ASSESS, config: CPSX_DB_CONFIG},
    {id: DATABASES.EDX, config: EDXAPP_DB_CONFIG}
];

// Legacy support
var poolCluster = mysql.createPoolCluster(multipleStatements=true);

poolCluster.add('CP_AS', CPSX_DB_CONFIG);
poolCluster.add('edxapp', EDXAPP_DB_CONFIG);

exports.pool = poolCluster;

const DatabaseHandler = {
    _poolCluster: undefined,

    cluster: () => {
        if (DatabaseHandler._poolCluster === undefined) {

            // The "multipleStatements" flag is rather self-evident but necessary for chaining queries
            DatabaseHandler._poolCluster = mysql.createPoolCluster({multipleStatements: true});

            for (let db in DB_CONFIGS) {
                DatabaseHandler._poolCluster.add(db.id, db.config);
            }
        }

        debug(`Pool cluster populated: ${DatabaseHandler._poolCluster}`);

        return DatabaseHandler._poolCluster;
    },

    connect: id => {
        return new Promise((resolve, reject) => {
            DatabaseHandler.cluster().getConnection(id, (err, connection) => {
                if (err) {
                    debug(`Database connection failed: ${err}`);
                    return reject(err);
                } else {
                    debug(`Database connection established to ${id}`);
                    resolve(connection);
                }
            });
        });
    },

    query: (connection, statement, args = []) => {
        return new Promise((resolve, reject) => {
            connection.query(statement, args, (err, results, fields) => {
                if (err) {
                    debug(`Database query failed: ${err}`);
                    return reject(err);
                } else {
                    debug(`Database query successful: ${results}`);

                    // Return connection to pool after use
                    connection.release();
                    resolve(results, fields);
                }
            });
        });
    },

    queryNoRelease: (connection, statement, args = []) => {
        return new Promise((resolve, reject) => {
            connection.query(statement, args, (err, results, fields) => {
                if (err) {
                    debug(`Database query failed: ${err}`);
                    return reject(err);
                } else {
                    debug(`Database query successful: ${results}`);

                    // Return connection as well so it's still available for use
                    resolve(connection, results, fields);
                }
            });
        });
    }
};

exports.DatabaseHandler = DatabaseHandler;
exports.DATABASES = DATABASES;
