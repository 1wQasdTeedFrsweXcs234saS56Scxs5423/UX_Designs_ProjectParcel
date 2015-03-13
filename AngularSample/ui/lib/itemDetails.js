var UserSysItem  = require('../lib/UserSysItemCode');
var config       = require('../config/config.js');
var Resp         = require('../lib/RespUtils.js');
var _            = require('underscore');
var bunyan    = require('bunyan');

var log          = new bunyan({
    name: 'ItemDetailWebService',
})
/**
 * This function returns the number of line items given order
 * @param orderNo       Response object
 * @param db            db connection object
 * @param cust          customer
 * @return -            count
 */

module.exports.getCount=function (order_no,db,cust,userSettings,cb){
    var sqlString = "";
    var bind_values=[];
    if (cust=='ex') {
        if(userSettings !=null) {
            bind_values = userSettings.bind.binds;
        }
    }
    bind_values.push(order_no)
    var bind_no=bind_values.length;

    sqlString ="select count(*) as count, \
                       i.legacy_order_no as order_no \
                       from backlog_item i,backlog_hdr h ";

    if(cust == 'ex') {
        sqlString=sqlString+",backlog_ids ids where h.legacy_order_no=i.legacy_order_no and h.legacy_order_no=ids.legacy_order_no";

    }
    if(cust == 'in') {
        sqlString=sqlString+" where h.legacy_order_no=i.legacy_order_no ";
    }

    if(cust=='ex') {
        sqlString=sqlString+" and i.is_valid='Y' and h.customer_order='Y' and "+"(" +userSettings.where +") ";
    }

    sqlString=sqlString+" and (h.order_no =:"+bind_no+" or h.legacy_order_no=:"+bind_no+")  ";
    sqlString=sqlString+" group by i.legacy_order_no";

    db.execute(sqlString,bind_values,function(err,result) {
        if (err) return cb(err, null);
        cb(err,result);
    });
}

/**
 * This function returns the  start and end row number
 * @param PageId       Page No
 * @param count        Total number of line items in an order
 * @param cust         customer
 * @return -           Array containing start and end row number
 */
module.exports.getStartAndEndRowNum=function(pageId,count, cust){

    var maxNum   = config.constants['MAX_NUM_ROWS'];
    var start_end=[];

    if (pageId == 1 ) {
        startRowNum = 1;
    } else {
        startRowNum = (pageId-1) * maxNum; var visitedItems = [];
            var newItems = [];
    }
    var totalCount = count;
    if (count > 1000) {
        msg="More then 1000 Items Present for this Order";
        endRowNum=pageId*maxNum;
    } else {
        endRowNum=count;
    }
    return [startRowNum,endRowNum];
}

/**
 * This function returns line item details
 * @param legacyOrderNo       Legacy_order_no
 * @param rownums             start and end row numbers
 * @param db                  db connection object
 * @param cust                customer
 * @return -                  Line item detail JSON object
 */

