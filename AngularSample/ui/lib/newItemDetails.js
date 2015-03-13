var UserSysItem  = require('../lib/UserSysItemCode');
var config = require('../config/config.js');
var Resp = require('../lib/RespUtils.js');
var _  = require('underscore');
var bunyan = require('bunyan');
var pricingDetails = require('../lib/pricingDetail');

var log          = new bunyan({
    name: 'ItemDetailWebService',
})

var CompleteBundlePrice = 0.00;
var noBundleItemCount=0;
var bundleTotalPrice="";
var haveConfigID=0;
var haveBundleID=0;
var haveConfigUID=0;
var firstHigherLevel=[];

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

    console.log(sqlString);

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

module.exports.getItemDetails=function(legacy_order_no,db,cust,cb) {

    var sqlString="";
    var visitedItems = [];
    var newItems=[];
    var visitedBundles=[];
    var BundleItems={};
    BundleItems["NoBundle"]=[];
    noBundleItemCount=0;
    firstHigherLevel=[];

    var indentaion_flag=0;
    sqlString = "select bi.status,bi.item_subitem,bi.material_no,    \
                                         bi.product_descr, bi.stati, bi.system,       \
                                         bi.so_line_item_qty,bi.shipment_no,          \
                                         bi.sched_line_no, bi.sched_line_qty,         \
                                         bi.invo_actual,bi.invoice_no, bi.bundle_price, \
                                         bi.bundle_id , bi.bundle_name, bi.config_id,bi.config_uid,  \
                                         bi.full_invoice_no, s.sched_ship_date,      \
                                         s.sched_delv_date,s.shipped_at, s.pod_at, \
                                         bi.customer_req_date,bi.big_deal_id,  bi.higher_level, bi.so_item_no,\
                                         bi.plant_code,bi.ship_from, bi.cancel_type, bi.cancellation_reason, dl.hpdeliveryno, \
                                         bi.sc_commit_date, bi.entitlement_id,bi.billing_plan,bi.eshp_actual, \
                                         bi.pgi_actual, bi.last_price_date, bi.canceled_at,bi.currency, ";
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
    sqlString=sqlString+" order by bi.item_subitem,bi.item_sln";


    db.execute(sqlString, [legacy_order_no], function(err, items) {
        log.info('sqlString for line item:' + sqlString);
        if (err) {
            //return Resp.sendError(res, log, err);
            log.error(err);
        }
        items.sort(exports.mycomparator);
        var hierarchyItems={};

        var Hirachy = {};
        var uniqStati = [],
        uniqDataSources = [],
        uniqDeliveyNos=[];
        _.each(items, function(item) {
            if (item.stati == null) {
                item.stati = ' ';
            }
            uniqStati = _.union(uniqStati, item.stati.split(" "));
            uniqDataSources = _.union(uniqDataSources, item.system);
            uniqDeliveyNos=_.union(uniqDeliveyNos,item.hpdeliveryno);

            if(item.bundle_id!=null) {
                haveBundleID=1;
            }
            if(item.config_id!=null) {
                haveConfigID=1;
            }
            if(item.config_uid!=null) {
                haveConfigUID=1;
            }
            hierarchyItems[item.item_subitem]=item.higher_level;
        });

        var heirarchyStructure={};

        Object.keys(hierarchyItems).forEach(function(k) {
            heirarchyStructure[k]=[];
            Object.keys(hierarchyItems).forEach(function(key) {
                if(k==hierarchyItems[key]) {
                    heirarchyStructure[k].push(key);
                }
            })
            if(heirarchyStructure[k].length == 0) {
                delete heirarchyStructure[k];
            }
        });
        var uniqStatiJoin = uniqStati.join("','");
        var uniqDataSourcesJoin=uniqDataSources.join("','");
        exports.getProductChars(legacy_order_no,db,function(err,itemChars) {
            exports.getTrackingNumbers(uniqDeliveyNos,db,function(err,trackingNumbers) {
                exports.getOrderComments(legacy_order_no,db,function(err,comments) {
                    if (cust == "in") {
                        UserSysItem.getItemHoldCode(uniqStatiJoin,uniqDataSourcesJoin,"item",db, function(err, HoldCodes) {

                            if (err) {
                                return Resp.sendError(res, log, err);
                                log.error(err);
                            }
                            items.forEach(function(item, i) {
                                var itemHoldCodes = [];
                                var itemInfoCodes=[];

                                if (visitedItems.indexOf(item.item_subitem) == -1) {
                                    itemHoldCodes=exports.makeHoldCodes(item,HoldCodes);
                                    itemInfoCodes=exports.makeInfoCodes(item,HoldCodes);
                                    schedLines = [];
                                    schedLines = exports.addInternalScheduleLine(schedLines,item,itemHoldCodes,itemInfoCodes);
                                    BundleItems=exports.addNewitems(BundleItems,visitedBundles,item,Hirachy,comments,trackingNumbers,itemChars);
                                    //BundleItems=exports.addNewitemsExtn(BundleItems,visitedBundles,item,Hirachy,comments,heirarchyStructure);
                                    if(Hirachy[item.so_item_no]>0) {
                                        indentaion_flag=1
                                    }
                                } else {
                                    itemHoldCodes=exports.makeHoldCodes(item,HoldCodes);
                                    itemInfoCodes=exports.makeInfoCodes(item,HoldCodes);
                                    schedLines= exports.addInternalScheduleLine(schedLines,item,itemHoldCodes,itemInfoCodes);
                                }
                                visitedItems.push(item.item_subitem);
                            });
                            delete items;
                            cb(null, BundleItems,indentaion_flag,haveBundleID,haveConfigID,haveConfigUID);
                        });
                    } else {
                        UserSysItem.getItemExceptions(uniqStatiJoin, uniqDataSourcesJoin,"item",db,function(err,exceptions)  {
                            console.log(exceptions)
                            items.forEach(function(item, i) {
                                var itemExceptions = [];
                                itemExceptions=exports.makeHoldCodes(item,exceptions);
                                if (visitedItems.indexOf(item.item_subitem) == -1) {
                                    schedLines = [];
                                    schedLines=exports.addExternalScheduleLine(schedLines,item,itemExceptions);
                                    BundleItems=exports.addNewitems(BundleItems,visitedBundles,item,Hirachy,comments,trackingNumbers,itemChars);
                                    if(Hirachy[item.so_item_no]>0) {
                                        indentaion_flag=1
                                    }
                                } else {
                                    schedLines=exports.addExternalScheduleLine(schedLines,item,itemExceptions);
                                }
                                visitedItems.push(item.item_subitem);
                            });

                            delete items;
                            cb(null, BundleItems,indentaion_flag,haveBundleID,haveConfigID,haveConfigUID);
                       });
                    }
                });
            });
        });
    });
}

