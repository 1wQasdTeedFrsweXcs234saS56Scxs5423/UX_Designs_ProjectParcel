/*----------------------------------------------------------------------------
|
|   baseline / high level authorization setup
|
|
|
|   written by Jochen Loewer
|   April 2013
|
\---------------------------------------------------------------------------*/


module.exports = {

    preRouteAuthorizationSetup : function(app) {
       
        //app.all('/ossui/*'   ,  app.role('Q2C_OSS_SANDY_USER')  );
    },


    postRouteAuthorizationSetup : function(app) {
    
        app.all('/ossui/*'   ,  app.role(+AuthGroupSandyUser)  );        
    }
}



