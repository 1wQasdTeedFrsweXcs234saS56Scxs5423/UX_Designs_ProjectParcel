/*----------------------------------------------------------------------------
|
|   DB connection pool setup
|
|
|
|   written by Jochen Loewer
|   April 2013
|
\---------------------------------------------------------------------------*/

var oracle = require("oracle");



module.exports = function()
{

    oracle.connect(
    { hostname: "gvu0599.austin.hp.com"
                     , port:     1525
                     , user:     "ossevent"
                     , password: "oss_2010_04_event"
                     , database: "OSSF"
   
    }, function(err, connection) {


       console.log(err);
       console.log(connection);
       console.log('connected to OSS');
  
       global.OSSDB = function( cb ) {
           cb(connection);
       }
       
    });

}



