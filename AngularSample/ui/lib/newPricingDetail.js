/*----------------------------------------------------------------------------
|
|   This function will return the pricing details for the given HP
|   leagacy order number.
|
|   written by Fouzia Nishath
|   April 2013
|
\---------------------------------------------------------------------------*/
var bunyan = require('bunyan');
var config = require('../config/config.js');
var DbPool = require('../lib/DbPool');


/**
 * This function returns item pricing details
 * @param orderNo                 order no
 * @param cust                    Customer(internal or external)
 * @param withPrice               With Price
 * @return -                      Pricing detials
 */
module.exports.getPricingDetail = function(orderNo, aaid,cust, withPrice, showPrice, resellerOrder, totalNetPriceEx, cb) {

    var sqlString = "";
    var newPricingInt = [];
    var newPricingExt = [];
    var newPricing = {};
    var newExtPricing = [];
    var columnNames = {};
    var pricingDetails = {};
    var product = "";
    var totalDiscValue = 0;
    var totalNetPrice = 0;
    var newItems = [];
    var visitedBundles = [];
    var BundleItems = {};
    var suppressPrices = "N";
    var withPrices = withPrice;
    var discount = 0;
    var customerProduct;
    var hasDiscount = "false";
    var hasCustProduct = "false";
    var customerProduct = null;
    var currency = "";
    var totallistExtPrice = 0;
    var totalDiscPersentage = 0;
    BundleItems["NoBundle"] = [];

    DbPool.OSSDB(function(db) {
        sqlString = "select distinct b.item_no, b.ln, b.entry_key, b.product_no, b.product_descr,           \
                                    b.quantity_ordered,b.order_price, b.line_total, b.bundle_order_price,   \
                                    b.bundle_line_total,b.cal_disc, b.currency, b.id_code,b.reason_code,    \
                                    b.tax_value, b.item_price, bi.ship_from, bi.lsp_name,bi.item_subitem,   \
                                    bi.model_id, bi.bundle_id, bi.config_id, bi.config_uid,bi.cust_delv_no, \
                                    bi.bundle_name, bi.pricing_bundle_id, bi.big_deal_id ,h.total_net_price,\
                                    bi.status,bi.sched_line_qty,bi.so_line_item_qty,bi.cust_product_no,     \
                                    bi.bundle_price ,bi.payment_terms,h.show_prices,b.discountable,h.reseller_order \
                               from backlog_hdr h,backlog_item bi                                           \
                    left outer join backlog_entry b on bi.legacy_order_no = b.legacy_order_no               \
                              where bi.legacy_order_no = h.legacy_order_no                                  \
                                and b.item_no = bi.item_subitem                                             \
                                and h.legacy_order_no = :1"
        if (cust == "ex") {
            sqlString = sqlString + "and (b.is_valid = 'Y' or b.is_valid is null)"

        }

        sqlString = sqlString + " order by to_number(b.item_no), b.ln";

        console.log("sqlString Pricing tab:" + sqlString);

        db.execute(sqlString, [orderNo], function(err, details) {
            if (err) return cb(err, null);

            if (cust == "ex" && details.length == 0) {

                if ((resellerOrder == "Y" && (aaid != "ppro" || aaid != "ap_cic") ) || (showPrice == "N")) {
                    suppressPrices = "Y";
                }

                columnNames = exports.makeColumns(columnNames, hasDiscount, hasCustProduct, cust, customerProduct, withPrices, suppressPrices);
                totalNetPrice = totalNetPriceEx;
            }

            details.forEach(function(row, i) {
                if (row.cal_disc > 0) {
                    hasDiscount = "true";
                }

                if(cust == "ex") {
                    if ((resellerOrder == "Y" && (aaid != "ppro" || aaid != "ap_cic") ) || (showPrice == "N")) {
                        suppressPrices = "Y";
                    }
                }

                if (row.cust_product_no != null) {
                    hasCustProduct = "true";
                }
            });

            if (cust == "ex") {

                var nextBundleLineTotal = 0;
                var bundleOrderPrice = 0;
                var bundleLineTotal = 0;
                var calDisc = 0;

                /* For external customer, For an item,if the entry Key is M and Product number
                 * starts with 60 or ends with B, than that items pricing details are hiden
                 * from the customer and price is assigned to 1 item hiegher than the current
                 * item
                 */

                for (var i = 0; i < (details.length) - 1; i++) {

                    var nextEntryKey = details[i + 1].entry_key;
                    var currentEnytryKey = details[i].entry_key;
                    var nextProductNo = details[i + 1].product_no;
                    var nextQuantityOrdered = details[i + 1].quantity_ordered;
                    var quantityOrdered = details[i].quantity_ordered;
                    bundleLineTotal = details[i].bundle_line_total;
                    bundleOrderPrice = details[i].bundle_order_price;

                    if (nextEntryKey == "M" && (nextProductNo.endsWith("B") || nextProductNo.startsWith("60"))) {

                        if (nextQuantityOrdered == quantityOrdered) {

                            bundleLineTotal = bundleLineTotal + details[i + 1].bundle_line_total;

                            if (details[i].discountable != "NN") {

                                bundleOrderPrice = bundleOrderPrice + details[i + 1].bundle_order_price;
                            }
                            var discount = 0.0;
                            discount = (1 - (bundleLineTotal / (quantityOrdered * bundleOrderPrice)));

                            if ((discount != "Infinity") || (discount != "-Infinity") || (discount != "NaN")) {

                                calDisc = (Math.round(discount * 1000.0) / 1000.0) * 100;
                            }
                        }

                    }
                    details[i].bundle_line_total = bundleLineTotal;
                    details[i].bundle_order_price = bundleOrderPrice;
                    details[i].cal_disc = calDisc;

                } //External for loop
            }
            columnNames = exports.makeColumns(columnNames, hasDiscount, hasCustProduct, cust, customerProduct, withPrices, suppressPrices);
            details.forEach(function(price, i) {

                var tempOrderPrice = 0;
                var tempNetPrice = 0;
                currency = price.currency;

                if (cust == "in") {

                    tempOrderPrice = price.order_price;
                    tempNetPrice = price.line_total;
                } else if (cust == "ex") {

                    tempOrderPrice = price.bundle_order_price;
                    tempNetPrice = price.bundle_line_total;
                }

                var listExtPrice = tempOrderPrice * price.so_line_item_qty;
                var disValue = listExtPrice - tempNetPrice;
                totallistExtPrice = totallistExtPrice + listExtPrice;
                totalDiscValue = totalDiscValue + disValue;

                if(cust == "in") {

                    totalNetPrice = totalNetPrice + price.line_total;
                } else {

                    totalNetPrice = totalNetPrice + price.bundle_line_total;
                }

                if (totallistExtPrice != 0) {

                    totalDiscPersentage = 100 - ((totalNetPrice / totallistExtPrice) * 100.0);
                }

                if (cust == "ex") {

                    if (price.entry_key == "M" && ((price.product_no).endsWith("B") || (price.product_no).startsWith("60"))) {
                        return;
                    } else if (withPrices == "N" && (price.entry_key == "M")) {
                        return;
                    } else if (price.entry_key == "M" && (withPrices != "Y" && suppressPrices == "Y")) {
                        return;
                    }
                }

                if (newItems.indexOf(price.item_no) == -1) {

                    optionDetailsInt = [];
                    optionDetails = [];

                    if (cust == "in") {

                        optionDetailsInt = exports.addOpionDetails(optionDetailsInt, price);
                        BundleItems = exports.addNewPricingDetails(BundleItems, visitedBundles, price);
                    } else {

                        optionDetails = exports.addExternalOpionDetails(optionDetails, price, withPrices, suppressPrices, hasDiscount, hasCustProduct);
                        BundleItems = exports.addExternalNewPricingDetails(BundleItems, visitedBundles, price, withPrices, suppressPrices, hasDiscount, hasCustProduct);
                    }

                } else {
                    if (cust == "in") {
                        optionDetailsInt = exports.addOpionDetails(optionDetailsInt, price);

                    } else {
                        optionDetails = exports.addExternalOpionDetails(optionDetails, price, withPrices, suppressPrices, hasDiscount, hasCustProduct);

                    }
                }
                newItems.push(price.item_no);
            });

            totallistExtPrice = exports.toUSD(totallistExtPrice);
            totalDiscValue = exports.toUSD(totalDiscValue);
            totalNetPrice = exports.toUSD(totalNetPrice);
            if(totalDiscPersentage < 0.00){
                totalDiscPersentage = 0;
            }
            totalDiscPersentage = exports.toUSD(totalDiscPersentage);

            if (cust == "ex") {

                if ((withPrices == "Y") && (suppressPrices == "N")) {

                    if (hasDiscount != "false") {

                        pricingDetails["totallistExtPrice"] = totallistExtPrice;
                        pricingDetails["totalDiscValue"] = totalDiscValue;
                        pricingDetails["totalDiscPersentage"] = totalDiscPersentage;
                        pricingDetails["totalNetPrice"] = totalNetPrice;
                    } else {

                        pricingDetails["totalNetPrice"] = totalNetPrice;
                    }
                }
                pricingDetails["currency"] = currency;
            } else {

                pricingDetails["totallistExtPrice"] = totallistExtPrice;
                pricingDetails["totalDiscValue"] = totalDiscValue;
                pricingDetails["totalDiscPersentage"] = totalDiscPersentage;
                pricingDetails["totalNetPrice"] = totalNetPrice;
                pricingDetails["currency"] = currency;
            }
            pricingDetails["columnNames"] = columnNames;
            pricingDetails["item"] = BundleItems;

            cb(null, pricingDetails);
        });
    });
}


