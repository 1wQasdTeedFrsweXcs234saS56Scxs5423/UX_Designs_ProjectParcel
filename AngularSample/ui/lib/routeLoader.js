/*----------------------------------------------------------------------------
|
|   Load expressjs route implementation files automatically
|
|
|
|   written by Jochen Loewer
|   April 2013
|
\---------------------------------------------------------------------------*/

var fs = require("fs");

module.exports = function(app) {

    var routesFolderPath = __dirname + "/../routes/";
    
    fs.readdirSync(routesFolderPath).forEach(function(routeName){
    
        if ( routeName.match(/Route.js$/) ) {
            var route = require(routesFolderPath + routeName);
            route.init(app);
        }
    });
}                                                    