module.exports.addNewitems=function (BundleItems,visitedBundles,item,Hirachy,comments,trackingNumbers,itemChars) {
    //var firstHigherLevel=[];
    if (item.higher_level == 0 ) {
        Hirachy[item.item_subitem]=0;
        firstHigherLevel.push(item.item_subitem);

    } else {
        if ( item.higher_level in Hirachy) {
            Hirachy[item.item_subitem] = Hirachy[item.higher_level] + 1;
        }
    }
    if (Hirachy[item.item_subitem] === undefined  ) {
        Hirachy[item.item_subitem]=0;
    }

    newItems={
        "item_subitem": item.item_subitem,
        "udf_text":comments[item.item_subitem],
        "product_no": item.material_no,
        "description": item.product_descr,
        "bundle_price":pricingDetails.toUSD(item.bundle_price),
        "order_qty": item.so_line_item_qty,
        "system": item.system,
        "request_date": item.customer_req_date,
        "deal_id": item.big_deal_id,
        "list_unit_price": item.net_price,
        "net_line_price": item.total_price,
        "full_invoice_no": item.full_invoice_no,
        "data_source": item.system,
        "hpdeliveryno":item.hpdeliveryno,
        "higher_level":item.higher_level,
        "level_indent":Hirachy[item.item_subitem],
        "cancellation_reason":item.cancellation_reason,
        "sc_commit_date":item.sc_commit_date,
        "config_id":item.config_id,
        "entitlement_id":item.entitlement_id,
        "billing_plan":item.billing_plan,
        "last_price_date":item.last_price_date,
        "canceled_at":item.canceled_at,
        "tracking_numbers":trackingNumbers[item.hpdeliveryno],
        "currency":item.currency,
        "product_chars":itemChars[item.item_subitem],
        "sched_Line": schedLines
    };
    var bundleName="";

    if(item.bundle_id!=null) {
        if (item.bundle_name!=null) {
            bundleName=bundleName+item.bundle_name;
        }else {
            bundleName=bundleName+item.bundle_id;
        }
    }

    //if(item.config_id!=null) {
      //  bundleName=bundleName+"  ConfigurationID:"+item.config_id;
    //}
    //bundleName=bundleName.replace(/\s+/g, "_");
    if(bundleName!=""){
        if(visitedBundles.indexOf(bundleName)==-1) {

            CompleteBundlePrice=0.00;
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
            BundleItems[bundleName]=[];
            bundleTotalPrice=bundleName+"_total_price"
            BundleItems[bundleName].push(newItems);
            BundleItems[bundleTotalPrice]=CompleteBundlePrice;
        }else{
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
            BundleItems[bundleName].push(newItems);
            BundleItems[bundleTotalPrice]=CompleteBundlePrice;
        }
    }else{

        if(noBundleItemCount==0) {
            CompleteBundlePrice=0.0;
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
        }else {
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
        }
        BundleItems["NoBundle"].push(newItems);
        bundleTotalPrice="NoBundle_total_price";
        BundleItems[bundleTotalPrice]=CompleteBundlePrice;
        noBundleItemCount++;
    }
    visitedBundles.push(bundleName);
    return BundleItems;
}