module.exports.toUSD = function(n) {
    if (n != null) {
        return n.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
    }
}

module.exports.addOpionDetails = function(optionDetailsInt, price) {

    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var tempOrderPrice = price.order_price;
    var tempNetPrice = price.line_total;
    var listExtPrice = tempOrderPrice * price.so_line_item_qty;
    var disValue = listExtPrice - tempNetPrice;

    //currency convertions
    disValue = exports.toUSD(disValue)
    listExtPrice = exports.toUSD(listExtPrice);
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var netItemPrice = exports.toUSD(price.bundle_price);

    //Calculate ship_qty
    var shipFact = 0;
    shippedQty = 0;
    if ((price.cust_delv_no != null) || (price.status == "Cust Shipped") || (price.status == "Delivered")) {

        if (shippedQty != 0) {

            shippedQty = shippedQty + price.sched_line_qty;
        } else {

            shippedQty = price.sched_line_qty;
            shipFact = 0;
        }

    } else {

        shippedQty = 0;
    }

    if (shippedQty != 0) {

        if (price.so_line_item_qty == 0) {

            shipFact = 1;
        } else {

            shipFact = price.so_line_item_qty / shippedQty;
        }

    }
    var shipQty = 0;

    if (shipFact != 0) {

        shipQty = price.so_line_item_qty / shipFact;
        shipQty = Number(shipQty.toFixed(1));
    }
    var option = "";
    var product = "";

    if (price.product_no != null) {

        var productNOArr = (price.product_no).split(/\s+/);
        var ext = "Default";
        product = productNOArr[0];
        ext = productNOArr[1];

        if (ext) {

            option = "# " + productNOArr[1];
        }

        if (price.entry_key == "M") {

            option = "M " + product;
        }

    } else {

        if(price.entry_key == "M") {

            option = "M"
        }
    }

    optionDetailsInt.push({
        "Option": option,
        "description": price.product_descr,
        "idCode": price.id_code,
        "orderQty": price.quantity_ordered,
        "shippedQty": shipQty,
        "listUnitPrice": listUnitPrice,
        "listExtPrice": listExtPrice,
        "netLinePrice": netLinePrice,
        "discPer": exports.toUSD(price.cal_disc) + "%",
        "disValue": disValue,
        "currency": price.currency,
        "shipFrom": price.ship_from,
        "lspname": price.lsp_name,
        "netItemPrice": netItemPrice,
        "configId": price.config_id,
        "configUId": price.config_uid,
    });
    return optionDetailsInt;
}

