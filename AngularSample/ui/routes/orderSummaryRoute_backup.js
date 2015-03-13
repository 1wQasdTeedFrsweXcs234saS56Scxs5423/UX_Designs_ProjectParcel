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

var augment   = require("../lib/augment.js")
var SqlUtils  = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2")
var PortalSec = require("../lib/PortalSecurity")
var DbPool    = require('../lib/DbPool');
var config    = require('../config/config.js');
var Resp      = require('../lib/RespUtils.js');
var tstore    = require('../lib/tstore');
var osconfig    = require('/etc/opt/oss/backend/UI.cfg');

var ts = new tstore.TStore( osconfig.UITstoreConnection )

var bunyan    = require('bunyan');

var log = new bunyan({
    name: 'OrderSummaryWebService',
});


/*----------------------------------------------------------------------------
|   OSSTSQuery  -   run tstore SQL where clause against the two partitions
|                   of the  main OSS TSTORE
|
|                   partition 1 : external/customer non-recent orders
|                   partition 2 : external/customer recent orders
|
\---------------------------------------------------------------------------*/
function OSSTSQuery (where, cb)
{
  if (where == '') return cb(null, '');

  ts.all(1, "select order_no from orders where "+where, function(err, legacyList1) {
    if (err) return cb(err);
    ts.all(2, "select order_no from orders where "+where, function(err, legacyList2) {
      if (err) return cb(err);

      var orders1 = legacyList1.replace(/','/g,'~').replace(/'/g,'').split('~')
      var orders2 = legacyList2.replace(/','/g,'~').replace(/'/g,'').split('~')

      if (orders1.length == 1  && orders1[0] == '') {
        orders1 = [];
      }

      if (orders2.length == 1  && orders2[0] == '') {
        orders2 = [];
      }


      if (orders1.length ==0) {
        var orders = orders2.sort()
      } else
      if (orders2.length ==0) {
        var orders = orders1.sort()
      } else {
        var orders = orders1.concat(orders2).sort()
      }

      if (orders.length == 0) {
          return cb('NonExistingOrder', "");  // dummy expression
      }
      if (orders.length > 500) {
         orders = orders.slice(0,500);
      }
      cb(null, ("'"+ orders.join("','") + "'"))
    })
  })
}


/*----------------------------------------------------------------------------
|  getCountExternal  - returns the total number of count based on filter
|                      criteria for External customer.
|
|  @param binds        Bind object
|  @param whereClause  Where clause object
|  @param db           connection object
|  @param res          response object
|
|  @return cb          call back function
|
\---------------------------------------------------------------------------*/
function getCountExternal(binds, whereClause, db, res, cb) {

    var sqlString = "";

    db.execute("select count(*) as count                                              \
                  from backlog_ship s, backlog_hdr, backlog_ids ids                   \
                 where backlog_hdr.legacy_order_no = s.legacy_order_no                \
                   and backlog_hdr.legacy_order_no = ids.legacy_order_no              \
                   and (s.is_valid = 'Y' or s.is_valid is null)                       \
                   and (backlog_hdr.is_valid = 'Y' or backlog_hdr.is_valid is null)   \
                   and backlog_hdr.customer_order = 'Y'                               \
                   and (" + whereClause + ")                                          \
                   ", binds, function(err, count) {
        if (err) {
            return Resp.sendError(res, log, err);
        }
        cb(err, count);
    });
}


/*----------------------------------------------------------------------------
|  getCountInternal  - returns the total number of count based on filter
|                      criteria for Internal customer.
|
|  @param binds        Bind object
|  @param whereClause  Where clause object
|  @param db           connection object
|  @param res          response object
|
|  @return cb          call back function
|
\---------------------------------------------------------------------------*/
function getCountInternal(binds, whereClause, db, res, cb) {

    var sqlString = "";

    db.execute("select count(*) as count \
                  from backlog_hdr,backlog_delv \
                 where backlog_hdr.legacy_order_no = backlog_delv.legacy_order_no \
                   and (" + whereClause + ") \
    ", binds, function(err, count) {
        if (err) {
            return Resp.sendError(res, log, err);
        }
        cb(err, count);
    });
}


/*----------------------------------------------------------------------------
|  getResponseMsg  - builds up the message that is returned to the response
|
|  @param msg   variable
|  @param req   request object
|
\---------------------------------------------------------------------------*/
function getResponseMsg (msg ,req) {

    if (req.query.custPoNo) {
        msg += ' PO#: ' + req.query.custPoNo +',';
    }
    if (req.query.hpOrderNo) {
        msg += ' Order#: ' + req.query.hpOrderNo +',';
    }
    if (req.query.shipmentNo) {
        msg += ' Shipment#: ' + req.query.shipmentNo +',';
    }
    if (req.query.status) {
        msg += ' Status: ' + req.query.status +',';
    }
    if (req.query.poDateFrom) {
        msg += ' Order Date From: ' + req.query.poDateFrom +',';
    }
    if (req.query.poDateTo) {
        msg += ' Order Date To: ' + req.query.poDateTo +',';
    }
    if (req.query.invoiceNo) {
        msg += ' Invoice#: ' + req.query.invoiceNo +',';
    }
    if (req.query.date) {
        msg += ' Recent: ' + req.query.date +'days,';
    }
    if (req.query.custId) {
        msg += ' Customer ID: ' + req.query.custId +',';
    }
    if (req.query.custName) {
        msg += ' Customer Name: ' + req.query.custName +',';
    }
    msg = msg.substring(0,msg.length-1);
    return msg;
}


/*----------------------------------------------------------------------------
|  getSummary  - get the results from Db based on filters
|
|  @param filter.binds   variable
|  @param where          variable
|  @param ts1            variable
|  @param db             variable
|  @param req            request object
|  @param res            response object
|
\---------------------------------------------------------------------------*/
function getSummary(filterBinds, where, ts1, db, req, res) {

    var maxNum = config.constants['MAX_NUM_ROWS'];
    var pageId = req.query.pageId;

    if (pageId == 1) {
        startRownum = 1;
    } else {
        startRownum = (pageId - 1) * maxNum;
    }
    var visitedOrders = [];
    var newOrder=[];

    getCountExternal(filterBinds, where, db, res, function(err, count) {
        if (err) {
            return Resp.sendError(res, log, err);
        }

        var  tdiff = Date.now() - ts1.getTime()
        console.log('DB 1 runtime : ' + tdiff + ' msec' );
        var totalCount = count[0].count;

        if (totalCount == 0) {
            var msg = 'No Orders found for search criteria';
            msg = getResponseMsg(msg,req);

            Resp.sendResponse(res, log, 'No Order summary details found.', msg, '');
        } else {
            if (totalCount > maxNum) {
                endRownum = maxNum;
            } else {
                endRownum = totalCount;
            }

            db.execute("select *                                      \
                          from (select backlog_hdr.purchase_order_no, \
                                       backlog_hdr.order_no,          \
                                       backlog_hdr.order_type_descr,  \
                                       CASE                           \
                                           WHEN s.status = 'Processing'  THEN 'Admin' \
                                           ELSE  s.status  \
                                       END as status,                 \
                                       s.quote_no,         \
                                       backlog_hdr.purch_order_date,  \
                                       s.pod_at,           \
                                       s.shipped_at,       \
                                       s.sched_delv_date,  \
                                       s.sched_ship_date,  \
                                       s.shipment_no,      \
                                       backlog_hdr.ship_to_addr_1,    \
                                       backlog_hdr.last_update,       \
                                       backlog_hdr.hp_receive_date,   \
                                       s.cust_delv_no,     \
                                       s.sdd_comment,      \
                                       CASE                           \
                                           WHEN s.sdd_comment is null  THEN to_char(s.sched_delv_date,'yyyy-mm-dd') \
                                           ELSE  s.sdd_comment \
                                       END as planned_delivery_date,      \
                                       CASE                               \
                                           WHEN s.sdd_comment is null  THEN to_char(s.sched_ship_date,'yyyy-mm-dd') \
                                           ELSE  s.sdd_comment \
                                       END as planned_ship_date,          \
                                       delivery.hpdeliveryno ,            \
                                       ROWNUM AS rn                       \
                                       from backlog_hdr,                  \
                                            backlog_ids ids,              \
                                            backlog_ship s LEFT OUTER JOIN delivery \
                                                              ON (s.shipment_no = delivery.shipmentno)     \
                                      where backlog_hdr.legacy_order_no = s.legacy_order_no                \
                                        and backlog_hdr.legacy_order_no = ids.legacy_order_no              \
                                        and (s.is_valid = 'Y' or s.is_valid is null)                       \
                                        and (backlog_hdr.is_valid = 'Y' or backlog_hdr.is_valid is null)   \
                                        and backlog_hdr.customer_order = 'Y'                               \
                                        and (" + where + ")                                                \
                                      order by backlog_hdr.order_no                                        \
                                   )                                                                       \
                         where rn >= " + startRownum + " and rownum <= " + endRownum + "                   \
                         ", filterBinds, function(err, summary) {
                if (err) {
                    return Resp.sendError(res, log, err);
                } else {
                    var  tdiff = Date.now() - ts1.getTime()
                    console.log('DB 2 runtime : '+ tdiff + ' msec');

                    var msg = '';
                    if (summary.length == 0) {
                        msg = 'No Orders found for search criteria';
                        msg = getResponseMsg(msg,req);
                    } else if (summary.length >= maxNum) {
                        msg = 'Search result exceeds more than ' + maxNum +' records Refine your search';
                    }
                    log.info('Summary' + summary);

                    for (var i=0; i<=summary.length-1; i++) {
                        if(visitedOrders.indexOf(summary[i].order_no ) == -1 ) {
                          schedLines = [];
                          schedLines=addExternalScheduleLine(schedLines,summary,i);
                          newOrder=addNewOrder(newOrder,summary,i);
                        } else {
                            schedLines=addExternalScheduleLine(schedLines,summary,i);
                        }
                        visitedOrders.push(summary[i]["order_no"]);
                    };
                    Resp.sendOrderResponse(res, log, 'Sending back Order Summary.', msg, pageId, maxNum, totalCount, newOrder);
                }
            });
        }
    });
}

/*------------------------------------------------------------------------------
|  addInternalScheduleLine  - get the schedule line from summary for internal
|
|  @param schedLines   variable
|  @param summary      variable
|  @param i            variable
|
\-------------------------------------------------------------------------------*/
function addInternalScheduleLine(schedLines,summary,i)  {
    schedLines.push({
        status: summary[i].status,
        pod_at: summary[i].pod_at,
        shipped_at: summary[i].shipped_at,
        sched_delv_date: summary[i].sched_delv_date,
        sched_ship_date: summary[i].sched_ship_date,
        shipment_no: summary[i].shipment_no,
        ship_to_addr_1: summary[i].ship_to_addr_1,
        quote_creation_date: summary[i].quote_creation_date,
        last_update: summary[i].last_update,
        hp_receive_date: summary[i].hp_receive_date,
        order_load_date: summary[i].order_load_date,
        clean_order_date: summary[i].clean_order_date,
        order_close_date: summary[i].order_close_date,
        cust_delv_no: summary[i].cust_delv_no,
        hpdeliveryno: summary[i].hpdeliveryno,

    });
    return schedLines;
}


/*------------------------------------------------------------------------------
|  addExternalScheduleLine  - get the schedule line from summary for external
|
|  @param schedLines   variable
|  @param summary      variable
|  @param i            variable
|
|\-------------------------------------------------------------------------------*/
function addExternalScheduleLine(schedLines,summary,i)  {
 schedLines.push({
        status: summary[i].status,
        pod_at: summary[i].pod_at,
        shipped_at: summary[i].shipped_at,
        sched_delv_date: summary[i].sched_delv_date,
        sched_ship_date: summary[i].sched_ship_date,
        shipment_no: summary[i].shipment_no,
        ship_to_addr_1: summary[i].ship_to_addr_1,
        last_update: summary[i].last_update,
        hp_receive_date: summary[i].hp_receive_date,
        cust_delv_no: summary[i].cust_delv_no,
        sdd_comment:summary[i].sdd_comment,
        planned_delivery_date:summary[i].planned_delivery_date,
        planned_ship_date: summary[i].planned_ship_date,
        hpdeliveryno: summary[i].hpdeliveryno,

    });
    return schedLines;
}


/*----------------------------------------------------------------------
|  addNewOrder  - get the unique order details from summary
|
|  @param schedLines   variable
|  @param summary      variable
|  @param i            variable
|
|\---------------------------------------------------------------------*/
function addNewOrder(newOrder,summary,i) {
    newOrder.push({
        purchase_order_no: summary[i].purchase_order_no,
        order_no: summary[i].order_no,
        order_type_descr: summary[i].order_type_descr,
        quote_no: summary[i].quote_no,
        purch_order_date: summary[i].purch_order_date,
        sched_Line: schedLines,
    });
    return newOrder;
}


module.exports.init = function(app) {

    /*----------------------------------------------------------------------------
    |   Internal OrderSummary Webservice.
    \---------------------------------------------------------------------------*/
    app.get('/ossui/v1/in/ordersummary', app.role(AuthGroupSandyUser), function(req, res) {

        //----------------------------------------------------------------------
        //   prepare ORACLE based filter
        //----------------------------------------------------------------------
        var filter = new SqlUtils.AndWhere();

        filter.addLike       (req.query.custPoNo,   "backlog_hdr.purchase_order_no");
        filter.addLike       (req.query.hpOrderNo,  "backlog_hdr.order_no"         );
        filter.addLike       (req.query.shipmentNo, "backlog_delv.shipment_no"     );
        filter.addEq         (req.query.status,     "backlog_delv.status"          );
        filter.addGtEq       (req.query.poDateFrom, "backlog_hdr.purch_order_date" );
        filter.addLtEq       (req.query.poDateTo,   "backlog_hdr.purch_order_date" );
        filter.addLike       (req.query.invoiceNo,  "backlog_delv.invoice_no"      );
        filter.addBetween    (req.query.date,       "backlog_hdr.purch_order_date" );
        filter.addIStartsWith(req.query.custName,   "backlog_hdr.customer_name"    );
        filter.addLike       (req.query.custId,     "backlog_hdr.customer_no"      );

        log.info('filter binds' + filter.binds);
        log.info('where clause' + filter.where);

        //----------------------------------------------------------------------
        //   prepare TSTORE based filter
        //----------------------------------------------------------------------
        var tsfilter = new SqlUtils.AndWhereDirect();

        tsfilter.addIStartsWith (req.query.custPoNo,   "purchase_order_no");
        tsfilter.addIStartsWith (req.query.hpOrderNo,  "order_no"         );
        tsfilter.addDateGtEq    (req.query.poDateFrom, "purch_order_date" );
        tsfilter.addDateLtEq    (req.query.poDateTo,   "purch_order_date" );
        tsfilter.addDateBetween (req.query.date,       "purch_order_date" );
        tsfilter.addIStartsWith (req.query.custName,   "customer_name"    );
        tsfilter.addIStartsWith (req.query.custId,     "customer_no"      );

        if (req.query.status) {
          console.log(req.query.status)
          if (req.query.status=="Processing")     tsfilter.addY("dg_processing" )
          if (req.query.status=="Acked")          tsfilter.addY("dg_acked"      )
          if (req.query.status=="Production")     tsfilter.addY("dg_production" )
          if (req.query.status=="ProductionDone") tsfilter.addY("dg_proddone"   )
          if (req.query.status=="FactShipped")    tsfilter.addY("dg_factshipped")
          if (req.query.status=="Registered")     tsfilter.addY("dg_registered" )
          if (req.query.status=="Shipped")        tsfilter.addY("dg_shipped"    )
          if (req.query.status=="Delivered")      tsfilter.addY("dg_delivered"  )
          if (req.query.status=="CANCELED")       tsfilter.addY("dg_canceled"   )
          if (req.query.status=="Submitted")      tsfilter.addY("dg_submitted"  )
        }
        console.log('TS where clause' + tsfilter.where);

        var maxNum = config.constants['MAX_NUM_ROWS'];
        var pageId = req.query.pageId;

        if (pageId == 1) {
            startRownum = 1;
        } else {
            startRownum = (pageId - 1) * maxNum;
        }
        var ts1 = new Date();
        var tdiff = Date.now() - ts1.getTime()
        console.log('DB 0 runtime : ' + tdiff + ' msec' );

        OSSTSQuery( tsfilter.where , function(tsErr, tsOrders) {
            if (tsErr) {
                return res.json({
                    status: 'E',
                    message: tsErr,
                    data: ''
                });
            }
            console.log('tsErr = '    +  tsErr    );
            console.log('tsOrders = ' +  tsOrders );

            if (tsOrders == '') {
                  var where = filter.where  // just plain basic ORACLE
              } else {
                  var where = '(' + filter.where + ') and ( backlog_hdr.legacy_order_no in ('+tsOrders+') )'
            }

            console.log('where = ' +  where );
            var visitedOrders = [];
            var newOrder=[];

          DbPool.OSSDB(function(db) {
            getCountInternal(filter.binds, where, db, res, function(err, count) {
                if (err) {
                    return Resp.sendError(res, log, err);
                }
                var  tdiff = Date.now() - ts1.getTime()
                console.log('DB 1 runtime : ' + tdiff + ' msec' );

                var totalCount = count[0].count;

                if (totalCount == 0) {
                    var msg = 'No Orders found for search criteria';
                    msg = getResponseMsg(msg,req);

                    Resp.sendResponse(res, log, 'No Order summary details found.', msg, '');
                } else {
                    console.log('totalCount='+totalCount);
                    if (totalCount > maxNum) {
                        endRownum = maxNum;
                    } else {
                        endRownum = totalCount;
                    }

                    db.execute("select *                                        \
                                  from (select backlog_hdr.purchase_order_no,   \
                                               backlog_hdr.order_no,            \
                                               backlog_hdr.order_type_descr,    \
                                               CASE                             \
                                                   WHEN backlog_delv.status = 'Processing'  THEN 'Admin / Processing'   \
                                                   WHEN backlog_delv.status = 'Acked' THEN 'Admin / Acked'              \
                                                   WHEN backlog_delv.status = 'FactShipped' THEN 'Shipped from Factory' \
                                                   WHEN backlog_delv.status = 'CustShipped' THEN 'Shipped to Customer'  \
                                                   WHEN backlog_delv.status = 'Shipped' THEN 'Shipped to Customer'      \
                                                   ELSE  backlog_delv.status             \
                                               END as status,                            \
                                               backlog_hdr.quote_no,                     \
                                               backlog_hdr.purch_order_date,             \
                                               backlog_delv.pod_actual as pod_at,        \
                                               backlog_delv.eshp_actual as shipped_at,   \
                                               backlog_delv.sched_delv_date,             \
                                               backlog_delv.sched_ship_date,             \
                                               backlog_delv.shipment_no,                 \
                                               backlog_hdr.ship_to_addr_1,               \
                                               backlog_hdr.quote_creation_date,          \
                                               backlog_hdr.last_update,                  \
                                               backlog_hdr.hp_receive_date,              \
                                               backlog_hdr.order_load_date,              \
                                               backlog_hdr.clean_order_date,             \
                                               backlog_hdr.order_close_date,             \
                                               backlog_delv.cust_delv_no,                \
                                               delivery.hpdeliveryno,                    \
                                               ROWNUM AS rn                              \
                                          from backlog_hdr,                              \
                                               backlog_delv LEFT OUTER JOIN delivery     \
                                                                         ON (backlog_delv.shipment_no = delivery.shipmentno) \
                                         where backlog_hdr.legacy_order_no = backlog_delv.legacy_order_no \
                                           and (" + where + ") order by backlog_hdr.order_no )     \
                                 where rn >= " + startRownum + " and rownum <= " + endRownum + "          \
                                 ", filter.binds, function(err, summary) {
                        if (err) {
                            return Resp.sendError(res, log, err);
                        } else {
                            var  tdiff = Date.now() - ts1.getTime()
                            console.log('DB 2 runtime : '+ tdiff + ' msec');

                            var msg = '';
                            if (summary.length == 0) {
                                msg = 'No Orders found for search criteria';
                                msg = getResponseMsg(msg,req);
                            } else if (summary.length >= maxNum) {
                                msg = 'Search result exceeds more than ' + maxNum +' records Refine your search';
                            }
                            log.info('summary' + summary);

                            for (var i=0; i<=summary.length-1; i++) {
                                if(visitedOrders.indexOf(summary[i].order_no ) == -1 ) {
                                    schedLines = [];
                                    schedLines=addInternalScheduleLine(schedLines,summary,i);
                                    newOrder=addNewOrder(newOrder,summary,i);
                                } else {
                                    schedLines=addInternalScheduleLine(schedLines,summary,i);
                                }
                                visitedOrders.push(summary[i]["order_no"]);
                            };
                            Resp.sendOrderResponse(res, log, 'Sending back Order Summary.', msg, pageId, maxNum, totalCount, newOrder);
                        }
                    });
                }
            });
          });
        });
    });


    /*----------------------------------------------------------------------------
    |   External OrderSummary Webservice.
    \---------------------------------------------------------------------------*/
    app.get('/ossui/v1/ex/ordersummary', app.role(AuthGroupExternal), function(req, res) {

        //----------------------------------------------------------------------
        //   prepare ORACLE based filter
        //----------------------------------------------------------------------
        var filter = new SqlUtils.AndWhere();

        filter.addLike   (req.query.custPoNo,   "s.customer_po_no"  )
        filter.addLike   (req.query.hpOrderNo,  "s.order_no"        )
        filter.addLike   (req.query.shipmentNo, "s.shipment_no"     )
        filter.addEq     (req.query.status,     "s.status "         )
        filter.addGtEq   (req.query.poDateFrom, "s.purch_order_date")
        filter.addLtEq   (req.query.poDateTo,   "s.purch_order_date")
        filter.addLike   (req.query.invoiceNo,  "s.invoice_no"      )
        filter.addBetween(req.query.date,       "backlog_hdr.purch_order_date" )
        filter.addLike   (req.query.custName,   "s.customer_name"   )
        filter.addLike   (req.query.custId,     "s.customer_no"     )

        //----------------------------------------------------------------------
        //   prepare TSTORE based filter
        //----------------------------------------------------------------------
        var tsfilter = new SqlUtils.AndWhereDirect();

        tsfilter.addIStartsWith (req.query.custPoNo,   "purchase_order_no");
        tsfilter.addIStartsWith (req.query.hpOrderNo,  "order_no"         );
        tsfilter.addDateGtEq    (req.query.poDateFrom, "purch_order_date" );
        tsfilter.addDateLtEq    (req.query.poDateTo,   "purch_order_date" );
        tsfilter.addDateBetween (req.query.date,       "purch_order_date" );
        tsfilter.addIStartsWith (req.query.custName,   "customer_name"    );
        tsfilter.addIStartsWith (req.query.custId,     "customer_no"      );

        if (req.query.status) {
          console.log(req.query.status)
          if (req.query.status=="Processing")     tsfilter.addY("sg_processing"   )
          if (req.query.status=="Production")     tsfilter.addY("sg_production"   )
          if (req.query.status=="ProductionDone") tsfilter.addY("sg_proddone"     )
          if (req.query.status=="Consolidation")  tsfilter.addY("sg_consolidation")
          if (req.query.status=="Shipped")        tsfilter.addY("sg_shipped"      )
          if (req.query.status=="Delivered")      tsfilter.addY("sg_delivered"    )
          if (req.query.status=="CANCELED")       tsfilter.addY("sg_canceled"     )
          if (req.query.status=="Submitted")      tsfilter.addY("sg_submitted"    )
        }
        console.log('TS where clause' + tsfilter.where);
        log.info('filter binds ' + filter.binds);
        log.info('where clause ' + filter.where);

        console.log('filter.binds:')
        console.log(filter.binds)
        console.log(filter)

        var b = new SqlUtils2.Bind( filter.bindNo );

        var ts1 = new Date();

        DbPool.OSSDB(function(db) {

        PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {
            if (err) {
              return Resp.sendError(res, log, err);
            }

            //-- combine adhoc filters with fixed portal security where clause parts
            console.log('userSettings:');
            console.log(userSettings);
            console.log('userSettingsTS:');
            console.log(userSettingsTS);
            console.log('tsPossible: '+tsPossible)
            console.log('filter: ')
            console.log(filter)

            filter.binds = filter.binds.concat( userSettings.bind.binds );
            filter.where = " ( " + filter.where + " ) and ( " + userSettings.where + " ) "

            console.log('filter combined with portal security filter:')
            console.log(filter)

            var ts1 = new Date();

            //-- combine tstore filter with fixed portal security where clause parts

            if (tsPossible == true) {

                if (tsfilter.where != ''){

                    tsfilter.where = " ( " + tsfilter.where + " ) and ( " + userSettingsTS.where + " ) and is_valid_order = 'Y'"

                    console.log('tstore filter combined with portal security filter:');
                    console.log(tsfilter);

                    var tdiff = Date.now() - ts1.getTime()
                    console.log('DB 0 runtime : ' + tdiff + ' msec' );

                    OSSTSQuery( tsfilter.where , function(tsErr, tsOrders) {
                        if (tsErr) {
                            return res.json({
                                status: 'E',
                                message: tsErr,
                                data: ''
                            });
                        }
                        console.log('tsErr = '    +  tsErr    );
                        console.log('tsOrders = ' +  tsOrders );

                        if (tsOrders == undefined) {
                            return res.json({
                                status: 'S',
                                message: "Too many orders found. Please refine your search criteria.",
                                data: ''
                            });
                        } else if (tsOrders == '') {
                            var where = filter.where  // just plain basic ORACLE
                        } else {
                            var where = '(' + filter.where + ') and ( backlog_hdr.legacy_order_no in ('+tsOrders+') )'
                        }

                        console.log('where = ' +  where );
                        getSummary(filter.binds, where, ts1, db, req, res);
                    });
                } else {
                    var where = filter.where  // just plain basic ORACLE
                    getSummary(filter.binds, where, ts1, db, req, res);
                }
            } else {
                var where = filter.where  // just plain basic ORACLE
                getSummary(filter.binds, where, ts1, db, req, res);
            }
        });
        });
    });
  }
