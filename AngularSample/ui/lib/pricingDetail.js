/*----------------------------------------------------------------------------
|
|   This function will return the header status codes for the given HP
|   leagacy order number or Hp order no. The service will return the below details:
|       1.  Header status codes
|
|   written by Fouzia Nishath
|   April 2013
|
\---------------------------------------------------------------------------*/
var bunyan = require('bunyan');
var config = require('../config/config.js')
var DbPool   = require('../lib/DbPool'  );


/**
 * This function returns item pricing details
 * @param orderNo                 order no
 * @param cust                    Customer(internal or external)
 * @param withPrice               With Price
 * @return -                      Pricing detials
 */
module.exports.getPricingDetail = function(orderNo,cust,withPrice,cb) {

    var sqlString  = "";
    var newPricing = [];
    var columnNames = {};

    var pricingDetails = {};

    var product    = "";
    var totallistExtPrice = 0;
    var totalDiscValue =0;
    var totalDiscPersentage =0;
    var totalNetPrice=0;

    var newItems = [];
    var visitedBundles=[];
    var BundleItems={};
    BundleItems["NoBundle"]=[];

    //hard coded need to remove
    var suppressPrices = "N";
    var withPrices= withPrice;
    var discount =0;
    var customerProduct;
    var hasDiscount="false";
    customerProduct = null;

    DbPool.OSSDB(function(db) {
        if(cust == "in"){
            sqlString         = "select distinct b.item_no, b.ln, b.entry_key, b.product_no, b.product_descr,   \
                                        b.quantity_ordered,b.order_price, b.line_total, b.bundle_order_price,   \
                                        b.bundle_line_total,b.cal_disc, b.currency, b.id_code,b.reason_code,    \
                                        b.tax_value, b.item_price, bi.ship_from, bi.lsp_name,bi.item_subitem,   \
                                        bi.model_id, bi.bundle_id, bi.config_id, bi.config_uid,bi.cust_delv_no, \
                                        bi.bundle_name, bi.pricing_bundle_id, bi.big_deal_id ,h.total_net_price,\
                                        bi.status,bi.sched_line_qty,bi.so_line_item_qty,bi.cust_product_no,     \
                                        bi.bundle_price ,bi.payment_terms,h.show_prices                         \
                                   from backlog_hdr h,backlog_item bi                                           \
                        left outer join backlog_entry b on (bi.legacy_order_no = b.legacy_order_no              \
                                    and b.item_no=bi.item_subitem)                                              \
                                  where bi.legacy_order_no = h.legacy_order_no                                  \
                                    and (h.legacy_order_no =:1 or h.order_no =:1)                               \
                               order by b.item_no, b.ln" ;
        }else if(cust == "ex"){
            sqlString         = "select distinct b.item_no, b.ln, b.entry_key, b.product_no, b.product_descr,   \
                                    b.quantity_ordered,b.order_price, b.line_total, b.bundle_order_price,   \
                                    b.bundle_line_total,b.cal_disc, b.currency, b.id_code,b.reason_code,    \
                                    b.tax_value, b.item_price, bi.ship_from, bi.lsp_name,bi.item_subitem,   \
                                    bi.model_id, bi.bundle_id, bi.config_id, bi.config_uid,bi.cust_delv_no, \
                                    bi.bundle_name, bi.pricing_bundle_id, bi.big_deal_id ,h.total_net_price,\
                                    bi.status,bi.sched_line_qty,bi.so_line_item_qty,bi.cust_product_no,     \
                                    bi.bundle_price ,bi.payment_terms,h.show_prices                         \
                               from backlog_hdr h,backlog_item bi                                           \
                    left outer join backlog_entry b on (bi.legacy_order_no = b.legacy_order_no              \
                                and b.item_no=bi.item_subitem)                                              \
                              where bi.legacy_order_no = h.legacy_order_no                                  \
                                and (h.legacy_order_no =:1 or h.order_no =:1)                               \
                                and (b.is_valid = 'Y' or b.is_valid is null)                              \
                           order by b.item_no, b.ln" ;
        }


        //log.info("sqlString Pricing tab:"+sqlString)
        console.log("sqlString Pricing tab:"+sqlString);

        db.execute(sqlString, [orderNo], function(err, details) {
            if (err) return cb(err, null);
            details.forEach(function(row, i) {
                if(row.cal_disc > 0){
                    hasDiscount="true";
                }
                if(row.show_prices == "N"){
                    suppressPrices = "Y"
                }
            });
            columnNames = exports.makeColumns(columnNames,hasDiscount,cust,customerProduct,withPrices,suppressPrices);
            details.forEach(function(price, i) {
                //console.log("item_no:"+row.item_no);

                var tempOrderPrice = 0;
                var tempNetPrice   = 0;
                if(cust == "in"){
                    tempOrderPrice = price.order_price;
                    tempNetPrice = price.line_total;
                }else if(cust == "ex"){
                    tempOrderPrice = price.bundle_order_price;
                    tempNetPrice = price.bundle_line_total;
                }
                var listExtPrice = tempOrderPrice*price.so_line_item_qty;
                var disValue = listExtPrice-tempNetPrice;

                totallistExtPrice = totallistExtPrice+listExtPrice;
                totalDiscPersentage = totalDiscPersentage+price.cal_disc;
                totalDiscValue = totalDiscValue+disValue;
                totalNetPrice=price.total_net_price;

                if(newItems.indexOf(price.item_no) == -1){
                    optionDetails = []
                    optionDetails = exports.addOpionDetails(optionDetails,price,cust,withPrices,suppressPrices,hasDiscount);
                    BundleItems=exports.addNewPricingDetails(BundleItems,visitedBundles,price,cust,withPrices,suppressPrices,hasDiscount);

                }else{
                    optionDetails = exports.addOpionDetails(optionDetails,price,cust,withPrices,suppressPrices,hasDiscount);
                }

                newItems.push(price.item_no);
                //visitedBundles.push(bundleName);

            });

            //console.log(newPricing)
            totallistExtPrice = exports.toUSD(totallistExtPrice);
            totalDiscValue = exports.toUSD(totalDiscValue);
            totalNetPrice = exports.toUSD(totalNetPrice);
            totalDiscPersentage = exports.toUSD(totalDiscPersentage);

            console.log("totallistExtPrice:"+totallistExtPrice);
            console.log("totalDiscValue:"+totalDiscValue);
            console.log("total_net_price:"+totalNetPrice);
            console.log("totalDiscPersentage:"+totalDiscPersentage);
            if(cust == "ex"){
                if((withPrices == "Y" ) && (suppressPrices == "N")){
                    if(hasDiscount != "false"){
                        pricingDetails["totallistExtPrice"]=totallistExtPrice;
                        pricingDetails["totalDiscValue"]=totalDiscValue;
                        pricingDetails["totalDiscPersentage"]=totalDiscPersentage;
                    }
                }
            } else {
                pricingDetails["totallistExtPrice"]=totallistExtPrice;
                pricingDetails["totalDiscValue"]=totalDiscValue;
                pricingDetails["totalDiscPersentage"]=totalDiscPersentage;
                pricingDetails["totalNetPrice"]=totalNetPrice;
            }
            pricingDetails["columnNames"]=columnNames;
            pricingDetails["item"]=BundleItems;

            cb(null, pricingDetails);
        });
    });

}


