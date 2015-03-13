/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/ordersummary
|
|
|   This webservice will return the Order Summary for the search
|   criteria entered by user.
|
|   written by Jochen Loewer and Deepu Krishnamurthy
|   April 2013
|
---------------------------------------------------------------------------*/

var augment = require("../lib/augment.js");
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2");
var PortalSec = require("../lib/PortalSecurity");
var DbPool = require('../lib/DbPool');
var config = require('../config/config.js');
var Resp = require('../lib/RespUtils.js');
var tstore = require('../lib/tstore');
var osconfig = require('/etc/opt/oss/backend/UI.cfg');
var async = require('async');

var ts = new tstore.TStore( osconfig.UITstoreConnection );

var bunyan = require('bunyan');

var log = new bunyan({
    name: 'OrderSummaryWebService',
});

isItem = 0;
isIds = 0;
var additonalTable = '';


/*----------------------------------------------------------------------------
|   OSSTSQueryInt  -   run tstore SQL where clause against the two partitions
|                      of the  main OSS TSTORE
|   @param where  variable contains where condition
|   @param cb     call back variable
|
|   partition 0 : internal orders
|   partition 1 : external/customer non-recent orders
|   partition 2 : external/customer recent orders
|
\---------------------------------------------------------------------------*/
function OSSTSQueryInt (where, cb)
{
    if (where == '') return cb(null, '');
    ts.all(0, "select order_no from orders where "+where, function(err, legacyList0) {
        if (err) return cb(err);
        ts.all(1, "select order_no from orders where "+where, function(err, legacyList1) {
            if (err) return cb(err);
            ts.all(2, "select order_no from orders where "+where, function(err, legacyList2) {
                if (err) return cb(err);

                var orders0 = legacyList0.replace(/','/g,'~').replace(/'/g,'').split('~');
                var orders1 = legacyList1.replace(/','/g,'~').replace(/'/g,'').split('~');
                var orders2 = legacyList2.replace(/','/g,'~').replace(/'/g,'').split('~');

                if (orders0.length == 1  && orders0[0] == '') {
                    orders0 = [];
                }

                if (orders1.length == 1  && orders1[0] == '') {
                    orders1 = [];
                }

                if (orders2.length == 1  && orders2[0] == '') {
                    orders2 = [];
                }

                var orders = orders0.concat(orders1).concat(orders2);

                if (orders.length == 0) {
                    return cb('NonExistingOrder', "");  // dummy expression
                }
                if (orders.length > 500) {
                    orders = orders.slice(0,500);
                }
                cb(null, ("'"+ orders.join("','") + "'"));
            });
        });
    });
}


/*----------------------------------------------------------------------
|  createStatusQuery  - construct the where clause for status.
|
|  @param value       variable entered by user
|  @param filter      variable for oracle based where clause
|  @param tsfilter    variable for tstore based where clause
|
|\---------------------------------------------------------------------*/

function createStatusQuery(value, filter, tsfilter) {
    switch (value) {
        case 'all' :
            break;

        case 'submitted':
            filter.addEq ('Submitted', "backlog_delv.status");
            tsfilter.addY("dg_submitted");
            break;

        case 'admin' :
            filter.addIn ("'Acked', 'Processing'" , "backlog_delv.status");
            if (tsfilter.where != '') {
                tsfilter.where += ' and (';
            } else {
                 tsfilter.where += '(' ;
            }
            tsfilter.and = "";
            tsfilter.addY("dg_processing");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_acked");
            tsfilter.where += ')';
            break;

        case 'c_admin' :
            filter.addIn ("'Processing'", "backlog_hdr.order_overall_status");
            tsfilter.addY("dg_processing");
            break;

        case 'processing' :
            filter.addIn ("'Processing'", "backlog_delv.status");
            tsfilter.addY("dg_processing");
            break;

        case 'acked' :
            filter.addIn ("'Acked'", "backlog_delv.status");
             tsfilter.addY("dg_acked");
            break;

        case 'prod' :
            filter.addIn ("'Production'", "backlog_delv.status");
            tsfilter.addY("dg_acked");
             break;

        case 'c_prod' :
            filter.addEq ('Production', "backlog_hdr.order_overall_status");
            tsfilter.addY("dg_production");
            break;

        case 'prod_done' :
            filter.addEq ('ProductionDone', "backlog_delv.status");
            tsfilter.addY("dg_proddone");
             break;

        case 'fact_ship' :
            filter.addEq ('FactShipped', "backlog_delv.status");
            tsfilter.addY("dg_factshipped");
            break;

        case 'ech' :
            filter.addEq ('Registered', "backlog_delv.status");
            tsfilter.addY("dg_registered");
            break;

        case 'cust_ship' :
            filter.addEq ('Shipped', "backlog_delv.status");
            tsfilter.addY("dg_shipped");
            break;

        case 'c_cons' :
            filter.addIn ("'FactShipped','Registered','Consolidation'", "backlog_hdr.order_overall_status");
            tsfilter.addY("overall_consolidation");
             break;

        case 'c_shipped' :
            filter.addEq ('Shipped', "backlog_hdr.order_overall_status");
            tsfilter.addY("overall_shipped");
            break;

        case 'delv' :
            filter.addEq ('Delivered', "backlog_delv.status");
            tsfilter.addY("dg_delivered");
            break;

        case 'c_delved' :
            filter.addEq ('Delivered', "backlog_hdr.order_overall_status");
            tsfilter.addY("overall_delivered");
            break;

        case 'invo' :
            if(filter.where != '') {
                filter.where += ' and (';
            } else {
                filter.where += ' (';
            }
            filter.where += 'backlog_delv.invoice_no <> \' \' or backlog_delv.invoice_no is not null'
            filter.where += ' )';
            tsfilter.addDateGt('2001-01-01',"invoice_date");
            break;

        case 'open' :
            filter.addEq ('OPEN', "backlog_hdr.order_status");
            tsfilter.addN("is_closed");
            break;

        case 'closed' :
            filter.addEq ('CLOSED', "backlog_hdr.order_status");
            tsfilter.addY("is_closed");
            break;

        case 'cancelled' :
            filter.addEq ('CANCELED', "backlog_hdr.order_overall_status");
            tsfilter.addY("overall_canceled");
            break;

        case 'notfship' :
            filter.addnotIn ("'FactShipped','Registered','Shipped', 'Delivered'", "backlog_delv.status");
            tsfilter.and = "";
            if (tsfilter.where != '') {
                tsfilter.where += ' and (';
            } else {
                 tsfilter.where += '(' ;
            }
            tsfilter.and = "";
            tsfilter.addY("dg_processing");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_acked");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_production");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_proddone");
            tsfilter.where += ')';
            break;

        case 'notcship' :
            filter.addnotIn ("'Shipped', 'Delivered'", "backlog_delv.status");
            tsfilter.and = "";
            if (tsfilter.where != '') {
                tsfilter.where += ' and (';
            } else {
                 tsfilter.where += '(' ;
            }
            tsfilter.and = "";
            tsfilter.addY("dg_processing");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_acked");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_production");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_proddone");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_factshipped");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_registered");
            tsfilter.where += ')';
            break;

        case 'notdelv' :
            filter.addInEquality ('Delivered', "backlog_delv.status");
            tsfilter.and = "";
            if (tsfilter.where != '') {
                tsfilter.where += ' and (';
            } else {
                 tsfilter.where += '(' ;
            }
            tsfilter.and = "";
            tsfilter.addY("dg_processing");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_acked");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_production");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_proddone");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_factshipped");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_registered");
            tsfilter.and = "";
            tsfilter.where += ' or ';
            tsfilter.addY("dg_shipped");
            tsfilter.where += ')';
            break;

        case 'notinvo' :
            if(filter.where != '') {
                filter.where += ' and (';
            } else {
                filter.where += ' (';
            }
            filter.where += 'backlog_delv.invoice_no = \'\' or backlog_delv.invoice_no = \' \' or backlog_delv.invoice_no is null'
            filter.where += ' )';
            tsfilter.addN("fully_invoiced");
             break;

        case 'f_invoiced':
            filter.addEq ('FI', "backlog_hdr.invoice_status");
            tsfilter.addY("fully_invoiced");
            break;

        case 'p_invoiced' :
            filter.addEq ('PI', "backlog_hdr.invoice_status");
            tsfilter.addY("partially_invoiced");
            break;

        case 'n_invoiced' :
            filter.addEq ('NI', "backlog_hdr.invoice_status");
            tsfilter.addY("nothing_invoiced");
            break;

        case 'f_shipped' :
            filter.addEq ('FS', "backlog_hdr.ship_status");
            tsfilter.addY("fully_shipped");
            break;

        case 'p_shipped' :
            filter.addEq ('PS', "backlog_hdr.ship_status");
            tsfilter.addY("partially_shipped");
            break;

        case 'n_shipped' :
            filter.addEq ('NS', "backlog_hdr.ship_status");
            tsfilter.addY("nothing_shipped");
            break;
    }
}


/*----------------------------------------------------------------------
|  createAdvanceOriginQuery  - construct the where clause for origin.
|
|  @param value       variable entered by user
|  @param filter      variable for oracle based where clause
|  @param tsfilter    variable for tstore based where clause
|
|\---------------------------------------------------------------------*/

function createAdvanceOriginQuery(value, filter, tsfilter) {

    var tmpfilter = new SqlUtils.AndWhere();
    var tsfil = new SqlUtils.OrWhereDirect();
    tmpfilter.binds = filter.binds;
    tmpfilter.bindNo = filter.bindNo;

    for (var i = 0; i <= value.length-1; i++) {
        switch (value[i]) {
            case 'all' :
                break;

            case 'ePrime' :
                tmpfilter.orEq ('ePrime', "backlog_hdr.originating_system");
                break;

            case 'ecl' :
                tmpfilter.orEq ('eClaims', "backlog_hdr.originating_system");
                break;

            case 'cca' :
                tmpfilter.orEq ('CCA', "backlog_hdr.originating_system");
                break;

            case 'wat' :
                tmpfilter.orEq ('Watson', "backlog_hdr.originating_system");
                break;

            case 'eop' :
                tmpfilter.orEq ('EOP', "backlog_hdr.originating_system");
                break;

            case 'elf' :
                tmpfilter.orEq ('ELF', "backlog_hdr.originating_system");
                break;

            case 'mad' :
                tmpfilter.orEq ('MAD', "backlog_hdr.purch_order_type");
                tsfil.addLike('MAD', "purch_order_type");
                break;

            case 'ebay_de' :
            case 'iscs_de' :
            case 'iscs_fr' :
            case 'iscs_gb' :
            case 'iscs_es' :
            case 'iscs_se' :
            case 'iscs_ch' :
            case 'iscs_aus' :
            case 'iscs_ca' :
            case 'iscs_hk' :
            case 'iscs_kr' :
            case 'iscs_my' :
            case 'iscs_sg' :
            case 'iscs_ar' :
            case 'scs_mx' :
            case 'iscs_br' :
                tmpfilter.orEqToUpper (value[i], "backlog_hdr.originating_system");
                break;

           // Submission method
            case 'doe' :
                tmpfilter.orEq ('DOE', "backlog_hdr.originating_system");
                break;

            case 'sm_Phone' :
                tmpfilter.orIn ("'Telephone','TELEPHONE'", "backlog_hdr.submission_method");
                break;

            case 'sm_Fax' :
                tmpfilter.orIn ("'Fax','FAX'", "backlog_hdr.submission_method");
                break;

            case 'sm_Email' :
                tmpfilter.orIn ("'Email','EMAIL'", "backlog_hdr.submission_method");
                break;

            case 'sm_Web' :
                tmpfilter.orIn ("'Web','WEB'", "backlog_hdr.submission_method");
                break;

            case 'doe' :
                tmpfilter.orIn ("'DOE','Direct Order Entry'", "backlog_hdr.submission_method");
                break;

            case 'edi' :
                tmpfilter.orEq ('EDI', "backlog_hdr.originating_system");
                break;

            case 'kiosk' :
                tmpfilter.orEq ('Kiosk', "backlog_hdr.originating_system");
                break;

            case 'omui' :
                tmpfilter.orEq ('OMUI', "backlog_hdr.submission_method");
                break;

            case 'tdc' :
                tmpfilter.orEq ('TDC', "backlog_hdr.originating_system");
                break;

            case 'iscs_hrepp' :
            case 'iscs_auspub' :
            case 'iscs_capub' :
            case 'iscs_hkpub' :
            case 'iscs_krpub' :
            case 'iscs_mypub' :
            case 'iscs_sgpub' :
            case 'iscs_arpub' :
            case 'iscs_mxpub' :
            case 'iscs_brpub' :
            case 'iscs_*' :
                var val = value[i].substring(5);
                tmpfilter.orEqToUpper (val, "backlog_hdr.originating_system");
                break;

            // OE system
            case 'sapr00' :
                tmpfilter.orEq ('SAP-R00', "backlog_hdr.om_system");
                tsfil.addY("source_sys_r00");
                break;

            case 'sapr01' :
                tmpfilter.orEq ('SAP-R01', "backlog_hdr.om_system");
                tsfil.addY("source_sys_r01");
                break;

            case 'sapap' :
                tmpfilter.orEq ('SAP-AP', "backlog_hdr.om_system");
                tsfil.addY("source_sys_pap");
                break;

            case 'sapfap' :
                tmpfilter.orEq ('SAP-FAP', "backlog_hdr.om_system");
                tsfil.addY("source_sys_fap");
                break;

            case 'sapclp' :
                tmpfilter.orEq ('SAP-CLP', "backlog_hdr.om_system");
                tmpfilter.where += ' or (backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'SAPCLP\')';
                tsfil.addY("source_sys_calado");
                break;

            case 'sapd7c' :
                tmpfilter.orEq ('SAP-D7C', "backlog_hdr.om_system");
                tmpfilter.where += ' or (backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'SAPD7C\')';
                tsfil.addY("source_sys_d7");
                break;

            case 'velocity' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.om_system = \'SAP-D7C\' or backlog_hdr.om_system = \'SAP-CLP\')' ;
                tmpfilter.where += ' or (backlog_hdr.source = \'HPSB\' and (backlog_hdr.om_system = \'SAPD7C\' or backlog_hdr.om_system = \'SAPCLP\'))' ;
                if(tsfil.where != '') {
                    tsfil.where += ' or (';
                } else {
                    tsfil.where += ' (';
                }
                tsfil.where += ' source_sys_d7 = \'Y\' or source_sys_calado = \'Y\') ';
                break;

            case 'sapcpo' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'SAPCPO\')';
                tsfil.addY("source_sys_sail");
                break;

            case 'sapvista' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'VISTA\')';
                tsfil.addY("source_sys_vista");
                break;

            case 'sappn1' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'SAP-PN1\')' ;
                tsfil.addY("source_sys_pn1");
                break;

            case 'sappo1' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'SAP-PO1\')';
                tsfil.addY("source_sys_po1");
                break;

            case 'sappj1' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'SAP-PJ1\')';
                tsfil.addY("source_sys_pj1");
                break;

            case 'sappw1' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.source = \'HPSB\' and backlog_hdr.om_system = \'SAP-PW1\')';
                tsfil.addY("source_sys_pw1");
                break;

            // OF system
            case 'sc_sapr00' :
                tmpfilter.orLike ('%SAP-R00', "backlog_hdr.sc_system");
                tsfil.addY("source_sys_r00");
                break;

            case 'sc_sapr01' :
                tmpfilter.orLike ('%SAP-R01', "backlog_hdr.sc_system");
                tsfil.addY("source_sys_r01");
                break;

            case 'sc_sapap' :
                tmpfilter.orLike ('%SAP-AP', "backlog_hdr.sc_system");
                tsfil.addY("source_sys_pap");
                break;

            case 'sc_sapfap' :
                tmpfilter.orLike ('%SAP-FAP', "backlog_hdr.sc_system");
                tsfil.addY("source_sys_fap");
                break;

            case 'sc_sapclp' :
                tmpfilter.orLike ('%SAP-CLP', "backlog_hdr.sc_system");
                tmpfilter.where += ' or (backlog_hdr.source = \'HPSB\' and backlog_hdr.sc_system like \'%SAPCLP%\')';
                tsfil.addY("source_sys_calado");
                break;

            case 'sc_sapd7c' :
                tmpfilter.orLike ('%SAP-D7C', "backlog_hdr.sc_system");
                tmpfilter.where += ' or (backlog_hdr.source = \'HPSB\' and backlog_hdr.sc_system like \'%SAPD7C%\')';
                tsfil.addY("source_sys_d7");
                break;

            case 'sc_sapcpo' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.source = \'HPSB\' and backlog_hdr.sc_system like \'%SAPCPO%\')';
                tsfil.addY("source_sys_sail");
                break;

            case 'sc_velocity' :
                if(tmpfilter.where != '') {
                    tmpfilter.where += ' or (';
                } else {
                    tmpfilter.where += ' (';
                }
                tmpfilter.where += ' backlog_hdr.sc_system in (\'SAP-D7C\', \'SAP-CLP\') )';
                tmpfilter.where += ' or (backlog_hdr.source = \'HPSB\' and (backlog_hdr.sc_system = \'SAPD7C\' or backlog_hdr.sc_system = \'SAPCLP\') )';
                if(tsfil.where != '') {
                    tsfil.where += ' or (';
                } else {
                    tsfil.where += ' (';
                }
                tsfil.where += ' source_sys_d7 = \'Y\' or source_sys_calado = \'Y\')';
                break;
        }
    }
    if (tmpfilter.where != '') {
        if(filter.where != '') {
           filter.bindNo = tmpfilter.bindNo;
           filter.where += ' and (' + tmpfilter.where + ')';
        } else {
            filter.where += ' ( '+ tmpfilter.where + ' )';
            filter.bindNo = tmpfilter.bindNo;
        }
    }

    if (tsfil.where != '') {
        if(tsfilter.where != '') {
            tsfilter.where += ' and ( '  + tsfil.where + ')';
        } else {
            tsfilter.where += ' ( ' + tsfil.where + ' )';
        }
    }
}