module.exports.getItemDetails=function(legacy_order_no,rownums,db,cust,cb) {

    var sqlString="";
    var visitedItems = [];
    var newItems=[];
    var startRowNum=rownums[0];
    var endRowNum=rownums[1];
    var indentaion_flag=0;
    sqlString = "select *                                                         \
                    from (select tmp.*,rownum rn                                  \
                             from (select bi.status,bi.item_subitem,bi.material_no,    \
                                         bi.product_descr, bi.stati, bi.system,       \
                                         bi.so_line_item_qty,bi.shipment_no,          \
                                         bi.sched_line_no, bi.sched_line_qty,         \
                                         bi.invo_actual,bi.invoice_no,                \
                                         bi.full_invoice_no, s.sched_ship_date,      \
                                         s.sched_delv_date,s.shipped_at, s.pod_at, \
                                         bi.customer_req_date,bi.big_deal_id,  bi.higher_level, bi.so_item_no,\
                                         bi.plant_code,bi.ship_from, bi.cancel_type,  dl.hpdeliveryno, \
                                         bi.sc_commit_date, ";
    if( cust == "ex") {
        sqlString=sqlString+"to_char(nvl((bi.bundle_dlr_price/bi.so_line_item_qty), 0), '999,999,999,999,999,999,999,999,990.99') AS net_price, \
                             to_char(nvl(bi.bundle_dlr_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_price ";
    }
    if(cust == "in") {
        sqlString=sqlString+"to_char(nvl((bi.net_price/bi.so_line_item_qty), 0), '999,999,999,999,999,999,999,999,990.99') AS net_price, \
                             to_char(nvl(bi.net_price, 0), '999,999,999,999,999,999,999,999,990.99') AS total_price ";

    }
    sqlString=sqlString+" from backlog_item bi,backlog_ship s, backlog_delv d  \
                          LEFT OUTER JOIN delivery dl ON (d.shipment_no = dl.shipmentno) \
                         where bi.legacy_order_no=s.legacy_order_no \
                           and bi.delivery_group = d.delivery_group  \
                           and d.shipment_group = s.shipment_group  \
                           and bi.legacy_order_no = :1 ";
    if( cust == "ex") {
        sqlString=sqlString+" and bi.is_valid='Y' and s.customer_order='Y'";
    }
    sqlString=sqlString+" order by bi.item_subitem,bi.item_sln) tmp   \
                             where  rownum <= :2 )                                \
                             where rn >=:3";


    db.execute(sqlString, [legacy_order_no, endRowNum, startRowNum], function(err, items) {
        log.info('sqlString for line item:' + sqlString);
        if (err) {
            //return Resp.sendError(res, log, err);
            log.error(err);
        }
        items.sort(exports.mycomparator);

        var Hirachy = {};
        if (cust == "in") {
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
                exports.getRejectionReason(uniqDataSources[0],db,function(err, rejectionCodesDesc) {
                    items.forEach(function(item, i) {
                        if (visitedItems.indexOf(item.item_subitem) == -1) {
                            var itemStatis = item.stati.split(" ");
                            var itemHoldCodes = []
                            for (var x = 0; x < itemStatis.length; x++) {
                                var key = itemStatis[x] + "|" + item.system;
                                if (HoldCodes[0][key] != null) {
                                    itemHoldCodes.push(HoldCodes[0][key]);
                                }
                            }
                            var cancel_code=[];
                            var cancel_code_desc="";

                            if(item.cancel_type!="" && item.cancel_type !=null) {
                                cancel_code=item.cancel_type.split(":");

                                if(rejectionCodesDesc != null || rejectionCodesDesc != undefined ) {

                                    if(rejectionCodesDesc[cancel_code[1]] != undefined ) {
                                        cancel_code_desc=rejectionCodesDesc[cancel_code[1]]
                                    }else {
                                        cancel_code_desc=cancel_code[1];
                                    }
                                } else {
                                    console.log("ff"+cancel_code[1]);
                                    cancel_code_desc=cancel_code[1];
                                }
                            }
                            //console.log(cancel_code_desc);
                            schedLines = [];
                            schedLines = exports.addInternalScheduleLine(schedLines,item,itemHoldCodes);
                            newItems=exports.addNewitems(newItems,item,Hirachy,cancel_code_desc);
                            if(Hirachy[item.so_item_no]>0) {

                                indentaion_flag=1
                            }
                        } else {
                            var itemHoldCodes = [];
                            var itemStatis = item.stati.split(" ");
                            var itemHoldCodes = []
                            for (var x = 0; x < itemStatis.length; x++) {
                                var key = itemStatis[x] + "|" + item.system;
                                if (HoldCodes[0][key] != null) {
                                    itemHoldCodes.push(HoldCodes[0][key]);
                                }
                            }
                            schedLines= exports.addInternalScheduleLine(schedLines,item,itemHoldCodes);
                        }
                        visitedItems.push(item.item_subitem);
                    });
                    delete items;
                    cb(null, newItems,indentaion_flag);
                });
            });
        } else {

            items.forEach(function(item, i) {
                if (visitedItems.indexOf(item.item_subitem) == -1) {
                    schedLines = [];
                    schedLines=exports.addExternalScheduleLine(schedLines,item);
                    newItems=exports.addNewitems(newItems,item,Hirachy);
                    if(Hirachy[item.so_item_no]>0) {
                        indentaion_flag=1
                    }
                } else {
                    schedLines=exports.addExternalScheduleLine(schedLines,item);
                }
                visitedItems.push(item.item_subitem);
            });
            delete items;
            cb(null, newItems,indentaion_flag);
        }
    });
}

module.exports.addNewitems=function (newItems,item,Hirachy,cancel_code_desc) {


    if (item.higher_level == 0 ) {
        Hirachy[item.so_item_no]=0;
    } else {
        if ( item.higher_level in Hirachy) {
            Hirachy[item.so_item_no] = Hirachy[item.higher_level] + 1;
        }
    }
    if (Hirachy[item.so_item_no] === undefined  ) {
        Hirachy[item.so_item_no]=0;
    }
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
        hpdeliveryno:item.hpdeliveryno,
        higher_level:item.higher_level,
        level_indent:Hirachy[item.so_item_no],
        cancellation_reason:cancel_code_desc,
        sc_commit_date:item.sc_commit_date,
        sched_Line: schedLines,
    });
    return newItems;
}

module.exports.addExternalScheduleLine=function(schedLines,item)  {

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
    });
    return schedLines;
}

module.exports.addInternalScheduleLine=function(schedLines,item,itemHoldCodes)  {
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
        Hold_Codes: itemHoldCodes
    });
    return schedLines;
}

module.exports.getRejectionReason=function(system,db,cb) {
    console.log(system);
    sqlString="select rejection_code, rejection_code_text from rejection_code_setup where  sapsystem=:1";
    db.execute(sqlString, [system], function(err, rejectionCodes) {
        var rejectionCodesDesc={};
        rejectionCodes.forEach(function(row, i) {
            rejectionCodesDesc[row.rejection_code]=row.rejection_code_text
        });
        cb(null,rejectionCodesDesc);
    });
}

module.exports.mycomparator=function(a,b) {
  return parseInt(a.item_subitem) - parseInt(b.item_subitem);

}
