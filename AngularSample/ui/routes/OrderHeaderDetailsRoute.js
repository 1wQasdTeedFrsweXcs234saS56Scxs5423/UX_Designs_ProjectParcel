/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/orderheaderdetail
|
|   This webservice will return the order details for the given HP
|   legacy order number or Hp order no. The service will return the
|   below details:
|       1.  Order Header Details
|       2.  Header status codes
|       3.  Block codes
|       4.  More Details
|       5.  Account Details
|   written by Jochen Loewer and Fouzia Nishath
|   April 2013
|
|---------------------------------------------------------------------------*/

var DbPool = require('../lib/DbPool');
var pricingDetails = require('../lib/pricingDetail');
var shipDetails = require('../lib/shipmentTab');
var UserSys = require('../lib/userSysSetupText');
var lastOrders = require('../lib/myLastViewedOrders');
var Resp = require('../lib/RespUtils');
var _ = require('underscore');
var bunyan = require('bunyan');
var async = require('async');
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2");
var PortalSec = require("../lib/PortalSecurity");
var config = require('../config/config.js');

DTADirPath = "/var/opt/oss/backend/data/";
DirPath = "/var/opt/oss/frontend/data/";

module.exports.init = function(app) {

    var order = {};
    app.get('/ossui/v1/in/orderheaderdetail', app.role(AuthGroupSandyUser), function(req, res) {

        var log = new bunyan({
            name: 'OrderDetailWebService',
        });

        var cust = "in";
        DbPool.OSSDB(function(db) {
            console.log('Getting header details...');
            var filter = new SqlUtils.AndWhere();

            filter.addORLike(req.query.oid, "backlog_hdr.legacy_order_no","backlog_hdr.order_no");

            var bind = new SqlUtils2.Bind(filter.bindNo);

            getHeaderDeatils(req.query.oid, db, cust, req, log, filter, function(err, hdr) {

                if (err) return Resp.sendError(res, log, err);

                if (hdr.length == 0) {
                    var msg = "No details found for order#: " + req.query.oid;
                    res.json({
                        'status': 'N',
                        'message': msg,
                        'data': '',
                    });
                }
                if (hdr.length != 0) {
                    res.json({
                        'status': 'S',
                        'message': msg,
                        'header': hdr,
                    });
                }
            }); //hdr
        }); //db
    }); //app

    var order = {};

    app.get('/ossui/v1/ex/orderheaderdetail', app.role(AuthGroupExternal), function(req, res) {
        var cust = "ex";

        var log = new bunyan({
            name: 'OrderDetailWebService',
        });

        DbPool.OSSDB(function(db) {

            var filter = new SqlUtils.AndWhere();
            filter.addEq(req.query.oid, "backlog_hdr.legacy_order_no");
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

                filter.binds = filter.binds.concat(userSettings.bind.binds);
                filter.where = filter.where + "  and ( " + userSettings.where + " ) ";

                console.log('Getting header details...');
                getHeaderDeatils(req.query.oid, db, cust, req, log, filter, function(err, hdr) {

                    if (err) return Resp.sendError(res, log, err);

                    if (hdr.length == 0) {
                        var msg = "No details found for order#: " + req.query.oid;

                        res.json({
                            'status': 'N',
                            'message': msg,
                            'data': '',
                        });
                    }

                    if (hdr.length != 0) {
                        res.json({
                            'status': 'S',
                            'message': msg,
                            'header': hdr,
                        });
                    }
                }); //hdr
            }); //portal
        }); //db
    }); //app

    /**
     * This function returns order header comments
     * @param legacyOrderNo       Legacy_order_no
     * @param db                  db connection object
     * @param cust                customer
     * @return -                  comments
     */

    function getComments(legacyOrderNo, db, cust, log, cb) {
        var sqlString = "";
        var comments = {};
        headerComments = [];

        console.log("Getting order comments....")
        if (cust == 'ex') {

            sqlString = "select legacy_order_no,name,sap_text_name,comment_text \
                           from order_comments where item_no is null            \
                            and legacy_order_no =:1 and visibility='E'"
        }
        if (cust == 'in') {

            sqlString = "select legacy_order_no,name,sap_text_name,comment_text \
                           from order_comments where item_no is null            \
                            and legacy_order_no =:1"
        }

        db.execute(sqlString, [legacyOrderNo], function(err, commentsResult) {

            console.log("sqlString for order comments:" + sqlString)
            commentsResult.forEach(function(comment, i) {

                if (err) return cb(err, null);

                if (comment.name != null) {

                    comments = {
                        key: comment.name,
                        value: comment.comment_text
                    }
                } else if (comment.sap_text_name != null) {

                    comments = {
                        key: comment.sap_text_name,
                        value: comment.comment_text
                    }
                } else {
                    if (comment.comment_text != null) {
                        comments = {
                            key: "",
                            value: comment.comment_text
                        }
                    }
                }

                headerComments.push(comments)
            });
            cb(null, headerComments);
        });
    }

    /**
     * This function returns order header detail
     * @param legacyOrderNo       Legacy_order_no
     * @param db                  db connection object
     * @param cust                customer
     * @param req                 http request parameter
     * @return -                  header detail JSON object
     */

    function getHeaderDeatils(legacyOrderNo, db, cust, req, log, filter, cb) {
        var sqlString = "";
        var comments = {};
        var holdCode = {};
        var consolidatedStati = "";
        var dataSource = "";
        var lorderNo = "";
        var soldToWcc = "";
        var shipToWcc = "";
        var tempShipToAddr = {};
        var tempSoldToAddr = {};
        var tempInvoiceToAddr = {};
        var soldToAddress = [];
        var shipToAddress = [];
        var invoiceToAddress = [];
        var strShipAdd1 = "";
        var strShipAdd2 = "";
        var strShipAdd3 = "";
        var strShipAdd4 = "";
        var strShipAdd5 = "";
        var strShipAdd6 = "";
        var strSoldAdd1 = "";
        var strSoldAdd2 = "";
        var strSoldAdd3 = "";
        var strSoldAdd4 = "";
        var strSoldAdd5 = "";
        var strInvoiceAdd1 = "";
        var strInvoiceAdd2 = "";
        var strInvoiceAdd3 = "";
        var strInvoiceAdd4 = "";
        var strInvoiceAdd5 = "";
        var i = 0;
        var k = 0;
        var m = 0;
        var shipTo = "";
        var soldTo = "";
        var invoiceTo = "";
        var orderType = "";
        var orderDesc = "";
        var deliveryType = "";
        var completeDelivery = "";
        var cdCode = "";
        var hdr = {};
        var dataSourceArr = {};
        var hasMoreDetail = "false";
        var moreDetailColumns = {};
        var tempMoreDetail = {};
        var moreDetails = [];
        var endCustSoldTo = "";
        var invoiceStatus = "";
        var totalNetPrice = "";
        var totaDlrlNetPrice = "";
        var totalPrice = "";
        var totalDlrPrice = "";
        var tax = "";
        var shippingCharges = "";
        var forwarderAddrNo = "";
        var salesOrg = "";
        var accDetailBinds = [];
        var inClauseVar1 = "";
        var inClauseVar2 = "";
        var shipStatus = "";
        var invoiceStatus = "";
        var creditHoldText = "";
        var omSystem = "";
        var delvFlag = "false";
        var billBlkFlag = "false";
        var userCodesFlag = "false";

        if (cust == "in") {

            console.log("filter.where:" + filter.where)
            console.log("filter.binds:" + filter.binds)

            sqlString = "select backlog_hdr.legacy_order_no       AS oid,                 \
                                backlog_hdr.purchase_order_no     AS PO_No,               \
                                backlog_hdr.order_no              AS HP_Order_No ,        \
                                backlog_hdr.sales_org             AS Sales_Org ,          \
                                backlog_hdr.purch_order_date      AS purch_order_date,    \
                                nvl(backlog_hdr.total_price, 0)   AS Total_Order_Value,   \
                                nvl(backlog_hdr.dlr_total_price, 0) AS dlr_total_price,   \
                                nvl(backlog_hdr.total_net_price, 0) AS total_net_price,   \
                                nvl(backlog_hdr.dlr_tot_net_price,0) AS dlr_tot_net_price,\
                                backlog_hdr.currency              AS currency ,           \
                                backlog_hdr.order_type            AS order_type,          \
                                backlog_hdr.order_type_descr      AS order_type_descr,    \
                                backlog_hdr.order_status          AS order_state,         \
                                backlog_hdr.quote_no              AS Quote_No,            \
                                backlog_hdr.hp_receive_date       AS hp_receive_date,     \
                                backlog_hdr.clean_order_date      AS clean_order_date,    \
                                backlog_hdr.order_close_date      AS order_close_date,    \
                                backlog_hdr.sold_to_addr_1        AS Sold_To_Address_1,   \
                                backlog_hdr.sold_to_addr_2        AS Sold_To_Address_2,   \
                                backlog_hdr.sold_to_addr_3        AS Sold_To_Address_3,   \
                                backlog_hdr.sold_to_addr_4        AS Sold_To_Address_4,   \
                                backlog_hdr.sold_to_addr_5        AS Sold_To_Address_5,   \
                                backlog_hdr.customer_no           AS Customer_No,         \
                                backlog_hdr.customer_name         AS Customer_Name,       \
                                nvl(backlog_hdr.tax_value, 0)     AS tax,                 \
                                nvl(backlog_hdr.freight_charge, 0) AS Shipping_Charges,    \
                                backlog_hdr.payment_terms         AS Payment_Terms,       \
                                backlog_hdr.payment_terms_descr   AS payment_terms_descr, \
                                backlog_hdr.ship_to               AS ship_to,             \
                                backlog_hdr.ship_to_addr_1        AS Ship_To_Address_1,   \
                                backlog_hdr.ship_to_addr_2        AS Ship_To_Address_2,   \
                                backlog_hdr.ship_to_addr_3        AS Ship_To_Address_3,   \
                                backlog_hdr.ship_to_addr_4        AS Ship_To_Address_4,   \
                                backlog_hdr.ship_to_addr_5        AS Ship_To_Address_5,   \
                                backlog_hdr.ship_to_addr_6        AS Ship_To_Address_6,   \
                                backlog_hdr.order_overall_status  AS order_overall_status,\
                                backlog_hdr.consolidated_stati    AS consolidated_stati,  \
                                backlog_hdr.data_source           AS data_source,         \
                                backlog_hdr.last_check            AS last_check,          \
                                backlog_hdr.delivery_type         AS delivery_type,       \
                                backlog_hdr.complete_delivery     AS complete_delivery,   \
                                backlog_hdr.cd_code               AS cd_code,             \
                                backlog_hdr.ship_to_attn          AS ship_to_attn,        \
                                backlog_hdr.ship_to_phone         AS ship_to_phone,       \
                                backlog_hdr.ship_to_fax           AS ship_to_fax,         \
                                backlog_hdr.ship_to_email         AS ship_to_email,       \
                                backlog_hdr.sold_to_attn          AS sold_to_attn,        \
                                backlog_hdr.sold_to_phone         AS sold_to_phone,       \
                                backlog_hdr.sold_to_fax           AS sold_to_fax,         \
                                backlog_hdr.sold_to_email         AS sold_to_email,       \
                                backlog_hdr.payment_method        AS payment_method,      \
                                backlog_hdr.ship_to_wcc           AS ship_to_wcc,         \
                                backlog_hdr.sold_to_wcc           AS sold_to_wcc,         \
                                backlog_hdr.delivery_block        AS delivery_block,      \
                                backlog_hdr.dc_code               AS dc_code,             \
                                backlog_hdr.is_valid              AS is_valid,            \
                                backlog_hdr.customer_order        AS customer_order,      \
                                backlog_hdr.invoice_to_addr_1     AS invoice_to_addr_1,   \
                                backlog_hdr.invoice_to_addr_2     AS invoice_to_addr_2,   \
                                backlog_hdr.invoice_to_addr_3     AS invoice_to_addr_3,   \
                                backlog_hdr.invoice_to_addr_4     AS invoice_to_addr_4,   \
                                backlog_hdr.invoice_to_addr_5     AS invoice_to_addr_5,   \
                                backlog_hdr.invoice_to_wcc        AS invoice_to_wcc,      \
                                backlog_hdr.cancelation_reason    AS cancelation_reason,  \
                                backlog_hdr.customer_intent_no    AS customer_intent_no,  \
                                backlog_hdr.orderer_name          AS  orderer_name,       \
                                backlog_hdr.factory_coord         AS  factory_coord,      \
                                backlog_hdr.purch_agent           AS  purch_agent,        \
                                backlog_hdr.order_entry_originator  AS  order_entry_originator, \
                                backlog_hdr.influencer_id1        AS  influencer_id1,     \
                                backlog_hdr.reporting_codes       AS  reporting_codes,    \
                                backlog_hdr.b2bis_id              AS  b2bis_id,           \
                                backlog_hdr.b2bgw_id              AS  b2bgw_id,           \
                                backlog_hdr.correlation_id        AS  correlation_id,     \
                                backlog_hdr.system_handle         AS  system_handle,      \
                                backlog_hdr.billing_block         AS  billing_block,      \
                                backlog_hdr.delivery_block        AS  delivery_block,     \
                                backlog_hdr.partner_agent_id      AS  partner_agent_id,   \
                                backlog_hdr.partner_direct_id     AS  partner_direct_id,  \
                                CASE NVL(backlog_hdr.originating_system,'EMPTY')          \
                                 WHEN  'EMPTY'  THEN    backlog_hdr.purch_order_type     \
                                ELSE  backlog_hdr.originating_system  END AS  originating_system,  \
                                backlog_hdr.submission_method     AS  submission_method,  \
                                backlog_hdr.legacy_order_type     AS  legacy_order_type,  \
                                backlog_hdr.purch_order_type      AS  purch_order_type,   \
                                backlog_hdr.program_type          AS  program_type,       \
                                backlog_hdr.cust_grp_4            AS  platform,           \
                                backlog_hdr.version               AS  version,            \
                                backlog_hdr.order_reason          AS  order_reason,       \
                                backlog_hdr.indirect_flag         AS  indirect_flag,      \
                                backlog_hdr.sales_force           AS  sales_force,        \
                                backlog_hdr.account_name          AS  account_name,       \
                                backlog_hdr.bank_branch           AS  bank_branch,        \
                                backlog_hdr.bank_zone             AS  bank_zone,          \
                                backlog_hdr.bank_loan             AS  bank_loan,          \
                                backlog_hdr.dod_flag              AS  dod_flag,           \
                                backlog_hdr.rfid_flag             AS  rfid_flag,          \
                                backlog_hdr.gvt_contract_number   AS  gvt_contract_number,\
                                backlog_hdr.end_customer_sold_to  AS  end_customer_sold_to,\
                                backlog_hdr.e_certificate_email   AS  e_certificate_email, \
                                backlog_hdr.warehouse_instr       AS  warehouse_instr,    \
                                backlog_hdr.division_instr        AS  division_instr,     \
                                backlog_hdr.system_manager        AS  system_manager,     \
                                backlog_hdr.sys_mgr_phone         AS  sys_mgr_phone,      \
                                backlog_hdr.forwarder_addr_no     AS  forwarder_addr_no,  \
                                backlog_hdr.end_cust_addr_no      AS  end_cust_addr_no,   \
                                backlog_hdr.reseller_addr_no      AS  reseller_addr_no,   \
                                backlog_hdr.customer_req_date     AS  customer_req_date,  \
                                backlog_hdr.big_deal_id           AS  big_deal_id,        \
                                backlog_hdr.opg_code              AS  opg_code,           \
                                backlog_hdr.distrib_channel       AS  distrib_channel,    \
                                backlog_hdr.invoice_status        AS  invoice_status,     \
                                backlog_hdr.om_region             AS  om_region,          \
                                backlog_hdr.opportunity_id        AS  opportunity_id,     \
                                backlog_hdr.om_system             AS  om_system,          \
                                backlog_hdr.payment_terms_descr   AS  payment_terms_descr,\
                                backlog_hdr.payment_terms         AS  payment_terms,      \
                                backlog_hdr.sales_office          AS  sales_office,       \
                                backlog_hdr.sales_group           AS  sales_group,        \
                                backlog_hdr.sales_force           AS  sales_force,        \
                                backlog_hdr.sales_org             AS  sales_org,          \
                                backlog_hdr.sales_rep             AS  sales_rep,          \
                                backlog_hdr.so_no                 AS  so_no,              \
                                backlog_hdr.ship_status           AS  ship_status,        \
                                backlog_hdr.sc_system             AS  sc_system,          \
                                backlog_hdr.business_type         AS  business_type,      \
                                backlog_hdr.credit_approval_date  AS  credit_approval_date, \
                                backlog_hdr.credit_status         AS  credit_status,      \
                                backlog_hdr.customer_segment      AS  customer_segment,   \
                                backlog_hdr.customer_sub_segment  AS  customer_sub_segment, \
                                backlog_hdr.distrib_channel       AS  distrib_channel,    \
                                backlog_hdr.eid                   AS  eid,                \
                                backlog_hdr.invoice_status        AS  invoice_status,     \
                                backlog_hdr.invoice_to_fax        AS  invoice_to_fax,     \
                                backlog_hdr.invoice_to_email      AS  invoice_to_email,   \
                                backlog_hdr.invoice_to_attn       AS  invoice_to_attn,    \
                                backlog_hdr.invoice_to_phone      AS  invoice_to_phone,   \
                                backlog_hdr.invoice_to_party      AS  invoice_to_party,   \
                                backlog_hdr.inv_to_tax_id         AS  inv_to_tax_id,      \
                                backlog_hdr.last_update           AS  last_update,        \
                                backlog_hdr.last_check            AS  last_check,         \
                                backlog_hdr.msm                   AS  msm,                \
                                backlog_hdr.om_region             AS  om_region,          \
                                backlog_hdr.odesk_agent_name      AS  odesk_agent_name,   \
                                backlog_hdr.est_tax               AS  est_tax,            \
                                backlog_hdr.dlr_tot_net_price     AS  dlr_tot_net_price,  \
                                backlog_hdr.order_load_date       AS  order_load_date,    \
                                backlog_hdr.purch_agree           AS  purch_agree,        \
                                backlog_hdr.ship_to_tax_id        AS  ship_to_tax_id,     \
                                backlog_hdr.sold_to_party         AS  sold_to_party,      \
                                backlog_hdr.submission_method     AS  submission_method,  \
                                backlog_hdr.tax_status            AS  tax_status,         \
                                backlog_hdr.tax_status_descr      AS  tax_status_descr,   \
                                backlog_hdr.payer_addr_no         AS  payer_addr_no,      \
                                backlog_hdr.sold_to_tax_id        AS  sold_to_tax_id,     \
                                backlog_hdr.so_no                 AS  so_no,              \
                                backlog_hdr.team_id               AS  team_id,            \
                                backlog_hdr.sales_coord           AS  sales_coord,        \
                                backlog_hdr.ship_zone             AS  ship_zone,          \
                                backlog_hdr.gtm                   AS  gtm,                \
                                backlog_hdr.ship_via_code         AS  ship_via_code,      \
                                backlog_hdr.ship_conditions       AS  ship_conditions,    \
                                backlog_hdr.customer_group        AS  customer_group,     \
                                backlog_hdr.contract_end_date     AS  contract_end_date,  \
                                backlog_hdr.contract_start_date   AS  contract_start_date,\
                                backlog_hdr.said                  AS  said,               \
                                backlog_hdr.sold_to_org_id        AS  sold_to_org_id,     \
                                backlog_hdr.ship_to_org_id        AS  ship_to_org_id,     \
                                backlog_hdr.inv_to_org_id         AS  inv_to_org_id,      \
                                backlog_hdr.payer_org_id          AS  payer_org_id,       \
                                backlog_hdr.end_cust_org_id       AS  end_cust_org_id,    \
                                backlog_hdr.special_codes         AS  special_codes       \
                          from  backlog_hdr                                               \
                         where  (" + filter.where + ") "
        }
        if (cust == "ex") {
            console.log("*******************************")
            console.log("Final filter:" + filter.where)
            console.log("Final filter.binds:" + filter.binds)
            console.log("*******************************")

            sqlString = "select backlog_hdr.legacy_order_no       AS oid,                 \
                                backlog_hdr.purchase_order_no     AS PO_No,               \
                                backlog_hdr.order_no              AS HP_Order_No ,        \
                                backlog_hdr.purch_order_date      as purch_order_date,    \
                                nvl(backlog_hdr.total_price, 0)     AS Total_Order_Value, \
                                nvl(backlog_hdr.dlr_total_price, 0) AS dlr_total_price,   \
                                nvl(backlog_hdr.total_net_price, 0) AS total_net_price,   \
                                nvl(backlog_hdr.dlr_tot_net_price,0) AS dlr_tot_net_price,\
                                backlog_hdr.currency              AS currency ,           \
                                backlog_hdr.order_type            AS order_type,          \
                                backlog_hdr.order_type_descr      AS order_type_descr,    \
                                backlog_hdr.order_status          AS order_state,         \
                                backlog_hdr.quote_no              AS Quote_No,            \
                                backlog_hdr.hp_receive_date       AS hp_receive_date,     \
                                backlog_hdr.clean_order_date      AS clean_order_date,    \
                                backlog_hdr.order_close_date      AS order_close_date,    \
                                backlog_hdr.sold_to_addr_1        AS Sold_To_Address_1,   \
                                backlog_hdr.sold_to_addr_2        AS Sold_To_Address_2,   \
                                backlog_hdr.sold_to_addr_3        AS Sold_To_Address_3,   \
                                backlog_hdr.sold_to_addr_4        AS Sold_To_Address_4,   \
                                backlog_hdr.sold_to_addr_5        AS Sold_To_Address_5,   \
                                backlog_hdr.customer_no           AS Customer_No,         \
                                backlog_hdr.customer_name         AS Customer_Name,       \
                                nvl(backlog_hdr.tax_value, 0)     AS tax,                 \
                                nvl(backlog_hdr.freight_charge, 0) AS Shipping_Charges,   \
                                backlog_hdr.payment_terms         AS Payment_Terms,       \
                                backlog_hdr.payment_terms_descr   AS payment_terms_descr, \
                                backlog_hdr.ship_to               AS ship_to,             \
                                backlog_hdr.ship_to_addr_1        AS Ship_To_Address_1,   \
                                backlog_hdr.ship_to_addr_2        AS Ship_To_Address_2,   \
                                backlog_hdr.ship_to_addr_3        AS Ship_To_Address_3,   \
                                backlog_hdr.ship_to_addr_4        AS Ship_To_Address_4,   \
                                backlog_hdr.ship_to_addr_5        AS Ship_To_Address_5,   \
                                backlog_hdr.ship_to_addr_6        AS Ship_To_Address_6,   \
                                backlog_hdr.order_overall_status  AS order_overall_status,\
                                backlog_hdr.consolidated_stati    AS consolidated_stati,  \
                                backlog_hdr.om_system             AS  om_system,          \
                                backlog_hdr.data_source           AS data_source,         \
                                backlog_hdr.last_check            AS last_check,          \
                                backlog_hdr.delivery_type         AS delivery_type,       \
                                backlog_hdr.complete_delivery     AS complete_delivery,   \
                                backlog_hdr.cd_code               AS cd_code,             \
                                backlog_hdr.ship_to_attn          AS ship_to_attn,        \
                                backlog_hdr.ship_to_phone         AS ship_to_phone,       \
                                backlog_hdr.ship_to_fax           AS ship_to_fax,         \
                                backlog_hdr.ship_to_email         AS ship_to_email,       \
                                backlog_hdr.sold_to_attn          AS sold_to_attn,        \
                                backlog_hdr.sold_to_phone         AS sold_to_phone,       \
                                backlog_hdr.sold_to_fax           AS sold_to_fax,         \
                                backlog_hdr.sold_to_email         AS sold_to_email,       \
                                backlog_hdr.payment_method        AS payment_method,      \
                                backlog_hdr.ship_to_wcc           AS ship_to_wcc,         \
                                backlog_hdr.sold_to_wcc           AS sold_to_wcc,         \
                                backlog_hdr.dc_code               AS dc_code,             \
                                backlog_hdr.is_valid              AS is_valid,            \
                                backlog_hdr.customer_order        AS customer_order,      \
                                backlog_hdr.invoice_to_addr_1     AS invoice_to_addr_1,   \
                                backlog_hdr.invoice_to_addr_2     AS invoice_to_addr_2,   \
                                backlog_hdr.invoice_to_addr_3     AS invoice_to_addr_3,   \
                                backlog_hdr.invoice_to_addr_4     AS invoice_to_addr_4,   \
                                backlog_hdr.invoice_to_addr_5     AS invoice_to_addr_5,   \
                                backlog_hdr.invoice_to_wcc        AS invoice_to_wcc,      \
                                backlog_hdr.customer_intent_no    AS customer_intent_no,  \
                                backlog_hdr.payment_terms_descr   AS  payment_terms_descr,\
                                backlog_hdr.payment_terms         AS  payment_terms,      \
                                backlog_hdr.customer_req_date     AS  customer_req_date,  \
                                backlog_hdr.end_cust_addr_no      AS  end_cust_addr_no,   \
                                backlog_hdr.invoice_to_fax        AS  invoice_to_fax,     \
                                backlog_hdr.invoice_to_email      AS  invoice_to_email,   \
                                backlog_hdr.invoice_to_attn       AS  invoice_to_attn,    \
                                backlog_hdr.invoice_to_phone      AS  invoice_to_phone,   \
                                backlog_hdr.invoice_to_party      AS  invoice_to_party,   \
                                backlog_hdr.inv_to_tax_id         AS  inv_to_tax_id,      \
                                backlog_hdr.last_update           AS  last_update,        \
                                backlog_hdr.payer_addr_no         AS  payer_addr_no,      \
                                backlog_hdr.so_no                 AS  so_no,              \
                                backlog_hdr.ship_to_tax_id        AS  ship_to_tax_id,     \
                                backlog_hdr.sold_to_tax_id        AS  sold_to_tax_id,     \
                                backlog_hdr.ship_via_code         AS  ship_via_code,      \
                                backlog_hdr.ship_conditions       AS  ship_conditions,    \
                                backlog_hdr.end_customer_sold_to  AS  end_customer_sold_to,\
                                backlog_hdr.contract_start_date   AS  contract_start_date, \
                                backlog_hdr.contract_end_date     AS  contract_end_date    \
                           from backlog_hdr ,backlog_ids  ids ,backlog_ship s             \
                          where backlog_hdr.customer_order = 'Y'                          \
                            and (backlog_hdr.is_valid = 'Y' or backlog_hdr.is_valid is null) \
                            and backlog_hdr.legacy_order_no = ids.legacy_order_no         \
                            and backlog_hdr.legacy_order_no = s.legacy_order_no           \
                            and " + filter.where
        }
        db.execute(sqlString, filter.binds, function(err, hdr) {
            console.log("sqlString for header details:" + sqlString)

            if (err) {
                cb(err, null);
                log.error(err);
                console.log(err);
            }
            if (hdr.length == 0) {
                cb(null, hdr);
                log.error(err);
            }
            if (cust == "ex") {
                deliveryType = "Partial allow";
            }
            if (hdr.length != 0) {

                hdr.forEach(function(row, i) {
                    tempShipToAddr = {};
                    tempSoldToAddr = {};
                    tempInvoiceToAddr = {};

                    totalNetPrice = "";
                    totaDlrlNetPrice = "";
                    totalPrice = "";
                    totalDlrPrice = "";
                    tax = "";
                    shippingCharges = "";

                    consolidatedStati = row.consolidated_stati;
                    dataSource = row.data_source;
                    lorderNo = row.oid;
                    soldToWcc = row.sold_to_wcc;
                    shipToWcc = row.ship_to_wcc;
                    orderType = row.order_type;
                    orderDesc = row.order_type_descr;
                    deliveryType = row.delivery_type;
                    completeDelivery = row.complete_delivery;
                    cdCode = row.cd_code;
                    orderType = orderDesc + " (" + orderType + ")";
                    deliveryBlock = row.delivery_block;
                    billingBlock = row.billing_block;
                    invoiceToWcc = row.invoice_to_wcc;
                    paymentTerms = row.payment_terms;
                    businessType = row.business_type;
                    rtm = row.gtm;
                    endCustSoldTo = row.end_customer_sold_to;
                    paymentMethod = row.payment_method;
                    creditApprovalDate = row.credit_approval_date;
                    creditStatus = row.credit_status;
                    omSystem = row.om_system;

                    totNetPrice = row.total_net_price
                    totalNetPrice = pricingDetails.toUSD(row.total_net_price);
                    totalDlrlNetPrice = pricingDetails.toUSD(row.dlr_tot_net_price);
                    totalPrice = pricingDetails.toUSD(row.total_order_value);
                    totalDlrPrice = pricingDetails.toUSD(row.dlr_total_price);
                    tax = pricingDetails.toUSD(row.tax);
                    estTax = pricingDetails.toUSD(row.est_tax);
                    shippingCharges = pricingDetails.toUSD(row.shipping_charges);
                    purchOrderTypeHdr = row.purch_order_type;
                    programTypeHdr = row.program_type;
                    shipConditions = row.ship_conditions;

                    shipStatus = "Nothing Shipped";
                    shipStatus = row.ship_status;
                    if (shipStatus == "PS") {
                        shipStatus = "Partially Shipped"
                    }
                    if (shipStatus == "FS") {
                        shipStatus = "Fully Shipped"
                    }
                    if (shipStatus == "NS") {
                        shipStatus = "Nothing Shipped";
                    }

                    invoiceStatus = "Nothing Invoiced";
                    invoiceStatus = row.invoice_status;
                    if (invoiceStatus == "PI") {
                        invoiceStatus = "Partially Invoiced"
                    }
                    if (invoiceStatus == "FI") {
                        invoiceStatus = "Fully Invoiced"
                    }
                    if (invoiceStatus == "NI") {
                        invoiceStatus = "Nothing Invoiced"
                    }
                    if (businessType != null) {
                        if (businessType == "A") {
                            businessType = "Value";
                        } else if (businessType == "O") {
                            businessType = "Volumn";
                        } else if (businessType == "K") {
                            businessType = "Kiosk";
                        } else if (businessType == "S") {
                            businessType = "Software Ops";
                        }
                    }

                    if (row.payment_terms_descr != null) {
                        paymentTerms = paymentTerms + " : " + row.payment_terms_descr;
                    }

                    if (cust == "ex") {

                        deliveryType = "Partial allow";
                        if (((cdCode != "00") && (cdCode != null) && (cdCode != "N")) || (completeDelivery == "Y")) {
                            deliveryType = "Complete delivery";
                        }
                        if (consolidatedStati != null) {
                            if ((consolidatedStati.match(/DropShp/g)) == 'DropShp') {
                                deliveryType = " - Drop shipment "
                            }
                        }
                    }

                    if (cust == "in") {
                        //Log the order into SANDY_hist table
                        var userId = req.user_id;
                        logOrderIntoSandy(lorderNo, userId, function(err, result) {
                            console.log("success");
                        });
                        //More details
                        getMoreDetail(row, log, function(moreDetails, hasMoreDetail) {
                            if (hasMoreDetail == "true") {
                                hdr[0]['moreDetail'] = moreDetails;
                            }
                        });
                        if (deliveryType != null) {
                            deliveryType = deliveryType;
                        } else {

                            deliveryType = "Partial allow";
                            if (((cdCode != "00") && (cdCode != null) && (cdCode != "N")) || (completeDelivery == "Y")) {
                                deliveryType = "Complete delivery";
                            }

                            if (consolidatedStati != null && ((consolidatedStati.match(/DropShp/g)) == 'DropShp')) {
                                deliveryType = " - Drop shipment "
                            }
                        }

                        if (rtm != null) {
                            if (rtm == "D") {
                                rtm = "Direct";
                            } else if (rtm == "I") {
                                rtm = "Indirect";
                            }
                        }
                        //Account details
                        creditHoldText = getCreditHoldText(creditHoldText, creditStatus, creditApprovalDate, paymentMethod, consolidatedStati);

                        if (row.customer_no != null) {

                            inClauseVar1 = "'CBN',";
                            inClauseVar2 = "'" + row.customer_no + "',";
                        }
                        if (row.purch_agree != null) {
                            inClauseVar1 = inClauseVar1 + "'PA',";
                            inClauseVar2 = inClauseVar2 + "'" + row.purch_agree + "',";
                        }
                        if (row.team_id != null) {
                            inClauseVar1 = inClauseVar1 + "'TeamID',";
                            inClauseVar2 = inClauseVar2 + "'" + row.team_id + "',";
                        }
                        if (row.ship_zone != null) {
                            inClauseVar1 = inClauseVar1 + "'ShipToZone',";
                            inClauseVar2 = inClauseVar2 + "'" + row.ship_zone + "',";
                        }
                        if (row.end_customer_sold_to != null) {
                            inClauseVar1 = inClauseVar1 + "'SoldToID',";
                            inClauseVar2 = inClauseVar2 + "'" + row.end_customer_sold_to + "',";
                        }
                        if (row.sold_to_party != null) {
                            inClauseVar1 = inClauseVar1 + "'SoldToID',";
                            inClauseVar2 = inClauseVar2 + "'" + row.sold_to_party + "',";
                        }
                        if (row.customer_group != null) {
                            var custGrpArray = (row.customer_group).split(" ");
                            for (var p = 0; p < custGrpArray.length; p++) {
                                inClauseVar1 = inClauseVar1 + "'CustomerGroup',";
                                inClauseVar2 = inClauseVar2 + "'" + custGrpArray[p] + "',";
                            }
                        }
                        inClauseVar1 = inClauseVar1.substring(0, inClauseVar1.length - 1);
                        inClauseVar2 = inClauseVar2.substring(0, inClauseVar2.length - 1);
                        console.log("inClauseVar1:" + inClauseVar1);
                        console.log("inClauseVar2:" + inClauseVar2);

                        accDetailBinds[0] = row.om_region;
                        accDetailBinds[1] = row.business_type;
                        accDetailBinds[2] = row.gtm;
                        accDetailBinds[3] = row.customer_segment;
                        accDetailBinds[4] = row.account_name;

                        console.log("accDetailBinds");
                        console.log(accDetailBinds);
                    }

                    forwarderAddrNo = row.forwarder_addr_no;
                    endCustAddrNO = row.end_cust_addr_no;
                    payerAddrNo = row.payer_addr_no;
                    salesOrg = row.sales_org;

                    strShipAdd1 = row.ship_to_address_1;
                    strShipAdd2 = row.ship_to_address_2;
                    strShipAdd3 = row.ship_to_address_3;
                    strShipAdd4 = row.ship_to_address_4;
                    strShipAdd5 = row.ship_to_address_5;
                    strShipAdd6 = row.ship_to_address_6;

                    strSoldAdd1 = row.sold_to_address_1
                    strSoldAdd2 = row.sold_to_address_2
                    strSoldAdd3 = row.sold_to_address_3
                    strSoldAdd4 = row.sold_to_address_4
                    strSoldAdd5 = row.sold_to_address_5

                    strInvoiceAdd1 = row.invoice_to_addr_1
                    strInvoiceAdd2 = row.invoice_to_addr_2
                    strInvoiceAdd3 = row.invoice_to_addr_3
                    strInvoiceAdd4 = row.invoice_to_addr_4
                    strInvoiceAdd5 = row.invoice_to_addr_5

                    //Removing nulls from the address details
                    i = 0;
                    if (strShipAdd1 != null) {
                        tempShipToAddr['ship_to_addr_' + i] = strShipAdd1;
                        i++;
                    }
                    if (strShipAdd2 != null) {
                        tempShipToAddr['ship_to_addr_' + i] = strShipAdd2;
                        i++;
                    }
                    if (strShipAdd3 != null) {
                        tempShipToAddr['ship_to_addr_' + i] = strShipAdd3;
                        i++;
                    }
                    if (strShipAdd4 != null) {
                        tempShipToAddr['ship_to_addr_' + i] = strShipAdd4;
                        i++;
                    }
                    if (strShipAdd5 != null) {
                        tempShipToAddr['ship_to_addr_' + i] = strShipAdd5;
                        i++;
                    }
                    if (strShipAdd6 != null) {
                        tempShipToAddr['ship_to_addr_' + i] = strShipAdd6;
                        i++;
                    }
                    var j = i - 1;
                    shipTo = tempShipToAddr['ship_to_addr_' + j];

                    k = 0;
                    if (strSoldAdd1 != null) {
                        tempSoldToAddr['sold_to_addr_' + k] = strSoldAdd1;
                        k++;
                    }
                    if (strSoldAdd2 != null) {
                        tempSoldToAddr['sold_to_addr_' + k] = strSoldAdd2;
                        k++;
                    }
                    if (strSoldAdd3 != null) {
                        tempSoldToAddr['sold_to_addr_' + k] = strSoldAdd3;
                        k++;
                    }
                    if (strSoldAdd4 != null) {
                        tempSoldToAddr['sold_to_addr_' + k] = strSoldAdd4;
                        k++;
                    }
                    if (strSoldAdd5 != null) {
                        tempSoldToAddr['sold_to_addr_' + k] = strSoldAdd5;
                        k++;
                    }
                    var l = k - 1;
                    soldTo = tempSoldToAddr['sold_to_addr_' + l];

                    m = 0;
                    if (strInvoiceAdd1 != null) {
                        tempInvoiceToAddr['invoice_to_addr_' + m] = strInvoiceAdd1;
                        m++;
                    }
                    if (strInvoiceAdd2 != null) {
                        tempInvoiceToAddr['invoice_to_addr_' + m] = strInvoiceAdd2;
                        m++;
                    }
                    if (strInvoiceAdd3 != null) {
                        tempInvoiceToAddr['invoice_to_addr_' + m] = strInvoiceAdd3;
                        m++;
                    }
                    if (strInvoiceAdd4 != null) {
                        tempInvoiceToAddr['invoice_to_addr_' + m] = strInvoiceAdd4;
                        m++;
                    }
                    if (strInvoiceAdd5 != null) {
                        tempInvoiceToAddr['invoice_to_addr_' + m] = strInvoiceAdd5;
                        m++;
                    }
                    var n = m - 1;
                    invoiceTo = tempInvoiceToAddr['invoice_to_addr_' + n];

                    getCountryNameByWCC(soldToWcc, function(err, soldToCountryName) {

                        getCountryNameByWCC(shipToWcc, function(err, shipToCountryName) {

                            getCountryNameByWCC(invoiceToWcc, function(err, invoiceToCountryName) {

                                shipToCountry = soldToCountryName;
                                soldToCountry = shipToCountryName;
                                invoiceToCountry = invoiceToCountryName;

                                if ((shipTo != null) && (shipToCountry != null)) {

                                    if (shipTo.toUpperCase() != shipToCountry.toUpperCase()) {
                                        tempShipToAddr['ship_to_addr_' + i] = shipToCountry;
                                    }
                                }
                                if ((soldTo != null) && (soldToCountry != null)) {

                                    if (soldTo.toUpperCase() != soldToCountry.toUpperCase()) {
                                        tempSoldToAddr['sold_to_addr_' + k] = soldToCountry;
                                    }
                                }
                                if ((invoiceTo != null) && (invoiceToCountry != null)) {

                                    if (invoiceTo.toUpperCase() != invoiceToCountry.toUpperCase()) {
                                        tempInvoiceToAddr['invoice_to_addr_' + m] = invoiceToCountry;
                                    }
                                }
                            }); //getCountryNameByWCC
                        }); //getCountryNameByWCC
                    }); //getCountryNameByWCC
                }); //hdr

                var systemName = "";
                systemName = getSystemName(systemName, omSystem);

                shipToAddress.push(tempShipToAddr);
                soldToAddress.push(tempSoldToAddr);
                invoiceToAddress.push(tempInvoiceToAddr);

                hdr[0]['sold_To_Address'] = soldToAddress;
                hdr[0]['ship_To_Address'] = shipToAddress;
                hdr[0]['invoice_To_Address'] = invoiceToAddress;
                hdr[0]['order_type'] = orderType;
                hdr[0]['paymentTerms'] = paymentTerms;
                hdr[0]['businessType'] = businessType;
                hdr[0]['delivery_type'] = deliveryType;
                hdr[0]['quote_link'] = OMUILink;

                hdr[0]['totalNetPrice'] = totalNetPrice;
                hdr[0]['totalDlrlNetPrice'] = totalDlrlNetPrice;
                hdr[0]['totalPrice'] = totalPrice;
                hdr[0]['totalDlrPrice'] = totalDlrPrice;
                hdr[0]['taxValue'] = tax;
                hdr[0]['est_tax'] = estTax;
                hdr[0]['shippingCharges'] = shippingCharges;
                hdr[0]['invoice_status'] = invoiceStatus;
                hdr[0]['ship_status'] = shipStatus;
                hdr[0]['om_system'] = systemName;

                var sourceSystem = shipDetails.getSystemId(dataSource);
                shipDetails.loadDTAFileTable(DirPath, sourceSystem);
                shipCondition = Cache.ShipConditionDescr[sourceSystem][shipConditions];

                if (shipCondition != null || shipCondition != undefined) {

                    hdr[0]['ship_conditions'] = shipCondition;
                } else {

                    hdr[0]['ship_conditions'] = shipConditions;
                }

                if (purchOrderTypeHdr != null) {
                    getOrigSetUp(dataSource, purchOrderTypeHdr, function(err, descr) {

                        if (descr == "?") {

                            descr = purchOrderTypeHdr;
                        }

                        if (descr.length == 0) {

                            descr = purchOrderTypeHdr;
                        }
                        hdr[0]['purch_order_type'] = descr;
                    });
                }

                if (programTypeHdr != null) {
                    getOrigSetUp(dataSource, programTypeHdr, function(err, descr) {
                        if (descr == "?") {

                            descr = programTypeHdr;
                        }

                        if (descr.length == 0) {
                            descr = programTypeHdr;
                        }
                        hdr[0]['program_type'] = descr;
                    });
                }

                if (cust == "in") {

                    hdr[0]['rtm'] = rtm;
                    hdr[0]['credit_status'] = creditHoldText;

                    getAccountDetails(accDetailBinds, inClauseVar1, inClauseVar2, function(err, result) {
                        //Precedence Logic
                        if (result.length != 0) {
                            for (var i = 0; i < result.length; i++) {
                                var key = result[i].key;
                                switch (key) {
                                    case 'CBN':
                                        hdr[0]['accountDetails'] = result[i];
                                        break;
                                    case 'PA':
                                        hdr[0]['accountDetails'] = result[i];
                                        break;
                                    case 'TeamID':
                                        hdr[0]['accountDetails'] = result[i];
                                        break;
                                    case 'ShipToZone':
                                        hdr[0]['accountDetails'] = result[i];
                                        break;
                                    case 'SoldToID':
                                        hdr[0]['accountDetails'] = result[i];
                                        break;
                                    case 'CustomerGroup':
                                        hdr[0]['accountDetails'] = result[i];
                                        break;
                                    default:
                                        hdr[0]['accountDetails'] = result[i];
                                }
                            }
                            hdr[0]['accountDetails'] = result;
                        }
                    });
                }

                getInvoicePrice(lorderNo, function(err, netInvoicePrice, netDlrInvoicePrice) {

                    hdr[0]['netInvoicePrice'] = netInvoicePrice.toFixed(2);
                    hdr[0]['netDlrInvoicePrice'] = netDlrInvoicePrice.toFixed(2);
                });

                getDiscount(lorderNo, cust, totNetPrice, function(err, discountAmount, discountPercentage) {

                    hdr[0]['discountAmount'] = discountAmount.toFixed(2);
                    hdr[0]['discountPercentage'] = discountPercentage.toFixed(2);
                });

                getHPRegionByWCC(shipToWcc, function(err, shipToCountry) {

                    if(shipToCountry.length != 0) {

                        shipToCountry.forEach(function(row, i) {
                            hdr[0]['hpRegion'] = row.hp_region;
                            hdr[0]['hpsubRegion'] = row.subregion;
                        });
                    }
                });

                convertDataSource(dataSource, function(err, dataSourceStr) {

                    getComments(lorderNo, db, cust, log, function(err, comments) {

                        if (comments.length != 0) {
                            hdr[0]['Comments'] = comments;
                        }

                        async.series([

                            function(callback) {
                                if ((deliveryBlock != null) && (cust == "in")) {
                                    console.log("Getting delivery block details..");

                                    UserSys.getDeliveryBlock(dataSourceStr, deliveryBlock, log, function(err, delvBlockCode) {
                                        if (err) {
                                            log.error(err);
                                            return cb(err, null);
                                        }
                                        if (delvBlockCode.length != 0) {
                                            delvFlag = "true";
                                            hdr[0]['delv_Codes'] = delvBlockCode;

                                        }
                                        callback();
                                    }); //getDeliveryBlock
                                } else {
                                    callback();
                                }
                            },

                            function(callback) {
                                if ((billingBlock != null) && (cust == "in")) {

                                    log.info("Getting billing block details..");
                                    UserSys.getBillingBlock(dataSourceStr, billingBlock, log, function(err, billingBlockCode) {

                                        if (err) {
                                            log.error(err);
                                            return cb(err, null);
                                        }

                                        if (billingBlockCode.length != 0) {
                                            billBlkFlag = "true";
                                            hdr[0]['billing_Codes'] = billingBlockCode;
                                        }
                                        callback();
                                    }); //getBillingBlock
                                } else {
                                    callback();
                                }
                            },

                            function(callback) {

                                if (consolidatedStati != null) {
                                    console.log("Getting header status codes..");

                                    UserSys.getHoldCode(consolidatedStati, dataSourceStr, db, log, function(err, holdCode) {
                                        if (err) {
                                            log.error(err);
                                            return cb(err, null);
                                        }

                                        if (holdCode.length != 0) {
                                            userCodesFlag = "true";
                                            hdr[0]['Hold_Codes'] = holdCode;
                                        }
                                        callback();
                                    }); //getHoldCod
                                } else {
                                    callback();
                                }
                            },

                            function(callback) {
                                console.log("Getting Quote_No..");

                                getQuoteId(lorderNo, log, function(err, quoteNo) {
                                    if (err) {
                                        log.error(err);
                                        return cb(err, null);
                                    }

                                    if (quoteNo != null) {
                                        hdr[0]['Unique_Ref_Quote_Id'] = quoteNo;
                                    }
                                    callback();
                                }); //getQuoteId
                            },

                            function(callback) {

                                if (endCustAddrNO != null) {

                                    var tempAddr = {};
                                    var addr = [];

                                    getAddress(endCustAddrNO, function(err, address) {

                                        if (err) {
                                            log.error(err);
                                            return cb(err, null);
                                        }

                                        str1 = "endCust";
                                        address.forEach(function(add, i) {
                                            hdr[0]['endCustName'] = add.name1;

                                            if (endCustSoldTo == null) {

                                                if (add.customer_number != null) {
                                                    hdr[0]["end_customer_sold_to"] = add.customer_number;
                                                }
                                            }

                                            if (salesOrg == 'JP01') {

                                                if (add.name2 != null) {
                                                    hdr[0]["endCustName"] = add.name2;
                                                }
                                            }

                                            if (add.telephone != null) {

                                                hdr[0]["endCustTelephone"] = add.telephone;
                                            }

                                            if (add.fax_number != null) {

                                                hdr[0]["endCustFax"] = add.fax_number;
                                            }

                                            if (add.email_address != null) {

                                                hdr[0]["endCustEmail"] = add.email_address;
                                            }

                                            tempAddr = getAddressDetails(tempAddr, add, str1, salesOrg);
                                            addr.push(tempAddr);
                                            hdr[0]["endCustAddress"] = addr;
                                        });
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                            },

                            function(callback) {

                                if (forwarderAddrNo != null) {

                                    var tempAddr = {};
                                    var addr = [];

                                    getAddress(forwarderAddrNo, function(err, address) {

                                        if (err) {
                                            log.error(err);
                                            return cb(err, null);
                                        }

                                        str1 = "forwarder";

                                        address.forEach(function(add, i) {

                                            hdr[0]['forwarderName'] = add.name1;
                                            hdr[0]['forwarder_sold_to'] = add.customer_number;

                                            if (salesOrg == 'JP01') {

                                                if (add.name2 != null) {
                                                    hdr[0]["forwarderName"] = add.name2;
                                                }
                                            }

                                            if (add.telephone != null) {

                                                hdr[0]["forwarderTelephone"] = add.telephone;
                                            }

                                            if (add.fax_number != null) {

                                                hdr[0]["forwarderFax"] = add.fax_number;
                                            }

                                            if (add.email_address != null) {

                                                hdr[0]["forwarderEmail"] = add.email_address;
                                            }

                                            tempAddr = getAddressDetails(tempAddr, add, str1, salesOrg);
                                            addr.push(tempAddr);
                                            hdr[0]["forwarderAddress"] = addr;
                                        });
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                            },

                            function(callback) {

                                if (payerAddrNo != null) {

                                    var tempAddr = {};
                                    var addr = [];

                                    getAddress(payerAddrNo, function(err, address) {

                                        if (err) {
                                            log.error(err);
                                            return cb(err, null);
                                        }
                                        str1 = "payer";

                                        address.forEach(function(add, i) {

                                            hdr[0]['payerName'] = add.name1;

                                            if (salesOrg == 'JP01') {

                                                if (add.name2 != null) {
                                                    hdr[0]["payerName"] = add.name2;
                                                }
                                            }

                                            if (add.telephone != null) {

                                                hdr[0]["payerTelephone"] = add.telephone;
                                            }

                                            if (add.fax_number != null) {

                                                hdr[0]["payerFax"] = add.fax_number;
                                            }

                                            if (add.email_address != null) {

                                                hdr[0]["payerEmail"] = add.email_address;
                                            }

                                            tempAddr = getAddressDetails(tempAddr, add, str1, salesOrg);
                                            addr.push(tempAddr);
                                            hdr[0]["payerAddress"] = addr;
                                        });
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                            },

                        ], function(err) {

                            if (err) return next(err);

                            if ((billingBlock != null) && (cust == "in") && (billBlkFlag == "true")) {

                                var info = {};
                                var infoArr = [];

                                if ((consolidatedStati == "Shipment Hold") || (consolidatedStati == " ") || (consolidatedStati == null)) {

                                    Object.keys(hdr[0]['billing_Codes'][0]['billCodes']).forEach(function(key) {

                                        info[key] = hdr[0]['billing_Codes'][0]['billCodes'][key];
                                    });

                                    infoArr.push({
                                        info: info
                                    })
                                    hdr[0]['Hold_Codes'] = infoArr;

                                } else {
                                    if ((hdr[0]['Hold_Codes'][0]).hasOwnProperty('info') != true) {

                                        Object.keys(hdr[0]['billing_Codes'][0]['billCodes']).forEach(function(key) {
                                            info[key] = hdr[0]['billing_Codes'][0]['billCodes'][key];
                                        });

                                        infoArr.push({
                                            info: info
                                        });

                                        hdr[0]['Hold_Codes'] = infoArr;
                                    } else {

                                        Object.keys(hdr[0]['billing_Codes'][0]['billCodes']).forEach(function(key) {

                                            hdr[0]['Hold_Codes'][0]['info'][key] = hdr[0]['billing_Codes'][0]['billCodes'][key];
                                        });
                                    }
                                }
                            }

                            if ((deliveryBlock != null) && (cust == "in") && (delvFlag == "true")) {

                                var info = {};
                                var infoArr = [];

                                if ((consolidatedStati == "Shipment Hold") || (consolidatedStati == " ") || (consolidatedStati == null)) {

                                    Object.keys(hdr[0]['delv_Codes'][0]['delvCodes']).forEach(function(key) {
                                        info[key] = hdr[0]['delv_Codes'][0]['delvCodes'][key];
                                    });

                                    infoArr.push({
                                        info: info
                                    })

                                    hdr[0]['Hold_Codes'] = infoArr;
                                } else {

                                    var holdCodeArr = [];
                                    var holdCode = {};

                                    if ((hdr[0].hasOwnProperty('Hold_Codes')) == false) {

                                        holdCodeArr.push({
                                            Hold_Codes: holdCode
                                        });

                                        hdr[0]['Hold_Codes'] = holdCodeArr;
                                    }

                                    if ((hdr[0]['Hold_Codes'][0]).hasOwnProperty('info') != true) {

                                        Object.keys(hdr[0]['delv_Codes'][0]['delvCodes']).forEach(function(key) {
                                            info[key] = hdr[0]['delv_Codes'][0]['delvCodes'][key];
                                        });

                                        infoArr.push({
                                            info: info
                                        });

                                        hdr[0]['Hold_Codes'] = infoArr;

                                    } else {

                                        Object.keys(hdr[0]['delv_Codes'][0]['delvCodes']).forEach(function(key) {

                                            hdr[0]['Hold_Codes'][0]['info'][key] = hdr[0]['delv_Codes'][0]['delvCodes'][key];
                                        });
                                    }

                                }
                            }
                            if ((consolidatedStati != null) && (cust == "in") && (userCodesFlag == "true")) {

                                var billCodes = {};
                                var billCodesArr = [];
                                var holdCodeArr = [];
                                var holdCode = {};

                                if ((hdr[0].hasOwnProperty('Hold_Codes')) == false) {

                                    holdCodeArr.push({
                                        Hold_Codes: holdCode
                                    });

                                    hdr[0]['Hold_Codes'] = holdCodeArr;
                                }

                                if ((hdr[0]['Hold_Codes'][0]).hasOwnProperty('otherCodes') == true) {

                                    Object.keys(hdr[0]['Hold_Codes'][0]['otherCodes']).forEach(function(key) {

                                        if (billingBlock != null) {

                                            hdr[0]['billing_Codes'][0]['billCodes'][key] = hdr[0]['Hold_Codes'][0]['otherCodes'][key];
                                        } else {

                                            billCodes[key] = hdr[0]['Hold_Codes'][0]['otherCodes'][key];
                                        }
                                    });

                                    if (billingBlock == null) {

                                        billCodesArr.push({
                                            billCodes: billCodes
                                        });

                                        hdr[0]['billing_Codes'] = billCodesArr
                                    }
                                }


                            }
                            cb(null, hdr);
                        });

                    }); //getComments
                }); //convertDataSource
            } //hdr.lenght !=0
        }); //db execute
    }

    /**
     * This function returns country name for the given WCC code
     * @param wcc       WCC
     * @return -        Country name
     */

    function getCountryNameByWCC(wcc, cb) {
        DbPool.OSSDB(function(db) {

            var sqlString = "";
            var countryName = "";

            sqlString = "select country_name from country where hp_code = :1 ";

            db.execute(sqlString, [wcc], function(err, countryname) {

                if (err) return cb(err, null);

                countryname.forEach(function(row, i) {
                    countryName = row.country_name;
                });

                cb(null, countryName);
            });
        });
    }

    /**
     * This function returns HPRegion for the given WCC code
     * @param wcc       WCC
     * @return -        result
     */

    function getHPRegionByWCC(wcc, cb) {
        DbPool.OSSDB(function(db) {

            var sqlString = "";
            var countryName = "";

            sqlString = "select subregion,hp_region from country where hp_code = :1 ";

            db.execute(sqlString, [wcc], function(err, result) {

                if (err) return cb(err, null);
                cb(null, result);
            });
        });
    }

    /**
     * This function returns origin setup for the given code
     * @param wcc       code
     * @return -        origin setup
     */

    function getOrigSetUp(datasource, code, cb) {
        DbPool.OSSDB(function(db) {
            var sqlString = "";
            var descr = "";
            if (datasource == "SAPCLP") {
                datasource = "SAP-CLP"

            }
            if (datasource == "SAPD7C") {
                datasource = "SAP-D7C"
            }
            if (datasource == "SAPCPO") {
                datasource = "SAP-CPO"
            }
            sqlString = "select description from order_origin_setup where code = :1 ";

            db.execute(sqlString, [code], function(err, descript) {
                if (err) return cb(err, null);

                descript.forEach(function(row, i) {
                    descr = row.description;
                });

                cb(null, descr);
            });
        });
    }

    /**
     * This function returns address detail
     * @param addressRefNo       addressRefNo
     * @return -        address details
     */

    function getAddress(addressRefNo, cb) {
        DbPool.OSSDB(function(db) {
            var sqlString = "";
            var countryName = "";

            sqlString = "select name1, name2, name3, name4, addressnumber,   \
                                street, street2, city, postal_code, country, \
                                region, telephone, fax_number, email_address,\
                                customer_number, district                    \
                           from address_details                              \
                          where reference_no = :1 ";

            db.execute(sqlString, [addressRefNo], function(err, address) {

                if (err) return cb(err, null);

                cb(null, address);
            });
        });
    }

    /**
     * This function converts the datasource into proper formate
     * @param wcc       datasource
     * @return -        datasource
     */

    function convertDataSource(dataSource, cb) {
        var dataSourceArr = {};

        dataSourceArr = dataSource.split(" ");
        var dataSourceStr = ""

        for (var i = 0; i < dataSourceArr.length; i++) {
            var dataSource = dataSourceArr[i];

            if (dataSource == "SAPCPO") {
                dataSource = "SAP-CPO','SAPCPO"
            }
            if (dataSource == "SAPD7C") {
                dataSource = "SAP-D7C"
            }
            if (dataSource == "SAPCLP") {
                dataSource = "SAP-CLP"
            }
            dataSourceStr += "'" + dataSource + "',";
        }

        cb(null, dataSourceStr);
    }

    /**
     * This function returns Quote Id for the given legacy_order_no
     * @param lorderNo       Legacy_order_no
     * @return -             Quote Id
     */

    function getQuoteId(lorderNo, log, cb) {
        DbPool.OSSDB(function(db) {

            var quoteNo = "";
            var sqlString = " select k.value                                  \
                                from backlog_hdr h, frontend_orders f, keys k \
                               where h.legacy_order_no = f.Legacy_order_no    \
                                 and k.name = 'reference_quote_no'            \
                                 and f.id = k.id                              \
                                 and h.legacy_order_no = :1";

            console.log("sqlString for Quote Id:" + sqlString);

            db.execute(sqlString, [lorderNo], function(err, quoteNo) {
                if (err) return cb(err, null);

                quoteNo.forEach(function(row, i) {
                    quoteNo = row.value;
                });

                cb(null, quoteNo);
            });
        });
    }

    /**
     * This function logs an order into sandy_hist
     * @param lorderNo       Legacy_order_no
     * @return -
     */

    function logOrderIntoSandy(lorderNo, userId, cb) {

        var sqlString = "";

        lastOrders.logOrder(userId, lorderNo, function(err, result) {

            cb(null, result);
        });
    }

    /**
     * This function gets more order details
     * @param row       row
     * @return moreDetail moreDetail
     */

    function getMoreDetail(row, log, cb) {
        var moreDetailColumns = {};
        var tempMoreDetail = {};
        var moreDetails = [];
        var tempAddr = {};
        var addr = [];
        var i = 0;
        var k = 0;
        var m = 0;

        var ordererName = row.orderer_name;
        var factoryCoord = row.factory_coord;
        var purchAgent = row.purch_agent;
        var orderEntryOriginator = row.order_entry_originator;
        var influencerId1 = row.influencer_id1;
        var reportingCodes = row.reporting_codes;
        var b2bisId = row.b2bis_id;
        var b2bgwId = row.b2bgw_id;
        var correlationId = row.correlation_id;
        var systemHandle = row.system_handle;
        var billingBlock = row.billing_block;
        var partnerAgentId = row.partner_agent_id;
        var partnerDirectId = row.partner_direct_id;
        var originatingSystem = row.originating_system;
        var submissionMethod = row.submission_method;
        var legacyOrderType = row.legacy_order_type;
        var purchOrderType = row.purch_order_type;
        var programType = row.program_type;
        var forwarderAddrNo = row.forwarder_addr_no;
        var salesOrg = row.sales_org;
        var endCustAddrNO = row.end_cust_addr_no;
        var endCustSoldTo = row.end_customer_sold_to;
        var resellerAddrNo = row.reseller_addr_no;
        var billingBlock = row.billing_block;
        var deliveryBlock = row.delivery_block;

        var endCustName = "";
        var endCustSoldTo = "";
        var endCustTelephone = "";
        var endCustFax = "";
        var endCustEmail = "";
        var address = [];
        var datasource = "";

        var question = "false";

        if (ordererName == "?") {
            question = "true";
        }

        if (ordererName != null) {

            if (question != "true") {

                hasMoreDetail = "true";
                moreDetailColumns["ordererName"] = "Orderer Name";
                tempMoreDetail["ordererName"] = ordererName;
            }
        }

        if (factoryCoord != null) {
            hasMoreDetail = "true";
            moreDetailColumns["factoryCoord"] = "Factory Co-ordinator";
            tempMoreDetail["factoryCoord"] = factoryCoord;
        }

        if (purchAgent != null) {
            hasMoreDetail = "true";
            moreDetailColumns["purchAgent"] = "Purchasing Agent";
            tempMoreDetail["purchAgent"] = purchAgent;
        }

        if (orderEntryOriginator != null) {
            hasMoreDetail = "true";
            moreDetailColumns["orderEntryOriginator"] = "Order Entry Originator";
            tempMoreDetail["orderEntryOriginator"] = orderEntryOriginator;
        }

        dataSource = row.data_source;
        convertDataSource(dataSource, function(err, dataSourceStr) {

            if (billingBlock != null) {

                UserSys.getBillingBlock(dataSourceStr, billingBlock, log, function(err, billingBlockCode) {

                    if (err) {
                        log.error(err);
                        return cb(err, null);
                    }

                    if (billingBlockCode.length != 0) {

                        Object.keys(billingBlockCode[0]['billCodes']).forEach(function(key) {

                            if (key == billingBlock) {

                                billingBlockText = key + " " + billingBlockCode[0]['billCodes'][key];
                                hasMoreDetail = "true";
                                moreDetailColumns["billingBlock"] = "Billing Block";
                                tempMoreDetail["billingBlock"] = billingBlockText;
                            }
                        });

                        Object.keys(billingBlockCode[0]['info']).forEach(function(key) {

                            if (key == billingBlock) {

                                billingBlockText = key + " " + billingBlockCode[0]['info'][key];
                                hasMoreDetail = "true";
                                moreDetailColumns["billingBlock"] = "Billing Block";
                                tempMoreDetail["billingBlock"] = billingBlockText;
                            }
                        });

                        Object.keys(billingBlockCode[0]['hide']).forEach(function(key) {

                            if (key == billingBlock) {

                                billingBlockText = key + " " + billingBlockCode[0]['hide'][key];
                                hasMoreDetail = "true";
                                moreDetailColumns["billingBlock"] = "Billing Block";
                                tempMoreDetail["billingBlock"] = billingBlockText;
                            }
                        });

                    } else {

                        moreDetailColumns["billingBlock"] = "Billing Block";
                        tempMoreDetail["billingBlock"] = billingBlock;
                    }
                }); //getBillingBlock
            }

            if (deliveryBlock != null) {

                console.log("Getting delivery block details..");
                UserSys.getDeliveryBlock(dataSourceStr, deliveryBlock, log, function(err, delvBlockCode) {
                    if (err) {
                        log.error(err);
                        return cb(err, null)
                    }
                    if (delvBlockCode.length != 0) {

                        Object.keys(delvBlockCode[0]['delvCodes']).forEach(function(key) {

                            if (key == deliveryBlock) {
                                delvBlockText = key + " " + delvBlockCode[0]['delvCodes'][key];
                                hasMoreDetail = "true";
                                moreDetailColumns["deliveryBlock"] = "Delivery Block";
                                tempMoreDetail["deliveryBlock"] = delvBlockText;
                            }
                        });

                        Object.keys(delvBlockCode[0]['info']).forEach(function(key) {

                            if (key == deliveryBlock) {
                                delvBlockText = key + " " + delvBlockCode[0]['info'][key];
                                hasMoreDetail = "true";
                                moreDetailColumns["deliveryBlock"] = "Delivery Block";
                                tempMoreDetail["deliveryBlock"] = delvBlockText;
                            }
                        });

                        Object.keys(delvBlockCode[0]['hide']).forEach(function(key) {

                            if (key == deliveryBlock) {
                                delvBlockText = key + " " + delvBlockCode[0]['hide'][key];
                                hasMoreDetail = "true";
                                moreDetailColumns["deliveryBlock"] = "Delivery Block";
                                tempMoreDetail["deliveryBlock"] = delvBlockText;
                            }
                        });

                    } else {

                        moreDetailColumns["deliveryBlock"] = "Delivery Block";
                        tempMoreDetail["deliveryBlock"] = deliveryBlock;
                    }
                }); //getDeliveryBlock
            }
        });

        if (influencerId1 != null) {
            hasMoreDetail = "true";
            moreDetailColumns["influencerId1"] = "Agent ID";
            tempMoreDetail["influencerId1"] = influencerId1;
        }

        if (reportingCodes != null) {
            hasMoreDetail = "true";
            moreDetailColumns["reportingCodes"] = "Reporting Codes";
            tempMoreDetail["reportingCodes"] = reportingCodes;
        }

        if (b2bisId != null) {
            hasMoreDetail = "true";
            moreDetailColumns["b2bisId"] = "OIS ID No";
            tempMoreDetail["b2bisId"] = b2bisId;
        }

        if (b2bgwId != null) {
            hasMoreDetail = "true";
            moreDetailColumns["b2bgwId"] = "B2BGW ID No";
            tempMoreDetail["b2bgwId"] = b2bgwId;
        }

        if (correlationId != null) {
            hasMoreDetail = "true";
            moreDetailColumns["correlationId"] = "Correlation ID No";
            tempMoreDetail["correlationId"] = correlationId;
        }

        if (systemHandle != null) {
            hasMoreDetail = "true";
            moreDetailColumns["systemHandle"] = "System Handle";
            tempMoreDetail["systemHandle"] = systemHandle;
        }

        if (partnerAgentId != null) {
            hasMoreDetail = "true";
            moreDetailColumns["partnerAgentId"] = "Partner Agent ID";
            tempMoreDetail["partnerAgentId"] = partnerAgentId;
        }

        if (partnerDirectId != null) {
            hasMoreDetail = "true";
            moreDetailColumns["partnerDirectId"] = "Partner Direct ID";
            tempMoreDetail["partnerDirectId"] = partnerDirectId;
        }

        if (originatingSystem != null) {
            hasMoreDetail = "true";
            moreDetailColumns["originatingSystem"] = "Originating System";
            tempMoreDetail["originatingSystem"] = originatingSystem;
        }

        if (submissionMethod != null) {
            hasMoreDetail = "true";
            moreDetailColumns["submissionMethod"] = "Submission Method";
            tempMoreDetail["submissionMethod"] = submissionMethod;
        }

        if (legacyOrderType != null) {
            hasMoreDetail = "true";
            moreDetailColumns["legacyOrderType"] = "Legacy Order Type";
            tempMoreDetail["legacyOrderType"] = legacyOrderType;
        }

        if (purchOrderType != null) {

            hasMoreDetail = "true";
            getOrigSetUp(dataSource, purchOrderType, function(err, descr) {
                if (descr == "?") {
                    descr = purchOrderType;
                }
                if (descr.length == 0) {
                    descr = purchOrderType;
                }
                moreDetailColumns["purchOrderType"] = "Purchase Order Type";
                tempMoreDetail["purchOrderType"] = descr;
            });
        }

        if (programType != null) {
            hasMoreDetail = "true";
            getOrigSetUp(dataSource, programType, function(err, descr) {
                if (descr == "?") {
                    descr = programType;
                }
                if (descr.length == 0) {
                    descr = programType;
                }
                moreDetailColumns["programType"] = "Program Type";
                tempMoreDetail["programType"] = descr;
            });

        }

        var platform = row.platform;
        if (platform != null) {
            hasMoreDetail = "true";
            moreDetailColumns["platform"] = "Platform";
            tempMoreDetail["platform"] = platform;
        }

        var version = row.version;
        if (version != null) {

            moreDetailColumns["version"] = "Version";
            tempMoreDetail["version"] = version;
        }

        var orderReason = row.order_reason;
        if (orderReason != null) {

            moreDetailColumns["orderReason"] = "Order Reason";
            tempMoreDetail["orderReason"] = orderReason;
        }

        var indirectFlag = row.indirect_flag;
        if (indirectFlag != null) {
            moreDetailColumns["indirectFlag"] = "indirect order (B2BIS)";
            tempMoreDetail["indirectFlag"] = indirectFlag;
        }

        if (row.sales_force == "{}") {
            row.sales_force = "";
        }

        accountName = row.account_name;
        if (accountName != null) {
            moreDetailColumns["accountName"] = "Account";
            tempMoreDetail["accountName"] = accountName;
        }

        var bankBranch = row.bank_branch;
        if (bankBranch != null) {

            moreDetailColumns["bankBranch"] = "Branch";
            tempMoreDetail["bankBranch"] = bankBranch;
        }

        var bankZone = row.bank_zone;
        if (bankZone != null) {

            moreDetailColumns["bankZone"] = "Zone";
            tempMoreDetail["bankZone"] = bankZone;
        }

        var bankLoan = row.bank_loan;
        if (bankLoan != null) {

            moreDetailColumns["bankLoan"] = "Loan";
            tempMoreDetail["bankLoan"] = bankLoan;
        }

        var gvtContractNumber = row.gvt_contract_number;
        if (gvtContractNumber != null) {
            moreDetailColumns["gvtContractNumber"] = "Gvt. Contract Number";
            tempMoreDetail["gvtContractNumber"] = gvtContractNumber;
        }

        var dodFlag = row.dod_flag;
        var rfidFlag = row.rfid_flag;

        if ((dodFlag == "Y") || (rfidFlag == "Y") || (gvtContractNumber != null)) {

            moreDetailColumns["dodFlag"] = "DoD/RFID";
            tempMoreDetail["dodFlag"] = dodFlag + "/" + rfidFlag;
        }

        if (endCustSoldTo != "") {

            moreDetailColumns["endCustSoldTo"] = "End Customer Sold-To";
            tempMoreDetail["endCustSoldTo"] = endCustSoldTo;
        }

        var eCertificateEmail = row.e_certificate_email;
        if (eCertificateEmail != null) {

            moreDetailColumns["eCertificateEmail"] = "e Certificate Email";
            tempMoreDetail["eCertificateEmail"] = eCertificateEmail;
        }

        var warehouseInstr = row.warehouse_instr;
        if (warehouseInstr != null) {
            moreDetailColumns["warehouseInstr"] = "Warehouse Instructions";
            tempMoreDetail["warehouseInstr"] = warehouseInstr;
        }

        var divisionInstr = row.division_instr;
        if (divisionInstr != null) {

            moreDetailColumns["divisionInstr"] = "Division Instructions";
            tempMoreDetail["divisionInstr"] = divisionInstr;
        }

        var systemManager = row.system_manager;
        if (systemManager != null) {

            moreDetailColumns["systemManager"] = "Customer Technical Contact";
            tempMoreDetail["systemManager"] = systemManager;
        }

        var sysMgrPhone = row.sys_mgr_phone;
        if (sysMgrPhone != null) {

            moreDetailColumns["sysMgrPhone"] = "Customer Technical Contact Phone";
            tempMoreDetail["sysMgrPhone"] = sysMgrPhone;
        }

        if (endCustAddrNO != null) {
            tempAddr = {};
            getAddress(endCustAddrNO, function(err, address) {
                str1 = "endCust";
                address.forEach(function(add, i) {
                    moreDetailColumns["endCustName"] = "End Customer Name";
                    tempMoreDetail["endCustName"] = add.name1;
                    if ((endCustSoldTo == "") || (endCustSoldTo == null)) {
                        if (add.customer_number != null) {
                            moreDetailColumns["endCustSoldTo"] = "End Customer Sold-To";
                            tempMoreDetail["endCustSoldTo"] = add.customer_number;
                        }
                    }

                    if (salesOrg == 'JP01') {
                        if (add.name2 != null) {
                            moreDetailColumns["endCustName"] = "End Customer Name";
                            tempMoreDetail["endCustName"] = add.name2;
                        }

                    }
                    tempAddr = getAddressDetails(tempAddr, add, str1, salesOrg);
                    if (add.telephone != null) {
                        moreDetailColumns["endCustTelephone"] = "End Customer telephone";
                        tempMoreDetail["endCustTelephone"] = add.telephone;
                    }
                    if (add.fax_number != null) {
                        moreDetailColumns["endCustFax"] = "End Customer Fax Number";
                        tempMoreDetail["endCustFax"] = add.fax_number;
                    }
                    if (add.email_address != null) {
                        moreDetailColumns["endCustEmail"] = "End Customer eMail";
                        tempMoreDetail["endCustEmail"] = add.email_address;
                    }

                });
                addr.push({
                    endCust: tempAddr
                });

            });
        }

        //reseller
        if (resellerAddrNo != null) {
            tempAddr = {};
            getAddress(resellerAddrNo, function(err, address) {
                str1 = "reseller";
                address.forEach(function(add, i) {
                    moreDetailColumns["resellerName"] = "Reseller Name";
                    tempMoreDetail["resellerName"] = add.name1;

                    if (add.customer_number != null) {
                        moreDetailColumns["resellerSoldTo"] = "Reseller Sold-To";
                        tempMoreDetail["resellerSoldTo"] = add.customer_number;
                    }


                    if (salesOrg == 'JP01') {
                        if (add.name2 != null) {
                            moreDetailColumns["resellerName"] = "Reseller Name";
                            tempMoreDetail["resellerName"] = add.name2;
                        }

                    }
                    tempAddr = getAddressDetails(tempAddr, add, str1, salesOrg);
                    if (add.telephone != null) {
                        moreDetailColumns["resellerTelephone"] = "Reseller telephone";
                        tempMoreDetail["resellerTelephone"] = add.telephone;
                    }
                    if (add.fax_number != null) {
                        moreDetailColumns["resellerFax"] = "Reseller Fax Number";
                        tempMoreDetail["resellerFax"] = add.fax_number;
                    }
                    if (add.email_address != null) {
                        moreDetailColumns["resellerEmail"] = "Reseller eMail";
                        tempMoreDetail["resellerEmail"] = add.email_address;
                    }

                });
                addr.push({
                    resller: tempAddr
                });

            });
        }

        //forwarder
        if (forwarderAddrNo != null) {
            tempAddr = {};
            getAddress(forwarderAddrNo, function(err, address) {
                str1 = "forwarder";
                address.forEach(function(add, i) {
                    moreDetailColumns["forwarderName"] = "Forwarder Name";
                    tempMoreDetail["forwarderName"] = add.name1;

                    if (add.customer_number != null) {
                        moreDetailColumns["forwarderSoldTo"] = "Forwarder Sold-To";
                        tempMoreDetail["forwarderSoldTo"] = add.customer_number;
                    }


                    if (salesOrg == 'JP01') {
                        if (add.name2 != null) {
                            moreDetailColumns["forwarderName"] = "Forwarder Name";
                            tempMoreDetail["forwarderName"] = add.name2;
                        }

                    }
                    tempAddr = getAddressDetails(tempAddr, add, str1, salesOrg);
                    if (add.telephone != null) {
                        moreDetailColumns["forwarderTelephone"] = "Forwarder telephone";
                        tempMoreDetail["forwarderTelephone"] = add.telephone;
                    }
                    if (add.fax_number != null) {
                        moreDetailColumns["forwarderFax"] = "Forwarder Fax Number";
                        tempMoreDetail["forwarderFax"] = add.fax_number;
                    }
                    if (add.email_address != null) {
                        moreDetailColumns["forwarderEmail"] = "Forwarder eMail";
                        tempMoreDetail["resellerEmail"] = add.email_address;
                    }

                });
                addr.push({
                    forwarder: tempAddr
                });

            });
        }

        if (hasMoreDetail) {

            moreDetails.push({
                details: tempMoreDetail,
                columns: moreDetailColumns,
                address: tempAddr
            });
        }
        cb(moreDetails, hasMoreDetail);
    }

    /**
     * This function removes null in the address
     * @param tempAddr       addres array
     * @return -             formated array
     */

    function getAddressDetails(tempAddr, add, str1, salesOrg) {

        var i = 0;
        if (salesOrg == 'JP01') {

            //postal_code,region district city street street2 country
            if (add.postal_code != null) {
                tempAddr[str1 + 'Addr_' + i] = add.postal_code;
                i++;
            }
            if (add.region != null) {
                tempAddr[str1 + 'Addr_' + i] = add.region;
                i++;
            }
            if (add.district != null) {
                tempAddr[str1 + 'Addr_' + i] = add.district;
                i++;
            }
            if (add.city != null) {
                tempAddr[str1 + 'Addr_' + i] = add.city;
                i++;
            }
            if (add.street != null) {
                tempAddr[str1 + 'Addr_' + i] = add.street;
                i++;
            }
            if (add.street2 != null) {
                tempAddr[str1 + 'Addr_' + i] = add.street2;
                i++;
            }
            if (add.country != null) {
                tempAddr[str1 + 'Addr_' + i] = add.country;
                i++;
            }
        } else {
            //name2 name3 name4 street city postal_code country region
            if (add.name2 != null) {
                tempAddr[str1 + 'Addr_' + i] = add.name2;
                i++;
            }
            if (add.name3 != null) {
                tempAddr[str1 + 'Addr_' + i] = add.name3;
                i++;
            }
            if (add.name4 != null) {
                tempAddr[str1 + 'Addr_' + i] = add.name4;
                i++;
            }
            if (add.street != null) {
                tempAddr[str1 + 'Addr_' + i] = add.street;
                i++;
            }
            if (add.city != null) {
                tempAddr[str1 + 'Addr_' + i] = add.city;
                i++;
            }
            if (add.postal_code != null) {
                tempAddr[str1 + 'Addr_' + i] = add.postal_code;
                i++;
            }

            if (add.region != null) {
                tempAddr[str1 + 'Addr_' + i] = add.region;
                i++;
            }
            if (add.country != null) {
                tempAddr[str1 + 'Addr_' + i] = add.country;
                i++;
            }
        }
        return tempAddr;
    }

    /**
     * This function returns invoice amount for the given legacyorder no
     * @param legacyOrderNo   legacyorder no
     * @return -             invoice details
     */

    function getInvoicePrice(legacyOrderNo, cb) {
        DbPool.OSSDB(function(db) {
            var sqlString = "";
            var netInvoicePrice = 0;
            var netDlrInvoicePrice = 0;

            sqlString = "select unique net_invoice_price,net_dlr_invoice_price \
                           from backlog_delv                                   \
                          where legacy_order_no = :1 "
            db.execute(sqlString, [legacyOrderNo], function(err, result) {

                if (err) return cb(err, null);

                result.forEach(function(row, i) {
                    netInvoicePrice = netInvoicePrice + row.net_invoice_price;
                    netDlrInvoicePrice = netDlrInvoicePrice + row.net_dlr_invoice_price;

                });

                cb(null, netInvoicePrice, netDlrInvoicePrice);
            });
        });
    }

    /**
     * This function returns discount amount for the given legacyorder no
     * @param legacyOrderNo   legacyorder no
     * @param cust            customer(in,ex)
     * @param totNetPrice     total NetPrice
     * @return -             discount details
     */

    function getDiscount(legacyOrderNo, cust, totNetPrice, cb) {
        DbPool.OSSDB(function(db) {
            var sqlString = "";
            var discountAmount = 0;
            var discountPercentage = 0;
            var totallistExtPrice = 0;

            var totalNetPrice = 0;

            sqlString = "select b.item_no,b.quantity_ordered,b.order_price, b.line_total,             \
                                b.bundle_line_total,b.cal_disc,b.bundle_order_price                   \
                           from backlog_entry b                                                       \
                          where b.legacy_order_no = :1 "

            db.execute(sqlString, [legacyOrderNo], function(err, result) {
                if (err) return cb(err, null);

                result.forEach(function(price, i) {
                    var tempOrderPrice = 0;
                    var tempNetPrice = 0;

                    if (cust == "in") {

                        tempOrderPrice = price.order_price;
                        tempNetPrice = price.line_total;
                    } else if (cust == "ex") {

                        tempOrderPrice = price.bundle_order_price;
                        tempNetPrice = price.bundle_line_total;
                    }

                    var listExtPrice = tempOrderPrice * price.quantity_ordered;
                    var disValue = listExtPrice - tempNetPrice;

                    totallistExtPrice = totallistExtPrice + listExtPrice;

                    if (totallistExtPrice != 0) {
                        discountPercentage = 100 - ((totNetPrice / totallistExtPrice) * 100.0);
                    }

                    discountAmount = discountAmount + disValue;
                    if (discountPercentage < 0) {
                        discountPercentage = 0;
                    }
                    if (discountAmount < 0) {
                        discountAmount = 0;
                    }

                });

                cb(null, discountAmount, discountPercentage);
            });
        });
    }

    /**
     * This function returns account details
     * @param accDetailBinds  account details bind variables
     * @param inClauseVar1    inClauseVar1
     * @param inClauseVar2    inClauseVar2
     * @return -             account details
     */

    function getAccountDetails(accDetailBinds, inClauseVar1, inClauseVar2, cb) {
        DbPool.OSSDB(function(db) {
            var sqlString = "";
            sqlString = "select fo_name,fo_team,fo_manager,fo_email,account,account_manager,\
                                account_group_name,account_country,account_service_level,   \
                                sales_support_name,sales_support_email,sales_contact_name,  \
                                sales_contact_email,creation_date,bo_name, bo_email,key     \
                           from org_relation                                                \
                          where om_region = :1                                              \
                            and business_type = :2                                          \
                            and rtm = :3                                                    \
                            and customer_segment = :4                                       \
                            and account = :5                                                \
                            and key in (" + inClauseVar1 + ")                               \
                            and value in (" + inClauseVar2 + ")";
            console.log("sqlString account Details:" + sqlString);
            db.execute(sqlString, accDetailBinds, function(err, result) {
                if (err) return cb(err, null);

                cb(null, result);
            });
        });
    }

    /**
     * This function returns CreditHold Text
     * @param accDetailBinds  account details bind variables
     * @param creditHoldText  creditHoldText
     * @param creditStatus    creditStatus
     * @param creditApprovalDate    creditApprovalDate
     * @param creditApprovalDate    creditApprovalDate
     * @param paymentMethod    paymentMethod
     * @return -             CreditHold Text
     */

    function getCreditHoldText(creditHoldText, creditStatus, creditApprovalDate, paymentMethod, consolidatedStati) {
        creditHoldText = "";

        creditHoldText = config.CreditHoldsText[creditStatus];
        if ((creditApprovalDate != null) && (creditHoldText != "")) {
            creditHoldText = "Approved " + creditApprovalDate;
        }
        if ((creditHoldText != "") && ((paymentMethod == null) || (paymentMethod == "OpenInvoice"))) {
            creditHoldText = "Approved";
        }
        if (consolidatedStati != null && (consolidatedStati.match(/WFS:WFS-CAN/g))) {
            creditHoldText = "Rejected"
        }

        return creditHoldText;

    }

    /**
     * This function returns systemName for the given data_source
     * @param data_source  data_source
     * @return -             system Name
     */

    function getSystemName(systemName, data_source) {

        switch (data_source) {

            case "SAP-R00":
                systemName = "FUSION-US";
                break;
            case "SAPR00":
                systemName = "FUSION-US";
                break;
            case "SAP-R01C":
                systemName = "FUSION-EMEA";
                break;
            case "SAP-R01":
                systemName = "FUSION-EMEA";
                break;
            case "SAPR01":
                systemName = "FUSION-EMEA";
                break;
            case "SAP-R01E":
                systemName = "FUSION-EMEA (Euro Tunnel)";
                break;
            case "SAPR01E":
                systemName = "FUSION-EMEA (Euro Tunnel)";
                break;
            case "SAP-FAP":
                systemName = "FUSION-AP";
                break;
            case "SAPFAP":
                systemName = "FUSION-AP";
                break;
            case "SAP-CPO":
                systemName = "SAIL-EMEA";
                break;
            case "SAPCPO":
                systemName = "SAIL-EMEA";
                break;
            case "SAP-D7C":
                systemName = "SAP-D7-US";
                break;
            case "SAPD7C":
                systemName = "SAP-D7-US";
                break;
            case "SAP-CLP":
                systemName = "CALADO-CA/LA";
                break;
            case "SAPCLP":
                systemName = "CALADO-CA/LA";
                break;
            case "SAP-PAP":
                systemName = "REPL-SAP-AP";
                break;
            case "SAPPAP":
                systemName = "REPL-SAP-AP";
                break;
            case "VISTA":
                systemName = "VISTA-US";
                break;
            case "SAP-PN1":
                systemName = "NGOM";
                break;
            case "SAP-PO1":
                systemName = "NGOM";
                break;
            case "SAP-PJ1":
                systemName = "NGOM";
                break;
            case "SAP-NT1":
                systemName = "NGOM";
                break;
            case "SAP-NT2":
                systemName = "NGOM";
                break;
            case "SAP-NT3":
                systemName = "NGOM";
                break;
            case "SAP-DVL":
                systemName = "NGOM";
                break;
            case "SAP-PW1":
                systemName = "NGOM-SW";
                break;
            case "system3":
                systemName = "OMS-Sys3-EMEA";
                break;
            case "system7":
                systemName = "OMS-Sys7-EMEA";
                break;
            case "system10":
                systemName = "OMS-Sys10-EMEA";
                break;
            case "system40":
                systemName = "OMS-Sys40-EMEA";
                break;
            case "system59":
                systemName = "OMS-Sys59-EMEA";
                break;
            case "ise29":
                systemName = "OMS-Ise29-US";
                break;
            case "ise94":
                systemName = "OMS-Ise94-US";
                break;
            case "ise42":
                systemName = "OMS-CA";
                break;
            case "ise63":
                systemName = "OMS-LAR";
                break;
            case "coral":
                systemName = "OMS-AP";
                break;
            case "griffin":
                systemName = "OMS-JP";
                break;
            case "scout":
                systemName = "pmCpq-WW";
                break;
            case "SCOUT":
                systemName = "pmCpq-WW";
                break;
            case "compucom":
                systemName = "COMPUCOM-US";
                break;
            case "b2bis":
                systemName = "Indirect-Reseller-B2BIS";
                break;
            case "CaGlobal":
                systemName = "Custom-Advantage-WW";
                break;
            default:
                systemName = data_source;
        }
        return systemName;
    }
}