module.exports.addExternalOpionDetails = function(optionDetails, price, withPrices, suppressPrices, hasDiscount, hasCustProduct) {

    var listUnitPrice = exports.toUSD(price.bundle_order_price);
    var netLinePrice = exports.toUSD(price.bundle_line_total);
    var tempOrderPrice = price.bundle_order_price;
    var tempNetPrice = price.bundle_line_total;
    var listExtPrice = tempOrderPrice * price.so_line_item_qty;
    var disValue = listExtPrice - tempNetPrice;
    var optionJson = {};

    //currency convertions
    disValue = exports.toUSD(disValue)
    listExtPrice = exports.toUSD(listExtPrice);

    //Calculate ship_qty
    var shipFact = 0;
    shippedQty = 0;

    if ((price.cust_delv_no != null) || (price.status == "Cust Shipped") || (price.status == "Delivered")) {

        if (shippedQty != 0) {

            shippedQty = shippedQty + price.sched_line_qty;

        } else {

            shippedQty = price.sched_line_qty;
            shipFact = 0;

        }
    } else {
        shippedQty = 0;
    }

    if (shippedQty != 0) {

        if (price.so_line_item_qty == 0) {

            shipFact = 1;

        } else {

            shipFact = price.so_line_item_qty / shippedQty;

        }

    }
    var shipQty = 0;
    if (shipFact != 0) {

        shipQty = price.so_line_item_qty / shipFact;
        shipQty = Number(shipQty.toFixed(1));

    }
    if (price.entry_key == "M" && ((price.product_no).endsWith("B") || (price.product_no).startsWith("60"))) {

        price.bundle_price = 0.0;

    }
    var option = "";
    var product = "";
    if (price.product_no != null) {

        var productNOArr = (price.product_no).split(/\s+/);
        product = productNOArr[0];
        var ext = "Default";
        ext = productNOArr[1];

        if (ext) {
            option = "# " + productNOArr[1];
        }
        if (price.entry_key == "M") {

            option = "";
        }
    }

    optionJson["Option"] = option;
    optionJson["description"] = price.product_descr;
    optionJson["orderQty"] = price.quantity_ordered;
    optionJson["shippedQty"] = shipQty;
    optionJson["listUnitPrice"] = listUnitPrice;

    if ((withPrices == "Y") && (suppressPrices == "N")) {

        if (hasDiscount != "false") {

            optionJson["listExtPrice"] = listExtPrice;
            optionJson["discPer"] = exports.toUSD(price.cal_disc) + "%";
            optionJson["disValue"] = disValue;
        }

        optionJson["netLinePrice"] = netLinePrice;
        optionJson["netItemPrice"] = exports.toUSD(price.bundle_price);
        optionJson["paymentTerms"] = price.payment_terms;

    } else if ((withPrices == "L") && (suppressPrices == "N")) {

        optionJson["netItemPrice"] = exports.toUSD(price.bundle_price);
    }

    optionJson["configId"] = price.config_id;
    optionJson["configUId"] = price.config_uid;
    optionDetails.push(optionJson);
    return optionDetails;
}

