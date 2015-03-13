/*----------------------------------------------------------------------------
|
|   route handler for user settings
|
|
|
|   written by Jochen Loewer & Alok Upendra Kamat
|   June 2013
|
\---------------------------------------------------------------------------*/

var augment = require('../lib/augment.js');
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require('../lib/SqlUtils2');
var PortalSec = require('../lib/PortalSecurity');
var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js');
var Bunyan = require('bunyan');
var userSetConfig = require('../config/userSetConfig.js');

var log = new Bunyan({
    name: 'userSettings'
});

module.exports.init = function(app) {

    app.get('/ossui/v1/in/usersettings', app.role(AuthGroupSandyUser),function(req,res) {

        // if request was authenticated, get user_id out of request object
        var user_id = req.user_id;

        res.json( {
          'config': {
              'links': {
                  'EntitlementViewURL': EntitlementViewURL
              }    
          },
          'user_id'     : user_id,
          'user_setting': {
          }
        });

    });

    app.get('/ossui/v1/ex/usersettings', app.role(AuthGroupExternal),function(req,res) {

        var aaid = 'b2b'                 // default:  enterprise customer portal
        if (req.aaid) aaid = req.aaid;

        // if request was authenticated, get user_id out of request object
        var user_id = req.user_id;
        if (req.osuiImpersonate) {
            console.log('overriding ' + user_id + ' with osuiImpersonate='+req.osuiImpersonate);
            user_id = req.osuiImpersonate
        }

        res.json( {
          'user_id'     : user_id,
          'aaid'        : aaid,
          'user_setting': {
          }
        });

    });

    app.get('/ossui/v1/in/getusersettings', app.role(AuthGroupSandyUser), function(req, res) {

        DbPool.OSSDB(function(db) {

            var filter = new SqlUtils.AndWhere();

            if (req.query.aaid && req.query.userid) {
                filter.addEq(req.query.aaid, "up.aaid");
                filter.addEq(req.query.userid, "up.user_id");
            } else
                return Resp.sendError(res, log, "Service did not receive the primary request parameter: aaid & userid.");

            if (req.query.mod) filter.addEq(req.query.mod, "up.module");

            log.info('filter:');
            log.info(filter);

            db.execute("select up.module, up.settings                                       \
                          from user_preferences up                                          \
                         where (" + filter.where + ")                                       \
            ", filter.binds, function(err, settings) {

                if (err) return Resp.sendError(res, log, err);

                if (settings.length == 0)
                    return Resp.sendResponse(res, log, 'No user settings found !!!', 'No user settings found !!!', userSetConfig);

                var userSettings = {};

                for (var i = 0; i < settings.length; i++) {

                    userSettings[settings[i].module] = {};
                    userSettings[settings[i].module].avlbl_fields = [];
                    userSettings[settings[i].module].displ_fields = [];
                    var avlblSettings = [];
                    var displSettings = settings[i].settings.split(" ");

                    for (var setting in userSetConfig[settings[i].module].fields)
                        avlblSettings.push(setting);

                    for (var j = 0; j < displSettings.length; j++) {
                        var index = avlblSettings.indexOf(displSettings[j]);
                        if (index > -1) avlblSettings.splice(index, 1);
                    }

                    for (var j = 0; j < avlblSettings.length; j++)
                        userSettings[settings[i].module].avlbl_fields.push(avlblSettings[j]);

                    for (var j = 0; j < displSettings.length; j++)
                        userSettings[settings[i].module].displ_fields.push(displSettings[j]);
                }

                var data = {
                    AllSettings: userSetConfig,
                    UserSettings: userSettings
                };

                Resp.sendResponse(res, log, 'Sending back user settings.', '', data);
            });
        });
    });

/*    app.get('/ossui/v1/in/setusersettings', app.role('Q2C_OSS_SANDY_USER'), function(req, res) {

        DbPool.OSSDB(function(db) {

            req.query.json = {
                "aaid": "adhoc",
                "userid": "alok.upendra-kamat@hp.com",
                "module": "OrderSummary",
                "fields": [
                    "1",
                    "2",
                    "3"
                ]
            };

            var userSettings = JSON.parse(req.query.json);
            var filter = new SqlUtils.AndWhere();
            var fields = "";
            var settings = "";

            if (userSettings.aaid && userSettings.userid && userSettings.module) {
                filter.addEq(userSettings.aaid, "aaid");
                filter.addEq(userSettings.userid, "user_id");
                filter.addEq(userSettings.mod, "module");
            } else
                return Resp.sendError(res, log, "Service did not receive the primary request parameter: aaid, userid & module.");

            log.info('filter:');
            log.info(filter);

            if (userSettings.fields.length > 0) {

                for (var i = 0; i < settings.length; i++)
                    fields += userSettings.fields[i] + ",";

                var settings = fields.substr(0, fields.length - 1);

            } else
                return Resp.sendError(res, log, "Service did not find any settings to update.");

            db.execute("update user_preferences                                             \
                           set settings = '" + settings + "'                                \
                         where (" + filter.where + ")                                       \
            ", filter.binds, function(err, settings) {

                if (err) return Resp.sendError(res, log, err);

                Resp.sendResponse(res, log, 'User Settings Saved Successfully.', 'User Settings Saved Successfully.', '');

            });
        });
    });*/
}