module.exports.toUSD = function(n) {
    if(n != null){
        return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }
}

module.exports.addOpionDetails = function (optionDetails,price,cust,withPrices,suppressPrices,hasDiscount) {

    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var tempOrderPrice = price.order_price;
    var tempNetPrice = price.line_total;
    var listExtPrice = tempOrderPrice*price.so_line_item_qty;
    var disValue = listExtPrice-tempNetPrice;


    //currency convertions
    disValue = exports.toUSD(disValue)
    listExtPrice = exports.toUSD(listExtPrice);
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    //Calculate ship_qty
    var shipFact = 0;
    shippedQty =0;
    if ((price.cust_delv_no != null)||(price.status == "Cust Shipped")||(price.status == "Delivered")){
        //console.log("Inside")
        if(shippedQty != 0){
            shippedQty = shippedQty+price.sched_line_qty;

        }else{
            shippedQty = price.sched_line_qty;
            shipFact = 0;
        }
    }else{
        shippedQty =0;
    }

    if(shippedQty != 0){
        if(price.so_line_item_qty == 0 ){
            shipFact=1;
        }else{
            shipFact = price.so_line_item_qty/shippedQty;
        }

    }
    var shipQty = 0;
    if(shipFact !=0){
        shipQty = price.so_line_item_qty/shipFact;
        shipQty = Number(shipQty.toFixed(1));
    }
    var option = "";
    var product = "";
    if(price.product_no != null ) {

        var productNOArr = (price.product_no).split(/\s+/);
        product= productNOArr[0];
        var ext = "Default";
        ext=productNOArr[1];
        //console.log("item_no:"+price.product_no);

        if(ext){
            option = "# "+productNOArr[1];
        }
        if(price.entry_key == "M"){
            option = "M "+product;
        }
    }

    if(cust == "in"){
        optionDetails.push({
            "Option":option,
            "description": price.product_descr,
            "idCode": price.id_code,
            "orderQty":price.quantity_ordered,
            "shippedQty" : shipQty,
            "listUnitPrice": listUnitPrice,
            "listExtPrice": listExtPrice,
            "netLinePrice": netLinePrice,
            "discPer":price.cal_disc+"%",
            "disValue":disValue,
            "currency":price.currency,
            "shipFrom":price.ship_from,
            "lspname":price.lsp_name,
            "configId":price.config_id,
            "configUId":price.config_uid,
        });
    }
    if(cust == "ex") {
        if((withPrices == "Y" ) && (suppressPrices == "N")){
            if(hasDiscount != "false"){
                optionDetails.push({
                    "Option":option,
                    "description": price.product_descr,
                    "orderQty":price.quantity_ordered,
                    "shippedQty" : shipQty,
                    "listUnitPrice" : listUnitPrice,
                    "listExtPrice": listExtPrice,
                    "discPer":price.cal_disc+"%",
                    "disValue":disValue,
                    "netLinePrice": netLinePrice,
                    "netItemPrice":exports.toUSD(price.bundle_price),
                    "paymentTerms":price.payment_terms,
                    "configId":price.config_id,
                    "configUId":price.config_uid,
                });
            }else{
                optionDetails.push({
                    "Option":option,
                    "description": price.product_descr,
                    "orderQty":price.quantity_ordered,
                    "shippedQty" : shipQty,
                    "listUnitPrice" : listUnitPrice,
                    "netLinePrice": netLinePrice,
                    "netItemPrice":exports.toUSD(price.bundle_price),
                    "paymentTerms":price.payment_terms,
                    "configId":price.config_id,
                    "configUId":price.config_uid,
                });
            }
        }else if((withPrices == "L" ) && (suppressPrices == "N")){
            optionDetails.push({
                "Option":option,
                "description": price.product_descr,
                "orderQty":price.quantity_ordered,
                "shippedQty":shipQty,
                "netItemPrice":exports.toUSD(price.bundle_price),
                "configId":price.config_id,
                "configUId":price.config_uid,
            });
        }else{
            optionDetails.push({
                "Option":option,
                "description": price.product_descr,
                "orderQty":price.quantity_ordered,
                "shippedQty":shipQty,
                "configId":price.config_id,
                "configUId":price.config_uid,
            });
        }

    }
    return optionDetails;
}

