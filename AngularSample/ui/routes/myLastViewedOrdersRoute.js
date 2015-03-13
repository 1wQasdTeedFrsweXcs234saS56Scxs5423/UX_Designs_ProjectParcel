/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/in/myLastViwedOrders
|   This webservice will return the last viewed orders
|   for the given user
|
|   written by Fouzia Nishath
|   Nov 2013
|
\---------------------------------------------------------------------------*/

var lastViewedOrders = require('../lib/myLastViewedOrders.js');
var bunyan = require('bunyan');
var Resp = require('../lib/RespUtils.js');
var DbPool = require('../lib/DbPool');

var log = new bunyan({
    name: 'LastViewedOrdersWebService',
});

module.exports.init = function(app) {
    app.get('/ossui/v1/in/myLastViwedOrders', app.role(AuthGroupSandyUser), function(req, res) {

        var msg = "";
        log.info('Getting last viewed orders...');
        var userId = req.user_id;

        console.log("userId:" + userId);

        lastViewedOrders.getMyLastOrders(userId, function(err, lastOrders) {

            if (err) {
                log.error(err);
                return Resp.sendError(res, log, err);
            }

            if (lastOrders == null || lastOrders.length == 0) {
                var msg = "No orders are viewed by the user: " + userId;
                Resp.sendResponse(res, log, "Sending last veiwed orders", msg, lastOrders);

            } else {
                Resp.sendResponse(res, log, "Sending last veiwed orders", msg, lastOrders);
            }
        });
    }); //app
}
