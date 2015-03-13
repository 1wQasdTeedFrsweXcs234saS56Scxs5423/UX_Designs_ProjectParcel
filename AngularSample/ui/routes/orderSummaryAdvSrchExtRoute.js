/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/ex/ordersummary
|
|
|   This webservice will return the Order Summary details for the Simple or
|   Advanced search criteria entered by user.
|
|   written by Alok Upendra Kamat
|   November 2013
|
---------------------------------------------------------------------------*/

var augment   = require("../lib/augment.js")
var SqlUtils  = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2");
var PortalSec = require("../lib/PortalSecurity");
var DbPool    = require('../lib/DbPool');
var config    = require('../config/config.js');
var Resp      = require('../lib/RespUtils.js');
var tstore    = require('../lib/tstore');
var osconfig  = require('/etc/opt/oss/backend/UI.cfg');
var bunyan    = require('bunyan');

fromClause  = "";
whereClause = "";

ts = new tstore.TStore(osconfig.UITstoreConnection);

var log = new bunyan({
    name: 'ExternalOrderSummaryWebService'
});

/*----------------------------------------------------------------------------
|   OSSTSQueryExt - run tstore SQL where clause against the two partitions
|                   of the  main OSS TSTORE
|
|                   partition 1 : external/customer non-recent orders
|                   partition 2 : external/customer recent orders
----------------------------------------------------------------------------*/
function OSSTSQueryExt(where, cb)
{
    if (where == '') return cb(null, '');

    ts.all(1, "select order_no from orders where " + where, function(err, legacyList1) {
        if (err) return cb(err);

        ts.all(2, "select order_no from orders where " + where, function(err, legacyList2) {
            if (err) return cb(err);

            var orders1 = legacyList1.replace(/','/g, '~').replace(/'/g, '').split('~');
            var orders2 = legacyList2.replace(/','/g, '~').replace(/'/g, '').split('~');

            if (orders1.length == 1  && orders1[0] == '') {
                orders1 = [];
            }

            if (orders2.length == 1  && orders2[0] == '') {
                orders2 = [];
            }

            var orders = orders1.concat(orders2).sort();

            if (orders.length == 0) {
                return cb('NonExistingOrder', "");  // dummy expression
            }

            if (orders.length > 500) {
                orders = orders.slice(0, 500);
            }

            cb(null, ("'"+ orders.join("','") + "'"));
        });
    });
}

/*----------------------------------------------------------------------------
|   formatValues  - Format the given value depending on the flags set.
|
|   @value              Value to be formatted
|   @wildCardFlag       If set, will replace '*' with '%'
|   @trimLeadZeroFlag   If set, will trim leading zeros if any
|   @toUpperFlag        If set, will change the case to UPPER
|
|   Note: By default this function will trim leading & trailing white spaces.
----------------------------------------------------------------------------*/
function formatValues(value, wildCardFlag, trimLeadZeroFlag, toUpperFlag) {

    value = value.trim();

    if (wildCardFlag) value = value.replace(/\*/g, '');

    if (trimLeadZeroFlag) value = value.replace(/^0+/, '');

    if (toUpperFlag) value = value.toUpperCase();

    return value;
}

/*----------------------------------------------------------------------------
|   addSingleAndMultipleOrToWhere  - This function will add single 'and'
|                                    and multiple 'or' to the given where
|                                    clause.
|
|   @filter             Filter
|   @uiValue            Value
|   @dbField            Database Field
|   @wildCardFlag       If set, will replace '*' with '%' in uiValue
|   @trimLeadZeroFlag   If set, will trim leading zeros if any in uiValue
|   @toUpperFlag        If set, will change the case to UPPER of uiValue
|
|   Note: By default this function will trim leading & trailing white spaces.
----------------------------------------------------------------------------*/
function addSingleAndMultipleOrToWhere(filter, uiValue, dbField, wildCardFlag, trimLeadZeroFlag, toUpperFlag) {

    filter.where += " and (";
    filter.or = "";

    uiValue.forEach(function(value, cb) {
        fValue = formatValues(value, wildCardFlag, trimLeadZeroFlag, toUpperFlag);
        filter.orLike(fValue, dbField);
    });

    filter.where += ') ';
}

/*----------------------------------------------------------------------------
|   addTStoreProdLineFilter  - This function will add tStore filter related to
|                              product lines.
|
|   @tsfilter           TStore Filter
|   @tmpfilter          Temporary Filter
|   @productLines       Product Lines
----------------------------------------------------------------------------*/
function addTStoreProdLineFilter(tsfilter, tmpfilter, productLines) {

    if (tsfilter.and == "") tsfilter.where += " (";
    else tsfilter.where += " and (";

    var pLStore = [ "91", "7F", "6J", "SI", "KV", "1N", "AN", "5M", "5T", "5X",
                    "1X", "SY", "MP", "BO", "AU", "83", "PQ", "MG", "21", "72",
                    "9F", "C2", "8A", "KN", "AK", "3C", "8B", "06", "4X", "7A",
                    "7T", "LY", "9G", "9J", "B7", "LA", "30", "6N", "6H", "9H" ];

    productLines.forEach(function(value, cb) {
        productLine = formatValues(value, 0, 0, 1);

        if(pLStore.indexOf(productLine) != -1) {
            tmpfilter.addY("has_pl_" + productLine);
        } else {
            switch (productLine) {
                case '61':
                case 'HA':
                case 'NW':
                    tmpfilter.addY("has_pl_61_HA_NW");
                    break;

                case '4K':
                case '79':
                    tmpfilter.addY("has_pl_4K_79");
                    break;

                case 'C5':
                case 'MC':
                case 'LF':
                    tmpfilter.addY("has_pl_C5_MC_LF");
                    break;

                case '6A':
                case 'MA':
                    tmpfilter.addY("has_pl_6A_MA");
                    break;

                case '1Y':
                case 'LN':
                case 'LM':
                case 'LI':
                case 'LJ':
                case 'LL':
                case 'LK':
                    tmpfilter.addY("has_pl_1Y_LN_LM_LI_LJ_LL_LK");
                    break;

                case 'KP':
                case 'R6':
                case '52':
                case 'MF':
                case 'ME':
                case 'KX':
                case 'JM':
                case 'E1':
                    tmpfilter.addY("has_pl_KP_R6_52_MF_ME_KX_JM_E1");
                    break;

                case '4U':
                case '87':
                case '8L':
                case 'KK':
                case '8S':
                    tmpfilter.addY("has_pl_4U_87_8L_KK_8S");
                    break;

                case '4J':
                case '6L':
                case 'R7':
                case 'R8':
                case 'R4':
                case 'JN':
                case '7G':
                    tmpfilter.addY("has_pl_4J_6L_R7_R8_R4_JN_7G");
                    break;

                default:
                    tmpfilter.addY("has_pl_other");
            }
        }
    });

    tsfilter.where += tmpfilter.where;
    tsfilter.where += ') ';
    tsfilter.and = " and ";

    tmpfilter.where = "";
    tmpfilter.or = "";
}

/*----------------------------------------------------------------------------
|   addInvoiceFilter  - This function will add invoice related filter to the
|                       where clause.
|
|   @filter             Filter
|   @value              Invoice Number
----------------------------------------------------------------------------*/
function addInvoiceFilter(filter, value) {
    var salesOrgMap2 = [];
    var salesOrgMap4 = [];
    var salesOrgMap2Uniq = [];
    var salesOrgMap4Uniq = [];
    var cronosInvPrefix = [];
    var cronosInvPrefixList = [ "200:GB00", "201:DE00", "202:IT00", "203:EU00", "204:SE00",
                                "205:ES00", "205:ES01", "206:BE00", "207:IE00", "208:FI00",
                                "209:AT00", "210:HU00", "211:CZ00", "212:DK00", "213:CH00",
                                "214:NO00", "215:ZA00", "216:FR00", "217:PT00", "218:RU00",
                                "219:TR00", "220:GR00", "221:IL00", "222:PL00", "224:EU02",
                                "225:NL00", "226:LU00", "227:RO00", "299:AT00", "299:BE00",
                                "299:CH00", "299:CZ00", "299:DE00", "299:DK00", "299:ES01",
                                "299:EU00", "299:EU02", "299:FI00", "299:FR00", "299:GB00",
                                "299:GR00", "299:HU00", "299:IE00", "299:IL00", "299:IT00",
                                "299:LU00", "299:NL00", "299:NO00", "299:PL00", "299:PT00",
                                "299:RO00", "299:RU00", "299:SE00", "299:TR00", "299:ZA00",
                                "299:61", "299:70", "299:71", "299:72", "299:74", "299:79",
                                "299:80", "299:81", "299:82", "299:83", "299:84", "299:85",
                                "299:86", "299:87", "299:88", "299:91", "299:92", "299:93",
                                "299:CB", "299:D9", "299:E8", "299:J4", "299:JM", "299:L3",
                                "299:L6", "299:L8", "299:M5", "299:CU", "218:61", "205:70",
                                "209:71", "207:72", "221:74", "215:79", "200:80", "216:81",
                                "202:82", "201:83", "206:84", "225:85", "209:86", "213:87",
                                "204:88", "208:91", "214:92", "212:93", "203:CB", "220:D9",
                                "224:E8", "219:J4", "226:JM", "217:L3", "222:L6", "211:L8",
                                "210:M5", "227:CU", "218:61", "205:70", "209:71", "207:72",
                                "221:74", "215:79", "200:80", "216:81", "202:82", "201:83",
                                "206:84", "225:85", "209:86", "213:87", "204:88", "208:91",
                                "214:92", "212:93", "203:CB", "220:D9", "224:E8", "219:J4",
                                "226:JM", "217:L3", "222:L6", "211:L8", "210:M5", "227:CU",
                                "218:61", "205:70", "209:71", "207:72", "221:74", "215:79",
                                "200:80", "216:81", "202:82", "201:83", "206:84", "225:85",
                                "209:86", "213:87", "204:88", "208:91", "214:92", "212:93",
                                "203:CB", "220:D9", "224:E8", "219:J4", "226:JM", "217:L3",
                                "222:L6", "211:L8", "210:M5", "227:CU", "218:61", "205:70",
                                "209:71", "207:72", "221:74", "215:79", "200:80", "216:81",
                                "202:82", "201:83", "206:84", "225:85", "209:86", "213:87",
                                "204:88", "208:91", "214:92", "212:93", "203:CB", "220:D9",
                                "224:E8", "219:J4", "226:JM", "217:L3", "222:L6", "211:L8",
                                "210:M5", "227:CU" ];

    filter.where += " and ((";

    if (value.length > 6) {
        filter.or = "";
        filter.orLike(value, "s.invoice_no");
        filter.where += " or (";

        filter.and = "";
        filter.addLike(value.substr(3), "s.invoice_no");
        filter.addLike(value, "s.full_invoice_no");
        filter.where += ") ";

    } else {
        filter.and = "";
        filter.addLike(value, "s.invoice_no");
    }

    filter.where += ") or (";

    cronosInvPrefixList.forEach(function(element, cb) {
        var preSalesOrg = element.split(":");

        var prefix = preSalesOrg[0];
        var salesOrg = preSalesOrg[1];

        if (salesOrg.length == "2") {
            salesOrgMap2[salesOrg] = 1;

        } else if (salesOrg.length == "4") {
            salesOrgMap4[salesOrg] = 1;
        }

        cronosInvPrefix[prefix] = 1;
    });

    for (var salesOrg in salesOrgMap2) {
        if (salesOrg != "has" && salesOrg != "contains")
            salesOrgMap2Uniq.push("'" + salesOrg + "'");
    }

    for (var salesOrg in salesOrgMap4) {
        if (salesOrg != "has" && salesOrg != "contains")
            salesOrgMap4Uniq.push("'" + salesOrg + "'");
    }

    var invoiceNo = value.replace(/%/g, "");
    var salesOrgFilter = "(s.sales_org in (" + salesOrgMap4Uniq + ") or \
                           substr(s.sales_org,1,2) in (" + salesOrgMap2Uniq + ")) ";

    filter.or = "";

    for (var prefix in cronosInvPrefix) {
        if (!isNaN(prefix))
            filter.orLike(prefix + invoiceNo, "s.invoice_no");
    }

    filter.where += " and " + salesOrgFilter + ")) ";
}

/*----------------------------------------------------------------------------
|   getSummary  - This function will retrieve the order summary details.
|
|   @filter     Filter
|   @ts1        Date object required for displaying execution time
|   @db         Database object
|   @req        Request object
|   @res        Response object
----------------------------------------------------------------------------*/
function getSummary(filter, ts1, db, req, res) {

    var maxNum = config.constants['MAX_NUM_ROWS'];

    db.execute("select *                                                                                                                  \
                  from (select distinct h.purchase_order_no,                                                                              \
                                        h.order_no,                                                                                       \
                                        h.legacy_order_no,                                                                                \
                                        h.so_no,                                                                                          \
                                        h.order_overall_status,                                                                           \
                                        to_char(nvl(h.dlr_total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS dlr_total_price,  \
                                        to_char(nvl(h.total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_order_value,    \
                                        to_char(nvl(h.total_net_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_net_price,  \
                                        h.currency,                                                                                       \
                                        h.order_type_descr,                                                                               \
                                        h.purch_order_date,                                                                               \
                                        h.ship_to_addr_1,                                                                                 \
                                        h.last_update,                                                                                    \
                                        h.quote_no,                                                                                       \
                                        h.quote_creation_date,                                                                            \
                                        h.hp_receive_date                                                                                 \
                          from " + fromClause + "                                                                                         \
                         where " + filter.where + "                                                                                       \
                         order by h.order_no)                                                                                             \
                  where rownum <= " + maxNum + "                                                                                          \
    ", filter.binds, function(err, summary) {

        if (err) return Resp.sendError(res, log, err);

        var tdiff = Date.now() - ts1.getTime();
        console.log('DB 2 runtime: '+ tdiff + ' msec');

        var msg = "";
        if (summary.length == 0) {
            msg = "No orders found for the given search criteria.";
        } else if (summary.length >= maxNum) {
            msg = "Search result exceeds more than " + maxNum + " records. Please refine your search.";
        }

        console.log('Summary: ');
        console.log(summary);

        Resp.sendOrderResponse(res, log, 'Sending back Order Summary.', msg, maxNum, summary);
    });
}

module.exports.init = function(app) {

    /*----------------------------------------------------------------------------
    |   External Order Summary & Advanced Search Webservice.
    |---------------------------------------------------------------------------*/
    app.post('/ossui/v1/ex/ordersummary', app.role(AuthGroupExternal), function(req, res) {

        var value = "";
        var filter = new SqlUtils.AndWhere();
        var tsfilter = new SqlUtils.AndWhereDirect();
        var tmpfilter = new SqlUtils.OrWhereDirect();

        fromClause = "backlog_hdr h, backlog_ids ids, backlog_ship s ";
        filter.where = "(s.is_valid = 'Y' or s.is_valid is null) and  \
                        (s.legacy_order_no = h.legacy_order_no)  and  \
                        (s.legacy_order_no = ids.legacy_order_no) and \
                        (h.is_valid = 'Y' or h.is_valid is null) and  \
                        (h.customer_order = 'Y') ";
        filter.and = " and ";

        var request = JSON.parse(JSON.stringify(req.body));

        // Simple Search
        if (request.hpOrderNo != undefined && request.hpOrderNo != "") {
            var hpOrderNo = [];
            var orgHpOrderNo = formatValues(request.hpOrderNo,1);
            var modHpOrderNo = formatValues(request.hpOrderNo, 1, 1);

            hpOrderNo.push(orgHpOrderNo);
            if (orgHpOrderNo != modHpOrderNo)
                hpOrderNo.push(modHpOrderNo);

            var or = "";
            filter.where += " and (";
            if (tsfilter.and == "") tsfilter.where += " (";
            else tsfilter.where += " and (";

            hpOrderNo.forEach(function(orderNo,i) {
                filter.where += or;

                filter.or = "";
                filter.orLike(orderNo, "s.order_no");

                filter.where += " or s.ref_docu_no = ( select max (ref_docu_no) \
                                                         from backlog_ship      \
                                                        where ";
                filter.or = "";
                filter.orLike(orderNo, "order_no");

                filter.where += ") ";
                filter.orLike(orderNo, "s.ref_docu_no");

                tmpfilter.addIStartsWith(orderNo, "order_no");

                or = " or ";
            });

            filter.where += ") ";

            tsfilter.where += tmpfilter.where;
            tsfilter.where += ') ';
            tsfilter.and = " and ";

            tmpfilter.where = "";
            tmpfilter.or = "";
        }

        if (request.custPoNo != undefined && request.custPoNo != "") {
            value = formatValues(request.custPoNo, 1, 0, 1);
            filter.addLike(value, "lpo.purchase_order_no");
            fromClause += ", l_purch_order_no lpo";
            whereClause += " and (s.legacy_order_no = lpo.legacy_order_no) ";

            tsfilter.addIStartsWith(value, "purchase_order_no");
        }

        if (request.shipNo != undefined && request.shipNo != "") {
            value = formatValues(request.shipNo, 1);
            filter.addLike(value, "s.shipment_no");
        }

        if (request.attTo != undefined && request.attTo != "") {
            value = formatValues(request.attTo, 1, 0, 1);
            filter.addLike(value, "s.ship_to_attn");
        }

        if (request.status != undefined && request.status != "") {
            switch (request.status) {
                case 'notship':
                    filter.addnotIn("'Shipped', 'Delivered'", "s.status");
                    tsfilter.addN("overall_shipped");
                    tsfilter.addN("overall_delivered");
                    break;

                case 'notdelv':
                    filter.addInEquality("Delivered", "s.status");
                    tsfilter.addN("overall_delivered");
                    break;

                case 'submit':
                    filter.addEq("Submitted", "s.status");
                    tsfilter.addY("sg_processing");
                    break;

                case 'admin':
                    filter.addEq("Processing", "s.status");
                    tsfilter.addY("sg_processing");
                    break;

                case 'prod':
                    filter.addEq("Production", "s.status");
                    tsfilter.addY("sg_production");
                    break;

                case 'proddone':
                    filter.addEq("ProductionDone", "s.status");
                    tsfilter.addY("sg_proddone");
                    break;

                case 'cons':
                    filter.addEq("Consolidation", "s.status");
                    tsfilter.addY("sg_consolidation");
                    break;

                case 'ship':
                    filter.addEq("Shipped", "s.status");
                    tsfilter.addY("sg_shipped");
                    break;

                case 'delv':
                    filter.addEq("Delivered", "s.status");
                    tsfilter.addY("sg_delivered");
                    break;

                case 'canc':
                    filter.addEq("CANCELED", "s.status");
                    tsfilter.addY("sg_canceled");
                    break;

                case 'n_ship':
                    filter.addEq("NS", "h.ship_status");
                    tsfilter.addN("fully_shipped");
                    break;

                case 'pa_ship':
                    filter.addEq("PS", "h.ship_status");
                    tsfilter.addN("fully_shipped");
                    tsfilter.addN("nothing_shipped");
                    break;

                case 'fu_ship':
                    filter.addEq("FS", "h.ship_status");
                    tsfilter.addY("nothing_shipped");
                    break;

                case 'n_inv':
                    filter.addEq("NI", "h.invoice_status");
                    tsfilter.addY("nothing_invoiced");
                    break;

                case 'pa_inv':
                    filter.addEq("PI", "h.invoice_status");
                    tsfilter.addY("partially_invoiced");
                    break;

                case 'fu_inv':
                    filter.addEq("FI", "h.invoice_status");
                    tsfilter.addY("fully_invoiced");
                    break;

                case 'a_admin':
                    filter.addEq("Processing", "h.order_overall_status");
                    tsfilter.addY("overall_processing");
                    break;

                case 'a_prod':
                    filter.addEq("Production", "h.order_overall_status");
                    tsfilter.addY("overall_production");
                    break;

                case 'a_cons':
                    filter.addEq("Consolidation", "h.order_overall_status");
                    tsfilter.addY("overall_consolidation");
                    break;

                case 'a_ship':
                    filter.addEq("Shipped", "h.order_overall_status");
                    tsfilter.addY("overall_shipped");
                    break;

                case 'a_delv':
                    filter.addEq("Delivered", "h.order_overall_status");
                    tsfilter.addY("overall_delivered");
                    break;

                default:
                    break;
            }
        }

        if (request.recentOrders != undefined && request.recentOrders != "") {
            filter.addBetween(request.recentOrders, "h.purch_order_date");
            tsfilter.addDateBetween(request.recentOrders, "purch_order_date");
        }

        if (request.custName != undefined && request.custName != "") {
            value = formatValues(request.custName, 1);
            filter.addLike(value, "s.customer_name");
            tsfilter.addIStartsWith(value, "customer_name");
        }

        if (request.custId != undefined && request.custId != "") {
            value = formatValues(request.custId, 1);
            filter.addLike(value, "s.customer_no");
            tsfilter.addIStartsWith(value, "customer_no");
        }

        // Advanced Search
        if (request.pagent != undefined && request.pagent != "") {
            value = formatValues(request.pagent, 1, 0, 1);
            filter.addLike(value, "s.purch_agent");
        }

        if (request.shipZip != undefined && request.shipZip != "") {
            value = formatValues(request.shipZip, 1);
            filter.addLike(value, "s.ship_zone");
        }

        if (request.soldTo != undefined && request.soldTo != "") {
            value = formatValues(request.soldTo, 1, 0, 1);
            filter.addEq(value, "ids.sold_to");

            tsfilter.addEq(value, "sold_to_party");
        }

        if (request.billTo != undefined && request.billTo != "") {
            value = formatValues(request.billTo, 1, 0, 1);
            filter.addEq(value, "s.invoice_to_party");

            tsfilter.addEq(value, "invoice_to_party");
        }

        if (request.shipTo != undefined && request.shipTo != "") {
            value = formatValues(request.shipTo, 1, 0, 1);
            filter.addEq(value, "s.ship_to");

            tsfilter.addEq(value, "ship_to_id");
        }

        if (request.prodLine != undefined && request.prodLine != "") {
            addSingleAndMultipleOrToWhere(filter, request.prodLine, "h.product_lines", 0, 0, 1);
            addTStoreProdLineFilter(tsfilter, tmpfilter, request.prodLine);
        }

        if (request.shipC != undefined && request.shipC != "") {
            value = formatValues(request.shipC);

            if (value == "000" || value == "100") {
                filter.addIn("'000', '100'", "s.ship_to_wcc");

                if (tsfilter.and == "") tsfilter.where += " (";
                else tsfilter.where += " and (";

                tmpfilter.addEq("000", "ship_to_wcc1");
                tmpfilter.addEq("000", "ship_to_wcc2");
                tmpfilter.addEq("000", "ship_to_wcc3");
                tmpfilter.addEq("100", "ship_to_wcc1");
                tmpfilter.addEq("100", "ship_to_wcc2");
                tmpfilter.addEq("100", "ship_to_wcc3");

                tsfilter.where += tmpfilter.where;
                tsfilter.where += ') ';
                tsfilter.and = " and ";

                tmpfilter.where = "";
                tmpfilter.or = "";

            } else {
                filter.addEq(value, "s.ship_to_wcc");

                if (tsfilter.and == "") tsfilter.where += " (";
                else tsfilter.where += " and (";

                tmpfilter.addEq(value, "ship_to_wcc1");
                tmpfilter.addEq(value, "ship_to_wcc2");
                tmpfilter.addEq(value, "ship_to_wcc3");

                tsfilter.where += tmpfilter.where;
                tsfilter.where += ') ';
                tsfilter.and = " and ";

                tmpfilter.where = "";
                tmpfilter.or = "";
            }
        }

        if (request.shipS != undefined && request.shipS != "") {
            value = formatValues(request.shipS);
            filter.addEq(value, "s.ship_to_region");
        }

        if (request.invoiceNo != undefined && request.invoiceNo != "") {
            value = formatValues(request.invoiceNo, 1);
            addInvoiceFilter(filter, value);
        }

        if (request.product != undefined && request.product != "") {
            var product = [formatValues(request.product,1), formatValues(request.product, 1, 0, 1)];
            addSingleAndMultipleOrToWhere(filter, product, "i.material_no");

            fromClause += " , backlog_item i";
            whereClause += " and (i.legacy_order_no = s.legacy_order_no) ";

            tsfilter.addIStartsWith(formatValues(request.product), "product_no");
        }

        if (request.cProduct != undefined && request.cProduct != "") {
            value = formatValues(request.cProduct, 1, 0, 1);
            filter.addLike(value, "i.cust_product_no");

            if (request.product == undefined || request.product == "") {
                fromClause += " , backlog_item i";
                whereClause += " and (i.legacy_order_no = s.legacy_order_no) ";
            }
        }

        if (request.changedSince != undefined && request.changedSince != "") {
            value = formatValues(request.changedSince);
            value = " (current_date - interval '" + value + "' day) ";
            filter.addGreaterThan(value, "s.last_update");
        }

        if (request.poDateFrom != undefined && request.poDateFrom != "") {
            filter.addGtEq(request.poDateFrom, "s.purch_order_date");
            tsfilter.addDateGtEq(request.poDateFrom, "purch_order_date");
        }

        if (request.poDateTo != undefined && request.poDateTo != "") {
            filter.addLtEq(request.poDateTo, "s.purch_order_date");
            tsfilter.addDateLtEq(request.poDateTo, "purch_order_date");
        }

        if (request.shipDateFrom != undefined && request.shipDateFrom != "") {
            filter.addGtEq(request.shipDateFrom, "s.shipped_at");
            tsfilter.addDateGtEq(request.shipDateFrom, "ship_date");
        }

        if (request.shipDateTo != undefined && request.shipDateTo != "") {
            filter.addLtEq(request.shipDateTo, "s.shipped_at");
            tsfilter.addDateLtEq(request.shipDateTo, "ship_date");
        }

        if (request.delvDateFrom != undefined && request.delvDateFrom != "") {
            filter.addGtEq(request.delvDateFrom, "s.sched_delv_date");
            tsfilter.addDateGtEq(request.delvDateFrom, "sdd");
            whereClause += " and (s.tba_flag = ' ' or s.tba_flag is NULL) ";
        }

        if (request.delvDateTo != undefined && request.delvDateTo != "") {
            filter.addLtEq(request.delvDateTo, "s.sched_delv_date");
            tsfilter.addDateLtEq(request.delvDateTo, "sdd");

            if (request.delvDateFrom == undefined || request.delvDateFrom == "")
                whereClause += " and (s.tba_flag = ' ' or s.tba_flag is NULL) ";
        }

        if (request.crdDateFrom != undefined && request.crdDateFrom != "") {
            filter.addGtEq(request.crdDateFrom, "s.customer_req_date");
            tsfilter.addDateGtEq(request.crdDateFrom, "hdr_customer_req_date");
        }

        if (request.crdDateTo != undefined && request.crdDateTo != "") {
            filter.addLtEq(request.crdDateTo, "s.customer_req_date");
            tsfilter.addDateLtEq(request.crdDateTo, "hdr_customer_req_date");
        }

        if (request.refContract != undefined && request.refContract != "") {
            if (request.refContract.quote != undefined && request.refContract.quote != "") {
                addSingleAndMultipleOrToWhere(filter, request.refContract.quote, "s.quote_no", 1, 0, 1);
            }

            if (request.refContract.deal != undefined && request.refContract.deal != "") {
                addSingleAndMultipleOrToWhere(filter, request.refContract.deal, "deal.deal_id", 1, 0, 1);
                fromClause += ", l_deal_id deal";
                whereClause += " and (s.legacy_order_no = deal.legacy_order_no) ";
            }

            if (request.refContract.claim != undefined && request.refContract.claim != "") {
                addSingleAndMultipleOrToWhere(filter, request.refContract.claim, "s.claim_no", 1, 0, 1);
                tsfilter.addIStartsWith(formatValues(request.refContract.claim, 1, 0, 1), "claim_no");
            }

            if (request.refContract.weborder != undefined && request.refContract.weborder != "") {
                addSingleAndMultipleOrToWhere(filter, request.refContract.weborder, "s.web_order_no", 1);
            }

            if (request.refContract.salno != undefined && request.refContract.salno != "") {
                addSingleAndMultipleOrToWhere(filter, request.refContract.salno, "h.sal_number", 1, 0, 1);
            }

            if (request.refContract.opg != undefined && request.refContract.opg != "") {
                addSingleAndMultipleOrToWhere(filter, request.refContract.opg, "h.opg_code", 1, 0, 1);
                tsfilter.addIStartsWith(formatValues(request.refContract.opg, 1, 0, 1), "opg_code");
            }
        }

        filter.where += whereClause;

        console.log(filter);
        console.log(tsfilter);

        var b = new SqlUtils2.Bind(filter.bindNo);
        var ts1 = new Date();

        DbPool.OSSDB(function(db) {

            /* Uncomment below two lines for testing with the test user. */
            // req.aaid = "b2b";
            // req.user_id = "testmanagerms@gmail.com";

            PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible, withPrice) {
                if (err) return Resp.sendError(res, log, err);

                // Combine adhoc filters with fixed portal security where clause parts.
                console.log('userSettings:');
                console.log(userSettings);
                console.log('userSettingsTS:');
                console.log(userSettingsTS);
                console.log('tsPossible: '+tsPossible)
                console.log('filter: ')
                console.log(filter)

                filter.binds = filter.binds.concat( userSettings.bind.binds );
                filter.where = " ( " + filter.where + " ) and ( " + userSettings.where + " ) ";

                console.log('filter combined with portal security filter:');
                console.log(filter);

                var ts1 = new Date();

                // Combine tstore filter with fixed portal security where clause parts.
                if (tsPossible == true) {

                    if (tsfilter.where != '') {
                        tsfilter.where = " ( " + tsfilter.where + " ) and ( " + userSettingsTS.where + " ) and is_valid_order = 'Y'";

                        console.log('tstore filter combined with portal security filter:');
                        console.log(tsfilter);

                        var tdiff = Date.now() - ts1.getTime();
                        console.log('DB 0 runtime: ' + tdiff + ' msec' );

                        OSSTSQueryExt(tsfilter.where, function(tsErr, tsOrders) {
                            if (tsErr) return Resp.sendError(res, log, tsErr);

                            if (tsOrders == undefined) {
                                return Resp.sendResponse(res, log,
                                                         'Too many orders found. Please refine your search criteria.',
                                                         'Too many orders found. Please refine your search criteria.',
                                                         '');
                            } else filter.where = '(' + filter.where + ') and ( h.legacy_order_no in ('+tsOrders+') )';

                            getSummary(filter, ts1, db, req, res);
                        });

                    } else getSummary(filter, ts1, db, req, res);

                } else getSummary(filter, ts1, db, req, res);
            });
        });
    });
}