module.exports.addNewPricingDetails = function(BundleItems, visitedBundles, price) {

    var bundleName = "";
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var tempOrderPrice = price.order_price;
    var tempNetPrice = price.line_total;
    var listExtPrice = tempOrderPrice * price.so_line_item_qty;
    var disValue = listExtPrice - tempNetPrice;


    //currency convertions
    disValue = exports.toUSD(disValue)
    listExtPrice = exports.toUSD(listExtPrice);
    var listUnitPrice = exports.toUSD(price.order_price);
    var netLinePrice = exports.toUSD(price.line_total);
    var netItemPrice = exports.toUSD(price.bundle_price);

    //Calculate ship_qty
    var shipFact = 0;
    shippedQty = 0;

    if ((price.cust_delv_no != null) || (price.status == "Cust Shipped") || (price.status == "Delivered")) {

        if (shippedQty != 0) {

            shippedQty = shippedQty + price.sched_line_qty;
        } else {

            shippedQty = price.sched_line_qty;
            shipFact = 0;
        }
    } else {

        shippedQty = 0;
    }

    if (shippedQty != 0) {

        if (price.so_line_item_qty == 0) {

            shipFact = 1;
        } else {

            shipFact = price.so_line_item_qty / shippedQty;
        }

    }
    var shipQty = 0;
    if (shipFact != 0) {

        shipQty = price.so_line_item_qty / shipFact;
        shipQty = Number(shipQty.toFixed(1));

    }

    var product = "";

    if (price.product_no != null) {

        var productNOArr = (price.product_no).split(/\s+/);
        product = productNOArr[0];
        console.log("product:"+product);
    }
    //Bundle logic
    if (price.bundle_id != null) {

        if (price.bundle_name != null) {

            bundleName = bundleName + price.bundle_name;
        } else {

            bundleName = bundleName + price.bundle_id;
        }
    }

    newPricingInt = {
        "item": price.item_no,
        "product": product,
        "description": price.product_descr,
        "idCode": price.id_code,
        "orderQty": price.quantity_ordered,
        "shippedQty": shipQty,
        "listUnitPrice": listUnitPrice,
        "listExtPrice": listExtPrice,
        "netLinePrice": netLinePrice,
        "discPer": exports.toUSD(price.cal_disc) + "%",
        "disValue": disValue,
        "currency": price.currency,
        "shipFrom": price.ship_from,
        "lspname": price.lsp_name,
        "netItemPrice": netItemPrice,
        "configId": price.config_id,
        "configUId": price.config_uid,
        "option": optionDetailsInt,
    };

    if (bundleName != "") {

        if (visitedBundles.indexOf(bundleName) == -1) {

            BundleItems[bundleName] = [];
            BundleItems[bundleName].push(newPricingInt);
        } else {

            BundleItems[bundleName].push(newPricingInt);
        }
    } else {

        BundleItems["NoBundle"].push(newPricingInt);
    }

    visitedBundles.push(bundleName);
    return BundleItems;
}