module.exports.addExternalScheduleLine=function(schedLines,item,exceptions)  {

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
        factory_shipped_date:item.pgi_actual,
        actual_customer_ship_date:item.eshp_actual,
        shipment_no: item.shipment_no,
        exceptions:exceptions
    });
    return schedLines;
}

module.exports.addInternalScheduleLine=function(schedLines,item,itemHoldCodes,itemInfoCodes)  {
    var status=item.status;
    if(item.status=="Shipped") {
        status="Shipped to Customer"
    }
    schedLines.push({
        status: status,
        qty: item.sched_line_qty,
        sched_line_no: item.sched_line_no,
        ship_date: item.shipped_at,
        planned_delivery_date: item.sched_delv_date,
        actual_ship_date: item.shipped_at,
        invoice_no: item.invoice_no,
        inv_date: item.invo_actual,
        planned_ship_date: item.sched_ship_date,
        actual_delivery_date: item.pod_at,
        factory_shipped_date:item.pgi_actual,
        actual_customer_ship_date:item.eshp_actual,
        shipment_no: item.shipment_no,
        Hold_Codes: itemHoldCodes,
        Information_status:itemInfoCodes
    });
    return schedLines;
}

module.exports.getRejectionReason=function(system,db,cb) {

    sqlString="select rejection_code, rejection_code_text from rejection_code_setup where  sapsystem=:1";
    db.execute(sqlString, [system], function(err, rejectionCodes) {
        var rejectionCodesDesc={};
        rejectionCodes.forEach(function(row, i) {
            rejectionCodesDesc[row.rejection_code]=row.rejection_code_text
        });
        cb(null,rejectionCodesDesc);
    });
}

module.exports.getOrderComments=function(os,db,cb){
    sqlString="select item_no, name, line, comment_text, sap_text_name \
                from order_comments \
               where legacy_order_no = :1 \
                and visibility <> 'W' \
               order by item_no, line, name";
    db.execute(sqlString,[os],function(err,result){
        if(err)cb(err,null);
        var UDFText={};
        result.forEach(function(row,i){
            if(row.item_no!=null) {
                UDFText[row.item_no]=[];
                if(row.name!=null) {
                    UDFText[row.item_no]=row.name+":"+row.comment_text;
                }else {
                    UDFText[row.item_no]=row.sap_text_name+":"+row.comment_text;
                }
            }
        });
        cb(null,UDFText);
    });

}

module.exports.mycomparator=function(a,b) {
  return parseInt(a.item_subitem) - parseInt(b.item_subitem);
}

