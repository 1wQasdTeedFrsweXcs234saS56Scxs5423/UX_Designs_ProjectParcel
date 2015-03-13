/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/ordersummaryOMPost
|
|
|   This webservice will return the Order Over all status to the OM
|   for the given so_no and source_system
|
|   written by  Deepu Krishnamurthy
|   May 2013
|
---------------------------------------------------------------------------*/

var SqlUtils = require('../lib/SqlUtils');
var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js');
var queryString = require("querystring");
var bunyan = require('bunyan');

var log = new bunyan({
    name: 'OrderSummaryOMWebService',
});

module.exports.init = function(app) {

    app.post('/ossui/v1/ordersummaryOMPost', app.role(AuthGroupSandyUser), function(req, res) {
        var soNo = req.body.so_no
        log.info('so_no ' + soNo);
        var sourceSystem = (req.body.source_system);
        log.info('source system' + sourceSystem);
        var data = JSON.parse(req.body.so_no).so_no;
        log.info('length of data' + data.length);

        for (var i = 0; i < data.length; i++) {
            if (i > 0) {
                newList = newList + "," + "'" + data[i] + "'";
            } else {
                newList = "'" + data[i] + "'";
            }
        }

        log.info('new list' + newList);

        DbPool.OSSDB(function(db) {

            db.execute("select backlog_hdr.order_no,backlog_hdr.so_no, \
                               backlog_hdr.order_overall_status        \
                          from backlog_hdr where backlog_hdr.so_no in (" + newList + ") \
                           and backlog_hdr.om_system = '" + sourceSystem + "'           \
                        ", [], function(err, summary) {
                if (err) {
                    return Resp.sendError(res, log, err);
                } else {
                    var diff = [];

                    if (summary.length != data.length) {

                        for (var i = 0; i < data.length; i++) {
                            exists = false;
                            for (var j = 0; j < summary.length; j++) {
                                if (data[i] == summary[j].so_no)
                                    exists = true;
                            }
                            if (exists == false) {
                                diff.push(data[i]);
                            }
                        }
                        log.info('difference in two array' + diff);
                    }
                    log.info('summary' + summary);

                    res.json({
                        'So_no_found': summary,
                        'So_no_not_found': diff,
                    });
                }
            });
        });
    });
}