/*-----------------------------------------------------------------------------
|  createAdvanceOrderTypeQuery  - construct the where clause for order type.
|
|  @param value       variable entered by user
|  @param filter      variable for oracle based where clause
|  @param tsfilter    variable for tstore based where clause
|
|\-----------------------------------------------------------------------------*/

function createAdvanceOrderTypeQuery(value, filter, tsfilter) {
     switch (value) {
        case 'all' :
            break;

        case 'trade' :
            filter.addLike  ("%Trade Order", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Trade Order', "order_type_descr");
            break;

        case 'debit' :
            filter.addLike  ("%Debit", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Debit', "order_type_descr");
            break;

        case 'lease' :
            filter.addLike  ("%Leasing Order", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Leasing Order', "order_type_descr");
            break;

        case 'srq' :
            filter.addLike  ("%SRQ", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%SRQ', "order_type_descr");
            break;

        case 'trade_lease' :
            if(filter.where != '') {
                filter.where += ' and (';
            } else {
                filter.where += ' (';
            }
            filter.orLike  ("%Trade Order", "backlog_hdr.order_type_descr");
            filter.orLike('%Leasing Order',  "backlog_hdr.order_type_descr"   );
            filter.where += ')';

            tsfilter.and = "";
            if (tsfilter.where != '') {
                tsfilter.where += ' and (';
            } else {
                 tsfilter.where += '(' ;
            }
            tsfilter.addLike('%Trade Order', "order_type_descr");
            tsfilter.and = "";
            tsfilter.where += ' or ' ;
            tsfilter.addLike('%Leasing Order', "order_type_descr");
            tsfilter.where += ' )' ;
            break;

        case 'trade_lease_srq' :
            if(filter.where != '') {
                filter.where += ' and (';
            } else {
                filter.where += ' (';
            }
            filter.orLike("%Trade Order", "backlog_hdr.order_type_descr");
            filter.orLike('%Leasing Order',  "backlog_hdr.order_type_descr"   );
            filter.orLike('%SRQ',  "backlog_hdr.order_type_descr"   );
            filter.where += ')'

            tsfilter.and = "";
            if (tsfilter.where != '') {
                tsfilter.where += ' and (';
            } else {
                 tsfilter.where += '(' ;
            }
            tsfilter.addLike('%Trade Order', "order_type_descr");
            tsfilter.and = "";
            tsfilter.where += ' or ' ;
            tsfilter.addLike('%Leasing Order', "order_type_descr");
            tsfilter.and = "";
            tsfilter.where += ' or ' ;
            tsfilter.addLike('%SRQ', "order_type_descr");
            tsfilter.where += ' )' ;
            break;

        case 'internal' :
            filter.addLike("%Internal Order", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Internal Order', "order_type_descr");
            break;

        case 'demo' :
            filter.addLike("%Demo Order", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Demo Order', "order_type_descr");
            break;

        case 'no_charge' :
            filter.addLike("%No Charge Order", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%No Charge Order', "order_type_descr");
            break;

        case 'resale' :
            filter.addLike("%Resal", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Resal', "order_type_descr");
            break;

        case 'return' :
            filter.addLike("%Return", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Return', "order_type_descr");
            break;

        case 'credit' :
            filter.addLike("%Credit", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Credit', "order_type_descr");
            break;

        case 'statistical' :
            filter.addLike("%Statistical", "backlog_hdr.order_type_descr");
            tsfilter.addLike('%Statistical', "order_type_descr");
            break;

        case 'contract' :
            filter.addLike("Contract Order", "backlog_hdr.order_type_descr");
            tsfilter.addLike('Contract Order', "order_type_descr");
            break;

        case 'sw_contract' :
             filter.addLike("SW Contract", "backlog_hdr.order_type_descr");
             tsfilter.addLike('SW Contract', "order_type_descr");
             break;

        case 'sw_contract_renewal' :
             filter.addLike("SW Contract Renewal", "backlog_hdr.order_type_descr");
             tsfilter.addLike('SW Contract Renewal', "order_type_descr");
             break;

        case 'sw_contract_migrations' :
            filter.addLike("SW Contract Migrations", "backlog_hdr.order_type_descr");
            tsfilter.addLike('SW Contract Migrations', "order_type_descr");
            break;

        case 'carepack' :
            filter.addY( "backlog_hdr.carepack_flag" );
            tsfilter.addY('carepack_flag');
            break;
    }
}

/*-----------------------------------------------------------------------------
|  createAdvanceGroupQuery  - construct the where clause for Group.
|
|  @param value       variable entered by user
|  @param filter      variable for oracle based where clause
|  @param tsfilter    variable for tstore based where clause
|
|\-----------------------------------------------------------------------------*/

function createAdvanceGroupQuery(value, filter, tsfilter) {

    switch (value) {
        case 'all' :
            break;

        case 'otd_tba' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addY("backlog_delv.lack_tba_flag");
            break;

        case 'otd_noa' :
            if (filter.where == ''){
                filter.where += ' (';
            } else {
                filter.where += ' and (';
            }

            filter.orLike('%Trade', "backlog_hdr.order_type_descr");
            filter.orLike('%Leasing', "backlog_hdr.order_type_descr");
            filter.where += ') ';
            filter.where += ' and backlog_delv.last_ack_date is null  \
                              and (backlog_delv.lack_tba_flag != \'Y\' or backlog_delv.lack_tba_flag is null) \
                              and exists (select d2.status from backlog_delv d2  \
                                           where backlog_delv.legacy_order_no = d2.legacy_order_no \
                                             and d2.status in (\'Acked\',\'FactShipped\',\'Processing\',\'Production\'))';
            break;

       case 'otd_re_ack' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addGreaterThan ('0', 'backlog_delv.nr_reacks');

            filter.where +=  ' and exists (select d2.status from backlog_delv d2 \
                                            where backlog_delv.legacy_order_no = d2.legacy_order_no \
                                              and d2.status in (\'Acked\',\'Processing\',\'Production\'))' ;
            break;

        case 'otd_akn' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addDateLtEqCurrentDate ('backlog_delv.last_ack_date');
            filter.where += ' and ( backlog_delv.lack_tba_flag <> \'Y\' or backlog_delv.lack_tba_flag  is null) \
                              and exists (select d2.status from backlog_delv d2 \
                                           where backlog_delv.legacy_order_no = d2.legacy_order_no  \
                                             and d2.status not in (\'FactShipped\',\'Registered\',\'Shipped\',\'Delivered\'))';
            break;

       case 'cust_sh_not_inv' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addIn ("'Shipped','Delivered'", "backlog_delv.status");
            filter.where += ' and (   backlog_delv.invoice_no = \'\' or backlog_delv.invoice_no = \' \' \
                                   or backlog_delv.invoice_no is null or backlog_delv.invo_actual is null)';
            break;

        case 'open_backlog' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addnotIn  ("'Shipped','Delivered','CANCELED'", 'backlog_delv.status');

            filter.where += ' and (    backlog_hdr.order_type_descr like \'%Trade%\' \
                                    or backlog_hdr.order_type_descr like \'%Leasing%\')' ;
            break;

        case 'late_backlog' :
            if (filter.where != '' ) {
               filter.where += ' and';
            }
            filter.where += ' (      backlog_hdr.ship_status <> \'FS\' or backlog_hdr.ship_status is null) \
                                 and exists (select d2.legacy_order_no                  \
                                               from backlog_delv d2                     \
                                              where d2.legacy_order_no = backlog_hdr.legacy_order_no \
                                                and d2.sched_delv_date > d2.latest_arr_date)';
            break;

        case 'await_pod' :
            if (filter.where != '' ) {
               filter.where += ' and';
            }
            filter.where += ' backlog_delv.sched_delv_date < ( current_date - interval \'3\' day ) ';
            filter.and = " and ";
            filter.andIsNull ( "backlog_delv.pod_actual") ;
            filter.where += ' and (    backlog_hdr.order_type_descr like \'%Trade%\' \
                                    or backlog_hdr.order_type_descr like \'%Leasing%\') ';
            filter.addEq ('Shipped', "backlog_delv.status");
            break;

        case 'delivered' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('Delivered', "backlog_delv.status");
            filter.where += ' and not exists (select d2.status from backlog_delv d2 \
                                               where backlog_delv.legacy_order_no = d2.legacy_order_no \
                                                 and d2.status not in (\'Delivered\')) ';
            break;

        case 'clean_backlog' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('OPEN', "backlog_hdr.order_status");
            filter.where += ' and backlog_delv.order_load_date < ( current_date - interval \'60\' day ) ' ;
            break;

        case 'reg_on_hold' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('Registered', "backlog_delv.status");
            filter.andIsNotNull('backlog_delv.shipment_hold') ;
            filter.addInEquality ('00', "backlog_hdr.dc_code");
            filter.where += ' and not exists (select d2.status from backlog_delv d2   \
                                               where backlog_delv.legacy_order_no = d2.legacy_order_no \
                                                 and d2.status not in (\'Registered\')) ' ;

            filter.where += ' and (    backlog_hdr.order_type_descr like \'%Trade%\' \
                                    or backlog_hdr.order_type_descr like \'%Leasing%\') ' ;
            break;

        case 'reg_on_ma_hold' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('Registered', "backlog_delv.status");
            filter.addInEquality ('00', "backlog_hdr.dc_code");
            filter.addLike  ("%MA", "backlog_delv.shipment_hold");
            filter.where += ' and not exists (select d2.status from backlog_delv d2  \
                                               where backlog_delv.legacy_order_no = d2.legacy_order_no \
                                                 and d2.status not in (\'Registered\'))' ;
            filter.where += ' and (    backlog_hdr.order_type_descr like \'%Trade%\' \
                                    or backlog_hdr.order_type_descr like \'%Leasing%\')' ;
            break;

        case 'reg_on_cr_hold' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('Registered', "backlog_delv.status");
            filter.addInEquality ('00', "backlog_hdr.dc_code");
            filter.addLike  ("%CR", "backlog_delv.shipment_hold");
            filter.where += ' and not exists (select d2.status from backlog_delv d2 \
                                               where backlog_delv.legacy_order_no = d2.legacy_order_no \
                                                 and d2.status not in (\'Registered\'))';

            filter.where += ' and (   backlog_hdr.order_type_descr like \'%Trade%\' \
                                   or backlog_hdr.order_type_descr like \'%Leasing%\') ';
            break;

        case 'partial_landed' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addInEquality ('00', "backlog_hdr.dc_code");

            filter.where += ' and (   backlog_hdr.order_type_descr like \'%Trade%\' \
                                   or backlog_hdr.order_type_descr like \'%Leasing%\') ';
            filter.where += ' and  exists (select d2.status from backlog_delv d2 \
                                            where backlog_delv.legacy_order_no = d2.legacy_order_no \
                                              and d2.status   in (\'Registered\'))'  ;
            break;

        case 'custship_not_bill' :
            if (filter.where != '' ) {
               filter.where += ' and ';
            }
            filter.where += ' exists (select h2.legacy_order_no   \
                                        from backlog_hdr h2 inner join backlog_delv d2  \
                                          on h2.legacy_order_no = d2.legacy_order_no    \
                                       where backlog_hdr.purchase_order_no = h2.purchase_order_no \
                                         and backlog_hdr.customer_no = h2.customer_no             \
                                         and d2.status in (\'Shipped\',\'Delivered\')       \
                                         and ( d2.invoice_no = \'\' or d2.invoice_no = \' \' \
                                          or d2.invoice_no is null)                     \
                                    ) ' ;
            break;

        case 'block_invo' :
            if (filter.where != '' ) {
               filter.where += ' and ';
            }
            filter.where += ' backlog_hdr.purchase_order_no in   \
                                            (select h2.purchase_order_no \
                                               from backlog_hdr h2       \
                                              where backlog_hdr.purchase_order_no = h2.purchase_order_no  \
                                                    and ( h2.invoice_type = \'3\' or h2.invoice_type = \'3S\')) ' ;
            break;

        case 'block_orders' :
            if (filter.where != '' ) {
               filter.where += ' and ';
            }
            filter.where += ' (   backlog_delv.delivery_block is not null \
                               or backlog_delv.shipment_hold  is not null )  \
                               and  exists (select d2.status from backlog_delv d2 \
                                             where backlog_delv.legacy_order_no = d2.legacy_order_no  \
                                               and d2.status   in (\'Production\')) ' ;
            break;

        case 'fix_delivery' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addLike  ("%FD", "backlog_hdr.special_codes");
            break;
    }
}

/*-----------------------------------------------------------------------------
|  createAdvanceRepositoryQuery  - construct the where clause for Repository.
|
|  @param value       variable entered by user
|  @param filter      variable for oracle based where clause
|  @param tsfilter    variable for tstore based where clause
|
|\-----------------------------------------------------------------------------*/

function createAdvanceRepositoryQuery (value, filter, tsfilter) {
    switch (value) {
        case 'all' :
            break;

        case 'open' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('OPEN', "backlog_hdr.order_status");

            if (tsfilter.where != '' ) {
                tsfilter.and = " and "
            }
            tsfilter.addN("is_closed");
            break;

        case 'closed' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('CLOSED', "backlog_hdr.order_status");

            if (tsfilter.where != '' ) {
                tsfilter.and = " and "
            }
            tsfilter.addY("is_closed");
            break;

        case 'qtcuid' :
            if (filter.where != '' ) {
                filter.and = " and "
            }
            filter.addEq ('29', "backlog_hdr.version");
            break;
    }
}

/*-----------------------------------------------------------------------------
|  numberQueryToUpper  - construct the where clause with like
|                        by converting values to Upper.
|
|  @param value       variable entered by user
|  @param field       variable for value selected from list
|  @param filter      variable for oracle based where clause
|
|-----------------------------------------------------------------------------*/

function numberQueryToUpper (value, field, filter) {

    if (filter.where != '' ) {
        filter.where += ' and (';
    } else {
        filter.where += '(';
    }

    for (var i = 0; i <= value.length-1; i++) {
        var val = value[i].replace(/\*/g,"");
        val = val.replace(/\?/g,"");
        val = val.replace(/\%/g,"");
        filter.orLikeToUpper(val, field);
    }
    filter.where += ') ';
    filter.or = '';
}

/*-----------------------------------------------------------------------------
|  numberQuery  - construct the where clause with like
|
|  @param value       variable entered by user
|  @param field       variable for value selected from list
|  @param action      variable for action performed
|  @param filter      variable for oracle based where clause
|-----------------------------------------------------------------------------*/

function numberQuery (value, field, action, filter,toUpper) {

    if (filter.where != '' ) {
        filter.where += ' and (';
    } else {
        filter.where += '(';
    }

    for (var i = 0; i <= value.length-1; i++) {

        var val = value[i].replace(/\*/g,"");
        val = val.replace(/\?/g,"");
        val = val.replace(/\%/g,"");
        if (action == 'eq'){
            if (toUpper == 1) {
                filter.orEqToUpper(val , field);
            } else {
                filter.orEq(val , field);
            }
        } else if (action == 'like'){
            if (toUpper == 1) {
                filter.orLikeToUpper(val, field);
            } else {
                filter.orLike(val, field);
            }
        }
    }
    filter.where += ') ';
    filter.or = '';
}

/*-----------------------------------------------------------------------------
|  tsnumberQuery  - contstruct the tstore where clause with start with
|
|  @param value       variable entered by user
|  @param field       variable for value selected from list
|  @param tsfilter    variable for tstore based where clause
|
|\-----------------------------------------------------------------------------*/
function tsnumberQuery (value, field, tsfilter, toUpper) {

    var tmpTSFilter = new SqlUtils.OrWhereDirect();

    if (tsfilter.where != '' ) {
        tsfilter.where += ' and ( ';
    } else {
        tsfilter.where += ' ( ';
    }

    for (var i = 0; i <= value.length-1; i++) {
        var val = value[i].replace(/\*/g,"");
        val = val.replace(/\?/g,"");
        val = val.replace(/\%/g,"");

        if(toUpper == 1) {
            val = val.toUpperCase();
        }

        tmpTSFilter.addIStartsWith(val, field);
    }
    tsfilter.where += tmpTSFilter.where;
    tsfilter.where += ') ';
    tmpTSFilter.or = '';
}

/*-----------------------------------------------------------------------------
|  addInvoiceFilter  - construct the invoice filter
|
|  @param filter          variable for oracle based where clause
|  @param value           variable entered by user
|  @param field           variable for value selected from list
|  @param fullField       variable
|  @param alias           variable
|\-----------------------------------------------------------------------------*/

function addInvoiceFilter(filter, value, field, fullField, alias) {

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

    if (filter.where != ''){
        filter.where += " and ((";
    } else {
        filter.where += " ((";
    }

    if (alias != '') {
        alias += ".";
    }
    field = alias + field;

    if (fullField != '') {
        fullField  = alias + fullField;
    }

    if (value.length > 6 && fullField != "") {
        filter.or = "";
        filter.orLike(value, field);
        filter.where += " or (";
        filter.and = "";
        filter.addLike(value.substr(3), field);
        filter.addLike(value, fullField);
        filter.where += ") ";
    } else {
        filter.and = "";
        filter.addLike(value, field);
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
    var salesOrgFilter = "(" + alias + "sales_org in (" + salesOrgMap4Uniq + ") or \
                           substr(" + alias + "sales_org,1,2) in (" + salesOrgMap2Uniq + ")) ";
    filter.or = "";

    for (var prefix in cronosInvPrefix) {
        if (!isNaN(prefix))
            filter.orLike(prefix + invoiceNo, field);
    }

    filter.where += " and " + salesOrgFilter + ")) ";
    filter.or = "";
}


/*-----------------------------------------------------------------------------
|  createAdvanceNumberQuery  - construct the where clause for Number
|
|  @param id              variable for value selected from list
|  @param value           variable entered by user
|  @param filter          variable for oracle based where clause
|  @param tsfilter        variable for tstore based where clause
|
|\-----------------------------------------------------------------------------*/

function createAdvanceNumberQuery(id, value, filter, tsfilter){

    switch (id) {

        case 'webOrderNo' :
            numberQueryToUpper(value, "backlog_hdr.web_order_no", filter);
            break;

        case 'assetTag' :
            if (filter.where != ''){
                filter.where += ' and '
            }
            filter.where += '  (backlog_hdr.legacy_order_no in \
                                 (select distinct delv.legacy_order_no \
                                    from backlog_delv delv, detail_techinfo dtech \
                                   where delv.delivery_group = dtech.delivery_group ' ;
            numberQuery(value, "dtech.asset_tag", "like", filter, 1);
            filter.where += ' and ((    dtech.serial_number is not null  \
                                    and dtech.serial_number not like \'XX%\')  \
                                     or dtech.serial_number is null)))' ;
            break;

        case 'b2bid' :
            numberQueryToUpper(value, "backlog_hdr.b2bis_id", filter);
            break;

        case 'eopId' :
            numberQueryToUpper(value, "backlog_hdr.eop_id", filter);
            break;

        case 'famNo' :
            numberQueryToUpper(value, "backlog_hdr.cust_family_no", filter);
            break;

        case 'csn' :
            numberQueryToUpper(value, "backlog_delv.shipment_no", filter);
            break;

        case 'custNo' :
            numberQuery(value, "backlog_hdr.customer_no", "like", filter, 1);
            tsnumberQuery(value, "customer_no", tsfilter, 1);
            break;

        case 'eclaimNo' :
            numberQuery(value, "backlog_hdr.claim_no", "like", filter, 1);
            tsnumberQuery(value, "claim_no", tsfilter, 1);
            break;

        case 'fsn' :
            numberQueryToUpper(value, "backlog_delv.fact_delv_no", filter);
            break;

        //only for single entry no multiple entry
        case 'ivn' :
            for (var i = 0; i <= value.length-1; i++) {
                addInvoiceFilter (filter, value[i], "invoice_no", "full_invoice_no", "backlog_delv");
            }
           break;

        case 'macAddr' :
            if (filter.where != ''){
                filter.where += ' and '
            }
            filter.where += '  (backlog_hdr.legacy_order_no in       \
                                     (select distinct delv.legacy_order_no \
                                        from backlog_delv delv, detail_techinfo dtech \
                                       where delv.delivery_group = dtech.delivery_group ';
            numberQuery(value, "dtech.primary_mac_addr", "like", filter, 1);
            filter.where += ' and ((    dtech.serial_number is not null  \
                                    and dtech.serial_number not like \'XX%\')  \
                                     or dtech.serial_number is null))) ';
            break;

        case 'ncrfNo' :
            if (filter.where != ''){
                filter.where += ' and ';
            }
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            filter.where += ' backlog_hdr.legacy_order_no in  \
                                  (select distinct legacy_order_no from backlog_ids where ';
                                    numberQuery(value, "sold_to_l1", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "sold_to_l2", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "sold_to_l3", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "sold_to_l4", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "ship_to_l1", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "ship_to_l2", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "ship_to_l3", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "ship_to_l4", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "inv_to_l1", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "inv_to_l2", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "inv_to_l3", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.where  += " or ";
                                    tmpFilter.where = '';

                                    numberQuery(value, "inv_to_l4", "eq", tmpFilter, 1);
                                    filter.where += tmpFilter.where;
                                    filter.bindNo = tmpFilter.bindNo ;
                                    filter.where += ' )';

            if (tsfilter.where != ''){
                tsfilter.where += ' and ('
            } else {
                tsfilter.where += ' ( '
            }
            var tempTSFil = new SqlUtils.AndWhereDirect();
            tsnumberQuery(value, "sold_to_party", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "sold_to_l2", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "sold_to_l4", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "ship_to_id", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "ship_to_l4_1", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "ship_to_l4_2", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "ship_to_l2_1", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "ship_to_l2_2", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "inv_to_party", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "inv_to_l4", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where  += " or ";
            tempTSFil.where = '';

            tsnumberQuery(value, "inv_to_l2", tempTSFil, 1);
            tsfilter.where += tempTSFil.where;
            tsfilter.where += ' ) ' ;
            break;

        case 'purchAgree' :
            numberQueryToUpper(value, "backlog_hdr.purch_agree", filter);
            tsnumberQuery(value, "purch_agree", tsfilter,1);
            break;

        case 'quoteNo' :
            numberQueryToUpper(value, "backlog_hdr.quote_no", filter);
            break;

        case 'salNo' :
            numberQueryToUpper(value, "backlog_hdr.sal_number", filter);
            break;

        case 'serialNo' :
            if (filter.where != ''){
                filter.where += ' and '
             }
            filter.where += ' (backlog_hdr.legacy_order_no in   \
                                 (select distinct delv.legacy_order_no \
                                    from backlog_delv delv, detail_techinfo dtech \
                                   where delv.delivery_group = dtech.delivery_group' ;
            numberQuery(value, "dtech.serial_number", "like", filter, 1);
            filter.where += ' and dtech.serial_number not like \'XX%\')) ';
            break;

        case 'imei' :
            if (filter.where != ''){
                filter.where += ' and '
            }
            filter.where += ' (backlog_hdr.legacy_order_no in   \
                                     (select distinct delv.legacy_order_no  \
                                        from backlog_delv delv, detail_techinfo dtech \
                                       where delv.delivery_group = dtech.delivery_group ';
            numberQuery(value, "dtech.imei", "like", filter, 1);
            filter.where += ' and ((    dtech.serial_number is not null  \
                                    and dtech.serial_number not like \'XX%\')  \
                                     or dtech.serial_number is null))) ';
            break;

        case 'gvtContractNo' :
            numberQueryToUpper(value, "backlog_hdr.gvt_contract_number", filter);
            tsnumberQuery(value, "gvt_contract_number", tsfilter, 1);
            break;

        case 'wawfNo' :
            if (filter.where != ''){
                filter.where += ' and '
            }
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            filter.where += ' backlog_hdr.legacy_order_no in (  \
                                select s.legacy_order_no        \
                                  from backlog_ship s  where '
            numberQueryToUpper(value, "s.wawf_number", tmpFilter);
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )' ;
            break;

        case 'accountName' :
            numberQueryToUpper(value, "backlog_hdr.account_name", filter);
            break;

        case 'legOrdType' :
            numberQueryToUpper(value, "backlog_hdr.legacy_order_type", filter);
            break;

        case 'mci' :
            numberQueryToUpper(value, "i.master_contract_id", filter);
            numberQuery(value, "i.master_contract_id", "eq", filter, 1);
            filter.where += '  and (backlog_hdr.legacy_order_no = i.legacy_order_no) ';
            isItem = 1;
            break;

        case 'opportunityId' :
            numberQuery(value, "backlog_hdr.opportunity_id", "eq", filter, 0);
            break;

        case 'rebateRequestId' :
            numberQuery(value, "backlog_hdr.rebate_request_id", "eq", filter, 0);
            break;
    }
}

/*-----------------------------------------------------------------------------
|  formatValues  - it will format the value passed
|
|  @param value              variable entered by user
|  @param wildCardFlag       variable for wildcard
|  @param trimLeadZeroFlag   variable for trimming
|  @param toUpperFlag        variable for converting to upper
|\-----------------------------------------------------------------------------*/

function formatValues(value, wildCardFlag, trimLeadZeroFlag, toUpperFlag) {

    value = value.trim();

    if (wildCardFlag) value = value.replace(/\*/g,"%");

    if (trimLeadZeroFlag) value = value.replace(/^0+/, '');

    if (toUpperFlag) value = value.toUpperCase();

    return value;
}

/*-----------------------------------------------------------------------------
|  addTStoreProdLineFilter  - construct the where clause for product lines
|
|  @param tsfilter              variable for tstore based where clause
|  @param tmpfilter             variable for oracle based where clause
|  @param productLines          variable containing product lines
|
|\-----------------------------------------------------------------------------*/

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

/*-----------------------------------------------------------------------------
|  createAdvanceCodeQuery  - construct the where clause for code
|
|  @param id              variable for value selected from list
|  @param value           variable entered by user
|  @param filter          variable for oracle based where clause
|  @param tsfilter        variable for tstore based where clause
|  @param additonalTable  variable for any additional table added
|\-----------------------------------------------------------------------------*/

function createAdvanceCodeQuery(id, value, filter, tsfilter, additonalTable){
    switch (id) {
        case 'cd' :
            numberQueryToUpper(value, "backlog_hdr.cd_code", filter);
            tsnumberQuery(value, "cd_code", tsfilter, 1);
            break;

        case 'dealId' :
            numberQuery(value, "deal.deal_id", "like", filter, 1);
            filter.where += ' and (backlog_hdr.legacy_order_no = deal.legacy_order_no)';
            additonalTable = additonalTable+ ", l_deal_id deal";
            return additonalTable;
            break;

        case 'dc' :
            numberQueryToUpper(value, "backlog_hdr.dc_code", filter);
            tsnumberQuery(value, "dc_code", tsfilter, 1);
            break;

        case 'eid' :
            numberQueryToUpper(value, "backlog_hdr.eid", filter);
            break;

        case 'salesorg' :
            numberQuery(value, "backlog_hdr.sales_org", "like", filter, 1);
            tsnumberQuery(value, "sales_org", tsfilter,1);
            break;

        case 'teamId' :
            numberQuery(value, "backlog_hdr.team_id", "like", filter, 1);
            tsnumberQuery(value, "team_id", tsfilter,1);
            break;

        case 'prodLines' :
            numberQueryToUpper(value, "backlog_hdr.product_lines", filter);
            var tmpfilter = new SqlUtils.OrWhereDirect();
            addTStoreProdLineFilter(tsfilter, tmpfilter, value);
            break;

        case 'salesRep' :
            numberQuery(value, "backlog_hdr.purch_agent", "like", filter, 1);
            tsnumberQuery(value, "sales_rep", tsfilter,1);
            break;

        case 'specialCodes' :
            numberQuery(value, "backlog_hdr.special_codes", "like", filter, 1);
            break;

        case 'supp' :
            if (filter.where != ''){
                filter.where += ' and '
            }
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            var tsfil = new SqlUtils.OrWhereDirect();

            filter.where += ' (backlog_hdr.legacy_order_no in   \
                                 (select distinct legacy_order_no \
                                    from backlog_delv where ' ;
            numberQueryToUpper(value, "supplier", tmpFilter);
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' ) )';

            for (var i = 0; i <= value.length-1; i++) {
               switch (value[i]) {
                    case '5200' :
                        tsfil.addY("has_supplier_5200");
                        break;

                    case '6320' :
                        tsfil.addY("has_supplier_6320");
                        break;

                    case '63D7' :
                        tsfil.addY("has_supplier_63D7");
                        break;

                    case 'AJ00' :
                        tsfil.addY("has_supplier_AJ00");
                        break;

                    case 'AJ01' :
                        tsfil.addY("has_supplier_AJ01");
                        break;

                    case 'B600' :
                        tsfil.addY("has_supplier_B600");
                        break;

                    case 'B606' :
                        tsfil.addY("has_supplier_B606");
                        break;

                    case 'G100' :
                        tsfil.addY("has_supplier_G100");
                        break;

                    case 'JN00' :
                        tsfil.addY("has_supplier_JN00");
                        break;

                    case 'JP01' :
                        tsfil.addY("has_supplier_JP01");
                        break;

                    case 'N820' :
                        tsfil.addY("has_supplier_N820");
                        break;

                    case 'NK00' :
                        tsfil.addY("has_supplier_NK00");
                        break;
                }
            }
            if (tsfil.where != '') {
                if(tsfilter.where != '') {
                    tsfilter.where += ' and ( '  + tsfil.where + ')';
                } else {
                    tsfilter.where += ' ( ' + tsfil.where + ' )';
                }
            }
            break;

        case 'suppMfg' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;

            if (filter.where != ''){
                filter.where += ' and '
            }
            filter.where += ' (backlog_hdr.legacy_order_no in   \
                                 (select distinct legacy_order_no \
                                    from backlog_item where ' ;
            numberQuery(value, "supplier_mfgso", "like", tmpFilter, 1);
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' ) )';
            break;

        case 'siebelAgentId' :
            numberQuery(value, "backlog_hdr.siebel_agent_id", "like", filter, 0);
            break;

        case 'opgCode' :
            numberQueryToUpper(value, "backlog_hdr.opg_code", filter);
            tsnumberQuery(value, "opg_code", tsfilter, 1);
            break;

        case 'soldtoId' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;

            numberQueryToUpper(value, "ids.sold_to", tmpFilter);
            tmpFilter.or = 'or ';
            for (var i = 0; i <= value.length-1; i++) {
                if (value[i].length < 10) {
                    tmpFilter.orLikeToUpper('0'+value[i] , "ids.sold_to");
                }
            }
            if(tmpFilter.where != ''){
                filter.where += ' and ('
                filter.where += tmpFilter.where;
                filter.bindNo = tmpFilter.bindNo ;
                filter.where += ' )' ;
            }
            isIds = 1;
            break;

        case 'invoicetoId' :
            numberQueryToUpper(value, "ids.inv_to", filter);
            isIds = 1;
            break;

        case 'shiptoId' :
            numberQueryToUpper(value, "ids.ship_to", filter);
            isIds = 1;
            break;

        case 'shiptoZip' :
            numberQueryToUpper(value, "backlog_delv.ship_zone", filter);

            var tsfil = new SqlUtils.OrWhereDirect();
            for (var i = 0; i <= value.length-1; i++) {
                val = formatValues(value[i], 0, 0, 1);
                tsfil.addEq(val, "ship_to_zip1");
                tsfil.addEq(val, "ship_to_zip2");
                tsfil.addEq(val, "ship_to_zip3");
            }

            if (tsfil.where != '') {
                if(tsfilter.where != '') {
                    tsfilter.where += ' and ( '  + tsfil.where + ')';
                } else {
                    tsfilter.where += ' ( ' + tsfil.where + ' )';
                }
            }
            break;

        case 'campaignCode' :
            numberQuery(value, "i.campaign_code", "like", filter, 1);
            isItem = 1;
            break;

        case 'funnelId' :
            numberQueryToUpper(value, "backlog_hdr.funnel_id", filter);
            break;

        case 'catalogId' :
            numberQueryToUpper(value, "backlog_hdr.catalog_id", filter);
            break;

        case 'distChannel' :
            numberQueryToUpper(value, "backlog_hdr.distrib_channel", filter);
            break;

        case 'commercialityCode' :
            numberQueryToUpper(value, "backlog_hdr.commerciality_code", filter);
            break;

        case 'paymentMethod' :
            numberQuery(value, "backlog_hdr.payment_method", "like", filter, 1);
            break;

        case 'communityId' :
            numberQueryToUpper(value, "backlog_hdr.community_id", filter);
            break;

        case 'telewAgentId' :
            numberQueryToUpper(value, "backlog_hdr.telew_agent_id", filter);
            break;

        case 'lspIdentiferId' :
            numberQuery(value, "i.ship_from", "like", filter, 1);
            isItem = 1;
            break;

        case 'plantCode' :
            numberQuery(value, "i.plant_code", "like", filter, 1);
            isItem = 1;
            break;

        case 'plantCodeMfg' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;

            if (filter.where != ''){
                filter.where += ' and '
            }
            filter.where += ' (backlog_hdr.legacy_order_no in   \
                                 (select distinct legacy_order_no \
                                    from backlog_item where ' ;
            numberQuery(value, "plant_code_mfgso", "like", tmpFilter, 1);
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' ) )';
            break;

        case 'idCode' :
            for (var i = 0; i < value.length; i++) {
                val = formatValues(value[i], 0, 0, 1);
                if (i > 0) {
                    newList = newList + "," + "'" + val + "'";
                } else {
                    newList = "'" + val + "'";
                }
            }

            if (filter.where != ''){
                filter.and = " and "
            }

            filter.addIn (newList , "lid.id_code");
            filter.where += ' and (backlog_hdr.legacy_order_no = lid.legacy_order_no)';
            additonalTable += ", l_id_code lid ";
            return additonalTable;
            break;
    }
}

/*-----------------------------------------------------------------------------
|  createAdvanceDateQuery  - contstruct the where clause for Date
|
|  @param id              variable for value selected from list
|  @param value           variable entered by user
|  @param filter          variable for oracle based where clause
|  @param tsfilter        variable for tstore based where clause
|  @param additonalTable  variable for any additional table added
|\-----------------------------------------------------------------------------*/

function createAdvanceDateQuery (id, value, filter, tsfilter, additonalTable) {
    switch (id) {
        case 'orderDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_hdr.purch_order_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "purch_order_date" );
            break;

        case 'orderDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_hdr.purch_order_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "purch_order_date" );
            break;

        case 'hprecieveFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_hdr.hp_receive_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "hp_receive_date" );
            break;

        case 'hprecieveTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_hdr.hp_receive_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "hp_receive_date" );
            break;

        case 'factshipDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_delv.pgi_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "pgi_actual" );
            break;

        case 'factshipDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_delv.pgi_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "pgi_actual" );
            break;

        case 'custshipDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_delv.eshp_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "eshp_actual" );
            break;

        case 'custshipDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_delv.eshp_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "eshp_actual" );
            break;

        case 'eadDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_delv.earl_arr_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';
            break;

        case 'eadDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_delv.earl_arr_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';
            break;

        case 'sddDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_delv.sched_delv_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "sdd" );
            break;

        case 'sddDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_delv.sched_delv_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "sdd" );
            break;

        case 'podDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_delv.pod_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "pod_date" );
            break;

        case 'podDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_delv.pod_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "pod_date" );
            break;

        case 'invoDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_delv.invo_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ')';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "invoice_date" );
            break;

        case 'invoDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_delv.invo_actual" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ')';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "invoice_date" );
            break;

        case 'quoteDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_hdr.quote_creation_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';
            break;

        case 'quoteDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_hdr.quote_creation_date" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';
            break;

        case 'webordDateFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_hdr.web_order_creation_dt" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';
            break;

        case 'webordDateTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_hdr.web_order_creation_dt" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';
            break;

        case 'changedSinceFrom' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addGtEq (value, "backlog_delv.last_update" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateGtEq  (value, "last_update" );
            break;

        case 'changedSinceTo' :
            if (filter.where != '' ) {
                filter.where += ' and ( ';
            } else {
                filter.where += '( ';
            }

            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            tmpFilter.addLtEq (value, "backlog_delv.last_update" );
            filter.where += tmpFilter.where;
            filter.bindNo = tmpFilter.bindNo ;
            filter.where += ' )';

            if (tsfilter.where != '') {
                tsfilter.and = " and "
            }
            tsfilter.addDateLtEq (value,   "last_update" );
            break;
    }
}

/*-----------------------------------------------------------------------------
|  createAdvanceStatusesQuery  - construct the where clause for Statuses
|
|  @param id              variable for value selected from list
|  @param value           variable entered by user
|  @param filter          variable for oracle based where clause
|  @param tsfilter        variable for tstore based where clause
|  @param additonalTable  variable for any additional table added
|-----------------------------------------------------------------------------*/

function createAdvanceStatusesQuery (id, value, filter, tsfilter, additonalTable) {
    switch (id) {
        case "userStati" :
            numberQueryToUpper(value, "backlog_hdr.consolidated_stati", filter);
            break;

        case "holdCat" :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            var tsfil = new SqlUtils.OrWhereDirect();

            for (var i = 0; i <= value.length-1; i++) {
                var val = value[i].replace(/\_/g,"/");
                switch (val) {
                    case "oe/cr" :
                        tmpFilter.orY("backlog_delv.block_oe_cr");
                        tsfil.addY("block_oe_cr");
                        break;

                    case "oe/cfg" :
                        tmpFilter.orY("backlog_delv.block_oe_cfg");
                        tsfil.addY("block_oe_cfg");
                        break;

                    case "oe/doc" :
                        tmpFilter.orY("backlog_delv.block_oe_doc");
                        tsfil.addY("block_oe_doc");
                        break;

                    case "oe/info" :
                        tmpFilter.orY("backlog_delv.block_oe_info");
                        tsfil.addY("block_oe_info");
                        break;

                    case "oe/oth" :
                        tmpFilter.orY("backlog_delv.block_oe_oth");
                        tsfil.addY("block_oe_oth");
                        break;

                    case "oe/pri" :
                        tmpFilter.orY("backlog_delv.block_oe_pri");
                        tsfil.addY("block_oe_pri");
                        break;

                    case "oe/pro" :
                        tmpFilter.orY("backlog_delv.block_oe_pro");
                        tsfil.addY("block_oe_pro");
                        break;

                    case "oe/exp" :
                        tmpFilter.orY("backlog_delv.block_oe_exp");
                        tsfil.addY("block_oe_exp");
                        break;

                    case "oe/stax" :
                        tmpFilter.orY("backlog_delv.block_oe_stax");
                        tsfil.addY("block_oe_stax");
                        break;

                    case "oe/acc" :
                        tmpFilter.orY("backlog_delv.block_oe_acc");
                        tsfil.addY("block_oe_acc");
                        break;

                    case "oe/bitf" :
                        tmpFilter.orY("backlog_delv.block_oe_bitf");
                        tsfil.addY("block_oe_bitf");
                        break;

                    case "oe/cont" :
                        tmpFilter.orY("backlog_delv.block_oe_cont");
                        tsfil.addY("block_oe_cont");
                        break;

                    case "oe/cust" :
                        tmpFilter.orY("backlog_delv.block_oe_cust");
                        tsfil.addY("block_oe_cust");
                        break;

                    case "oe/cins" :
                        tmpFilter.orY("backlog_delv.block_oe_cins");
                        tsfil.addY("block_oe_cins");
                        break;

                    case "oe/cmov" :
                        tmpFilter.orY("backlog_delv.block_oe_cmov");
                        tsfil.addY("block_oe_cmov");
                        break;

                    case "oe/data" :
                        tmpFilter.orY("backlog_delv.block_oe_data");
                        tsfil.addY("block_oe_data");
                        break;

                    case "oe/deal" :
                        tmpFilter.orY("backlog_delv.block_oe_deal");
                        tsfil.addY("block_oe_deal");
                        break;

                    case "oe/dpri" :
                        tmpFilter.orY("backlog_delv.block_oe_dpri");
                        tsfil.addY("block_oe_dpri");
                        break;

                    case "oe/dupo" :
                        tmpFilter.orY("backlog_delv.block_oe_dupo");
                        tsfil.addY("block_oe_dupo");
                        break;

                    case "oe/eord" :
                        tmpFilter.orY("backlog_delv.block_oe_eord");
                        tsfil.addY("block_oe_eord");
                        break;

                    case "oe/fulcr" :
                        tmpFilter.orY("backlog_delv.block_oe_fulcr");
                        tsfil.addY("block_oe_fulcr");
                        break;

                    case "oe/leas" :
                        tmpFilter.orY("backlog_delv.block_oe_leas");
                        tsfil.addY("block_oe_leas");
                        break;

                    case "oe/lic" :
                        tmpFilter.orY("backlog_delv.block_oe_lic");
                        tsfil.addY("block_oe_lic");
                        break;

                    case "oe/man" :
                        tmpFilter.orY("backlog_delv.block_oe_man");
                        tsfil.addY("block_oe_man");
                        break;

                    case "oe/ois" :
                        tmpFilter.orY("backlog_delv.block_oe_ois");
                        tsfil.addY("block_oe_ois");
                        break;

                    case "oe/oee" :
                        tmpFilter.orY("backlog_delv.block_oe_oee");
                        tsfil.addY("block_oe_oee");
                        break;

                    case "oe/pay" :
                        tmpFilter.orY("backlog_delv.block_oe_pay");
                        tsfil.addY("block_oe_pay");
                        break;

                    case "oe/res" :
                        tmpFilter.orY("backlog_delv.block_oe_res");
                        tsfil.addY("block_oe_res");
                        break;

                    case "oe/so" :
                        tmpFilter.orY("backlog_delv.block_oe_so");
                        tsfil.addY("block_oe_so");
                        break;

                    case "oe/serv" :
                        tmpFilter.orY("backlog_delv.block_oe_serv");
                        tsfil.addY("block_oe_serv");
                        break;

                    case "oe/ship" :
                        tmpFilter.orY("backlog_delv.block_oe_ship");
                        tsfil.addY("block_oe_ship");
                        break;

                    case "oe/shto" :
                        tmpFilter.orY("backlog_delv.block_oe_shto");
                        tsfil.addY("block_oe_shto");
                        break;

                    case "oe/skel" :
                        tmpFilter.orY("backlog_delv.block_oe_skel");
                        tsfil.addY("block_oe_skel");
                        break;

                    case "oe/supp" :
                        tmpFilter.orY("backlog_delv.block_oe_supp");
                        tsfil.addY("block_oe_supp");
                        break;

                    case "oe/vdps" :
                        tmpFilter.orY("backlog_delv.block_oe_vdps");
                        tsfil.addY("block_oe_vdps");
                        break;

                    case "ff/cfg" :
                        tmpFilter.orY("backlog_delv.block_ff_cfg");
                        tsfil.addY("block_ff_cfg");
                        break;

                    case "ff/doc" :
                        tmpFilter.orY("backlog_delv.block_ff_doc");
                        tsfil.addY("block_ff_doc");
                        break;

                    case "ff/mat" :
                        tmpFilter.orY("backlog_delv.block_ff_mat");
                        tsfil.addY("block_ff_mat");
                        break;

                    case "ff/can" :
                        tmpFilter.orY("backlog_delv.block_ff_can");
                        tsfil.addY("block_ff_can");
                        break;

                    case "ff/chg" :
                        tmpFilter.orY("backlog_delv.block_ff_chg");
                        tsfil.addY("block_ff_chg");
                        break;

                    case "ff/cons" :
                        tmpFilter.orY("backlog_delv.block_ff_cons");
                        tsfil.addY("block_ff_mer");
                        break;

                    case "ff/oth" :
                        tmpFilter.orY("backlog_delv.block_ff_oth");
                        tsfil.addY("block_ff_oth");
                        break;

                    case "ff/alli" :
                        tmpFilter.orY("backlog_delv.block_ff_alli");
                        tsfil.addY("block_ff_alli");
                        break;

                    case "ff/alloc" :
                        tmpFilter.orY("backlog_delv.block_ff_alloc");
                        tsfil.addY("block_ff_alloc");
                        break;

                    case "ff/cred" :
                        tmpFilter.orY("backlog_delv.block_ff_cred");
                        tsfil.addY("block_ff_cred");
                        break;

                    case "ff/esc1" :
                        tmpFilter.orY("backlog_delv.block_ff_esc1");
                        tsfil.addY("block_ff_esc1");
                        break;

                    case "ff/esc2" :
                        tmpFilter.orY("backlog_delv.block_ff_esc2");
                        tsfil.addY("block_ff_esc2");
                        break;

                    case "ff/esc3" :
                        tmpFilter.orY("backlog_delv.block_ff_esc3");
                        tsfil.addY("block_ff_esc3");
                        break;

                    case "ff/fact" :
                        tmpFilter.orY("backlog_delv.block_ff_fact");
                        tsfil.addY("block_ff_fact");
                        break;

                    case "ff/exp" :
                        tmpFilter.orY("backlog_delv.block_ff_exp");
                        tsfil.addY("block_ff_exp");
                        break;

                    case "ff/npi" :
                        tmpFilter.orY("backlog_delv.block_ff_npi");
                        tsfil.addY("block_ff_npi");
                        break;

                    case "ff/obs" :
                        tmpFilter.orY("backlog_delv.block_ff_obs");
                        tsfil.addY("block_ff_obs");
                        break;

                    case "ff/plant" :
                        tmpFilter.orY("backlog_delv.block_ff_plant");
                        tsfil.addY("block_ff_plant");
                        break;

                    case "ff/prod" :
                        tmpFilter.orY("backlog_delv.block_ff_prod");
                        tsfil.addY("block_ff_prod");
                        break;

                    case "ff/shipm" :
                        tmpFilter.orY("backlog_delv.block_ff_shipm");
                        tsfil.addY("block_ff_shipm");
                        break;

                    case "ff/tba" :
                        tmpFilter.orY("backlog_delv.block_ff_tba");
                        tsfil.addY("block_ff_tba");
                        break;

                    case "ship" :
                        tmpFilter.orY("backlog_delv.block_ship");
                        tsfil.addY("block_ship");
                        break;

                    case "ship/tra" :
                        tmpFilter.orY("backlog_delv.block_ship_tra");
                        tsfil.addY("block_ship_tra");
                        break;

                    case "ship/mer" :
                        tmpFilter.orY("backlog_delv.block_ship_mer");
                        tsfil.addY("block_ship_mer");
                        break;

                    case "ship/sch" :
                        tmpFilter.orY("backlog_delv.block_ship_sch");
                        tsfil.addY("block_ship_sch");
                        break;

                    case "ship/fo" :
                        tmpFilter.orY("backlog_delv.block_ship_fo");
                        tsfil.addY("block_ship_fo");
                        break;

                    case "bill" :
                        tmpFilter.orY("backlog_delv.block_bill");
                        tsfil.addY("block_bill");
                        break;

                    case "bill/inv" :
                        tmpFilter.orY("backlog_delv.block_bill_inv");
                        tsfil.addY("block_bill_inv");
                        break;

                    case "bill/part" :
                        tmpFilter.orY("backlog_delv.block_bill_part");
                        tsfil.addY("block_bill_part");
                        break;

                    case "fo/sap" :
                        tmpFilter.orY("backlog_delv.block_fo_sap");
                        tsfil.addY("block_fo_sap");
                        break;

                    case "fo/ois" :
                        tmpFilter.orY("backlog_delv.block_fo_ois");
                        tsfil.addY("block_fo_ois");
                        break;

                    case "st/awcf" :
                        tmpFilter.orY("backlog_delv.block_st_awcf");
                        tsfil.addY("block_st_awcf");
                        break;

                    case "st/awcr" :
                        tmpFilter.orY("backlog_delv.block_st_awcr");
                        tsfil.addY("block_st_awcr");
                        break;
                    case "st/awrp" :
                        tmpFilter.orY("backlog_delv.block_st_awrp");
                        tsfil.addY("block_st_awrp");
                        break;

                    case "st/ffw" :
                        tmpFilter.orY("backlog_delv.block_st_ffw");
                        tsfil.addY("block_st_ffw");
                        break;

                    case "st/oew" :
                        tmpFilter.orY("backlog_delv.block_st_oew");
                        tsfil.addY("block_st_oew");
                        break;

                    case "st/shw" :
                        tmpFilter.orY("backlog_delv.block_st_shw");
                        tsfil.addY("block_st_shw");
                        break;

                    case "can" :
                        tmpFilter.orY("backlog_delv.block_can");
                        tsfil.addY("block_can");
                        break;
                }
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            } else {
                numberQueryToUpper(value, "backlog_hdr.consolidated_stati", filter);
            }

            if (tsfil.where != '') {
                if(tsfilter.where != '') {
                    tsfilter.where += ' and ( '  + tsfil.where + ')';
                } else {
                    tsfilter.where += ' ( ' + tsfil.where + ' )';
                }
            }
    }
}

/*-----------------------------------------------------------------------------
|  getWCC  - returns the value from country table
|
|  @param cb  call back variable
| -----------------------------------------------------------------------------*/

function getWCC(cb) {
    DbPool.OSSDB(function(db) {
        db.execute("select iso_code,hp_code,country_name     \
                      from country     \
          ", [], function(err, result) {
            var wcc = {};
            var hpCode = {};
            if (err) {
                cb(err,null);
            }
            result.forEach(function(row,i) {
                wcc[row.iso_code] = row.hp_code;
                hpCode[row.country_name] = row.hp_code;
            });
            cb(null, wcc,hpCode);
        });
    });
}

/*-----------------------------------------------------------------------------
|  createAdvanceLocationQuery  - construct the where clause for location
|
|  @param id              variable for value selected from list
|  @param value           variable entered by user
|  @param filter          variable for oracle based where clause
|  @param tsfilter        variable for tstore based where clause
|  @param additonalTable  variable for any additional table added
|  @param wcc             variable containing wcc code
|  @param hpCode          variable containing hpcode
|-----------------------------------------------------------------------------*/

function createAdvanceLocationQuery (id, value, filter, tsfilter, additonalTable, wcc, hpCode) {
    switch (id) {
        case 'omRegion' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            var tsfil = new SqlUtils.OrWhereDirect();

            for (var i = 0; i <= value.length-1; i++) {
                switch (value[i]) {
                    case 'AMS' :
                        tmpFilter.orIn ("'AMS','NA','US','CA'", "backlog_hdr.om_region");
                        tsfil.addY("om_region_north_amer");
                        tsfil.addY("om_region_us");
                        tsfil.addY("om_region_ca");
                        break;

                    case 'EMEA' :
                        tmpFilter.orIn ("'EMEA','EU'", "backlog_hdr.om_region");
                        tsfil.addY("om_region_emea");
                        break;

                    case 'LA' :
                        tmpFilter.orIn ("'LA'", "backlog_hdr.om_region");
                        tsfil.addY("om_region_latin_amer");
                        break;

                    case 'APJ' :
                        tmpFilter.orIn ("'APJ','AP'" , "backlog_hdr.om_region");
                        tsfil.addY("om_region_apj");
                        break;

                    case 'US' :
                        tmpFilter.orIn ("'US'", "backlog_hdr.om_region");
                        tsfil.addY("om_region_us");
                        break;

                    case 'CA' :
                        tmpFilter.orIn ("'CA'", "backlog_hdr.om_region");
                        tsfil.addY("om_region_ca");
                        break;

                    default :
                       tmpFilter.orLike (value[i], "backlog_hdr.om_region");
                       var val = value[i].replace(/\*/g,"");
                       val = val.replace(/\?/g,"");
                       val = val.replace(/\%/g,"");

                       tsfil.addY("om_region_unknown");
                       break;
                }
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            if (tsfil.where != '') {
                if(tsfilter.where != '') {
                    tsfilter.where += ' and ( '  + tsfil.where + ')';
                } else {
                    tsfilter.where += ' ( ' + tsfil.where + ' )';
                }
            }
            break;

        case 'shipToISO' :
            var tsfil = new SqlUtils.OrWhereDirect();
            for (var i = 0; i <= value.length-1; i++) {
                if (i > 0) {
                    newWcc = newWcc + "," + "'" + value[i]+ "'";
                } else {
                    newWcc = "'" + value[i] + "'";
                }
            }

            if (filter.where != '' ) {
                filter.and = " and "
            }

            filter.addIn ( newWcc, "backlog_ship.ship_to_wcc");
            tsfil.ORIn(newWcc, "ship_to_wcc1");
            tsfil.ORIn(newWcc, "ship_to_wcc2");
            tsfil.ORIn(newWcc, "ship_to_wcc3");

            if (tsfil.where != '') {
                if(tsfilter.where != '') {
                    tsfilter.where += ' and ( '  + tsfil.where + ')';
                } else {
                    tsfilter.where += ' ( ' + tsfil.where + ' )';
                }
            }
            break;

        case 'shipToRegion' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            var tsfil = new SqlUtils.OrWhereDirect();

            Object.keys(value).forEach(function(key,i) {
                v = formatValues(key, 0, 0, 1);

                val = value[key].join(",");
                region = formatValues(val, 0, 0, 1);
                state = region.split(",");

                for (var k=0; k <= state.length-1; k++) {
                    regions = state[k].split("|");
                    for (var j=0; j <= regions.length-1; j++) {
                        if (k > 0) {
                            newRegion = newRegion + "," + "'" + regions[j]+ "'";
                        } else {
                            newRegion = "'" + regions[j] + "'";
                        }
                    }
                }

                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.orIn (newRegion , "backlog_delv.ship_to_region");
                tmpFilter.where += ' and (backlog_delv.ship_to_wcc in ( select hp_code \
                                                                          from country \
                                                                         where country_name = \'' + key + '\')) ' ;
                tmpFilter.where += ')';
                tmpFilter.or ='';
                if (tsfil.where != '')  {
                    tsfil.where += " or ( (" ;
                } else {
                    tsfil.where += " ( (" ;
                }
                tsfil.ORIn(newRegion, "ship_to_region1");
                tsfil.ORIn(newRegion, "ship_to_region2");
                tsfil.where += ")" ;
                tsfil.or ='';
                if (tsfil.where != '')  {
                    tsfil.where += " and (" ;
                } else {
                    tsfil.where += " (" ;
                }
                tsfil.ORIn('\''+hpCode[key] + '\'', "ship_to_wcc1");
                tsfil.ORIn('\''+hpCode[key] + '\'', "ship_to_wcc2");
                tsfil.ORIn('\''+hpCode[key] + '\'', "ship_to_wcc3");
                tsfil.where += ") )" ;
                tsfil.or ='';
            });

            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            if (tsfil.where != '') {
                if(tsfilter.where != '') {
                    tsfilter.where += ' and ( '  + tsfil.where + ')';
                } else {
                    tsfilter.where += ' ( ' + tsfil.where + ' )';
                }
            }
            break;
    }

}

/*-----------------------------------------------------------------------------
|  formatPrice  - returns the formated price
|
|  @param price     variable
|-----------------------------------------------------------------------------*/

function formatPrice (price,option) {
    if (option == 'commaDot') {
        var n = price.match(/^[0-9]+\.[0-9]+$/);

        if (n == null) {
            price += ".0";
        }
        price = price.replace(/\,/g,"");
        return price;
    } else {
        price = price.replace(/\,/g,"#");
        price = price.replace(/\./g,",");
        price = price.replace(/\#/g,".");
        if ( !(price.match(/^[0-9]+\.[0-9]+$/)) && !(price.match(/^[0-9]+\.$/)) ) {
            price += ".0";
        }
        price = price.replace(/\,/g,"");
        return price;
    }
}

/*-----------------------------------------------------------------------------
|  createAdvanceOrderAmountQuery  - construct the where clause for location
|
|  @param id              variable for value selected from list
|  @param value           variable entered by user
|  @param filter          variable for oracle based where clause
|  @param tsfilter        variable for tstore based where clause
|  @param additonalTable  variable for any additional table added
|-----------------------------------------------------------------------------*/

function createAdvanceOrderAmountQuery (id, value, filter, tsfilter, additonalTable) {
    switch (id) {
        case 'totalPriceExactWithCommaDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalPriceExactWithDotComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalPriceApproxWithComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;
                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.total_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.total_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalPriceApproxWithDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;
                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.total_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.total_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalPriceLsEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalPriceLsEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalPriceGrEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalPriceGrEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceExactWithCommaDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.total_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceExactWithDotComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.total_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceApproxWithComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;

                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.total_net_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.total_net_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceApproxWithDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;

                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.total_net_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.total_net_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceLsEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.total_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceLsEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.total_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceGrEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.total_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'totalNetPriceGrEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.total_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceExactWithCommaDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.dlr_total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceExactWithDotComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.dlr_total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceApproxWithComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;
                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.dlr_total_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.dlr_total_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceApproxWithDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;

                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.dlr_total_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.dlr_total_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceLsEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceLsEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceGrEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotalPriceGrEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_total_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceExactWithCommaDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.dlr_tot_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceExactWithDotComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.orEq (totalPriceFilterTextBox, "backlog_hdr.dlr_tot_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceApproxWithComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;

                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.dlr_tot_net_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.dlr_tot_net_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceApproxWithDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                var approxWindow = 0.2 * totalPriceFilterTextBox ;
                var upWindow  =   (+totalPriceFilterTextBox) + (+approxWindow);
                var downWindow  = totalPriceFilterTextBox - approxWindow ;

                if (tmpFilter.where != '')  {
                    tmpFilter.where += " or (" ;
                } else {
                    tmpFilter.where += " (" ;
                }
                tmpFilter.addGreaterThan (downWindow, "backlog_hdr.dlr_tot_net_price");
                tmpFilter.addLessThan (upWindow, "backlog_hdr.dlr_tot_net_price");
                tmpFilter.where += " )" ;
                tmpFilter.and = '';
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceLsEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_tot_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceLsEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addLessThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_tot_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceGrEqComma' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'commaDot');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_tot_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;

        case 'dlrTotNetPriceGrEqDot' :
            var tmpFilter = new SqlUtils.AndWhere();
            tmpFilter.binds = filter.binds;
            tmpFilter.bindNo = filter.bindNo;
            for (var i = 0; i <= value.length-1; i++) {
                var totalPriceFilterTextBox = formatPrice(value[i], 'dotComma');
                tmpFilter.addGreaterThanEq (totalPriceFilterTextBox, "backlog_hdr.dlr_tot_net_price");
            }
            if (tmpFilter.where != '') {
                if(filter.where != '') {
                   filter.bindNo = tmpFilter.bindNo;
                   filter.where += ' and (' + tmpFilter.where + ')';
                } else {
                    filter.where += ' ( '+ tmpFilter.where + ' )';
                    filter.bindNo = tmpFilter.bindNo;
                }
            }
            break;
    }
}

module.exports.init = function(app) {
   additonalTable = "";
    /*----------------------------------------------------------------------------
    |   Internal OrderSummary Webservice.
    \---------------------------------------------------------------------------*/
    app.post('/ossui/v1/in/ordersummary', app.role(AuthGroupSandyUser), function(req, res) {

        //----------------------------------------------------------------------
        //   prepare ORACLE based filter and TSTORE based filter
        //----------------------------------------------------------------------
        var filter = new SqlUtils.AndWhere();
        var tsfilter = new SqlUtils.AndWhereDirect();

        var additionalwhereClause = '';
        additonalTable = "";

        getWCC(function(err, wcc, hpCode) {
            var result = JSON.parse(JSON.stringify(req.body));

            if (result.hpOrderNo != undefined && result.hpOrderNo != ""){
                var val = (result.hpOrderNo).replace(/\*/g,"%");
                val = formatValues(val, 0, 0, 1);
                filter.addLike  (val,   "backlog_hdr.order_no");
                tsfilter.addIStartsWith (val,  "order_no"  );
            }
            if (result.custPoNo != undefined && result.custPoNo != ""){
                var val = (result.custPoNo).replace(/\*/g,"%");
                val = formatValues(val, 0, 0, 1);
                filter.addLike  (val,   "backlog_hdr.purchase_order_no");
                tsfilter.addIStartsWith (val,   "purchase_order_no");
            }
            if (result.soNo != undefined && result.soNo != ""){
                var val = (result.soNo).replace(/\*/g,"%");
                val = formatValues(val, 0, 0, 1);
                filter.addLike  (val,   "lso.so_no");
                additonalTable += ", l_so_no lso";
                additionalwhereClause += " and (backlog_hdr.legacy_order_no = lso.legacy_order_no)"
                tsfilter.addIStartsWith (val,   "hdr_so_no");
            }
            if (result.csr != undefined && result.csr != ""){
                var val = (result.csr).replace(/\*/g,"%");
                val = formatValues(val, 0, 0, 1);
                filter.addLike  (val,   "lcsr.sales_coord");
                additonalTable += ", l_csr lcsr";
                additionalwhereClause += " and (backlog_hdr.legacy_order_no = lcsr.legacy_order_no)"
                tsfilter.addIStartsWith (val,   "sales_coord");
            }
            if (result.custName != undefined && result.custName != "") {
                var val = (result.custName).replace(/\*/g,"%");
                filter.addIStartsWith (val,   "backlog_hdr.customer_name" );
                tsfilter.addIStartsWith (val,   "customer_name" );
            }
            if (result.custId != undefined && result.custId != "") {
               var val = (result.custId).replace(/\*/g,"%");
               val = formatValues(val, 0, 0, 1);
               filter.addLike   (val,     "backlog_hdr.customer_no" );
               tsfilter.addIStartsWith (val,     "customer_no" );
            }
            if (result.shipmentNo != undefined && result.shipmentNo != "") {
                var val = (result.shipmentNo).replace(/\*/g,"%");
                val = formatValues(val, 0, 0, 1)
                filter.addLike   (val,     "backlog_delv.shipment_no" );
            }
            if (result.poDateFrom != undefined && result.poDateFrom != "") {
               filter.addGtEq   (result.poDateFrom,     "backlog_hdr.purch_order_date" );
               tsfilter.addDateGtEq    (result.poDateFrom, "purch_order_date" );
            }
            if (result.poDateTo != undefined && result.poDateTo != "") {
               filter.addLtEq   (result.poDateTo,     "backlog_hdr.purch_order_date" );
               tsfilter.addDateLtEq    (result.poDateTo,   "purch_order_date" );
            }
            if (result.invoiceNo != undefined && result.invoiceNo != "") {
                var val = (result.invoiceNo).replace(/\*/g,"%");
                val = formatValues(val, 0, 0, 1);
                filter.addLike   (val,     "backlog_delv.invoice_no" );
            }
            if (result.recentOrders != undefined && result.recentOrders != "") {
               filter.addBetween  (result.recentOrders,     "backlog_hdr.purch_order_date" );
               tsfilter.addDateBetween (result.recentOrders,       "purch_order_date" );
            }
            if (result.status != undefined && result.status != "") {
                createStatusQuery(result.status, filter, tsfilter);
            }
            if (result.type != undefined && result.type != "") {
                createAdvanceOrderTypeQuery(result.type, filter, tsfilter);
            }
            if (result.origin != undefined && result.origin != "") {
                createAdvanceOriginQuery(result.origin, filter, tsfilter);
            }
            if (result.repository != undefined && result.repository != "") {
                createAdvanceRepositoryQuery(result.repository, filter, tsfilter);
            }
            if (result.group != undefined && result.group != "") {
                createAdvanceGroupQuery(result.group, filter, tsfilter);
            }
            // search by Numbers
            if (result.searchByNumber != undefined && result.searchByNumber != "") {
                if(result.searchByNumber.web_order_no != undefined && result.searchByNumber.web_order_no != "") {
                    id = 'webOrderNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.web_order_no, filter, tsfilter);
                }
                if(result.searchByNumber.asset_tag != undefined && result.searchByNumber.asset_tag != "") {
                    id = 'assetTag';
                    createAdvanceNumberQuery(id, result.searchByNumber.asset_tag, filter, tsfilter);
                }
                if(result.searchByNumber.b2bid != undefined && result.searchByNumber.b2bid != "") {
                    id = 'b2bid';
                    createAdvanceNumberQuery(id, result.searchByNumber.b2bid, filter);
                }
                if(result.searchByNumber.eop_id != undefined && result.searchByNumber.eop_id != "") {
                    id = 'eopId';
                    createAdvanceNumberQuery(id, result.searchByNumber.eop_id, filter, tsfilter);
                }
                if(result.searchByNumber.cust_fam_no != undefined && result.searchByNumber.cust_fam_no != "") {
                    id = 'famNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.cust_fam_no, filter, tsfilter);
                }
                if(result.searchByNumber.csn != undefined && result.searchByNumber.csn != "") {
                    id = 'csn';
                    createAdvanceNumberQuery(id, result.searchByNumber.csn, filter, tsfilter);
                }
                if(result.searchByNumber.cust_no != undefined && result.searchByNumber.cust_no != "") {
                    id = 'custNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.cust_no, filter, tsfilter);
                }
                if(result.searchByNumber.eclaim_no != undefined && result.searchByNumber.eclaim_no != "") {
                    id = 'eclaimNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.eclaim_no, filter, tsfilter);
                }
                if(result.searchByNumber.fsn != undefined && result.searchByNumber.fsn != "") {
                    id = 'fsn';
                    createAdvanceNumberQuery(id, result.searchByNumber.fsn, filter, tsfilter);
                }
                if(result.searchByNumber.ivn != undefined && result.searchByNumber.ivn != "") {
                    id = 'ivn';
                    createAdvanceNumberQuery(id, result.searchByNumber.ivn, filter, tsfilter);
                }
                if(result.searchByNumber.mac_addr != undefined && result.searchByNumber.mac_addr != "") {
                    id = 'macAddr';
                    createAdvanceNumberQuery(id, result.searchByNumber.mac_addr, filter, tsfilter);
                }
                if(result.searchByNumber.ncrf_no != undefined && result.searchByNumber.ncrf_no != "") {
                    id = 'ncrfNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.ncrf_no, filter, tsfilter);
                }
                if(result.searchByNumber.purch_agree != undefined && result.searchByNumber.purch_agree != "") {
                    id = 'purchAgree';
                    createAdvanceNumberQuery(id, result.searchByNumber.purch_agree, filter, tsfilter);
                }
                if(result.searchByNumber.hp_quote_no != undefined && result.searchByNumber.hp_quote_no != "") {
                    id = 'quoteNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.hp_quote_no, filter, tsfilter);
                }
                if(result.searchByNumber.sal_number != undefined && result.searchByNumber.sal_number != "") {
                    id = 'salNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.sal_number, filter, tsfilter);
                }
                if(result.searchByNumber.serial_no != undefined && result.searchByNumber.serial_no != "") {
                    id = 'serialNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.serial_no, filter, tsfilter);
                }
                if(result.searchByNumber.imei != undefined && result.searchByNumber.imei != "") {
                    id = 'imei';
                    createAdvanceNumberQuery(id, result.searchByNumber.imei, filter, tsfilter);
                }
                if(result.searchByNumber.gvt_contract_number != undefined && result.searchByNumber.gvt_contract_number != "") {
                    id = 'gvtContractNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.gvt_contract_number, filter, tsfilter);
                }
                if(result.searchByNumber.wawf_number != undefined && result.searchByNumber.wawf_number != "") {
                    id = 'wawfNo';
                    createAdvanceNumberQuery(id, result.searchByNumber.wawf_number, filter, tsfilter);
                }
                if(result.searchByNumber.account_name != undefined && result.searchByNumber.account_name != "") {
                    id = 'accountName';
                    createAdvanceNumberQuery(id, result.searchByNumber.account_name, filter, tsfilter);
                }
                if(result.searchByNumber.leg_ord_type != undefined && result.searchByNumber.leg_ord_type != "") {
                    id = 'legOrdType';
                    createAdvanceNumberQuery(id, result.searchByNumber.leg_ord_type, filter, tsfilter);
                }
                if(result.searchByNumber.mci != undefined && result.searchByNumber.mci != "") {
                    id = 'mci';
                    createAdvanceNumberQuery(id, result.searchByNumber.mci, filter, tsfilter);
                }
                if(result.searchByNumber.opportunity_id != undefined && result.searchByNumber.opportunity_id != "") {
                    id = 'opportunityId';
                    createAdvanceNumberQuery(id, result.searchByNumber.opportunity_id, filter, tsfilter);
                }
                if(result.searchByNumber.rebate_request_id != undefined && result.searchByNumber.rebate_request_id != "") {
                    id = 'rebateRequestId';
                    createAdvanceNumberQuery(id, result.searchByNumber.rebate_request_id, filter, tsfilter);
                }
            }
            // search by codes
            if (result.searchByCode != undefined && result.searchByCode != "") {
                if(result.searchByCode.CDCode != undefined && result.searchByCode.CDCode != "") {
                    id = 'cd';
                    createAdvanceCodeQuery(id, result.searchByCode.CDCode, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.DealPriceID != undefined && result.searchByCode.DealPriceID != "") {
                    id = 'dealId';
                    additonalTable = createAdvanceCodeQuery(id, result.searchByCode.DealPriceID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.DCCode != undefined && result.searchByCode.DCCode != "") {
                    id = 'dc';
                    createAdvanceCodeQuery(id, result.searchByCode.DCCode, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.EID != undefined && result.searchByCode.EID != "") {
                    id = 'eid';
                    createAdvanceCodeQuery(id, result.searchByCode.EID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.SalesOrg != undefined && result.searchByCode.SalesOrg != "") {
                    id = 'salesorg';
                    createAdvanceCodeQuery(id, result.searchByCode.SalesOrg, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.TeamID != undefined && result.searchByCode.TeamID != "") {
                    id = 'teamId';
                    createAdvanceCodeQuery(id, result.searchByCode.TeamID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.ProductLines != undefined && result.searchByCode.ProductLines != "") {
                    id = 'prodLines';
                    createAdvanceCodeQuery(id, result.searchByCode.ProductLines, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.SalesRep != undefined && result.searchByCode.SalesRep != "") {
                    id = 'salesRep';
                    createAdvanceCodeQuery(id, result.searchByCode.SalesRep, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.SpecialCodes != undefined && result.searchByCode.SpecialCodes != "") {
                    id = 'specialCodes';
                    createAdvanceCodeQuery(id, result.searchByCode.SpecialCodes, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.SupplierOrigSO != undefined && result.searchByCode.SupplierOrigSO != "") {
                    id = 'supp';
                    createAdvanceCodeQuery(id, result.searchByCode.SupplierOrigSO, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.SupplierMfgSO != undefined && result.searchByCode.SupplierMfgSO != "") {
                    id = 'suppMfg';
                    createAdvanceCodeQuery(id, result.searchByCode.SupplierMfgSO, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.SiebelAgentID != undefined && result.searchByCode.SiebelAgentID != "") {
                    id = 'siebelAgentId';
                    createAdvanceCodeQuery(id, result.searchByCode.SiebelAgentID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.OPGCode != undefined && result.searchByCode.OPGCode != "") {
                    id = 'opgCode';
                    createAdvanceCodeQuery(id, result.searchByCode.OPGCode, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.SoldToID != undefined && result.searchByCode.SoldToID != "") {
                    id = 'soldtoId';
                    createAdvanceCodeQuery(id, result.searchByCode.SoldToID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.InvoiceToID != undefined && result.searchByCode.InvoiceToID != "") {
                    id = 'invoicetoId';
                    createAdvanceCodeQuery(id, result.searchByCode.InvoiceToID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.ShipToID != undefined && result.searchByCode.ShipToID != "") {
                    id = 'shiptoId';
                    createAdvanceCodeQuery(id, result.searchByCode.ShipToID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.shipto_region != undefined && result.searchByCode.shipto_region != "") {
                    id = 'shiptoRegion';
                    createAdvanceCodeQuery(id, result.searchByCode.shipto_region, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.ShipToZip != undefined && result.searchByCode.ShipToZip != "") {
                    id = 'shiptoZip';
                    createAdvanceCodeQuery(id, result.searchByCode.ShipToZip, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.om_region != undefined && result.searchByCode.om_region != "") {
                    id = 'omRegion';
                    createAdvanceCodeQuery(id, result.searchByCode.om_region, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.CampaignCode != undefined && result.searchByCode.CampaignCode != "") {
                    id = 'campaignCode';
                    createAdvanceCodeQuery(id, result.searchByCode.CampaignCode, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.FunnelID != undefined && result.searchByCode.FunnelID != "") {
                    id = 'funnelId';
                    createAdvanceCodeQuery(id, result.searchByCode.FunnelID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.CatalogID != undefined && result.searchByCode.CatalogID != "") {
                    id = 'catalogId';
                    createAdvanceCodeQuery(id, result.searchByCode.CatalogID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.DistribChannel != undefined && result.searchByCode.DistribChannel != "") {
                    id = 'distChannel';
                    createAdvanceCodeQuery(id, result.searchByCode.DistribChannel, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.CommercialityCode != undefined && result.searchByCode.CommercialityCode != "") {
                    id = 'commercialityCode';
                    createAdvanceCodeQuery(id, result.searchByCode.CommercialityCode, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.PaymentMethod != undefined && result.searchByCode.PaymentMethod != "") {
                    id = 'paymentMethod';
                    createAdvanceCodeQuery(id, result.searchByCode.PaymentMethod, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.CommunityID != undefined && result.searchByCode.CommunityID != "") {
                    id = 'communityId';
                    createAdvanceCodeQuery(id, result.searchByCode.CommunityID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.TelewebAgentID != undefined && result.searchByCode.TelewebAgentID != "") {
                    id = 'telewAgentId';
                    createAdvanceCodeQuery(id, result.searchByCode.TelewebAgentID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.LogisticServiceProviderID != undefined && result.searchByCode.LogisticServiceProviderID != "") {
                    id = 'lspIdentiferId';
                    createAdvanceCodeQuery(id, result.searchByCode.LogisticServiceProviderID, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.PlantOrigSO != undefined && result.searchByCode.PlantOrigSO != "") {
                    id = 'plantCode';
                    createAdvanceCodeQuery(id, result.searchByCode.PlantOrigSO, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.PlantMfgSO != undefined && result.searchByCode.PlantMfgSO != "") {
                    id = 'plantCodeMfg';
                    createAdvanceCodeQuery(id, result.searchByCode.PlantMfgSO, filter, tsfilter, additonalTable);
                }
                if(result.searchByCode.IdCode != undefined && result.searchByCode.IdCode != "") {
                    id = 'idCode';
                    additonalTable = createAdvanceCodeQuery(id, result.searchByCode.IdCode, filter, tsfilter, additonalTable);
                }
            }
            // search by Dates
            if (result.SearchByDates != undefined && result.SearchByDates != "") {
                if(result.SearchByDates.orderDate != undefined && result.SearchByDates.orderDate != "") {
                    if(result.SearchByDates.orderDate.from != undefined && result.SearchByDates.orderDate.from != "") {
                        id = 'orderDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.orderDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.orderDate.to != undefined && result.SearchByDates.orderDate.to != "") {
                        id = 'orderDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.orderDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.hprecieve != undefined && result.SearchByDates.hprecieve != "") {
                    if(result.SearchByDates.hprecieve.from != undefined && result.SearchByDates.hprecieve.from != "") {
                        id = 'hprecieveFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.hprecieve.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.hprecieve.to != undefined && result.SearchByDates.hprecieve.to != "") {
                        id = 'hprecieveTo';
                        createAdvanceDateQuery(id, result.SearchByDates.hprecieve.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.factshipDate != undefined && result.SearchByDates.factshipDate != "") {
                    if(result.SearchByDates.factshipDate.from != undefined && result.SearchByDates.factshipDate.from != "") {
                        id = 'factshipDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.factshipDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.factshipDate.to != undefined && result.SearchByDates.factshipDate.to != "") {
                        id = 'factshipDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.factshipDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.custshipDate != undefined && result.SearchByDates.custshipDate != "") {
                    if(result.SearchByDates.custshipDate.from != undefined && result.SearchByDates.custshipDate.from != "") {
                        id = 'custshipDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.custshipDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.custshipDate.to != undefined && result.SearchByDates.custshipDate.to != "") {
                        id = 'custshipDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.custshipDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.eadDate != undefined && result.SearchByDates.eadDate != "") {
                    if(result.SearchByDates.eadDate.from != undefined && result.SearchByDates.eadDate.from != "") {
                        id = 'eadDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.eadDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.eadDate.to != undefined && result.SearchByDates.eadDate.to != "") {
                        id = 'eadDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.eadDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.sddDate != undefined && result.SearchByDates.sddDate != "") {
                    if(result.SearchByDates.sddDate.from != undefined && result.SearchByDates.sddDate.from != "") {
                        id = 'sddDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.sddDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.sddDate.to != undefined && result.SearchByDates.sddDate.to != "") {
                        id = 'sddDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.sddDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.podDate != undefined && result.SearchByDates.podDate != "") {
                    if(result.SearchByDates.podDate.from != undefined && result.SearchByDates.podDate.from != "") {
                        id = 'podDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.podDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.podDate.to != undefined && result.SearchByDates.podDate.to != "") {
                        id = 'podDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.podDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.invoDate != undefined && result.SearchByDates.invoDate != "") {
                    if(result.SearchByDates.invoDate.from != undefined && result.SearchByDates.invoDate.from != "") {
                        id = 'invoDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.invoDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.invoDate.to != undefined && result.SearchByDates.invoDate.to != "") {
                        id = 'invoDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.invoDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.quoteDate != undefined && result.SearchByDates.quoteDate != "") {
                    if(result.SearchByDates.quoteDate.from != undefined && result.SearchByDates.quoteDate.from != "") {
                        id = 'quoteDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.quoteDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.quoteDate.to != undefined && result.SearchByDates.quoteDate.to != "") {
                        id = 'quoteDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.quoteDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.webordDate != undefined && result.SearchByDates.webordDate != "") {
                    if(result.SearchByDates.webordDate.from != undefined && result.SearchByDates.webordDate.from != "") {
                        id = 'webordDateFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.webordDate.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.orderDate.to != undefined && result.SearchByDates.orderDate.to != "") {
                        id = 'webordDateTo';
                        createAdvanceDateQuery(id, result.SearchByDates.webordDate.to, filter, tsfilter, additonalTable);
                    }
                }
                if(result.SearchByDates.changedSince != undefined && result.SearchByDates.changedSince != "") {
                    if(result.SearchByDates.changedSince.from != undefined && result.SearchByDates.changedSince.from != "") {
                        id = 'changedSinceFrom';
                        createAdvanceDateQuery(id, result.SearchByDates.changedSince.from, filter, tsfilter, additonalTable);
                    }
                    if(result.SearchByDates.changedSince.to != undefined && result.SearchByDates.changedSince.to != "") {
                        id = 'changedSinceTo';
                        createAdvanceDateQuery(id, result.SearchByDates.changedSince.to, filter, tsfilter, additonalTable);
                    }
                }
            }
            //search by Statuses
            if (result.SearchByStatuses != undefined && result.SearchByStatuses != "") {
                if(result.SearchByStatuses.Sapuserstatus != undefined && result.SearchByStatuses.Sapuserstatus != "") {
                     id = 'userStati';
                    createAdvanceStatusesQuery(id, result.SearchByStatuses.Sapuserstatus, filter, tsfilter, additonalTable);
                }
                if(result.SearchByStatuses.UserStatusCategory != undefined && result.SearchByStatuses.UserStatusCategory != "") {
                     id = 'holdCat';
                    createAdvanceStatusesQuery(id, result.SearchByStatuses.UserStatusCategory, filter, tsfilter, additonalTable);
                }
            }
            //Search by Location type
            if (result.SearchByLocationType != undefined && result.SearchByLocationType != "") {

                    if(result.SearchByLocationType.OMRegion != undefined && result.SearchByLocationType.OMRegion != "") {
                        id = 'omRegion';
                        createAdvanceLocationQuery(id, result.SearchByLocationType.OMRegion, filter, tsfilter, additonalTable,'','');
                    }
                    if(result.SearchByLocationType.ShipToCountry != undefined && result.SearchByLocationType.ShipToCountry != "") {
                        id = 'shipToISO';
                        createAdvanceLocationQuery(id, result.SearchByLocationType.ShipToCountry, filter, tsfilter, additonalTable,wcc,hpCode);
                    }
                    if(result.SearchByLocationType.ShipToRegion != undefined && result.SearchByLocationType.ShipToRegion != "") {
                        id = 'shipToRegion';
                        createAdvanceLocationQuery(id, result.SearchByLocationType.ShipToRegion, filter, tsfilter, additonalTable,wcc,hpCode);
                    }

            }
            //Search by total order Amount
            if (result.SearchTotalOrderAmount != undefined && result.SearchTotalOrderAmount != "") {
                if (result.SearchTotalOrderAmount.TotalAmountInclTax != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax != "") {
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.exact_with_comma_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.exact_with_comma_dot != "") {
                        id = 'totalPriceExactWithCommaDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.exact_with_comma_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.exact_with_dot_comma != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.exact_with_dot_comma != "") {
                        id = 'totalPriceExactWithDotComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.exact_with_dot_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.approx_with_comma != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.approx_with_comma != "") {
                        id = 'totalPriceApproxWithComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.approx_with_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.approx_with_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.approx_with_dot != "") {
                        id = 'totalPriceApproxWithDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.approx_with_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.ls_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.ls_eq_comma != "") {
                        id = 'totalPriceLsEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.ls_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.ls_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.ls_eq_dot != "") {
                        id = 'totalPriceLsEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.ls_eq_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.gr_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.gr_eq_comma != "") {
                        id = 'totalPriceGrEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.gr_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTax.gr_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTax.gr_eq_dot != "") {
                        id = 'totalPriceGrEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTax.gr_eq_dot, filter, tsfilter, additonalTable);
                    }
                }
                if (result.SearchTotalOrderAmount.TotalAmountWOTax != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax != "") {
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.exact_with_comma_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.exact_with_comma_dot != "") {
                        id = 'totalNetPriceExactWithCommaDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.exact_with_comma_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.exact_with_dot_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.exact_with_dot_comma != "") {
                        id = 'totalNetPriceExactWithDotComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.exact_with_dot_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.approx_with_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.approx_with_comma != "") {
                        id = 'totalNetPriceApproxWithComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.approx_with_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.approx_with_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.approx_with_dot != "") {
                        id = 'totalNetPriceApproxWithDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.approx_with_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.ls_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.ls_eq_comma != "") {
                        id = 'totalNetPriceLsEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.ls_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.ls_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.ls_eq_dot != "") {
                        id = 'totalNetPriceLsEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.ls_eq_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.gr_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.gr_eq_comma != "") {
                        id = 'totalNetPriceGrEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.gr_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTax.gr_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTax.gr_eq_dot != "") {
                        id = 'totalNetPriceGrEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTax.gr_eq_dot, filter, tsfilter, additonalTable);
                    }
                }
                if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars != "") {
                    if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.exact_with_comma_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.exact_with_comma_dot != "") {
                        id = 'dlrTotalPriceExactWithCommaDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.exact_with_comma_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TTotalAmountInclTaxInUSDollars.exact_with_dot_comma != undefined && result.SearchTotalOrderAmount.TTotalAmountInclTaxInUSDollars.exact_with_dot_comma != "") {
                        id = 'dlrTotalPriceExactWithDotComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.exact_with_dot_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.approx_with_comma != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.approx_with_comma != "") {
                        id = 'dlrTotalPriceApproxWithComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.approx_with_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.approx_with_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.approx_with_dot != "") {
                        id = 'dlrTotalPriceApproxWithDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.approx_with_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.ls_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.ls_eq_comma != "") {
                        id = 'dlrTotalPriceLsEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.ls_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.ls_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.ls_eq_dot != "") {
                        id = 'dlrTotalPriceLsEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.ls_eq_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.gr_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.gr_eq_comma != "") {
                        id = 'dlrTotalPriceGrEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.gr_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.gr_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.gr_eq_dot != "") {
                        id = 'dlrTotalPriceGrEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountInclTaxInUSDollars.gr_eq_dot, filter, tsfilter, additonalTable);
                    }
                }
                 if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars != "") {
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.exact_with_comma_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.exact_with_comma_dot != "") {
                        id = 'dlrTotNetPriceExactWithCommaDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.exact_with_comma_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.exact_with_dot_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.exact_with_dot_comma != "") {
                        id = 'dlrTotNetPriceExactWithDotComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.exact_with_dot_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.approx_with_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.approx_with_comma != "") {
                        id = 'dlrTotNetPriceApproxWithComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.approx_with_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.approx_with_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.approx_with_dot != "") {
                        id = 'dlrTotNetPriceApproxWithDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.approx_with_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.ls_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.ls_eq_comma != "") {
                        id = 'dlrTotNetPriceLsEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.ls_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.ls_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.ls_eq_dot != "") {
                        id = 'dlrTotNetPriceLsEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.ls_eq_dot, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.gr_eq_comma != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.gr_eq_comma != "") {
                        id = 'dlrTotNetPriceGrEqComma' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.gr_eq_comma, filter, tsfilter, additonalTable);
                    }
                    if (result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.gr_eq_dot != undefined && result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.gr_eq_dot != "") {
                        id = 'dlrTotNetPriceGrEqDot' ;
                        createAdvanceOrderAmountQuery(id, result.SearchTotalOrderAmount.TotalAmountWOTaxInUSDollars.gr_eq_dot, filter, tsfilter, additonalTable);
                    }
                }
            }
            if (isItem) {
                filter.where += ' and (backlog_hdr.legacy_order_no = i.legacy_order_no) ';
                additonalTable +=  ", backlog_item i" ;
            }
            if (isIds) {
                filter.where += ' and (backlog_hdr.legacy_order_no = ids.legacy_order_no)';
                additonalTable += ", backlog_ids ids";
            }
            log.info('filter binds' + filter.binds);
            log.info('where clause' + filter.where);

            console.log('TS where clause' + tsfilter.where);

            var maxNum = config.constants['MAX_NUM_ROWS'];

            var ts1 = new Date();
            var tdiff = Date.now() - ts1.getTime();

            OSSTSQueryInt( tsfilter.where , function(tsErr, tsOrders) {
                if (tsErr) {
                    return res.json({
                        status: 'E',
                        message: tsErr,
                        data: ''
                    });
                }

                console.log('tsErr = '    +  tsErr    );
                console.log('tsOrders = ' +  tsOrders );

                tsLength = tsOrders.split(",");
                console.log('tsLength = ' +  tsLength.length );
                if ( tsLength.length > maxNum) {
                    var msg = 'Too many orders found, refine your search';

                    Resp.sendResponse(res, log, 'Too many orders found, refine your search.', msg, '');
                } else {

                    if (tsOrders == '' || tsOrders == undefined) {
                        var where = filter.where + additionalwhereClause  // just plain basic ORACLE
                    } else {
                        var where = '(' + filter.where + additionalwhereClause + ') and ( backlog_hdr.legacy_order_no in ('+tsOrders+') )'
                    }

                    console.log('where = ' +  where );

                    DbPool.OSSDB(function(db) {

                        var  tdiff = Date.now() - ts1.getTime()
                        console.log('DB 1 runtime : ' + tdiff + ' msec' );

                    db.execute("select *                                        \
                                  from (select distinct backlog_hdr.purchase_order_no,   \
                                               backlog_hdr.order_no,            \
                                               CASE                             \
                                                       WHEN backlog_hdr.order_overall_status = 'Processing'  THEN 'Admin / Processing'   \
                                                       WHEN backlog_hdr.order_overall_status = 'Acked' THEN 'Admin / Acked'              \
                                                       WHEN backlog_hdr.order_overall_status = 'FactShipped' THEN 'Shipped from Factory' \
                                                       WHEN backlog_hdr.order_overall_status = 'CustShipped' THEN 'Shipped to Customer'  \
                                                       WHEN backlog_hdr.order_overall_status = 'Shipped' THEN 'Shipped to Customer'      \
                                                       ELSE  backlog_hdr.order_overall_status             \
                                               END as order_overall_status,                            \
                                               to_char(nvl(backlog_hdr.dlr_total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS dlr_total_price,    \
                                               to_char(nvl(backlog_hdr.total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS Total_Order_Value,    \
                                               to_char(nvl(backlog_hdr.total_net_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_net_price,    \
                                               backlog_hdr.currency, \
                                               backlog_hdr.quote_no, \
                                               backlog_hdr.order_type_descr, \
                                               backlog_hdr.purch_order_date, \
                                               backlog_hdr.last_update,      \
                                               backlog_hdr.so_no,            \
                                               backlog_hdr.ship_to_addr_1,   \
                                               backlog_hdr.legacy_order_no,  \
                                               backlog_hdr.quote_creation_date, \
                                               backlog_hdr.hp_receive_date,     \
                                               backlog_hdr.order_load_date,     \
                                               backlog_hdr.clean_order_date,    \
                                               backlog_hdr.order_close_date,    \
                                               backlog_hdr.sold_to_org_id       \
                                                                                \
                                          from backlog_hdr,backlog_ship,      \
                                               backlog_delv LEFT OUTER JOIN delivery    \
                                                                         ON (backlog_delv.shipment_no = delivery.shipmentno) \
                                               " + additonalTable + "                             \
                                         where backlog_hdr.legacy_order_no = backlog_delv.legacy_order_no   \
                                           and backlog_hdr.legacy_order_no = backlog_ship.legacy_order_no   \
                                           and (" + where + ") order by backlog_hdr.order_no )     \
                                 where  rownum <= " + maxNum + "          \
                                 ", filter.binds, function(err, summary) {
                            if (err) {
                                return Resp.sendError(res, log, err);
                            } else {
                                var  tdiff = Date.now() - ts1.getTime()
                                console.log('DB 2 runtime : '+ tdiff + ' msec');

                                var msg = '';
                                if (summary.length == 0) {
                                    msg = 'No Orders found for search criteria';
                                } else if (summary.length >= maxNum) {
                                    msg = 'Search result exceeds more than ' + maxNum +' records Refine your search';
                                }
                                log.info(summary);

                                Resp.sendOrderResponse(res, log, 'Sending back Order Summary.', msg, maxNum,  summary);
                            }
                        });
                    });
                }
            });
    });
    });
}