module.exports.makeHoldCodes=function(item,HoldCodes) {
    var itemStatis = item.stati.split(" ");
    var itemHoldCodes = [];
    if(HoldCodes.length)
    for (var x = 0; x < itemStatis.length; x++) {
        var key = itemStatis[x] + "|" + item.system;
        if ( HoldCodes[0][key] != null) {
            itemHoldCodes.push(HoldCodes[0][key]);
        }
    }
    return itemHoldCodes;
}

module.exports.makeInfoCodes=function(item,HoldCodes) {
    var itemStatis = item.stati.split(" ");
    var itemHoldCodes = [];
    if(HoldCodes.length)
    for (var x = 0; x < itemStatis.length; x++) {
        var key = itemStatis[x] + ":" + item.system;
        if ( HoldCodes[0][key] != null) {
            itemHoldCodes.push(HoldCodes[0][key]);
        }
    }
    return itemHoldCodes;
}
module.exports.getTrackingNumbers=function(hpdeliverynos,db,cb) {
    var hpdeliverynosString="'"+hpdeliverynos.join("','")+"'";

    var sqlString="select HPDELIVERYNO, TRACKINGNO   \
                        from delv_tracking   \
                where hpdeliveryno in ("+hpdeliverynosString+")"
    db.execute(sqlString,[],function(err,result) {
        if(err)cb(null,err);
        var trackingNumbers={};
        var deliveyNumbers=[];
        result.forEach(function(row,i) {
            if(deliveyNumbers.indexOf(row.hpdeliveryno) == -1) {
                trackingNumbers[row.hpdeliveryno]=[];
                trackingNumbers[row.hpdeliveryno].push(row.trackingno);
            }else {
                trackingNumbers[row.hpdeliveryno].push(row.trackingno);
            }

            deliveyNumbers.push(row.hpdeliveryno);

        });
        cb(null,trackingNumbers);
    });
}

module.exports.getProductChars=function(os,db,cb) {

    var sqlString="select    \
                    item_subitem,ID, \
                    ID_DESCR, \
                    VALUE,VALUE_DESCR, \
                    LINE,VALUE_TYPE \
                    from backlog_item_charac  \
                    where legacy_order_no = :1 \
                    order by item_subitem,line"

    db.execute(sqlString,[os],function(err,result) {
        if(err)cb(err,null);
        var items=[];
        var itemCharacs={};
        var chars={};
        //console.log(result);
        result.forEach(function(row,i) {
            if(items.indexOf(row.item_subitem)==-1) {
                itemCharacs[row.item_subitem]=[];
                chars={};
                chars["charac_id"]=row.id;
                chars["charac_id_descr"]=row.id_descr;
                chars["charac_value"]=row.value;
                chars["charac_value_descr"]=row.value_descr;
                chars["charac_line"]=row.line;
                chars["value_type"]=row.value_type;
                itemCharacs[row.item_subitem].push(chars);
            }else {
                chars={};
                chars["charac_id"]=row.id;
                chars["charac_id_descr"]=row.id_descr;
                chars["charac_value"]=row.value;
                chars["charac_value_descr"]=row.value_descr;
                chars["charac_line"]=row.line;
                chars["value_type"]=row.value_type;
                itemCharacs[row.item_subitem].push(chars);
            }
            items.push(row.item_subitem);
        });
        cb(null,itemCharacs);
    });
}

