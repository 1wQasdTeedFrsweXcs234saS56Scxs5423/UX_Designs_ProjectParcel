/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/orderdetail
|   This webservice will return the order details for the given HP
|   leagacy order number or Hp order no. The service will return the below details:
|       1.  Order Header Details
|       2.  Line Item  Details
|
|
|   written by Jochen Loewer and Fouzia Nishath
|   April 2013
|
\---------------------------------------------------------------------------*/

var DbPool = require('../lib/DbPool');
var UserSys = require('../lib/userSysSetupText');
var UserSysItem = require('../lib/UserSysItemCode');
var config = require('../config/config.js');
var Resp = require('../lib/RespUtils.js')
var _ = require('underscore');
var bunyan = require('bunyan');

var log = new bunyan({
    name: 'OrderDetailWebService',
});
/**
 * This function calls intenal webservice
 * @param app       Application object
 * @return -        JSON object
 */
module.exports.init = function(app) {

    var order = {};
    log.info('registering /ossui/v1/orderdetail/ ...');

    app.get('/ossui/v1/in/orderdetail', app.role(AuthGroupSandyUser), function(req, res) {
        var cust = "in";
        DbPool.OSSDB(function(db) {
            log.info('Getting header details...');
            getHeaderDeatils(req.query.oid, db, cust, function(err, hdr) {

                if (err) return Resp.sendError(res, log, err);

                if (hdr.length == 0) {
                    var msg = "No details found for order1#: " + req.query.oid;
                    //return Resp.sendResponse(res, log, msg, msg, '');
                    res.json({
                                'status': 'N',
                                'message': msg,
                                'data': '',
                            });
                }
                if(hdr.length != 0){
                  getCount(req.query.oid, db, cust, function(err, result) {

                      if (err) return Resp.sendError(res, log, err);

                      var endRowNum = 1;
                      var startRowNum = 1;
                      var msg = "";
                      var pageId = req.query.pageId;
                      var totalCount = result[0]['count'];
                      var maxNum = config.constants['MAX_NUM_ROWS'];
                      var rownums = getStartAndEndRowNum(pageId, result[0]['count'], "in");

                      getItemDetails(result[0]['order_no'], rownums, db, cust, function(err, newItems) {

                          if (err) {
                              log.error(err);
                              return Resp.sendError(res, log, err);
                          } else {
                              res.json({
                                  'status': 'S',
                                  'message': msg,
                                  'pageNo': pageId,
                                  'pageSize': maxNum,
                                  'recordCount': totalCount,
                                  'header': hdr,
                                  'data': newItems,
                              });
                          }
                      }); //items
                  }); //count
                }
            }); //hdr
        }); //db
    }); //app

    /**
     * This function calls external webservice
     * @param app       Application object
     * @return -        JSON object
     */
    var order = {};
    log.info('registering /ossui/v1/orderdetail/ ...');

    app.get('/ossui/v1/ex/orderdetail', app.role(AuthGroupExternal), function(req, res) {
        var cust = "ex";
        DbPool.OSSDB(function(db) {
            log.info('Getting header details...');
            getHeaderDeatils(req.query.oid, db, cust, function(err, hdr) {

                if (err) return Resp.sendError(res, log, err);

                if (hdr.length == 0) {
                    var msg = "No details found for order#: " + req.query.oid;

                    res.json({
                                'status': 'N',
                                'message': msg,
                                'data': '',
                            });
                }
                if(hdr.length != 0){
                  getCount(req.query.oid, db, cust, function(err, result) {

                      if (err) return Resp.sendError(res, log, err);

                      var endRowNum = 1;
                      var startRowNum = 1;
                      var msg = "";
                      var pageId = req.query.pageId;
                      var totalCount = result[0]['count'];
                      var maxNum = config.constants['MAX_NUM_ROWS'];
                      var rownums = getStartAndEndRowNum(pageId, totalCount, "ex");
                      getItemDetails(result[0]['order_no'], rownums, db, cust, function(err, newItems) {

                          if (err) {
                              log.error(err);
                              return Resp.sendError(res, log, err);
                          } else {
                              //Resp.sendOrderResponse(res, log, 'Sending back Item Details.', msg, pageId, maxNum, totalCount, newItems);
                              res.json({
                                  'status': 'S',
                                  'message': msg,
                                  'pageNo': pageId,
                                  'pageSize': maxNum,
                                  'recordCount': totalCount,
                                  'header': hdr,
                                  'data': newItems,
                              });
                          }
                      }); //items
                  }); //count
                }
            }); //hdr
        }); //d
    }); //app

    /**
     * This function returns the number of line items given order
     * @param orderNo       Response object
     * @param db            db connection object
     * @param cust          customer
     * @return -            count
     */

    function getCount(orderNo, db, cust, cb) {
        var sqlString = "";
        sqlString = "select count(*) as count,                    \
                            i.legacy_order_no as order_no         \
                       from backlog_item i,backlog_hdr h          \
                      where (h.legacy_order_no=i.legacy_order_no) \
                        and (h.order_no =:1  or h.legacy_order_no=:1) ";

        if (cust == 'ex') {
            sqlString = sqlString + " and i.is_valid='Y'"
        }
        sqlString = sqlString + " group by i.legacy_order_no";

        db.execute(sqlString, [orderNo], function(err, result) {
            if (err) return cb(err, null);
            cb(null, result);
        });
    }
    /**
     * This function returns the  start and end row number
     * @param PageId       Page No
     * @param count        Total number of line items in an order
     * @param cust         customer
     * @return -           Array containing start and end row number
     */

    function getStartAndEndRowNum(pageId, count, cust) {

        var maxNum = config.constants['MAX_NUM_ROWS'];

        var start_end = [];

        if (pageId == 1) {
            startRowNum = 1;
        } else {
            startRowNum = (pageId - 1) * maxNum;
            var visitedItems = [];
            var newItems = [];
        }
        var totalCount = count;
        getItemDetails
        if (count > 1000) {
            msg = "More then 1000 Items Present for this Order";
            endRowNum = pageId * maxNum;
        } else {
            endRowNum = count;
        }
        return [startRowNum, endRowNum];

    }
    /**
     * This function returns order header comments
     * @param legacyOrderNo       Legacy_order_no
     * @param db                  db connection object
     * @param cust                customer
     * @return -                  comments
     */

    function getComments(legacyOrderNo, db, cust, cb) {
        log.info("legacyOrderNo:" + legacyOrderNo)
        var sqlString = "";
        var comments = {};
        headerComments = [];
        log.info("Getting order comments....")
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
            log.info("sqlString for order comments:" + sqlString)
            commentsResult.forEach(function(comment, i) {
                if (err) return cb(err, null);
                if (comment.name != null) {
                    comments = {
                        key: comment.name,
                        value: comment.comment_text
                    }
                }
                if (comment.sap_text_name != null) {
                    comments = {
                        key: comment.sap_text_name,
                        value: comment.comment_text
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
     * @return -                  header detail JSON object
     */

    function getHeaderDeatils(legacyOrderNo, db, cust, cb) {
        var sqlString = "";
        var comments = {};
        var holdCode = {};
        var consolidatedStati = "";
        var dataSource = "";
        var lorderNo;
        var soldToWcc, shipToWcc = "";
        var tempShipToAddr = {};
        var tempSoldToAddr = {};
        var soldToAddress = [];
        var shipToAddress = [];
        var strShipAdd1 = "",
            strShipAdd2 = "",
            strShipAdd3 = "",
            strShipAdd4 = "",
            strShipAdd5 = "",
            strShipAdd6 = "";
        var strSoldAdd1 = "",
            strSoldAdd2 = "",
            strSoldAdd3 = "",
            strSoldAdd4 = "",
            strSoldAdd5 = "";
        var i = 0,
            k = 0;
        var shipTo = "";
        var soldTo = "";
        var orderType = "",
            orderDesc = "";
        var deliveryType = "";
        var completeDelivery = "";
        var cdCode = "";
        var hdr = {};
        if (cust == "in") {
            sqlString = "Select backlog_hdr.legacy_order_no       AS oid,                 \
                                backlog_hdr.order_load_date       AS orderloaddate ,      \
                                backlog_hdr.purchase_order_no     AS PO_No,               \
                                backlog_hdr.order_no              AS HP_Order_No ,        \
                                backlog_hdr.sales_org             AS Sales_Org ,          \
                                to_char(nvl(backlog_hdr.total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS Total_Order_Value,    \
                                to_char(nvl(backlog_hdr.dlr_total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS dlr_total_price,    \
                                to_char(nvl(backlog_hdr.total_net_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_net_price,    \
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
                                to_char(nvl(backlog_hdr.tax_value, 0), '999,999,999,999,999,999,999,999,990.99') AS tax,    \
                                to_char(nvl(backlog_hdr.freight_charge, 0), '999,999,999,999,999,999,999,999,990.99') AS Shipping_Charges,    \
                                backlog_hdr.payment_terms         AS Payment_Terms,       \
                                backlog_hdr.payment_terms_descr   AS payment_terms_descr, \
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
                                backlog_hdr.sold_to_wcc           AS sold_to_wcc          \
                          from  backlog_hdr                                               \
                         where  backlog_hdr.legacy_order_no  =:1 or backlog_hdr.order_no = :1 "
        }
        if (cust == "ex") {
            sqlString = "Select backlog_hdr.legacy_order_no       AS oid,                 \
                                backlog_hdr.purchase_order_no     AS PO_No,               \
                                backlog_hdr.order_no              AS HP_Order_No ,        \
                                to_char(nvl(backlog_hdr.total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS Total_Order_Value,    \
                                to_char(nvl(backlog_hdr.dlr_total_price, 0), '999,999,999,999,999,999,999,999,990.99') AS dlr_total_price,    \
                                to_char(nvl(backlog_hdr.total_net_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_net_price,    \
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
                                to_char(nvl(backlog_hdr.tax_value, 0), '999,999,999,999,999,999,999,999,990.99') AS tax,    \
                                to_char(nvl(backlog_hdr.freight_charge, 0), '999,999,999,999,999,999,999,999,990.99') AS Shipping_Charges,    \
                                backlog_hdr.payment_terms         AS Payment_Terms,       \
                                backlog_hdr.payment_terms_descr   AS payment_terms_descr, \
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
                                backlog_hdr.sold_to_wcc           AS sold_to_wcc          \
                          from  backlog_hdr                                               \
                         where  (backlog_hdr.legacy_order_no  =:1 or backlog_hdr.order_no = :1) \
                           and  (backlog_hdr.is_valid = 'Y' or backlog_hdr.is_valid is null) \
                           and  backlog_hdr.customer_order = 'Y' "
        }
        db.execute(sqlString, [legacyOrderNo], function(err, hdr) {

            log.info("sqlString for header details:" + sqlString)
            if (err) {
                cb(err, null);
                log.error(err);
            }
            if (hdr.length == 0) {
                cb(null, hdr);
                log.error(err);
            }
            if (cust == "ex") {
                deliveryType = "Partial allow";

            }
            if(hdr.length !=0){
              hdr.forEach(function(row, i) {
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
                      if (deliveryType != null) {
                          deliveryType = deliveryType;
                      } else {
                          deliveryType = "Partial allow";
                          if (((cdCode != "00") && (cdCode != null) && (cdCode != "N")) || (completeDelivery == "Y")) {
                              deliveryType = "Complete delivery";
                          }
                          if ((consolidatedStati.match(/DropShp/g)) == 'DropShp') {
                              deliveryType = " - Drop shipment "
                          }

                      }
                  }
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
                  getCountryNameByWCC(soldToWcc, function(err, soldToCountryName) {
                      getCountryNameByWCC(shipToWcc, function(err, shipToCountryName) {
                          shipToCountry = soldToCountryName;
                          soldToCountry = shipToCountryName;
                          if ((shipTo != null) && (shipToCountry != null)) {
                              if (shipTo.toUpperCase() != shipToCountry.toUpperCase()) {
                                  tempShipToAddr['ship_to_addr_' + i] = shipToCountry;
                              }
                          }
                          if ((shipTo != null) && (shipToCountry != null)) {
                              if (soldTo.toUpperCase() != soldToCountry.toUpperCase()) {
                                  tempSoldToAddr['sold_to_addr_' + k] = soldToCountry;
                              }
                          }
                      }); //getCountryNameByWCC
                  }); //getCountryNameByWCC
              });//hdr

              shipToAddress.push(tempShipToAddr);
              soldToAddress.push(tempSoldToAddr);
              hdr[0]['sold_To_Address'] = soldToAddress;
              hdr[0]['ship_To_Address'] = shipToAddress;
              hdr[0]['order_type'] = orderType;
              hdr[0]['delivery_type'] = deliveryType;
              if ((consolidatedStati != null) && (cust == "in")) {
                  UserSys.getHoldCode(consolidatedStati, dataSource, db, function(err, holdCode) {
                      if (err) {
                          log.error(err);
                          return cb(err, null)
                      }
                      if (holdCode.length != 0) {
                          hdr[0]['Hold_Codes'] = holdCode;
                      }
                  }); //getHoldCod
              }
              getComments(lorderNo, db, cust, function(err, comments) {
                  if (comments.length != 0) {
                      hdr[0]['Comments'] = comments;
                  }
              });//getComments
              cb(null, hdr);
          }
        });//db execute
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
            sqlString = "Select country_name from country where hp_code = :1 "
            db.execute(sqlString, [wcc], function(err, countryname) {
                if (err) return cb(err, null);
                countryname.forEach(function(row, i) {
                    countryName = row.country_name;
                });
                console.log(countryName)
                cb(null, countryName);
            });
        });
    }
    /**
     * This function returns line item details
     * @param legacyOrderNo       Legacy_order_no
     * @param rownums             start and end row numbers
     * @param db                  db connection object
     * @param cust                customer
     * @return -                  Line item detail JSON object
     */

    function getItemDetails(legacyOrderNo, rownums, db, cust, cb) {

        var sqlString = "";
        var visitedItems = [];
        var newItems = [];
        var startRowNum = rownums[0];
        var endRowNum = rownums[1];

        if (cust == "ex") {
            sqlString = "select *                                                          \
                           from (select tmp.*,rownum rn                                    \
                                 from (select bi.status,bi.item_subitem,bi.material_no,    \
                                              bi.product_descr, bi.stati, bi.system,       \
                                              bi.so_line_item_qty,bi.shipment_no,          \
                                              bi.sched_line_no, bi.sched_line_qty,         \
                                              bi.invo_actual,bi.invoice_no,                \
                                              bi.full_invoice_no, bs.sched_ship_date,      \
                                              bs.sched_delv_date,bs.shipped_at, bs.pod_at, \
                                              bi.customer_req_date,bi.big_deal_id,         \
                                              bi.plant_code,bi.ship_from,                  \
                                              to_char(nvl((bi.bundle_dlr_price/bi.so_line_item_qty), 0), '999,999,999,999,999,999,999,999,990.99') AS net_price, \
                                              to_char(nvl(bi.bundle_dlr_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_price \
                                         from backlog_item bi,backlog_ship bs, backlog_delv d  \
                                        where bi.legacy_order_no=bs.legacy_order_no        \
                                          and bi.delivery_group = d.delivery_group         \
                                          and d.shipment_group = bs.shipment_group         \
                                          and bi.legacy_order_no = :1                      \
                                          and bi.is_valid='Y'                              \
                                     order by to_number(bi.item_subitem),                  \
                                              bi.item_sln) tmp                             \
                                where  rownum <= :2 )                                      \
                         where rn >=:3";
        }
        if (cust == "in") {
            sqlString = "select *                                         \
                           from (select tmp.*, rownum rn                   \
                                   from (select bi.status,bi.item_subitem, \
                                                bi.material_no,bi.product_descr,        \
                                                bi.stati,bi.system,bi.so_line_item_qty, \
                                                bi.shipment_no,bi.sched_line_no,        \
                                                bi.sched_line_qty,bi.invo_actual,       \
                                                bi.invoice_no,bi.full_invoice_no,       \
                                                bs.sched_ship_date,bs.sched_delv_date,  \
                                                bs.shipped_at,bs.pod_at,bi.big_deal_id, \
                                                bi.customer_req_date,bi.plant_code,bi.ship_from, \
                                                to_char(nvl((bi.net_price/bi.so_line_item_qty), 0), '999,999,999,999,999,999,999,999,990.99') AS net_price, \
                                                to_char(nvl(bi.net_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_price \
                                           from backlog_item bi,backlog_ship bs, backlog_delv d  \
                                          where bi.legacy_order_no=bs.legacy_order_no   \
                                            and bi.delivery_group = d.delivery_group    \
                                            and d.shipment_group = bs.shipment_group    \
                                            and bi.legacy_order_no = :1                 \
                                       order by to_number(bi.item_subitem), bi.item_sln) tmp \
                                where rownum <= :2) \
                          where rn >=:3";
        }

        db.execute(sqlString, [legacyOrderNo, endRowNum, startRowNum], function(err, items) {
            log.info('sqlString for line item:' + sqlString);
            if (err) {
                cb(err, null);
                log.error(err);
            }
            var uniqStati = [],
                uniqDataSources = [];
            _.each(items, function(item) {
                if (item.stati == null) {
                    item.stati = ' ';
                }
                uniqStati = _.union(uniqStati, item.stati.split(" "));
                uniqDataSources = _.union(uniqDataSources, item.system);
            });
            UserSysItem.getItemHoldCode(uniqStati, uniqDataSources, db, function(err, HoldCodes) {
                if (err) {
                    return Resp.sendError(res, log, err);
                    log.error(err);
                }
                items.forEach(function(item, i) {
                    if (visitedItems.indexOf(item.item_subitem) == -1) {
                        var itemStatis = item.stati.split(" ");
                        var itemHoldCodes = []
                        for (var x = 0; x < itemStatis.length; x++) {
                            var key = itemStatis[x] + "|" + item.system;
                            if (cust != "ex") {
                                if (HoldCodes[0][key] != null) {
                                    itemHoldCodes.push(HoldCodes[0][key]);
                                }
                            }
                        }
                        schedLines = [];
                        schedLines.push({
                            status: item.status,
                            qty: item.sched_line_qty,
                            sched_line_no: item.sched_line_no,
                            ship_date: item.shipped_at,
                            planned_delivery_date: item.sched_delv_date,
                            actual_ship_date: item.shipped_at,
                            invoice_no: item.invoice_no,
                            inv_date: item.invo_actual,
                            planned_ship_date: item.sched_ship_date,
                            actual_delivery_date: item.pod_at,
                            shipment_no: item.shipment_no,
                            Hold_Codes: itemHoldCodes,
                        });
                        newItems.push({
                            item_subitem: item.item_subitem,
                            product_no: item.material_no,
                            description: item.product_descr,
                            order_qty: item.so_line_item_qty,
                            system: item.system,
                            request_date: item.customer_req_date,
                            deal_id: item.big_deal_id,
                            list_unit_price: item.net_price,
                            net_line_price: item.total_price,
                            full_invoice_no: item.full_invoice_no,
                            data_source: item.system,
                            sched_Line: schedLines,
                        });
                    } else {
                        var itemHoldCodes = [];
                        var itemStatis = item.stati.split(" ");
                        var itemHoldCodes = []
                        for (var x = 0; x < itemStatis.length; x++) {
                            var key = itemStatis[x] + "|" + item.system;
                            if (cust != "ex") {
                                if (HoldCodes[0][key] != null) {
                                    itemHoldCodes.push(HoldCodes[0][key]);
                                }
                            }
                        }
                        schedLines.push({
                            status: item.status,
                            qty: item.sched_line_qty,
                            sched_line_no: item.sched_line_no,
                            ship_date: item.shipped_at,
                            planned_delivery_date: item.sched_delv_date,
                            actual_ship_date: item.shipped_at,
                            invoice_no: item.invoice_no,
                            inv_date: item.invo_actual,
                            planned_ship_date: item.sched_ship_date,
                            actual_delivery_date: item.pod_at,
                            shipment_no: item.shipment_no,
                            Hold_Codes: itemHoldCodes,
                        });
                    }
                    visitedItems.push(item.item_subitem);
                });
                delete items;
                cb(null, newItems);
            });

        });
    }
}
