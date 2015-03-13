/*----------------------------------------------------------------------------
|
|   Route handler for /ossui/v1/shipmentdetail
|
|   This webservice will return the shipment details for the given HP
|   delivery number. The service will return the below details:
|       1.  Shipment Header Details
|       2.  Tracking Information
|       3.  Tracing Information
|       4.  Box Information
|
|   written by Alok Upendra Kamat
|   May 2013
|
\---------------------------------------------------------------------------*/

var augment = require('../lib/augment.js');
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require('../lib/SqlUtils2');
var PortalSec = require('../lib/PortalSecurity');
var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js');
var ExecScript = require('child_process');
var Bunyan = require('bunyan');
var FileSys = require('fs');

DTADirPath = "/var/opt/oss/backend/data/";
Cache = {}

var log = new Bunyan({
    name: 'shipmentDetailWebService',
});

module.exports.init = function(app) {

    log.info('registering /ossui/v1/shipmentdetail/:hpdelvno ...');

    // Internal ShipmentDetail Webservice.
    app.get('/ossui/v1/in/shipmentdetail/:hpdelvno', app.role(AuthGroupSandyUser), function(req, res) {

        DbPool.OSSDB(function(db) {

            db.execute("select distinct d.shipmentno as shipment_no,                                               \
                                        d.shipmentdate as ship_date,                                               \
                                        d.deliverydate as delivery_date,                                           \
                                        o.customerpurchaseno as cust_po_no,                                        \
                                        h.legacy_order_no as legacy_order_no,                                      \
                                        o.orderno as hp_order_no,                                                  \
                                        o.customerbaseno as customer_no,                                           \
                                        h.customer_name as customer_name,                                          \
                                        c.carriername as carrier,                                                  \
                                        trim(to_char(nvl(d.weight, 0),                                             \
                                        '999999999999999999999990.99')) as weight,                                 \
                                        d.unitofmeasure as unit_of_measure,                                        \
                                        h.est_tax as tax_value,                                                    \
                                        h.freight_charge as shipping_charges,                                      \
                                        h.payment_terms as payment_terms,                                          \
                                        d.sourcesystem as source_system,                                           \
                                        d.hpdepotcode as depot_to_addr_1,                                          \
                                        d.depotcity as depot_to_addr_2,                                            \
                                        hc.country_name as depot_to_addr_3                                         \
                          from delivery d                                                                          \
                          join ordersecdelrel r            on d.hpdeliveryno  = r.hpdeliveryno                     \
                          join ordersection o              on r.hporderno     = o.hporderno                        \
                          left outer join carrier c        on d.carrier_id    =  c.carrier_id                      \
                          left outer join country dc       on d.iso_country   = dc.iso_code                        \
                          left outer join country t        on d.delvtocountry = t.iso_code                         \
                          left outer join country hc       on d.depotcountry  = hc.iso_code                        \
                          left outer join delv_tracking dt on d.hpdeliveryno  = dt.hpdeliveryno                    \
                          left outer join backlog_hdr h    on r.hporderno     = h.legacy_order_no                  \
                          join backlog_ship  s on d.shipmentno = s.shipment_no and o.hporderno = s.legacy_order_no \
                          join backlog_ids ids on s.legacy_order_no = ids.legacy_order_no                          \
                         where d.hpdeliveryno  = :1                                                                \
            ", [req.params.hpdelvno], function(err, header) {

                if (err) return Resp.sendError(res, log, err);

                if (header.length == 0) return Resp.sendResponse(res, log, 'No shipment details found !!!',
                                                                 'No shipment details found !!!', '');

                var sourceSystem = getSystemId(header[0].source_system);

                // Loading DTA file data for Depot Address.
                loadDTAFileData(DTADirPath, sourceSystem);

                if (Cache.ShippointAddress && Cache.ShippointAddress[sourceSystem]
                    && Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1]) {

                    var depotToAddr3 = header[0].depot_to_addr_3;

                    header[0].depot_to_addr_2 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].name1;
                    header[0].depot_to_addr_3 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].name2;
                    header[0].depot_to_addr_4 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].name3;
                    header[0].depot_to_addr_5 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].street;

                    (Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].zip_code != '')
                        ? header[0].depot_to_addr_6 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].zip_code
                        + " " + Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].city
                        : header[0].depot_to_addr_6 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].city;

                    header[0].depot_to_addr_7 = depotToAddr3;
                }

                log.info(header);

                db.execute("select t.trackingno as tracking_no,                                                    \
                                   c.carriername as carrier,                                                       \
                                   dh.housebillno as hawb                                                          \
                              from delv_tracking t                                                                 \
                              join delv_header       dh on  t.id        = dh.id                                    \
                              left outer join carrier c on t.carrier_id = c.carrier_id                             \
                             where t.hpdeliveryno = :1                                                             \
                ", [req.params.hpdelvno], function(err, tracking) {

                    if (err) return Resp.sendError(res, log, err);

                    // Retrieving track and trace urls using legacy order number and shipment number
                    ExecScript.execFile("/opt/oss/pkg/frontend/scripts/OSfGetTrackAndTraceUrl.tcl",
                        [header[0].legacy_order_no, header[0].shipment_no], function(err, trackAndTraceUrls) {

                        if (err) return Resp.sendError(res, log, err);

                        var trackAndTraceUrlsJSON = JSON.parse(trackAndTraceUrls);

                        tracking.forEach(function(tracker, cb) {
                            if (trackAndTraceUrlsJSON[tracker.tracking_no] == undefined) {
                                tracker.carrier_website = null;
                                tracker.tat_url = null;
                            } else {
                                tracker.carrier_website = trackAndTraceUrlsJSON[tracker.tracking_no]['carrier_url'];

                                if (trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'].match(/^bridge=/i) ||
                                    trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'].match(/^fetchSTS=/i)) {

                                    tracker.tat_url = TATIntPreURL + trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'];

                                } else {
                                    tracker.tat_url = trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'];
                                }
                            }
                        });

                        log.info(tracking);

                        db.execute("select t.trackingno as tracking_no,                                            \
                                           (select description                                                     \
                                              from statuscode                                                      \
                                             where statuscode = e.statuscode) as status,                           \
                                           (select description                                                     \
                                              from reasoncode                                                      \
                                             where reasoncode = e.reasoncode) as reason                            \
                                      from delv_event e                                                            \
                                      join statuscode            s on s.statuscode = e.statuscode                  \
                                      join delv_tracking         t on t.id         = e.id                          \
                                      join carrier               c on c.carrier_id = t.carrier_id                  \
                                      left outer join reasoncode r on r.reasoncode = e.reasoncode                  \
                                     where t.hpdeliveryno = :1                                                     \
                                       and e.is_latest   = 'Y'                                                     \
                                  order by t.trackingno, e.event_datetime, e.loaded, e.statuscode,                 \
                                           e.version, e.reasoncode, r.displayorder                                 \
                        ", [req.params.hpdelvno], function(err, tracing) {

                            if (err) return Resp.sendError(res, log, err);

                            log.info(tracing);

                            db.execute("select distinct o.orderno as order_no,                                     \
                                               b.boxnumber as box_no,                                              \
                                               trim(to_char(nvl(b.boxweight, 0),                                   \
                                               '999999999999999999999990.99')) as weight                           \
                                          from box b                                                               \
                                    inner join ordersection o on b.hporderno = o.hporderno                         \
                                         where (b.hpdeliveryno = :1 or b.alt_shipment_no = :2)                     \
                                      order by o.orderno, b.boxnumber                                              \
                            ", [req.params.hpdelvno, req.params.hpdelvno], function(err, box) {

                                if (err) return Resp.sendError(res, log, err);

                                log.info(box);

                                var shipmentDetails = {
                                    header: header,
                                    tracking: tracking,
                                    tracing: tracing,
                                    box: box
                                };

                                Resp.sendResponse(res, log, 'Sending back shipment details.', '', shipmentDetails);
                            });
                        });
                    });
                });
            });
        });
    });

    // External ShipmentDetail Webservice.
    app.get('/ossui/v1/ex/shipmentdetail/:hpdelvno', app.role(AuthGroupExternal), function(req, res) {

        DbPool.OSSDB(function(db) {

            var filter = new SqlUtils.AndWhere();
            filter.addEq(req.params.hpdelvno, "d.hpdeliveryno");

            var bindStart = new SqlUtils2.Bind(filter.bindNo);

            PortalSec.CheckUser(req, db, bindStart, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {

                if (err) return Resp.sendError(res, log, err);

                log.info('userSettings:');
                log.info(userSettings);
                log.info('filter:');
                log.info(filter);

                filter.binds = filter.binds.concat( userSettings.bind.binds );
                filter.where = " ( " + filter.where + " ) and ( " + userSettings.where + " ) ";

                log.info('Main filter combined with portal security filter:');
                log.info(filter);

                db.execute("select distinct d.shipmentno as shipment_no,                                               \
                                            d.shipmentdate as ship_date,                                               \
                                            d.deliverydate as delivery_date,                                           \
                                            o.customerpurchaseno as cust_po_no,                                        \
                                            h.legacy_order_no as legacy_order_no,                                      \
                                            o.orderno as hp_order_no,                                                  \
                                            o.customerbaseno as customer_no,                                           \
                                            h.customer_name as customer_name,                                          \
                                            c.carriername as carrier,                                                  \
                                            trim(to_char(nvl(d.weight, 0),                                             \
                                            '999999999999999999999990.99')) as weight,                                 \
                                            d.unitofmeasure as unit_of_measure,                                        \
                                            h.est_tax as tax_value,                                                    \
                                            h.freight_charge as shipping_charges,                                      \
                                            h.payment_terms as payment_terms,                                          \
                                            d.sourcesystem as source_system,                                           \
                                            d.hpdepotcode as depot_to_addr_1,                                          \
                                            d.depotcity as depot_to_addr_2,                                            \
                                            hc.country_name as depot_to_addr_3                                         \
                              from delivery d                                                                          \
                              join ordersecdelrel r            on d.hpdeliveryno  = r.hpdeliveryno                     \
                              join ordersection o              on r.hporderno     = o.hporderno                        \
                              left outer join carrier c        on d.carrier_id    =  c.carrier_id                      \
                              left outer join country dc       on d.iso_country   = dc.iso_code                        \
                              left outer join country t        on d.delvtocountry = t.iso_code                         \
                              left outer join country hc       on d.depotcountry  = hc.iso_code                        \
                              left outer join delv_tracking dt on d.hpdeliveryno  = dt.hpdeliveryno                    \
                              left outer join backlog_hdr h    on r.hporderno     = h.legacy_order_no                  \
                              join backlog_ship  s on d.shipmentno = s.shipment_no and o.hporderno = s.legacy_order_no \
                              join backlog_ids ids on s.legacy_order_no = ids.legacy_order_no                          \
                             where (s.is_valid = 'Y' or s.is_valid is null)                                            \
                               and (" + filter.where + ")                                                              \
                ", filter.binds, function(err, header) {

                    if (err) return Resp.sendError(res, log, err);

                    if (header.length == 0) return Resp.sendResponse(res, log, 'No shipment details found !!!',
                                                                     'No shipment details found !!!', '');

                    var sourceSystem = getSystemId(header[0].source_system);

                    // Loading DTA file data for Depot Address.
                    loadDTAFileData(DTADirPath, sourceSystem);

                    if (Cache.ShippointAddress && Cache.ShippointAddress[sourceSystem]
                        && Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1]) {

                        var depotToAddr3 = header[0].depot_to_addr_3;

                        header[0].depot_to_addr_2 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].name1;
                        header[0].depot_to_addr_3 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].name2;
                        header[0].depot_to_addr_4 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].name3;
                        header[0].depot_to_addr_5 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].street;

                        (Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].zip_code != '')
                            ? header[0].depot_to_addr_6 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].zip_code
                            + " " + Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].city
                            : header[0].depot_to_addr_6 = Cache.ShippointAddress[sourceSystem][header[0].depot_to_addr_1].city;

                        header[0].depot_to_addr_7 = depotToAddr3;
                    }

                    log.info(header);

                    db.execute("select t.trackingno as tracking_no,                                                    \
                                       c.carriername as carrier,                                                       \
                                       dh.housebillno as hawb                                                          \
                                  from delv_tracking t                                                                 \
                                  join delv_header       dh on  t.id        = dh.id                                    \
                                  left outer join carrier c on t.carrier_id = c.carrier_id                             \
                                 where t.hpdeliveryno = :1                                                             \
                    ", [req.params.hpdelvno], function(err, tracking) {

                        if (err) return Resp.sendError(res, log, err);

                        // Retrieving track and trace urls using legacy order number and shipment number
                        ExecScript.execFile("/opt/oss/pkg/frontend/scripts/OSfGetTrackAndTraceUrl.tcl",
                            [header[0].legacy_order_no, header[0].shipment_no], function(err, trackAndTraceUrls) {

                            if (err) return Resp.sendError(res, log, err);

                            var trackAndTraceUrlsJSON = JSON.parse(trackAndTraceUrls);

                            tracking.forEach(function(tracker, cb) {
                                if (trackAndTraceUrlsJSON[tracker.tracking_no] == undefined) {
                                    tracker.carrier_website = null;
                                    tracker.tat_url = null;
                                } else {
                                    tracker.carrier_website = trackAndTraceUrlsJSON[tracker.tracking_no]['carrier_url'];

                                    if (trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'].match(/^bridge=/i) ||
                                        trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'].match(/^fetchSTS=/i)) {

                                        var hostAndPort = req.headers.host.split(":");
                                        tracker.tat_url = TATExtPreURL + trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'];

                                    } else {
                                        tracker.tat_url = trackAndTraceUrlsJSON[tracker.tracking_no]['tat_url'];
                                    }
                                }
                            });

                            log.info(tracking);

                            db.execute("select t.trackingno as tracking_no,                                            \
                                               (select description                                                     \
                                                  from statuscode                                                      \
                                                 where statuscode = e.statuscode) as status,                           \
                                               (select description                                                     \
                                                  from reasoncode                                                      \
                                                 where reasoncode = e.reasoncode) as reason                            \
                                          from delv_event e                                                            \
                                          join statuscode            s on s.statuscode = e.statuscode                  \
                                          join delv_tracking         t on t.id         = e.id                          \
                                          join carrier               c on c.carrier_id = t.carrier_id                  \
                                          left outer join reasoncode r on r.reasoncode = e.reasoncode                  \
                                         where t.hpdeliveryno = :1                                                     \
                                           and e.is_latest   = 'Y'                                                     \
                                      order by t.trackingno, e.event_datetime, e.loaded, e.statuscode,                 \
                                               e.version, e.reasoncode, r.displayorder                                 \
                            ", [req.params.hpdelvno], function(err, tracing) {

                                if (err) return Resp.sendError(res, log, err);

                                log.info(tracing);

                                db.execute("select distinct o.orderno as order_no,                                     \
                                                   b.boxnumber as box_no,                                              \
                                                   trim(to_char(nvl(b.boxweight, 0),                                   \
                                                   '999999999999999999999990.99')) as weight                           \
                                              from box b                                                               \
                                        inner join ordersection o on b.hporderno = o.hporderno                         \
                                             where (b.hpdeliveryno = :1 or b.alt_shipment_no = :2)                     \
                                          order by o.orderno, b.boxnumber                                              \
                                ", [req.params.hpdelvno, req.params.hpdelvno], function(err, box) {

                                    if (err) return Resp.sendError(res, log, err);

                                    log.info(box);

                                    var shipmentDetails = {
                                        header: header,
                                        tracking: tracking,
                                        tracing: tracing,
                                        box: box
                                    };

                                    Resp.sendResponse(res, log, 'Sending back shipment details.', '', shipmentDetails);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

/**
 * Loads DTA file data required for depot address section into a global array.
 * @param DTADirPath          DTA file directory path
 * @param sourceSystem        Source System
 * @return -                  None
 */
function loadDTAFileData (DTADirPath, sourceSystem) {

    var DTAFilePath = DTADirPath + sourceSystem + '/tvst_adrc.dta';
    Cache.ShippointAddress = {}

    if (FileSys.existsSync(DTAFilePath)) {
        Cache.ShippointAddress[sourceSystem] = {}
        var fileData = FileSys.readFileSync(DTAFilePath).toString().split("\n");

        for(eachRowIndex in fileData) {

            if (isNaN(eachRowIndex)) return;

            var rowData = fileData[eachRowIndex].replace(/{(.*?)} /g, function(all, match) {
                    if (match == '') return " {} ";
                    else return " " + match.replace(/\s/g, "||") + " ";
                }).replace(/\s+/g, " ").replace(/{}/g, "").split(" ");

            if (eachRowIndex == 0) {
                var columnName = rowData;

            } else {
                Cache.ShippointAddress[sourceSystem][rowData[0]] = {};

                for (i = 1; i < rowData.length; i++) {
                    Cache.ShippointAddress[sourceSystem][rowData[0]][columnName[i]] = rowData[i].replace(/\|\|/g, " ");
                }
            }
        }
    }
}

/**
 * Returns source system id for the given source system.
 * @param sourceSystem        Source System
 * @return -                  Source System Id
 */
function getSystemId (sourceSystem) {

    switch (sourceSystem) {
        case 'US-SAP':
            return 'SAP-R00';
            break;

        case 'EUFUSION':
        case 'SAP-R01-ET':
        case 'SAP-R01-ESG':
        case 'SAP-R01-PSG':
            return 'SAP-R01';
            break;

        case 'CPDE-SAP':
            return 'SAPCPO';
            break;

        default:
            return sourceSystem;
    }
}