module.exports.addExternalNewPricingDetails = function(BundleItems, visitedBundles, price, withPrices, suppressPrices, hasDiscount, hasCustProduct) {

    var bundleName = "";
    var listUnitPrice = exports.toUSD(price.bundle_order_price);
    var netLinePrice = exports.toUSD(price.bundle_line_total);

    var tempOrderPrice = price.order_price;
    var tempNetPrice = price.line_total;
    var listExtPrice = tempOrderPrice * price.so_line_item_qty;
    var disValue = listExtPrice - tempNetPrice;
    var newPricing = {};

    //currency convertions
    disValue = exports.toUSD(disValue)
    listExtPrice = exports.toUSD(listExtPrice);

    //Calculate ship_qty
    var shipFact = 0;
    shippedQty = 0;

    if ((price.cust_delv_no != null) || (price.status == "Cust Shipped") || (price.status == "Delivered")) {

        if (shippedQty != 0) {

            shippedQty = shippedQty + price.sched_line_qty;
        } else {

            shippedQty = price.sched_line_qty;
            shipFact = 0;
        }
    } else {

        shippedQty = 0;
    }

    if (shippedQty != 0) {

        if (price.so_line_item_qty == 0) {

            shipFact = 1;
        } else {

            shipFact = price.so_line_item_qty / shippedQty;
        }

    }
    var shipQty = 0;
    if (shipFact != 0) {

        shipQty = price.so_line_item_qty / shipFact;
        shipQty = Number(shipQty.toFixed(1));
    }

    var option = "";
    var product = "";

    if (price.product_no != null) {

        var productNOArr = (price.product_no).split(/\s+/);
        product = productNOArr[0];
        var ext = "Default";
        ext = productNOArr[1];

        if (ext) {

            option = "# " + productNOArr[1];
        }

        if (price.entry_key == "M") {

            option = "";
        }
    }
    //Bundle logic

    if (price.bundle_id != null) {

        if (price.bundle_name != null) {

            bundleName = bundleName + price.bundle_name;
        } else {

            bundleName = bundleName + price.bundle_id;
        }
    }

    newPricing["item"] = price.item_no;
    newPricing["product"] = product;

    if (hasCustProduct != "false") {

        newPricing["custProduct"] = price.cust_product_no;
    }

    newPricing["description"] = price.product_descr;
    newPricing["orderQty"] = price.quantity_ordered;
    newPricing["shippedQty"] = shipQty;

    if ((withPrices == "Y") && (suppressPrices == "N")) {

        newPricing["listUnitPrice"] = listUnitPrice;

        if (hasDiscount != "false") {

            newPricing["listExtPrice"] = listExtPrice;
            newPricing["discPer"] = exports.toUSD(price.cal_disc) + "%";
            newPricing["disValue"] = disValue;
        }

        newPricing["netLinePrice"] = netLinePrice;
        newPricing["netItemPrice"] = exports.toUSD(price.bundle_price);
        newPricing["paymentTerms"] = price.payment_terms;

    } else if ((withPrices == "L") && (suppressPrices == "N")) {

        newPricing["netItemPrice"] = exports.toUSD(price.bundle_price);
    }

    newPricing["configId"] = price.config_id;
    newPricing["configUId"] = price.config_uid;
    newPricing["option"] = [];
    newPricing["option"] = optionDetails;

    if (bundleName != "") {

        if (visitedBundles.indexOf(bundleName) == -1) {

            BundleItems[bundleName] = [];
            BundleItems[bundleName].push(newPricing);
        } else {

            BundleItems[bundleName].push(newPricing);
        }
    } else {

        BundleItems["NoBundle"].push(newPricing);
    }

    visitedBundles.push(bundleName);
    return BundleItems;
}

