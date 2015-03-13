/*----------------------------------------------------------------------------
|
|   DB connection pool setup for labVM
|
|
|   written for opt/oss/pkg/frontend/OSfInternalUIServer
|   written by Alok Upendra Kamat
|   July 2013
|
\---------------------------------------------------------------------------*/

var oracle = require("oracle");

module.exports.testdbConn = function(cb) {

    oracle.connect({
        hostname: "localhost",
        port:     "1521",
        user:     "osstest",
        password: "ora",
        database: "XE"

    }, function(err, connection) {

        if (err) {
            console.log('Couldn\'t connect to OSS labVM DB. ' + err + 'Stopping Server ...');
            process.exit(1);
        }

        console.log('Connected to OSS TEST labVM DB.');
        console.log(connection);
        cb(connection);


    });

}
