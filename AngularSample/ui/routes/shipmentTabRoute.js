/*-----------------------------------------------------------------------------/
Route handler for /ossui/v1/shipmenttab
Includes internal and external services to retireve Box Information,
Item Information, Tracking Information, Status History and RFUID Information for
all shipments.

Written by Ashwini Upadhya
Nov 2013

/-----------------------------------------------------------------------------*/

var augment = require('../lib/augment.js');
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require('../lib/SqlUtils2');
var PortalSec = require('../lib/PortalSecurity');
var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js');
var ExecScript = require('child_process');
var Bunyan = require('bunyan');
var FileSys = require('fs');
var shipment = require('../lib/shipmentTab.js');

var log = new Bunyan({
    name: 'shipmentTabInfoWebservice',
});

var filter = new SqlUtils.AndWhere();
var b = new SqlUtils2.Bind(filter.bindNo);

module.exports.init = function(app) {
    log.info('registering /ossui/v1/shipmenttab...');

    var Cache = {};

    app.get('/ossui/v1/in/shipmenttab', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {

            shipment.shipmentInfo(req, db, "in", function(err, headerCS) {
                if (headerCS == null) {
                    var msg = "No records found, Please provide legacy order number"
                    res.json({
                        'status': 'N',
                        'message': msg,
                        'data': '',
                    });

                } else {
                    var dodRfidFlag = "N";

                    if (headerCS[0].dod_flag == 'Y' || headerCS[0].rfid_flag == "Y") {
                        dodRfidFlag = "Y";
                    }
                    res.json({
                        status: "S",
                        dodRfidFlag: dodRfidFlag,
                        totalCount: headerCS.length,
                        data: headerCS
                    });
                }
            });
        });
    });

    app.get('/ossui/v1/in/trackInfo', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {

            shipment.trackInfo(req, db, "in", function(err, tracks) {
                if (tracks == null) {
                    var msg = "No records found"
                    res.json({
                        status: "E",
                        Message: msg,
                        Data: ''
                    });

                } else {
                    res.json({
                        status: "S",
                        Trackinfo: tracks
                    });
                }
            });
        });
    });

    app.get('/ossui/v1/in/boxInfo', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {

            shipment.boxDetail(req, db, function(err, boxDetails) {
                if (boxDetails == null) {
                    var msg = "No records found"
                    res.json({
                        'status': 'N',
                        'message': msg,
                        'data': '',
                    });

                } else {
                    res.json({
                        status: "Success",
                        boxdetails: boxDetails
                    });
                }
            });
        });
    });

    app.get('/ossui/v1/in/statusHistory', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {

            shipment.statusHistory(req, db, function(err, statusHistory) {
                res.json({
                    status: "S",
                    Event: statusHistory
                });
            });
        });
    });

    app.get('/ossui/v1/in/itemInfo', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {

            shipment.itemInfo(req, db, "in", function(err, itemDetails) {
                res.json({
                    status: "S",
                    Iteminfo: itemDetails
                });
            });
        });
    });

    app.get('/ossui/v1/in/dodInfo', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {

            shipment.dodInfo(req, db, function(err, dodDetails) {
                if (dodDetails == null) {
                    var msg = "No dodinfo found for this order !!"
                    res.json({
                        'status': 'N',
                        'message': msg,
                        'data': '',
                    });
                } else {
                    res.json({
                        status: "S",
                        dod: dodDetails
                    });
                }
            });
        });
    });
    //---------------------------------------------------------------//
    //----------------External Services------------------------------//
    //---------------------------------------------------------------//

    app.get('/ossui/v1/ex/shipmenttab', app.role(AuthGroupExternal), function(req, res) {
        DbPool.OSSDB(function(db) {

            PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
                if (err) {
                    return Resp.sendError(res, log, err);
                }
                shipment.shipmentInfo(req, db, "ex", function(err, headerCS) {

                    if (headerCS == null) {
                        var msg = "No records found, Please provide legacy order number"
                        res.json({
                            'status': 'N',
                            'message': msg,
                            'data': '',
                        });

                    } else {

                        var dodRfidFlag = "N";
                        if (headerCS[0].dod_flag == 'Y' || headerCS[0].rfid_flag == "Y") {
                            dodRfidFlag = "Y";
                        }
                        res.json({
                            status: "S",
                            dodRfidFlag: dodRfidFlag,
                            totalCount: headerCS.length,
                            data: headerCS
                        });
                    }
                });
            });
        });
    });

    app.get('/ossui/v1/ex/trackInfo', app.role(AuthGroupExternal), function(req, res) {
        DbPool.OSSDB(function(db) {

            PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
                if (err) {
                    return Resp.sendError(res, log, err);
                }
                shipment.trackInfo(req, db, "ex", function(err, tracks) {
                    if (tracks == null) {
                        var msg = "No records found"
                        res.json({
                            status: "E",
                            Message: msg,
                            Data: ''
                        });

                    } else {
                        res.json({
                            status: "S",
                            Trackinfo: tracks
                        });
                    }
                });
            });
        });
    });

    app.get('/ossui/v1/ex/boxInfo', app.role(AuthGroupExternal), function(req, res) {
        DbPool.OSSDB(function(db) {

            PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
                if (err) {
                    return Resp.sendError(res, log, err);
                }
                shipment.boxDetail(req, db, function(err, boxDetails) {

                    if (boxDetails == null) {
                        var msg = "No records found"
                        res.json({
                            'status': 'N',
                            'message': msg,
                            'data': '',
                        });
                    } else {
                        res.json({
                            status: "Success",
                            boxdetails: boxDetails
                        });
                    }
                });
            });
        });
    });

    app.get('/ossui/v1/ex/statusHistory', app.role(AuthGroupExternal), function(req, res) {
        DbPool.OSSDB(function(db) {

            PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
                if (err) {
                    return Resp.sendError(res, log, err);
                }
                shipment.statusHistory(req, db, function(err, statusHistory) {
                    res.json({
                        status: "S",
                        Event: statusHistory
                    });
                });
            });
        });
    });

    app.get('/ossui/v1/ex/itemInfo', app.role(AuthGroupExternal), function(req, res) {
        DbPool.OSSDB(function(db) {

            PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
                if (err) {
                    return Resp.sendError(res, log, err);
                }
                shipment.itemInfo(req, db, "ex", function(err, itemDetails) {
                    res.json({
                        status: "S",
                        Iteminfo: itemDetails
                    });
                });
            });
        });
    });
}
