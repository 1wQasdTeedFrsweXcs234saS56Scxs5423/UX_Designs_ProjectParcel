/*----------------------------------------------------------------------------
|
|   Route handler for /ossui/v1/dtechinfo
|
|   This webservice will return the detail tech info (serial/asset no. info)
|   for the given legacy order number.
|
|   written by Alok Upendra Kamat
|   September 2013
|
\---------------------------------------------------------------------------*/

var augment = require('../lib/augment.js');
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require('../lib/SqlUtils2');
var PortalSec = require('../lib/PortalSecurity');
var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js');
var Bunyan = require('bunyan');
var DetailTechInfoLib = require('../lib/detailTechInfo.js');

var log = new Bunyan({
    name: 'detailTechInfoWebService'
});

module.exports.init = function(app) {

    log.info('registering /ossui/v1/dtechinfo ...');

    // Internal DetailTechInfo Webservice.
    app.get('/ossui/v1/in/dtechinfo', app.role(AuthGroupSandyUser), function(req, res) {

        DbPool.OSSDB(function(db) {

            var filter = new SqlUtils.AndWhere();

            if (req.query.lon)
                filter.addEq(req.query.lon, "d.legacy_order_no");
            else
                return Resp.sendError(res, log, "Service did not receive the primary request parameter: lon (legacy order no).");

            if (req.query.item) filter.addEq(req.query.item, "t.item_subitem");
            if (req.query.delvgrp) filter.addEq(req.query.delvgrp, "t.delivery_group");

            log.info('filter:');
            log.info(filter);

            db.execute("select distinct t.delivery_group,                                   \
                                        t.item_subitem,                                     \
                                        t.serial_number,                                    \
                                        t.asset_tag,                                        \
                                        t.primary_mac_addr,                                 \
                                        t.imei,                                             \
                                        d.fact_delv_no,                                     \
                                        d.shipment_no,                                      \
                                        i.material_no,                                      \
                                        i.product_descr,                                    \
                                        t.system_info,                                      \
                                        t.box_no,                                           \
                                        i.coo_exclusion_flag                                \
                          from detail_techinfo t, backlog_delv d, backlog_item i            \
                         where (" + filter.where + ")                                       \
                           and d.delivery_group = t.delivery_group                          \
                           and i.delivery_group = d.delivery_group                          \
                           and i.item_subitem = t.item_subitem                              \
                      order by d.shipment_no, t.item_subitem, t.serial_number               \
            ", filter.binds, function(err, dTechInfo) {

                if (err) return Resp.sendError(res, log, err);

                if (dTechInfo.length == 0)
                    return Resp.sendResponse(res, log, 'No technical information found !!!',
                                             'No technical information found !!!', '');

                var serialAssetInfo = {};
                serialAssetInfo = DetailTechInfoLib.constructSerialAssetInfo(dTechInfo, "int");

                Resp.sendResponse(res, log, 'Sending back technical details.', '', serialAssetInfo);
            });
        });
    });

    // External DetailTechInfo Webservice.
    app.get('/ossui/v1/ex/dtechinfo', app.role(AuthGroupExternal), function(req, res) {

        DbPool.OSSDB(function(db) {

            var filter = new SqlUtils.AndWhere();

            if (req.query.lon)
                filter.addEq(req.query.lon, "d.legacy_order_no");
            else
                return Resp.sendError(res, log, "Service did not receive the primary request parameter: lon (legacy order no).");

            if (req.query.item) filter.addEq(req.query.item, "t.item_subitem");
            if (req.query.delvgrp) filter.addEq(req.query.delvgrp, "t.delivery_group");

            var bindStart = new SqlUtils2.Bind(filter.bindNo);

            PortalSec.CheckUser(req, db, bindStart, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {

                if (err) return Resp.sendError(res, log, "User " + req.user_id + " is not authorized to view the requested details.");

                log.info('userSettings:');
                log.info(userSettings);
                log.info('filter:');
                log.info(filter);

                filter.binds = filter.binds.concat( userSettings.bind.binds );
                filter.where = " ( " + filter.where + " ) and ( " + userSettings.where + " ) ";

                log.info('Main filter combined with portal security filter:');
                log.info(filter);

                db.execute("select distinct t.delivery_group,                                   \
                                            t.item_subitem,                                     \
                                            t.serial_number,                                    \
                                            t.asset_tag,                                        \
                                            t.primary_mac_addr,                                 \
                                            t.imei,                                             \
                                            d.fact_delv_no,                                     \
                                            d.shipment_no,                                      \
                                            i.material_no,                                      \
                                            i.product_descr,                                    \
                                            t.system_info,                                      \
                                            t.box_no,                                           \
                                            i.coo_exclusion_flag                                \
                              from detail_techinfo t, backlog_delv d, backlog_item i            \
                             where (" + filter.where + ")                                       \
                               and d.delivery_group = t.delivery_group                          \
                               and i.delivery_group = d.delivery_group                          \
                               and i.item_subitem = t.item_subitem                              \
                          order by d.shipment_no, t.item_subitem, t.serial_number               \
                ", filter.binds, function(err, dTechInfo) {

                    if (err) return Resp.sendError(res, log, err);

                    if (dTechInfo.length == 0)
                        return Resp.sendResponse(res, log, 'No technical information found !!!',
                                                 'No technical information found !!!', '');

                    var serialAssetInfo = {};
                    serialAssetInfo = DetailTechInfoLib.constructSerialAssetInfo(dTechInfo, "ext");

                    Resp.sendResponse(res, log, 'Sending back technical details.', '', serialAssetInfo);
                });
            });
        });
    });
}