/*
*
* Presently we are not using this proc.
*/
module.exports.addNewitemsExtn=function (BundleItems,visitedBundles,item,Hirachy,comments,heirarchyStructure) {

    if (item.higher_level == "0" || item.higher_level==item.item_subitem  ) {
        Hirachy[item.item_subitem]=0;
        firstHigherLevel.push(item.item_subitem);

    } else {
        if ( item.higher_level in Hirachy) {
            Hirachy[item.item_subitem] = Hirachy[item.higher_level] + 1;
        }
    }
    if (Hirachy[item.item_subitem] === undefined  ) {
        Hirachy[item.item_subitem]=0;
    }
    console.log(firstHigherLevel);

    newItems={
        "item_subitem": item.item_subitem,
        "udf_text":comments[item.item_subitem],
        "product_no": item.material_no,
        "description": item.product_descr,
        "bundle_price":pricingDetails.toUSD(item.bundle_price),
        "order_qty": item.so_line_item_qty,
        "system": item.system,
        "request_date": item.customer_req_date,
        "deal_id": item.big_deal_id,
        "list_unit_price": item.net_price,
        "net_line_price": item.total_price,
        "full_invoice_no": item.full_invoice_no,
        "data_source": item.system,
        "hpdeliveryno":item.hpdeliveryno,
        "higher_level":item.higher_level,
        "level_indent":Hirachy[item.item_subitem],
        "cancellation_reason":item.cancellation_reason,
        "sc_commit_date":item.sc_commit_date,
        "entitlement_id":item.entitlement_id,
        "billing_plan":item.billing_plan,
        "config_id":item.config_id,
        "sched_Line": schedLines
    };
    var bundleName="";

    if(item.bundle_id!=null) {
        if (item.bundle_name!=null) {
            bundleName=bundleName+item.bundle_name;
        }else {
            bundleName=bundleName+item.bundle_id;
        }
    }

    //if(item.config_id!=null) {
      //  bundleName=bundleName+"  ConfigurationID:"+item.config_id;
    //}
    //bundleName=bundleName.replace(/\s+/g, "_");
    if(bundleName!=""){
        if(visitedBundles.indexOf(bundleName)==-1) {
            CompleteBundlePrice=0.00;
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
            BundleItems[bundleName][0]=[];
            bundleTotalPrice=bundleName+"_total_price"
            BundleItems=exports.itemLevels(BundleItems,bundleName,newItems,heirarchyStructure,firstHigherLevel);
            console.log("1");
            console.log(BundleItems);
            BundleItems[bundleTotalPrice]=CompleteBundlePrice;
        }else{
            console.log("2");
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
            BundleItems=exports.itemLevels(BundleItems,bundleName,newItems,heirarchyStructure,firstHigherLevel);
            //BundleItems[bundleName].push(newItems);
            BundleItems[bundleTotalPrice]=CompleteBundlePrice;
        }
    }else{
        if(noBundleItemCount==0) {
            CompleteBundlePrice=0.0;
            BundleItems["NoBundle"][0]={};
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
        }else {
            CompleteBundlePrice=CompleteBundlePrice+item.bundle_price;
        }

        BundleItems=exports.itemLevels(BundleItems,"NoBundle",newItems,heirarchyStructure,firstHigherLevel);

        bundleTotalPrice="NoBundle_total_price";
        BundleItems[bundleTotalPrice]=CompleteBundlePrice;
        noBundleItemCount++;
    }
    visitedBundles.push(bundleName);
    return BundleItems;
}

module.exports.itemLevels=function(BundleItems,bundleName,newItems,heirarchyStructure,firstHigherLevel) {
    if (newItems["higher_level"] == "0" || newItems["higher_level"]==newItems["item_subitem"] ) {
            console.log("bundleName = "+bundleName+ "|  "+newItems["item_subitem"] );
            BundleItems[bundleName][0][newItems["item_subitem"]]={};
             console.log( BundleItems);
            BundleItems[bundleName][0][newItems["item_subitem"]]=newItems;
            console.log( BundleItems);
    } else {
        if(firstHigherLevel.indexOf(newItems["higher_level"]) > -1) {
            console.log("bundleName = "+bundleName+ "|  "+newItems["item_subitem"]);
            BundleItems[bundleName][0][newItems["higher_level"]][newItems["item_subitem"]]={};
            BundleItems[bundleName][0][newItems["higher_level"]][newItems["item_subitem"]]=newItems;
        } else if(Object.keys(heirarchyStructure).indexOf(newItems["higher_level"])> -1) {
            if (firstHigherLevel.indexOf(newItems["higher_level"])==-1)  {
                firstHigherLevel.forEach(function(row) {
                    if(heirarchyStructure[row].indexOf(newItems["higher_level"])> -1) {
                        BundleItems[bundleName][0][row][newItems["higher_level"]][newItems["item_subitem"]]={};
                        BundleItems[bundleName][0][row][newItems["higher_level"]][newItems["item_subitem"]]=newItems;
                    }
                });
            }
        }
    }
    return BundleItems;
}
