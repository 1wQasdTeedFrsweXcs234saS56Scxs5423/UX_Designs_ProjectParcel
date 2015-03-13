/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/EventNotification
|
|
|   This webservice will return the Order Information for the search
|   criteria entered by user.
|
|   written by Hyma vajrala
|   Oct 2013
|
---------------------------------------------------------------------------*/
var DbPool    = require('../lib/DbPool');
var augment   = require("../lib/augment.js")
var SqlUtils  = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2")
var PortalSec = require("../lib/PortalSecurity")
var config    = require('../config/config.js');
var Resp      = require('../lib/RespUtils.js');
var tstore    = require('../lib/tstore');
var osconfig    = require('/etc/opt/oss/backend/UI.cfg');
var notification  = require('../lib/eventNotification.js');

var ts = new tstore.TStore( osconfig.UITstoreConnection )

var bunyan    = require('bunyan');
var log          = new bunyan({
    name: 'eventNotificationWebService',
});
   module.exports.init = function(app) {

    
    /*-------------------------------------
           Active Orders Webservice.
    ---------------------------------------*/
    

    app.get('/ossui/v1/in/activeOrders', app.role(AuthGroupSandyUser), notification.GetActiveOrders);

    
    /*-------------------------------------------
         detaildactiveOrders  Webservice.
    ---------------------------------------------*/

    app.get('/ossui/v1/in/detaildactiveOrders',app.role(AuthGroupSandyUser), notification.GetDetailactiveOrders);


   
    /*---------------------------------------
           searchOrders Webservice.
    ----------------------------------------*/

    app.get('/ossui/v1/in/searchOrders', app.role(AuthGroupSandyUser),notification.GetHpOrderNos);


   
    /*----------------------------------------------
        Internal saveWatch  Webservice.
    -------------------------------------------------*/

    app.post('/ossui/v1/in/saveWatch', app.role(AuthGroupSandyUser),function(req, res) {
       
        notification.saveWatch (req ,res);
        var msg = 'Settings have been saved !';
        Resp.sendResponse(res, log, msg, msg, '');
        
    });
    
    
    /*----------------------------------------------
        Internal deleteWatch  Webservice.
    -------------------------------------------------*/

    app.get('/ossui/v1/in/deleteWatch', app.role(AuthGroupSandyUser),function(req, res) {
       
        notification.deleteWatch (req ,res);
        var msg = 'Settings have been Removed !';
        Resp.sendResponse(res, log, msg, msg, '');
        
    });
    
    /*-----------------------------------------------
       Internal saveProfile  Webservice.
    -------------------------------------------------*/

    app.post('/ossui/v1/in/saveProfile', app.role(AuthGroupSandyUser),function(req, res) {
       
        notification.saveProfile (req ,res);
        var msg = 'Settings have been saved !';
        Resp.sendResponse(res, log, msg, msg, '');
        
    });
    
    
    
    /*----------------------------------------------
        Internal deleteProfile  Webservice.
    -------------------------------------------------*/

    app.get('/ossui/v1/in/deleteProfile', app.role(AuthGroupSandyUser),function(req, res) {
       
        notification.deleteProfile (req ,res);
        var msg = 'Settings have been Removed !';
        Resp.sendResponse(res, log, msg, msg, '');
        
    });



    /*---------------------------------------------
       display user profile for order based  
    -----------------------------------------------*/

    app.get('/ossui/v1/in/showOrderSettings', app.role(AuthGroupSandyUser), notification.GetUserSettingsForOrder);

    
    /*-----------------------------------------------
       display user profile for profile based 
    ------------------------------------------------*/

    app.get('/ossui/v1/in/showProfileSettings', app.role(AuthGroupSandyUser), notification.GetUserSettingsForProfile);


    /*----------------------------------------------------------------------------
    |   Internal shared Profiles  Webservice.
    \---------------------------------------------------------------------------*/

    //app.get('/ossui/v1/in/sharedProfiles', app.role(AuthGroupSandyUser), notification.GetSharedProfiles);

   
   
    
    /*--------------------------------------------
         My Personal Profiles  Webservice.
    ----------------------------------------------*/

    app.get('/ossui/v1/in/myProfiles', app.role(AuthGroupSandyUser), notification.GetMyPersonalProfiles);

    
    
    
    /*------------------------------------
      Active Profiles  Webservice.
    --------------------------------------*/

    app.get('/ossui/v1/in/activeProfiles', app.role(AuthGroupSandyUser), notification.GetActiveProfiles);

}