module.exports.checkOrderForExternalUser = function(filter, cb) {
    DbPool.OSSDB(function(db) {
        console.log("*******************************")
        console.log("Final filter:" + filter.where)
        console.log("Final filter.binds:" + filter.binds)
        console.log("*******************************")

        var sqlString = "";
        var lOrderno = "";

        sqlString = "select h.order_no,h.legacy_order_no,h.total_net_price,\
                            h.show_prices,h.reseller_order                 \
                       from backlog_hdr h,backlog_ids ids                  \
                      where (h.legacy_order_no = ids.legacy_order_no)      \
                        and h.customer_order     = 'Y'                     \
                        and (h.is_valid          = 'Y'                     \
                         or h.is_valid           IS NULL)                  \
                        and (" + filter.where + ")                         \
                        and rownum = 1"
        console.log("sqlString:" + sqlString);
        db.execute(sqlString, filter.binds, function(err, legacyOrderNos) {
            if (err) return cb(err, null);

            cb(null, legacyOrderNos);
        });
    });
}

module.exports.makeColumns = function(columnNames, hasDiscount, hasCustProduct, cust, customerProduct, withPrices, suppressPrices) {

    columnNames['item'] = "Item";
    columnNames['product'] = "Product";

    if (cust == "ex") {

        if (hasCustProduct != "false") {

            columnNames['custProduct'] = "Customer Product";
        }
        if ((withPrices == "Y") && (suppressPrices == "N")) {

            if (hasDiscount != "false") {

                columnNames['option'] = "Option";
                columnNames['description'] = "Description";
                columnNames['orderQty'] = "Order Qty";
                columnNames['shippedQty'] = "Shipped Qty";
                columnNames['listUnitPrice'] = "List Unit Price";
                columnNames['listExtPrice'] = "List Ext. Price";
                columnNames['disValue'] = "Discount";
                columnNames['discPer'] = "Discount %";
                columnNames['netLinePrice'] = "Net Line Price";
                columnNames['netItemPrice'] = "Net Item Price";
                columnNames['paymentTerms'] = "Payment Terms";

            } else {

                columnNames['option'] = "Option";
                columnNames['description'] = "Description";
                columnNames['orderQty'] = "Order Qty";
                columnNames['shippedQty'] = "Shipped Qty";
                columnNames['listUnitPrice'] = "List Unit Price";
                columnNames['netLinePrice'] = "Net Line Price";
                columnNames['netItemPrice'] = "Net Item Price";
                columnNames['paymentTerms'] = "Payment Terms";

            }
        } else if ((withPrices == "L") && (suppressPrices == "N")) {

            columnNames['option'] = "Option";
            columnNames['description'] = "Description";
            columnNames['orderQty'] = "Order Qty";
            columnNames['shippedQty'] = "Shipped Qty";
            columnNames['netItemPrice'] = "Net Item Price";

        } else {

            columnNames['option'] = "Option";
            columnNames['description'] = "Description";
            columnNames['orderQty'] = "Order Qty";
            columnNames['shippedQty'] = "Shipped Qty";

        }
    }
    if (cust == "in") {

        columnNames['option'] = "Option";
        columnNames['description'] = "Description";
        columnNames['orderQty'] = "Order Qty";
        columnNames['shippedQty'] = "Shipped Qty";
        columnNames['listUnitPrice'] = "List Unit Price";
        columnNames['listExtPrice'] = "List Ext. Price";
        columnNames['disValue'] = "Discount";
        columnNames['discPer'] = "Discount %";
        columnNames['netLinePrice'] = "Net Line Price";
        columnNames['currency'] = "Currency";
        columnNames['shipFrom'] = "Ship From";
        columnNames['lspname'] = "Vendor's Name";
    }
    return columnNames;
}

