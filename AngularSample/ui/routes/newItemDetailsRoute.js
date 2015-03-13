/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/<in/ex>/itemdetail
|
|   written by Sravan
|   Jun 2013
|
\---------------------------------------------------------------------------*/

var DbPool = require('../lib/DbPool');
var ItemDetails = require('../lib/newItemDetails');
var config = require('../config/config.js');
var Resp = require('../lib/RespUtils.js');
var _ = require('underscore');
var LogJs = require('../lib/logJs');
var SqlUtils2 = require("../lib/SqlUtils2");
var PortalSec = require("../lib/PortalSecurity")
var bunyan = require('bunyan');

var log = new bunyan({
    name: 'ItemDetailWebService',
});

var CompleteBundlePrice = 0.00;
module.exports.init = function(app) {
    app.get('/ossui/v1/in/newitemdetail', app.role(AuthGroupSandyUser), function(req, res) {
        var cust = "in";
        DbPool.OSSDB(function(db) {
            log.info('Getting Line item details...');
            ItemDetails.getCount(req.query.oid, db, cust, [], function(err, result) {
                if (result == null || result.length == 0) {
                    var msg = "No Order found";
                    res.json({
                        'status': 'N',
                        'message': msg,
                        'data': '',
                    });
                } else {
                    var msg = "";
                    var totalCount = result[0]['count'];

                    var indentaion_flag = 0;

                    ItemDetails.getItemDetails(result[0]['order_no'], db, cust, function(err, newItems, indentaion_flag, haveBundleID, haveConfigID, haveConfigUID) {
                        if (err) {
                            log.error(err);
                            return Resp.sendError(res, log, err);
                        }
                        if (newItems == null || newItems.length == 0) {
                            var msg = "No Item details found for order#: " + legacy_order_no;
                            Resp.sendItemResponse(res, log, 'Sending back Item Details.', msg, 0, 0, 0, 0, newItems);
                        } else {
                            Resp.sendItemResponse(res, log, 'Sending back Item Details.', msg, 0, 0, totalCount, indentaion_flag, haveBundleID, haveConfigID, haveConfigUID, newItems);
                        }
                    }); //items
                }
            }); //count
        }); //db
    }); //app

    log.info('registering /ossui/v1/ex/newitemdetail/ ...');

    app.get('/ossui/v1/ex/newitemdetail', app.role(AuthGroupExternal), function(req, res) {

        var cust = "ex";
        var b = new SqlUtils2.Bind(1);

        DbPool.OSSDB(function(db) {
            log.info('Getting item details...');
            PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
                if (err) {
                    log.error(err);
                    return Resp.sendError(res, log, err);
                }

                if (userSettings == null || userSettings.length == 0) {
                    var msg = "No User found";
                    res.json({
                        'status': 'N',
                        'message': msg,
                        'data': '',
                    });

                }

                ItemDetails.getCount(req.query.oid, db, cust, userSettings, function(err, result) {
                    console.log(result);
                    if (result == null || result.length == 0) {
                        var msg = "No Order found";
                        res.json({
                            'status': 'N',
                            'message': msg,
                            'data': '',
                        });
                    } else {

                        var msg = "";
                        var totalCount = result[0]['count'];
                        var indentaion_flag = 0;

                        ItemDetails.getItemDetails(result[0]['order_no'], db, cust, function(err, newItems, indentaion_flag, haveBundleID, haveConfigID, haveConfigUID) {
                            if (err) {
                                log.error(err);
                                return Resp.sendError(res, log, err);
                            }
                            if (newItems == null || newItems.length == 0) {
                                var msg = "No Item details found for order#: " + result[0]['order_no'];
                                Resp.sendItemResponse(res, log, 'Sending back Item Details.', 0, 0, msg, newItems);
                            } else {
                                Resp.sendItemResponse(res, log, 'Sending back Item Details.', msg, 0, 0, totalCount, indentaion_flag, haveBundleID, haveConfigID, haveConfigUID, newItems);
                            }

                        }); //items
                    }
                }); //count
            });
        });
    });
}
