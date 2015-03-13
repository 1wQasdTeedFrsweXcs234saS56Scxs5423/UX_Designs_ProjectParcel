/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/<in/ex>/pricingdetail
|
|   written by Fouzia Nishath
|   Jun 2013
|
\---------------------------------------------------------------------------*/

var pricingDetails = require('../lib/newPricingDetail');
var Resp = require('../lib/RespUtils.js');
var LogJs = require('../lib/logJs');
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2");
var PortalSec = require("../lib/PortalSecurity");
var bunyan = require('bunyan');
var DbPool = require('../lib/DbPool');

var log = new bunyan({
    name: 'PricingWebService',
});

module.exports.init = function(app) {
    app.get('/ossui/v1/in/pricingdetail', app.role(AuthGroupSandyUser), function(req, res) {
        var cust = "in";
        var msg = "";
        var aaid = req.aaid;
        log.info('Getting line item pricing details...');
        var hpOrderNo = req.query.hpOrderNo;
        var withPrice = "None";
        var showPrice = "None";
        var totalNetPrice = 0;
        var resellerOrder = "None";
        var completPricingDetails = [];

        pricingDetails.getPricingDetail(hpOrderNo, aaid, cust, withPrice, showPrice, resellerOrder, totalNetPrice, function(err, pricing) {
            if (err) {
                log.error(err);
                return Resp.sendError(res, log, err);
            }
            if (pricing == null || pricing.length == 0) {
                var msg = "No pricing details found for order#: " + hpOrderNo;
                Resp.sendResponse(res, log, "Sending pricing details", msg, pricing);

            } else {
                completPricingDetails.push({
                    pricing: pricing
                });

                Resp.sendResponse(res, log, "Sending pricing details", msg, completPricingDetails);
            }
        }); //count
    }); //app

    log.info('registering /ossui/v1/ex/pricingdetail/ ...');

    app.get('/ossui/v1/ex/pricingdetail', app.role(AuthGroupExternal), function(req, res) {

        var showPrice = "None";
        var resellerOrder = "None";
        var totalNetPrice = 0;

        var cust = "ex";
        var aaid = req.aaid;

        DbPool.OSSDB(function(db) {
            log.info('Getting Line item pricing details...');

            var completPricingDetails = [];
            var hpOrderNo = req.query.hpOrderNo;
            var filter = new SqlUtils.AndWhere();

            filter.addEq(hpOrderNo, "h.legacy_order_no");
            var bind = new SqlUtils2.Bind(filter.bindNo);

            PortalSec.CheckUser(req, db, bind, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
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
                console.log("withPrice:" + withPrice);

                filter.binds = filter.binds.concat(userSettings.bind.binds);
                filter.where = filter.where + "  and ( " + userSettings.where + " ) ";
                var lOrderNo = "";

                pricingDetails.checkOrderForExternalUser(filter, function(err, legacyOrderNo) {
                    if (legacyOrderNo == null || legacyOrderNo.length == 0) {

                        var msg = "User is not authorized to view the pricing details of the order no:" + hpOrderNo;
                        res.json({
                            'status': 'N',
                            'message': msg,
                            'data': '',
                        });

                    } else {

                        legacyOrderNo.forEach(function(row, i) {

                            lOrderNo = row.legacy_order_no;
                            showPrice = row.show_prices;
                            resellerOrder = row.reseller_order;
                            totalNetPrice = row.total_net_price;
                        });

                        pricingDetails.getPricingDetail(lOrderNo, aaid,cust, withPrice, showPrice, resellerOrder, totalNetPrice, function(err, pricing) {

                            if (err) {

                                log.error(err);
                                return Resp.sendError(res, log, err);

                            }
                            if (pricing == null || pricing.length == 0) {

                                var msg = "No Pricing details found for order#: " + hpOrderNo;
                                Resp.sendResponse(res, log, "Sending pricing details", msg, pricing);

                            } else {

                                completPricingDetails.push({
                                    pricing: pricing
                                });
                                Resp.sendResponse(res, log, "Sending pricing details", msg, completPricingDetails);

                            }

                        });
                    }
                });
            }); //portal
        });
    });
}