module.exports.addNewPricingDetails = function (BundleItems,visitedBundles,price,cust,withPrices,suppressPrices,hasDiscount) {

    var bundleName="";
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var tempOrderPrice = price.order_price;
    var tempNetPrice = price.line_total;
    var listExtPrice = tempOrderPrice*price.so_line_item_qty;
    var disValue = listExtPrice-tempNetPrice;


    //currency convertions
    disValue = exports.toUSD(disValue)
    listExtPrice = exports.toUSD(listExtPrice);
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    //Calculate ship_qty
    var shipFact = 0;
    shippedQty =0;
    if ((price.cust_delv_no != null)||(price.status == "Cust Shipped")||(price.status == "Delivered")){
        //console.log("Inside")
        if(shippedQty != 0){
            shippedQty = shippedQty+price.sched_line_qty;

        }else{
            shippedQty = price.sched_line_qty;
            shipFact = 0;
        }
    }else{
        shippedQty =0;
    }

    if(shippedQty != 0){
        if(price.so_line_item_qty == 0 ){
            shipFact=1;
        }else{
            shipFact = price.so_line_item_qty/shippedQty;
        }

    }
    var shipQty = 0;
    if(shipFact !=0){
        shipQty = price.so_line_item_qty/shipFact;
        shipQty = Number(shipQty.toFixed(1));
    }
    var option = "";
    var product = "";
    if(price.product_no != null ) {

        var productNOArr = (price.product_no).split(/\s+/);
        product= productNOArr[0];
        var ext = "Default";
        ext=productNOArr[1];
        //console.log("item_no:"+price.product_no);

        if(ext){
            option = "# "+productNOArr[1];
        }
        if(price.entry_key == "M"){
            option = "M "+product;
        }
    }
    //Bundle logic


    if(price.bundle_id!=null) {
        if (price.bundle_name!=null) {
            bundleName=bundleName+price.bundle_name;
        }else {
            bundleName=bundleName+price.bundle_id;
        }
    }

    // if(price.config_id!=null) {
    //     bundleName=bundleName+" /Config ID: "+price.config_id;

    // }

    if(cust == "in"){
        newPricing={
            "item": price.item_no,
            "product": product,
            "description": price.product_descr,
            "idCode": price.id_code,
            "orderQty":price.quantity_ordered,
            "shippedQty" : shipQty,
            "listUnitPrice": listUnitPrice,
            "listExtPrice": listExtPrice,
            "netLinePrice": netLinePrice,
            "discPer":price.cal_disc+"%",
            "disValue":disValue,
            "currency":price.currency,
            "shipFrom":price.ship_from,
            "lspname":price.lsp_name,
            "configId":price.config_id,
            "configUId":price.config_uid,
            "option":optionDetails,
        };
    } else {
        if((withPrices == "Y" ) && (suppressPrices == "N")){
            if(hasDiscount != "false"){
                newPricing={
                    "item": price.item_no,
                    "product": product,
                    "description": price.product_descr,
                    "orderQty":price.quantity_ordered,
                    "shippedQty" : shipQty,
                    "listUnitPrice": listUnitPrice,
                    "listExtPrice": listExtPrice,
                    "discPer":price.cal_disc+"%",
                    "disValue":disValue,
                    "netLinePrice": netLinePrice,
                    "netItemPrice":exports.toUSD(price.bundle_price),
                    "paymentTerms":price.payment_terms,
                    "configId":price.config_id,
                    "configUId":price.config_uid,
                    "option":optionDetails,
                };

            }else{
                newPricing={
                    "item": price.item_no,
                    "product": product,
                    "description": price.product_descr,
                    "orderQty":price.quantity_ordered,
                    "shippedQty" : shipQty,
                    "listUnitPrice": listUnitPrice,
                    "netLinePrice": netLinePrice,
                    "netItemPrice":exports.toUSD(price.bundle_price),
                    "paymentTerms":price.payment_terms,
                    "configId":price.config_id,
                    "configUId":price.config_uid,
                    "option":optionDetails,
                };
            }
        }else if((withPrices == "L" ) && (suppressPrices == "N")){
            newPricing={
                "item": price.item_no,
                "product": product,
                "description": price.product_descr,
                "orderQty":price.quantity_ordered,
                "shippedQty" : shipQty,
                "netItemPrice":exports.toUSD(price.bundle_price),
                "configId":price.config_id,
                "configUId":price.config_uid,
                "option":optionDetails,
            };
        }else{
            newPricing={
                "item": price.item_no,
                "product": product,
                "description": price.product_descr,
                "orderQty":price.quantity_ordered,
                "shippedQty" : shipQty,
                "configId":price.config_id,
                "configUId":price.config_uid,
                "option":optionDetails,
            };

        }

    }

    if(bundleName!=""){
        if(visitedBundles.indexOf(bundleName)==-1) {
            BundleItems[bundleName]=[];
            BundleItems[bundleName].push(newPricing);
        }else{
            BundleItems[bundleName].push(newPricing);
        }
    }else{
        console.log(price.item_no);
        BundleItems["NoBundle"].push(newPricing);
    }

    visitedBundles.push(bundleName);
    return BundleItems;
}

