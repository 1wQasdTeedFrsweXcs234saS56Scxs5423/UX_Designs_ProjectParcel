/*----------------------------------------------------------------------------
|
|   This file contains all the functions used in My last
|   viewed order webservice
|
|
|   written by Fouzia Nishath
|   Nov 2013
|
\---------------------------------------------------------------------------*/

var DbPool = require('../lib/DbPool');
var async = require('async');
var convert = require('../lib/pricingDetail')

/**
 * This function returns last viewed orders
 * @param userId                 User ID
 * @return -                     Last viewed orders
 */

module.exports.getLastViewedOrders = function(userId, cb) {

    DbPool.OSSDB(function(db) {

        var sqlString = "";
        var lastOrders = {};
        var lastOrdersStr = "";

        sqlString = "select last_orders     \
                       from sandy_hist      \
                      where username =:1 "

        console.log("sqlString:" + sqlString);
        db.execute(sqlString, [userId], function(err, lastOrderNos) {
            if (err) return cb(err, null);
            cb(null, lastOrderNos);
        });
    });
}

/**
 * This function returns last viewed orders details
 * @param userId                 last orders
 * @return -                     Last viewed orders details
 */

module.exports.getMyLastOrders = function(userId, cb) {

    var sqlString = "";
    var lastOrdersDetails = [];
    var lastOrdersStr = "";
    var lastOrders = "";

    exports.getLastViewedOrders(userId, function(err, lastOrderNos) {

        if (lastOrderNos.length != 0) {

            lastOrderNos.forEach(function(row, i) {
                lastOrders = (row.last_orders).split(" ");
            });
            lastOrdersStr = lastOrders.join("','");
            var instString = lastOrders.join(",");
            instString = "'"+instString+"',h.legacy_order_no";

            DbPool.OSSDB(function(db) {

                 sqlString = "select h.legacy_order_no, h.order_no, h.customer_name,\
                                h.purchase_order_no, h.last_update,h.order_overall_status,  \
                                h.work_note_attribs, h.b2bis_id,h.customer_no, \
                                h.order_type,h.order_type_descr,h.total_price,h.currency  \
                           from backlog_hdr h                                  \
                          where h.legacy_order_no in ('" + lastOrdersStr + "') \
                          order by instr("+instString+")";

                console.log("sqlString:" + sqlString);

                db.execute(sqlString, [], function(err, result) {

                    result.forEach(function(detail, i) {

                        var orderType = detail.order_type_descr + " (" + detail.order_type + ")";
                        var price = 0.0;
                        price = convert.toUSD(detail.total_price);

                        lastOrdersDetails.push({
                            "orderNo": detail.order_no,
                            "legacyOrderNo": detail.legacy_order_no,
                            "purchaseOrderNo": detail.purchase_order_no,
                            "status": detail.order_overall_status,
                            "customerName": detail.customer_name,
                            "customerNo": detail.customer_no,
                            "totalPrice": parseFloat(price),
                            "currency": detail.currency,
                            "orderType": orderType,
                            "lastChange": detail.last_update
                        });
                    });
                    cb(null, lastOrdersDetails);
                }); //db.execute
            }); //db.pool
        } else {
            cb(null, lastOrdersDetails);
        }
    }); //getLastViewedOrders
}

module.exports.insertUser = function(userId, cb) {

    var sqlInsertString = '';
    DbPool.OSSDB(function(db) {
        sqlInsertString = "insert into sandy_hist (username, last_mode, last_profiles,\
                                       last_orders, options, last_update)             \
                                values ('" + userId + "','','','','',CURRENT_TIMESTAMP)"

        console.log("sqlInsertString:" + sqlInsertString);

        db.execute(sqlInsertString, [], function(err, result) {
            console.log(result);
            cb(null,result);
        });
    });
}

module.exports.logOrder = function(userId, newOrder, cb) {

    exports.getLastViewedOrders(userId, function(err, lastOrderNos) {

        if (lastOrderNos.length == 0) {
            async.series([
                function(callback) {
                    console.log("Adding a user to view last orders...");
                    exports.insertUser(userId, function(err, result) {
                        if (result[0]["updateCount"] == 1) {
                            callback();
                        }
                    });

                },
                function(callback) {
                    exports.updateOrderIntoHistory(newOrder, userId, function(err, resultUpdate) {
                        console.log("Updated order ...");
                        cb(null,resultUpdate);
                        callback();
                    });

                }
            ], function(err) {

            });

        } else {

            var lastOrders = [];
            lastOrders.push(newOrder);

            lastOrderNos.forEach(function(row, i) {

                var tempArr = (row.last_orders).split(" ");

                for(var i = 0;i < tempArr.length; i++) {

                    if(lastOrders.indexOf(tempArr[i]) == -1) {

                        if(lastOrders.join(" ").length < 470) {

                          lastOrders.push(tempArr[i]);
                        }
                    }
                }

                var newLastOrders = lastOrders.join(" ");

                exports.updateOrderIntoHistory(newLastOrders, userId,function(err, result) {
                    console.log("updated viewed order");
                    cb(null,result)
                });

            });
        }
    });
}

module.exports.updateOrderIntoHistory = function(lastOrders, userId, cb) {
    var sqlString = "";

    DbPool.OSSDB(function(db) {
        sqlString = "update sandy_hist                     \
                        set last_orders =:1,               \
                            last_update = CURRENT_TIMESTAMP\
                      where username =:2"

        console.log("sqlString:" + sqlString);
        db.execute(sqlString, [lastOrders, userId], function(err, result) {
            console.log("updated:" + result);
            cb(null,result);
        });
    });
}
