/*----------------------------------------------------------------------------
|
|   Config file for User Settings.
|
|
|   written for opt/oss/pkg/frontend/OSfInternalUIServer
|   written by Alok Upendra Kamat
|   October 2013
|
\---------------------------------------------------------------------------*/

module.exports.OrderSummary = {
    "label": "Order Summary",
    "desc": "Customize Order Summary Page",
    "fields": {
        "1": {
            "field": "order_no",
            "table": "backlog_hdr",
            "alias": "bh",
            "type": "",
            "label": "HP Order #",
            "desc": "",
            "default": "Y"
        },
        "2": {
            "field": "purchase_order_no",
            "table": "backlog_hdr",
            "alias": "bh",
            "type": "",
            "label": "Purchase Order #",
            "desc": "",
            "default": "Y"
        }
    }
};

module.exports.OrderDetail = {
    "label": "Order Detail",
    "desc": "Customize Order Detail Page",
    "fields": {
        "1": {
            "field": "item_subitem",
            "table": "backlog_item",
            "alias": "bh",
            "type": "",
            "label": "Item #",
            "desc": "",
            "default": "Y"
        },
        "2": {
            "field": "shipment_no",
            "table": "backlog_item",
            "alias": "bh",
            "type": "",
            "label": "Shipment #",
            "desc": "",
            "default": "N"
        }
    }
};

module.exports.AdvSearch = {
    "label": "Advance Search",
    "desc": "Customize Advance Search Page",
    "fields": {
        "1": {
            "field": "orderNo",
            "table": "",
            "alias": "",
            "type": "simple",
            "label": "Order #",
            "desc": "",
            "default": "Y"
        },
        "2": {
            "field": "purchaseOrderNo",
            "table": "",
            "alias": "",
            "type": "simple",
            "label": "Purchase Order #",
            "desc": "",
            "default": "Y"
        },
        "3": {
            "field": "srchByNum",
            "table": "",
            "alias": "",
            "type": "complex",
            "label": "Search By Numbers",
            "desc": "",
            "default": "Y"
        },
        "4": {
            "field": "srchByTotOrdAmt",
            "table": "",
            "alias": "",
            "type": "complex",
            "label": "Search By Total Order Amount",
            "desc": "",
            "default": "N"
        },
        "5": {
            "field": "srchByLocTyp",
            "table": "",
            "alias": "",
            "type": "complex",
            "label": "Search By Location Type",
            "desc": "",
            "default": "N"
        }
    }
};