module.exports.checkOrderforExternalUser=function (filter,cb) {
    DbPool.OSSDB(function(db) {
        console.log("*******************************")
        console.log("Final filter:"+filter.where)
        console.log("Final filter.binds:"+filter.binds)
        console.log("*******************************")

        var sqlString   = "";
        var lOrderno = "";
        sqlString = "select h.order_no,h.legacy_order_no              \
                       from backlog_hdr h,backlog_ids ids             \
                      where (h.legacy_order_no = ids.legacy_order_no) \
                        and h.customer_order     = 'Y'                \
                        and (h.is_valid          = 'Y'                \
                         or h.is_valid           IS NULL)             \
                        and (" + filter.where + ")                    \
                        and rownum = 1"
        console.log("sqlString:"+sqlString);
        db.execute(sqlString, filter.binds, function(err, legacyOrderNos) {
            if (err) return cb(err, null);
            console.log("HI");
            console.log(legacyOrderNos)
            cb(null, legacyOrderNos);
        });
    });
}

module.exports.makeColumns=function (columnNames,hasDiscount,cust,customerProduct,withPrices,suppressPrices) {
    //var columnNames = [];
    console.log("inside");
    columnNames['item']="Item"
    columnNames['product']="Product"
    if(cust == "ex"){
        if(customerProduct !=null){
            columnNames['custProduct']="Customer Product"

        }
        if((withPrices == "Y" ) && (suppressPrices == "N")){
            if(hasDiscount != "false"){
                columnNames['option']="Option";
                columnNames['description']="Description";
                columnNames['orderQty']="Order Qty";
                columnNames['shippedQty']="Shipped Qty";
                columnNames['listUnitPrice']="List Unit Price";
                columnNames['listExtPrice']="List Ext. Price";
                columnNames['disValue']="Discount";
                columnNames['discPer']="Discount %";
                columnNames['netLinePrice']="Net Line Price";
                columnNames['netItemPrice']="Net Item Price";
                columnNames['paymentTerms']="Payment Terms";

            }else{
                columnNames['option']="Option";
                columnNames['description']="Description";
                columnNames['orderQty']="Order Qty";
                columnNames['shippedQty']="Shipped Qty";
                columnNames['listUnitPrice']="List Unit Price";
                columnNames['netLinePrice']="Net Line Price";
                columnNames['netItemPrice']="Net Item Price";
                columnNames['paymentTerms']="Payment Terms";

            }
        }else if((withPrices == "L" ) && (suppressPrices == "N")){
            columnNames['option']="Option";
            columnNames['description']="Description";
            columnNames['orderQty']="Order Qty";
            columnNames['shippedQty']="Shipped Qty";
            columnNames['netItemPrice']="Net Item Price";

        }else{
            columnNames['option']="Option";
            columnNames['description']="Description";
            columnNames['orderQty']="Order Qty";
            columnNames['shippedQty']="Shipped Qty";

        }
    }
    if(cust == "in"){
        columnNames['option']="Option";
        columnNames['description']="Description";
        columnNames['orderQty']="Order Qty";
        columnNames['shippedQty']="Shipped Qty";
        columnNames['listUnitPrice']="List Unit Price";
        columnNames['listExtPrice']="List Ext. Price";
        columnNames['disValue']="Discount";
        columnNames['discPer']="Discount %";
        columnNames['netLinePrice']="Net Line Price";
        columnNames['currency']="Currency";
        columnNames['shipFrom']="Ship From";
        columnNames['lspname']="Vendor's Name";

    }
    console.log(columnNames);
    return columnNames;
}
