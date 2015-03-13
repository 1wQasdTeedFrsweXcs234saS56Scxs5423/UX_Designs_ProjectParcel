/*----------------------------------------------------------------------------
|
|   DB connection pool handler
|
|
|
|   written by Jochen Loewer
|   April 2013
|
\---------------------------------------------------------------------------*/


module.exports.OSSDB = function (cb) {

    // no pool for now on VM
    global.OSSDB(cb);

}
