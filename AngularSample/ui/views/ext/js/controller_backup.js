/* This js file is used to get data from services for external customers */

function indexCtrl($scope, pageTitle) {
    $scope.pageTitle = pageTitle;
}


/* providing navigation to order summary and report page  in all pages */

function PortalCtrl($scope, $location, $http, $routeParams) {
    var hostAddr = $location.host()+":"+$location.port();
    
    $scope.breadcrumbs = [];
    $scope.menu =   [
        {text: 'Orders & Reporting', href:'/ext/index.html', children: [
            {text:'Order Status', href:"./index.html"},
            {text:'Order Summary', href:'', click:'redirectToOrderSummary()'},
            {text:'My Reports', href:'', click:'redirectToReports()'},
            {text:'Event Notification', href:'', click:'redirectToEventNotification()'},
            {text:'Legacy Oss', href:'', click:'redirectToLegacyOSS()'}
          ]
        }/*,
        {text: 'Tools & Resources', href:'/ext/index.html', children: [
            {text:'Administrative Tools',click:'redirectToEventNotification()'},
            {text:'Customer Hierarchy', href:'#', click:'redirectToLegacyOSS()'}              
            ]
        }*/
      ]

    url = "http://" + hostAddr+"/ossui/v1/ex/usersettings";
    $http.get(url).success(function(data, status) {
        $scope.data = data;
        $scope.redirectToOrderSummary = function() {alert("hi");
            url = "#/ex/orderSummary?";
                if ($routeParams.hasOwnProperty("orderNo")!= false) {
                var orderNo = $routeParams.orderNo;
                var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
                url = url + urlParams;
                jQuery(location).attr("href", url);
            }
        }
        $scope.redirectToReports = function() {
            var url = "#/viewReports";
            /*url = "#/viewReports?";
            var urlParams = "user=" + data.user_id + "&aaid=adhoc";
            url = url + urlParams;*/
            jQuery(location).attr("href", url);
        }
        $scope.redirectToEventNotification = function(){                
            var url = "#/ex/eventBased";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToLegacyOSS = function(){
            console.log("called up redirect to legacy oss function");
                var serurl = "http://" + hostAddr+"/ossui/v1/ex/legacyOSSLink";
                var legacyurl = "";
                  jQuery(location).attr("href", legacyurl);
                $http.get(serurl).success(function(data, status) {
                legacyurl = data.data;
                jQuery(location).attr("href", legacyurl);
            }).error(function(data, status) {
                console.log('error');
                console.log(JSON.stringify(data));
                console.log('status');
                console.log(status);
            });
        }
    }).error(function(data, status) {
        console.log('error');
        console.log(JSON.stringify(data));
        console.log('status');
        console.log(status);
    });
}
/* get orders information for orderSummaryRoute service for order summary page*/

function orderListCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle) {
    var scopeItems = [];
    $scope.data = [];
    var hostAddr = $location.host()+":"+$location.port();
    //$scope.showColSort = function() {};

    jQuery("#home").removeClass("current");
    jQuery("#orderSummary").addClass("current");
    jQuery("#reports").removeClass("current");

    pageTitle.setTitle('Order Summary');

    var isFirst = false,
        url = "http://" + hostAddr+"/ossui/v1/ex/ordersummary";
    var isOrderType = true;
    if ($routeParams.hasOwnProperty("orderNoFor") == false) {
        isOrderType = false;
    }
    angular.forEach($routeParams, function(value, key) {
        if (key == "orderNo" && isOrderType != true) {
            url += "?hpOrderNo=" + encodeURIComponent($routeParams.orderNo);
        } else {
            if (isFirst) {
             //   if(key!="customerNameNoFor")
                url += "&";
            } else {
                txtVal = url.indexOf("?hpOrderNo=");
                if(txtVal < 0){
                    url += "?";
                }else{
                    url += "&";
                }
                isFirst = true;
            }

            if (key == "orderNoFor" || key == "orderFromDp" || key == "orderToDp") {
                if (key == "orderNoFor" && value == 'OR') {
                    if ($routeParams.hasOwnProperty("orderNo")!= false){
                        url += "hpOrderNo=" + encodeURIComponent($routeParams.orderNo);
                    }
                }
                if (key == "orderNoFor" && value == 'PO') {
                    if ($routeParams.hasOwnProperty("orderNo")!= false){
                        url += "custPoNo=" + encodeURIComponent($routeParams.orderNo);
                    }
                }
                if (key == "orderNoFor" && value == 'SH') {
                    if ($routeParams.hasOwnProperty("orderNo")!= false){
                        url += "shipmentNo=" + encodeURIComponent($routeParams.orderNo);
                    }
                }
                if (key == "orderFromDp") {
                    url += "poDateFrom=" + dateConversion(value);//$filter('date')(new Date(value), 'dd-MM-yy');
                }
                if (key == "orderToDp") {
                    url += "poDateTo=" + dateConversion(value);//$filter('date')(new Date(value), 'dd-MM-yy');
                }
            } else if(key == "status") {
                    url += "status=" + encodeURIComponent($routeParams.status);
            }else if (key == "poNo") {
                url += "custPoNo=" + encodeURIComponent(value);
            } else if (key == "hpOrderNo") {
                url += "hpOrderNo=" + encodeURIComponent(value);
            } else if (key == "shipmentNo") {
                url += "shipmentNo=" + encodeURIComponent(value);
            } else if (key == "invoiceNo") {
                url += "invoiceNo=" + encodeURIComponent(value);
            } else if (key == "customer") {
                url += "custId=" + encodeURIComponent(value);
            } else if (key == "customerName") {
                url += "custName=" + encodeURIComponent(value);
            } else if (key == "recentOrders") {
                url += "date=" + value;
            } else {
                if ($routeParams.hasOwnProperty("customerNameNoFor") == true && $routeParams.hasOwnProperty("customer") == true) {
                    if (key == "customerNameNoFor" && value == 'custno') {
                        url += "custId=" + encodeURIComponent($routeParams.customer);
                    } else if (key == "customerNameNoFor" && value == 'custname') {
                        var customerName = $routeParams.customer;
                        url += "custName=" + encodeURIComponent(customerName);
                    }
                } else if ($routeParams.hasOwnProperty("customerNameNoFor") == false && $routeParams.hasOwnProperty("customer") == true) {
                    url += "custId=" + encodeURIComponent($routeParams.customer);
                } else {
                    url += key + "=" + encodeURIComponent(value);
                }
            }
        }
    });
    //console.log(url);
    $scope.dataFetchUrl = url;

    $scope.getData = function(pageId) {
        var pageUrl = $scope.dataFetchUrl + "&pageId=" + pageId;
        $("#loader, #overlay").show();
        //console.log('url: ' + pageUrl);
        $http.get(pageUrl).success(function(data, status) {
            $scope.data = data;
            $("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.data != "") {
                    var lineItems=data.data;
                    var items = {
                    pageNo: data.pageNo,
                    recordCount: data.recordCount,
                    pageSize: data.pageSize,
                    data: []
                    };
                    $scope.showhide = false;
                    $scope.dataflag = false;
                    $scope.moreItems = false;
                    if (data.data.length > 10) {
                        $scope.moreItems = true;
                    } else {
                        $scope.moreItems = false;
                    }
                    if (data.recordCount > 1000) {
                        $scope.refineFlag = true;
                        $scope.refineSearchMsg = "Your search has returned " + data.recordCount + " records. Please refine your search.";
                    } else {
                        $scope.refineFlag = false;
                        $scope.refineSearchMsg = "";
                    }
                       $filter('filter')(lineItems, function(attr) {
                    var counter = 0;
                    $filter('filter')(attr.sched_Line, function(subAttr) {
                        var showItem = (counter == 0) ? true : false;
                        var lineItem = {
                            'showItem': showItem,
                            'purchaseOrderNo': attr.purchase_order_no,
                            'orderNo': attr.order_no,
                            'orderTypeDescr': attr.order_type_descr,
                            'quoteNo': attr.quote_no,
                            'purchOrderDate': attr.purch_order_date,
                            'status': subAttr.status,
                            'podAt': subAttr.pod_at,
                            'shippedAt': subAttr.shipped_at,
                            'schedDelvDate': subAttr.sched_delv_date,
                            'schedShipDate': subAttr.sched_ship_date,
                            'shipmentNo': subAttr.shipment_no,
                            'shipToAddr1': subAttr.ship_to_addr_1,
                            'quoteCreationDate': subAttr.quote_creation_date,
                            'lastUpdate': subAttr.last_update,
                            'hpReceiveDate': subAttr.hp_receive_date,
                            'orderLoadDate': subAttr.order_load_date,
                            'cleanOrderDate': subAttr.clean_order_date,
                            'orderCloseDate': subAttr.order_close_date,
                            'custDelvNo': subAttr.cust_delv_no,
                            'hpdeliveryno': subAttr.hpdeliveryno
                        };
                        counter++;
                        items.data[(items.data.length)++] = lineItem;
                    });
                });
                $rootScope.$broadcast('gotPageData', items);
                } else {
                    $scope.showhide = true;
                    $scope.dataflag = true;
                    document.getElementById("nodatafound").innerHTML = data.message;
                }
            }
            $rootScope.$broadcast('dataflag', $scope.dataflag);
            $rootScope.$broadcast('showhide', $scope.showhide);
        }).error(function(data, status) {
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
            $("#loader, #overlay").hide();
        });
    };
    $scope.getData(1);
    /* displaying column names in order summary page*/
    $scope.columnNames = [{
            'id': "purchaseOrderNo",
            'value': "PO#",
            "sort": "true"
        }, {
            'id': 'quoteNo',
            'value': 'Quote#',
            "sort": "true"
        }, {
            'id': 'shipToAddr1',
            'value': 'Ship To',
            "sort": "true"
        }, {
            'id': 'orderNo',
            'value': 'HP Order#',
            "sort": "true"
        }, {
            'id': 'status',
            'value': 'Order Status',
            "sort": "true"
        }, {
            'id': 'purchOrderDate',
            'value': 'Purchase Order Date',
            "sort": "true"
        }, {
            'id': 'plannedShipDate',
            'value': 'Planned Ship Date',
            'format': 'date',
            "sort": "true"
        }, {
            'id': 'shippedAt',
            'value': 'Actual Ship Date',
            'format': 'date',
            "sort": "true"
        }, {
            'id': 'plannedDeliveryDate',
            'value': 'Planned Delivery Date',
            'format': 'date',
            "sort": "true"
        }, {
            'id': 'podAt',
            'value': 'Actual Delivery Date',
            'format': 'date',
            "sort": "true"
        }, {
            'id': 'shipmentNo',
            'value': 'Shipment#',
            "sort": "true"
        }, {
            'id': 'orderTypeDescr',
            'value': 'Order Type',
            "sort": "true"
        }, {
            'id': 'lastUpdate',
            'value': 'Last Update',
            'format': 'date',
            "sort": "true"
        }
    ];
    $rootScope.$broadcast('columnNames', $scope.columnNames); // end of column names

    $scope.search = {
        'purchaseOrderNo': '',
        'quoteNo': '',
        'shipToAddr1': '',
        'orderNo': '',
        'status': '',
        'purchOrderDate':'',
        'plannedShipDate': '',
        'shippedAt': '',
        'plannedDeliveryDate': '',
        'podAt': '',
        'shipmentNo': '',
        'orderTypeDescr': '',
        'lastUpdate': ''
    };
    $scope.showCol = false;
    $scope.showColSort = function() {
        $filter('filter')($scope.items, function(item) {
            item.showItem = true;
        });
    };
    jQuery('a.trigger').live("click", function() {
        jQuery(this).parent().find('.OrderStatusPopup').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.OrderStatusPopup').hide();
    });
    $scope.displayRecordOption = [10, 20, 30];
    $scope.params = $routeParams;

    /* to add/remove column in order summary page*/

    $scope.showDropDown = function() {
        if ($("#tinyDrop").is(":visible")) {
            $("#tinyDrop").hide();
        } else {
            $("#tinyDrop").show();
        }
    }
    $("#showhideclmDiv > a").live("click", function() {

    });
    $(document).mousedown(function(e) {
        $("#tinyDrop").hide();
    });
    $("#showhideclmDiv>a, #tinyDrop").mousedown(function(e) {
        e.stopPropagation();
    });

    $scope.showHideColumn = function(id) {
        if ($(".test:checked").length < 2) {
            $(".test:checked").attr("disabled", "disabled");
            $(".test:checked + label.tblClmName").css("color", "#ccc");
        } else {
            $(".test:checked").removeAttr("disabled");
            $("label.tblClmName").css("color", "#4d4d4d");
        }
        $scope[id] = !$scope[id];
    }; // end of add/remove column

    /* to display quote details */
    $scope.openQuoteDetails = function(quote_no) {
        var quoteurl = "http://d2t0020g.austin.hp.com:8580/q2cngom/ngom#/quotationdetails/";
        window.open(quoteurl + quote_no, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
    }
    /* export to excel for order summary page*/
    $scope.exportToExcel = function() {

        var items = {
            columns: [{
                    names: $scope.columnNames
                }
            ],
            rows: $scope.items
        };
        var headTmpl = {
            "tag": "thead",
            children: function() {
                return (json2html.transform(this.columns, rowTmpl));
            }
        };
        var rowTmpl = {
            "tag": "tr",
            children: function() {
                return (json2html.transform(this.names, colTmpl));
            }
        };
        var colTmpl = {
            "tag": "th",
            "align": "left",
            "height": "50",
            "style": "background-color:#ccc",
            "html": "${value}"
        };

        var headerHtml = json2html.transform(items, headTmpl);

        var bodyTmpl = {
            "tag": "tbody",
            children: function() {
                return (json2html.transform(this.rows, rowTmpl));
            }
        };

        var rowTmpl = {
            "tag": "tr",
            children: [{
                    "tag": "td",
                    "html": "${purchaseOrderNo}"
                }, {
                    "tag": "td",
                    "html": "${quoteNo}"
                }, {
                    "tag": "td",
                    "html": "${shipToAddr1}"
                }, {
                    "tag": "td",
                    "html": "${orderNo}"
                }, {
                    "tag": "td",
                    "html": "${status}"
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.schedShipDate != "" && obj.schedShipDate != null) {
                            var dat = convertDatefromISO(obj.schedShipDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.shippedAt != "" && obj.shippedAt != null) {
                            var dat = convertDatefromISO(obj.shippedAt);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.schedDelvDate != "" && obj.schedDelvDate != null) {
                            var dat = convertDatefromISO(obj.schedDelvDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.podAt != "" && obj.podAt != null) {
                            var dat = convertDatefromISO(obj.podAt);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    "html": "${shipmentNo}"
                }, {
                    "tag": "td",
                    "html": "${orderTypeDescr}"
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.purchOrderDate != "" && obj.purchOrderDate != null) {
                            var dat = convertDatefromISO(obj.purchOrderDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.lastUpdate != "" && obj.lastUpdate != null) {
                            var dat = convertDatefromISO(obj.lastUpdate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }
            ]
        };
        var bodyHtml = json2html.transform(items, bodyTmpl);
        var exportTable = "<TABLE border='1' cellpadding='10' cellspacing='1'>" + headerHtml + bodyHtml + "</TABLE>";
        var dt = new Date();
        var day = dt.getDate();
        var month = dt.getMonth() + 1;
        var year = dt.getFullYear();
        var hour = dt.getHours();
        var mins = dt.getMinutes();
        var postfix = day + "." + month + "." + year + "_" + hour + "." + mins;
        var a = document.createElement('a');
        var data_type = 'data:application/vnd.ms-excel';
        a.href = data_type + ', ' + encodeURIComponent(exportTable);
        a.download = 'Order_Summary_' + postfix + '.xls';
        a.click();
    } // end of export to excel

    /* navigating to shipment page from order summary */
    $scope.redirectToShipmentDetails = function(hpdeliveryno) {
        if (hpdeliveryno != "") {
            url = "#/ex/shipmentInformation/" + hpdeliveryno;
            //console.log(url);
            jQuery(location).attr("href", url);
        } else {
            alert("No shipments found");
        }
    } //end of navigating to shipment page

    /* navigating to order detail Page from order summary */
    $scope.redirectToOrderDetails = function(orderNo) {
        url = "#/ex/orderheaderdetail?";
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);
    } //end of navigating to order detail page

    $scope.setDisplayModel = function(displayModel) {
        var model = displayModel;
        var dislpaymodel = 'isPanel';
        if (dislpaymodel == model) {
            jQuery('#panelDIV').attr("style", "display:block");
            jQuery('.tableDIV').attr("style", "display:none");
            jQuery('#autoFilterBut').attr("style", "visibility:hidden");
            jQuery("#viewByAllWithoutRefine").hide();
            jQuery("#viewByAllWithRefine").hide();
            jQuery("a.js_page_forward").addClass('icn_forward_active');
            jQuery("a.js_page_back").removeClass('icn_back_active');
            dislpaymodel = 'isPanel';
        } else {
            jQuery('.tableDIV').attr("style", "display:block");
            jQuery('#panelDIV').attr("style", "display:none");
            jQuery('#autoFilterBut').attr("style", "visibility:visible");

            if($scope.refineFlag == true){
                jQuery("#viewByAllWithRefine").show();
            }else{
                jQuery("#viewByAllWithoutRefine").hide();
                jQuery("#viewByAllWithoutRefine").attr("style","margin-top:10px;");
            }

            jQuery("a.js_page_forward").removeClass('icn_forward_active');
            jQuery("a.js_page_back").addClass('icn_back_active');
            dislpaymodel = 'isTable';
        }
    }
}
orderListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle']; // end of order summary controller

/* get order header information from orderDetailRoute service  for order detail page*/

function orderHeaderCtrl($scope, $http, $routeParams, $location, pageTitle,legacyOrder) {
    var hostAddr = $location.host()+":"+$location.port();
    var orderNo = $routeParams.orderNo;
    pageTitle.setTitle('Order Detail');

    jQuery('a.trigger').live("click", function() {
        jQuery(this).parent().find('.pop-up').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.pop-up').hide();
    });

    jQuery('img.bludbuildflag').live("click", function() {
        jQuery(this).parent().find('.bludbuildflag_tip').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.bludbuildflag_tip').hide();
    });

    var surl = "http://" + hostAddr+"/ossui/v1/ex/orderheaderdetail/?oid=" + orderNo + "&pageId=1";
    //console.log(surl);
    var orderStatus = "";
    var comments = {};
    var commentstr = "";
    var comments_str = "";
    var httpRequest = $http.get(surl).success(function(data, status) {
        //console.log(surl);
        $scope.cdCodeFlag = true;

        if (data.status=='S') {
            $scope.showDataFlag = false;
            $scope.orderHeader = data.header[0];
            var legacyOrderNo = data.header[0].oid;
            legacyOrder.setLegacyorderNo(legacyOrderNo);

            if (data.header[0].dc_code != null && data.header[0].dc_code != "00") {
                $scope.cdCodeFlag = false;
            }

            if (data.header[0].payment_terms != null && data.header[0].payment_terms_descr != null) {
            $scope.Payment_Terms = data.header[0].payment_terms + " : " + data.header[0].payment_terms_descr;
            } else if (data.header[0].payment_terms != null && data.header[0].payment_terms_descr == null) {
                $scope.Payment_Terms = data.header[0].payment_terms;
            } else if (data.header[0].payment_terms == null && data.header[0].payment_terms_descr != null) {
                $scope.Payment_Terms = data.header[0].payment_terms_descr;
            } else {
                $scope.Payment_Terms = "";
            }
            if (data.header[0].hasOwnProperty("Comments") == true) {
                angular.forEach(data.header[0].Comments, function(key, val) {
                    if(key.key!=""){
                    if (comments.hasOwnProperty(key.key) == true) {
                        commentstr = "\n" + key.value;
                        comments[key.key] += commentstr;
                    } else {

                        comments[key.key] = key.value;
                    }
                }else{
                    comments[val] = key.value;
                    }
                });
                angular.forEach(comments, function(key, val) {
                    if(isNaN(val)){
                        comments_str += val + " : " + key + "\n\r\n\r";
                    }else{
                        comments_str += key + "\n\r\n\r";
                    }
                });
                $scope.comments = comments_str;
                $scope.commentsflag = true;
            }
            /*  display hold codes */
            $scope.orderNotesflag = true;
            if (data.header[0].hasOwnProperty("Comments") == false) {
                $scope.orderNotesflag = false;
            } //end of hold codes and comments

            /* display order progression */
            orderStatus = data.header[0].order_overall_status;
            $scope.orderStatuses = {
                "Admin": 0,
                "Production": 1,
                "ProductionDone": 2,
                "Consolidation": 3,
                "Shipped": 4,
                "Delivered": 5
            };
            if (orderStatus == "Submitted" || orderStatus == "Acked" || orderStatus == "Processing") {
                var statusId = $scope.orderStatuses["Admin"];
                if (statusId == undefined) statusId = -1;
                $scope.currentStatus = statusId;
            } else if (orderStatus == "FactShipped") {
                var statusId = $scope.orderStatuses["Consolidation"];
                if (statusId == undefined) statusId = -1;
                $scope.currentStatus = statusId;
            } else if (orderStatus == "Registered") {
                var statusId = $scope.orderStatuses["Consolidation"];
                if (statusId == undefined) statusId = -1;
                $scope.currentStatus = statusId;
            } else {
                var statusId = $scope.orderStatuses[orderStatus];
                if (statusId == undefined) statusId = -1;
                $scope.currentStatus = statusId;
            } //end of order progression

            /* display quote details */
            $scope.openQuoteDetails = function() {
                var Unique_Ref_Quote_Id = data.header[0].Unique_Ref_Quote_Id;
                var quoteurl = data.header[0].quote_link+Unique_Ref_Quote_Id;
                window.open(quoteurl, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
            } // end of quote details

        } else {
            $scope.showDataFlag = true;
            $scope.errorFlag = data.message;
        }
    }).error(function(data, status) {
                console.log('error');
                console.log(JSON.stringify(data));
                console.log('status');
                console.log(status);
                $("#loader, #overlay").hide();
            });
    $scope.redirectToOrderHistoryDetails = function(){
            var orderNo = $routeParams.orderNo;
            url = "#/ex/orderHistory?";
            var orderNo = encodeURIComponent(orderNo);
            var urlParams = "orderNo=" + orderNo;
            url = url + urlParams;
            jQuery(location).attr("href", url);
        }
}
orderHeaderCtrl.$inject = ['$scope', '$http', '$routeParams', '$location', 'pageTitle','legacyOrder']; //end of order detail header controller

/* get line item details for order in order detail page */

function lineItemListCtrl($scope, $filter, $http, $routeParams, $rootScope, $location) {
    var orderNo = $routeParams.orderNo;
    var hostAddr = $location.host()+":"+$location.port();
    jQuery('a.trigger').live("click", function() {
        jQuery(this).parent().find('.prodPopup').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.prodPopup').hide();
    });

    jQuery('img.productflag').live("click", function() {
        jQuery(this).parent().find('.flag_tip').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.flag_tip').hide();
    });

    jQuery('#holecodemoreinfo').live("click", function() {
        jQuery(this).parent().find('.holdCodeMoreInfo').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.holdCodeMoreInfo').hide();
    });

    $scope.dataFetchUrl = "http://" + hostAddr+"/ossui/v1/ex/itemdetail/?oid=" + orderNo;
    $scope.indentationFlag = false;
    $scope.getData = function(pageId) {
        var pageUrl = $scope.dataFetchUrl + "&pageId=" + pageId;
        $("#loader, #overlay").show();
        //console.log('url: ' + pageUrl);
        $http.get(pageUrl).success(function(data, status) {
            $("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.status=='S') {
                    var productDetails = {};
                    var lineItems = data.data;
                    var items = {
                        pageNo: data.pageNo,
                        recordCount: data.recordCount,
                        pageSize: data.pageSize,
                        data: []
                    };
                    if(data.indentation_flag == 1){
                        $scope.indentationFlag = true;
                    }
                $rootScope.$broadcast('indentationFlag', $scope.indentationFlag);
                    $filter('filter')(lineItems, function(attr) {
                        var counter = 0;
                        $filter('filter')(attr.sched_Line, function(subAttr) {
                            var showItem = (counter == 0) ? true : false;
                            var lineItem = {
                                'showItem': showItem,
                                'itemSubItem': attr.item_subitem,
                                'level_indent': attr.level_indent,
                                'product': attr.product_no,
                                'itemStatus': subAttr.status,
                                'productDescr': attr.description,
                                'openQty': attr.order_qty,
                                'shippedQty': subAttr.qty,
                                'listUnitPrice': attr.list_unit_price,
                                'netLinePrice': attr.net_line_price,
                                'plannedDeliveryDate': subAttr.planned_delivery_date,
                                'actualDeliveryDate': subAttr.actual_delivery_date,
                                'purchOrderDate': subAttr.purch_order_date,
                                'plannedShipDate': subAttr.planned_ship_date,
                                'actualShipDate': subAttr.actual_ship_date,
                                'shipmentNo': subAttr.shipment_no,
                                'invoiceNo': subAttr.invoice_no,
                                'invoiceDate': subAttr.inv_date,
                                'shipDate': subAttr.ship_date,
                                'requestedDate': attr.request_date,
                                'fullInvoiceNo': attr.full_invoice_no,
                                'hpdeliveryno' : attr.hpdeliveryno,
                                'system': attr.system
                            };
                            counter++;
                            items.data[(items.data.length)++] = lineItem;
                        });
                    });
                    $rootScope.$broadcast('gotPageData', items);
                    $scope.moreItems = false;
                    if (items.data.length > 10) {
                        if(data.indentation_flag == 0){
                            $scope.moreItems = true;
                        }else{
                            $scope.moreItems = false;
                        }
                    } else {
                        $scope.moreItems = false;
                    }
                } else {
                    $scope.showDataFlag = true;
                    $scope.errorFlag = data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
            $("#loader, #overlay").hide();
        });
    };
    $scope.getData(1);
    /* display column names for line items in order detail page */
    $scope.columnNames = [{
            'id': "itemSubItem",
            'value': "Item",
            "sort": "true"
        }, {
            'id': 'product',
            'value': 'Product',
            "sort": "true"
        }, {
            'id': 'itemStatus',
            'value': 'Item Status',
            "sort": "true"
        }, {
            'id': 'productDescr',
            'value': 'Description',
            "sort": "true"
        }, {
            'id': 'openQty',
            'value': 'Order Qty',
            "sort": "true"
        }, {
            'id': 'shippedQty',
            'value': 'Partial Qty',
            "sort": "false"
        }, {
            'id': 'listUnitPrice',
            'value': 'Net Unit Price',
            "sort": "true"
        }, {
            'id': 'netLinePrice',
            'value': 'Net Line Price',
            "sort": "true"
        }, {
            'id': 'plannedShipDate',
            'value': 'Planned Ship Date',
            "sort": "true"
        }, {
            'id': 'actualShipDate',
            'value': 'Actual Ship Date',
            "sort": "true"
        }, {
            'id': 'plannedDeliveryDate',
            'value': 'Planned Delivery Date',
            "sort": "true"
        }, {
            'id': 'actualDeliveryDate',
            'value': 'Actual Delivery Date',
            "sort": "true"
        }, {
            'id': 'shipmentNo',
            'value': 'Shipment#',
            "sort": "true"
        }, {
            'id': 'invoiceNo',
            'value': 'Invoice#',
            "sort": "true"
        }, {
            'id': 'invoiceDate',
            'value': 'Invoice Date',
            "sort": "true"
        }, {
            'id': 'shipDate',
            'value': 'Ship Date',
            "sort": "true"
        }, {
            'id': 'requestedDate',
            'value': 'Requested Date',
            "sort": "true"
        }
    ];

    $scope.indentColumnNames = [{
            'id': "itemSubItem",
            'value': "Item",
            "sort": "false"
        }, {
            'id': 'product',
            'value': 'Product',
            "sort": "false"
        }, {
            'id': 'itemStatus',
            'value': 'Item Status',
            "sort": "false"
        }, {
            'id': 'productDescr',
            'value': 'Description',
            "sort": "false"
        }, {
            'id': 'openQty',
            'value': 'Order Qty',
            "sort": "false"
        }, {
            'id': 'shippedQty',
            'value': 'Partial Qty',
            "sort": "false"
        }, {
            'id': 'listUnitPrice',
            'value': 'Net Unit Price',
            "sort": "false"
        }, {
            'id': 'netLinePrice',
            'value': 'Net Line Price',
            "sort": "false"
        }, {
            'id': 'plannedShipDate',
            'value': 'Planned Ship Date',
            "sort": "false"
        }, {
            'id': 'actualShipDate',
            'value': 'Actual Ship Date',
            "sort": "false"
        }, {
            'id': 'plannedDeliveryDate',
            'value': 'Planned Delivery Date',
            "sort": "false"
        }, {
            'id': 'actualDeliveryDate',
            'value': 'Actual Delivery Date',
            "sort": "false"
        }, {
            'id': 'shipmentNo',
            'value': 'Shipment#',
            "sort": "false"
        }, {
            'id': 'invoiceNo',
            'value': 'Invoice#',
            "sort": "false"
        }, {
            'id': 'invoiceDate',
            'value': 'Invoice Date',
            "sort": "false"
        }, {
            'id': 'shipDate',
            'value': 'Ship Date',
            "sort": "false"
        }, {
            'id': 'requestedDate',
            'value': 'Requested Date',
            "sort": "false"
        }
    ];
    $rootScope.$broadcast('columnNames', $scope.columnNames); // end of displaying column names
    $scope.applyIndent = function(indentValue){
             if(indentValue > 0){
                 if(indentValue == 1){
                     return "indentOne";
                }else if(indentValue == 2){
                     return "indentTwo";
                 }else if(indentValue == 3){
                     return "indentThree";
                 }else if(indentValue == 4){
                     return "indentFour";
                 }
             }

        }

    $scope.search = {
        'itemSubItem': '',
        'product': '',
        'itemStatus': '',
        'productDescr': '',
        'openQty': '',
        'shippedQty': '',
        'listUnitPrice': '',
        'netLinePrice': '',
        'purchOrderDate': '',
        'plannedShipDate': '',
        'actualShipDate': '',
        'plannedDeliveryDate': '',
        'actualDeliveryDate': '',
        'shipmentNo': '',
        'invoiceNo': '',
        'invoiceDate': '',
        'shipDate': '',
        'requestedDate': ''
    };

    $scope.showCol = false;
    $scope.showColSort = function() {
        $filter('filter')($scope.items, function(item) {
            item.showItem = true;
        });
    };
    /* get invoice info from invoiceRoute service to download invoice */
    $scope.searchInvoice = function(invoiceNo, fullInvoiceNo, system) {
        var hostAddr = $location.host()+":"+$location.port();
        if (invoiceNo != "") {
            url = "http://" + hostAddr+"/ossui/v1/ex/invoice?" + "order_no=" + orderNo + "&invoice_no=" +
                invoiceNo + "&full_invoice_no" + fullInvoiceNo + "&data_source=" + system;
            jQuery(location).attr("href", url);
        }
    } //end of download invoice

    /* navigating to shipment page from order detail */
    $scope.redirectToShipmentDetails = function(hpdeliveryno) {
        if (hpdeliveryno != "") {
            url = "#/ex/shipmentInformation/" + hpdeliveryno;
            //console.log(url);
            jQuery(location).attr("href", url);
        } else {
            alert("No shipments found");
        }
    } //end of navigating to shipment page

    /* export to excel for order detail */
    $scope.exportToExcel = function() {

        var items = {
            columns: [{
                    names: $scope.columnNames
                }
            ],
            rows: $scope.items
        };
        var headTmpl = {
            "tag": "thead",
            children: function() {
                return (json2html.transform(this.columns, rowTmpl));
            }
        };
        var rowTmpl = {
            "tag": "tr",
            children: function() {
                return (json2html.transform(this.names, colTmpl));
            }
        };
        var colTmpl = {
            "tag": "th",
            "align": "left",
            "height": "50",
            "style": "background-color:#ccc",
            "html": "${value}"
        };
        var headerHtml = json2html.transform(items, headTmpl);
        var bodyTmpl = {
            "tag": "tbody",
            children: function() {
                return (json2html.transform(this.rows, rowTmpl));
            }
        };
        var rowTmpl = {
            "tag": "tr",
            children: [{
                    "tag": "td",
                    "html": "${itemSubItem}"
                }, {
                    "tag": "td",
                    "html": "${product}"
                }, {
                    "tag": "td",
                    "html": "${itemStatus}"
                }, {
                    "tag": "td",
                    "html": "${productDescr}"
                }, {
                    "tag": "td",
                    "html": "${openQty}"
                }, {
                    "tag": "td",
                    "html": "${shippedQty}"
                }, {
                    "tag": "td",
                    "html": "${listUnitPrice}"
                }, {
                    "tag": "td",
                    "html": "${netLinePrice}"
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.plannedShipDate != "" && obj.plannedShipDate != null) {
                            var dat = convertDatefromISO(obj.plannedShipDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.actualShipDate != "" && obj.actualShipDate != null) {
                            var dat = convertDatefromISO(obj.actualShipDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.plannedDeliveryDate != "" && obj.plannedDeliveryDate != null) {
                            var dat = convertDatefromISO(obj.plannedDeliveryDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.actualDeliveryDate != "" && obj.actualDeliveryDate!= null) {
                            var dat = convertDatefromISO(obj.actualDeliveryDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    "html": "${shipmentNo}"
                }, {
                    "tag": "td",
                    "html": "${invoiceNo}"
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.invoiceDate != "" && obj.invoiceDate != null) {
                            var dat = convertDatefromISO(obj.invoiceDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.shipDate != "" && obj.shipDate != null) {
                            var dat = convertDatefromISO(obj.shipDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.requestedDate != "" && obj.requestedDate != null) {
                            var dat = convertDatefromISO(obj.requestedDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }
            ]
        };
        var bodyHtml = json2html.transform(items, bodyTmpl);
        var exportTable = "<TABLE border='1' cellpadding='10' cellspacing='1'>" + headerHtml + bodyHtml + "</TABLE>";
        var dt = new Date();
        var day = dt.getDate();
        var month = dt.getMonth() + 1;
        var year = dt.getFullYear();
        var hour = dt.getHours();
        var mins = dt.getMinutes();
        var postfix = day + "." + month + "." + year + "_" + hour + "." + mins;
        var a = document.createElement('a');
        var data_type = 'data:application/vnd.ms-excel';
        a.href = data_type + ', ' + encodeURIComponent(exportTable);
        a.download = 'Order_Details_' + postfix + '.xls';
        a.click();
    } // end of export to excel
}
lineItemListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location']; //end of line items for order

/* get shipment information from shipmentDetailRoute service */

function trackingListCtrl($scope, $http, $routeParams, $rootScope, $location) {
    var hpdeliveryno = $routeParams.hpdeliveryno;
    var hostAddr = $location.host()+":"+$location.port();
    $scope.showColSort = function() {};
    if (hpdeliveryno && hpdeliveryno != "") {
        var surl = "http://" + hostAddr+"/ossui/v1/ex/shipmentdetail/" + hpdeliveryno;
        //console.log(surl);
        $http.get(surl).success(function(data, status) {
            $("#loader, #overlay").hide();
            if (data != undefined) {
                $rootScope.$broadcast('shipmentHeader', data);
                $rootScope.$broadcast('trackingItems', data.data.tracking);
                $rootScope.$broadcast('tracingItems', data.data.tracing);
                $rootScope.$broadcast('boxInfo', data.data.box);
            }
        }).error(function(data, status) {
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
            $("#loader, #overlay").hide();
        });
    } else {
        $rootScope.$broadcast('shipmentHeader', []);
        $rootScope.$broadcast('trackingItems', []);
        $rootScope.$broadcast('tracingItems', []);
        $rootScope.$broadcast('boxInfo', []);
    }
      /* track and trace url */
    $scope.isTrackClickable = function(tat_url) {
        if (tat_url == undefined || tat_url == "" || tat_url == null) return false;
        return true;
    }
    $scope.isCarrierClickable = function(carrierWebSite) {
        if (carrierWebSite == undefined || carrierWebSite == "" || carrierWebSite == null) return false;
        return true;
    }
    $scope.searchTrackAndTrace = function(tat_url) {
        var hostAddr = $location.host()+":"+$location.port();

        if (tat_url != "") {
            var trackAndTraceFlag =confirm("You are about to leave HP's website!\nHP is not responsible for information outside the HP website.");
            if (trackAndTraceFlag==true){
                window.open(tat_url, '_blank', 'width=700,height=500,toolbar=0,location=0,menubar=0')
            }
        }
    } // end of track and trace

    $scope.displayCarrier= function(carrierWebSite) {
        var hostAddr = $location.host()+":"+$location.port();

        if(carrierWebSite != "") {
            var carrierFlag =confirm("You are about to leave HP's website!\nHP is not responsible for information outside the HP website.");
            if (carrierFlag=true) {
                window.open(carrierWebSite,'_blank','width=700,height=500,toolbar=0,location=0,menubar=0')
            }
        }
    }
}
trackingListCtrl.$inject = ['$scope', '$http', '$routeParams', '$rootScope', '$location'];

/* get shipment header details */

function shipmentHeaderCtrl($scope, pageTitle) {
    pageTitle.setTitle('Shipment Detail');
    $scope.addOneFlag = false;
    $scope.addTwoFlag = false;
    $scope.addThreeFlag = false;
    $scope.addFourFlag = false;
    $scope.addFiveFlag = false;
    $scope.addSixFlag = false;
    $scope.addSevenFlag = false;
    $scope.$on('shipmentHeader', function(events, data) {
        if (data.data != "") {
            $scope.items = data.data.header;
            if(data.data.header[0].hasOwnProperty("depot_to_addr_1") == true ){
                $scope.addOneFlag = true;
            }if(data.data.header[0].hasOwnProperty("depot_to_addr_2") == true ){
                $scope.addTwoFlag = true;
            }if(data.data.header[0].hasOwnProperty("depot_to_addr_3") == true ){
                $scope.addThreeFlag = true;
            }
            if(data.data.header[0].hasOwnProperty("depot_to_addr_4") == true ){
                $scope.addFourFlag = true;
            }if(data.data.header[0].hasOwnProperty("depot_to_addr_5") == true ){
                $scope.addFiveFlag = true;
            }if(data.data.header[0].hasOwnProperty("depot_to_addr_6") == true ){
                $scope.addSixFlag = true;
            }if(data.data.header[0].hasOwnProperty("depot_to_addr_7") == true ){
                $scope.addSevenFlag = true;
            }
            $scope.showhide = false;
        } else {
            $scope.showhide = true;
            $scope.error = data.message;
        }
    });
    jQuery("#home").removeClass("current");
    jQuery("#orderSummary").addClass("current");
    jQuery("#reports").removeClass("current");
    $scope.redirectToOrderDetails = function(orderNo) {
        url = "#/ex/orderheaderdetail?";
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);
    }
}
shipmentHeaderCtrl.$inject = ['$scope', 'pageTitle']; //end of shipment header details

/* get tracking information */

function trackInfoListCtrl($scope, $rootScope) {
    $scope.showColSort = function() {};
    $rootScope.trackingInfo = false;
    /* diplaying column names for tracking information */
    $scope.columnNames = [{
            'id': "trackingNo",
            'value': "Tracking#",
            "sort": "false"
        }, {
            'id': 'carrier',
            'value': 'Carrier',
            "sort": "false"
        }, {
            'id': 'hawb',
            'value': 'House Bill#',
            "sort": "false"
        }
    ];
    $scope.$on('trackingItems', function(events, data) {
        if (data != undefined) {
            $scope.items = data;
            if ($scope.items.length > 0) {
                $rootScope.trackingInfo = true;
            }
        }
    });
}
trackInfoListCtrl.$inject = ['$scope', '$rootScope']; // end of tracking information

/* get status history */

function statusHistoryListCtrl($scope, $rootScope) {
    $scope.showColSort = function() {};
    $rootScope.statusHist = false;
    /* diplaying column names for status history */
    $scope.columnNames = [{
            'id': "trackingNo",
            'value': "Tracking#",
            "sort": "false"
        }, {
            'id': 'status',
            'value': 'Status',
            "sort": "false"
        }, {
            'id': 'reason',
            'value': 'Reason',
            "sort": "false"
        }
    ];
    $scope.$on('tracingItems', function(events, data) {
        if (data != undefined) {
            $scope.items = data;
            if ($scope.items.length > 0) {
                $rootScope.statusHist = true;
            }
        }
    });
}
statusHistoryListCtrl.$inject = ['$scope', '$rootScope']; // end of status history

/* get box information */

function boxInfoListCtrl($scope, $rootScope) {
    $scope.showColSort = function() {};
    $rootScope.boxInfo = false;
    /* diplaying column names for box information */
    $scope.columnNames = [{
            'id': "orderNo",
            'value': "Order#",
            "sort": "false"
        }, {
            'id': 'boxNo',
            'value': 'Box',
            "sort": "false"
        }, {
            'id': 'weight',
            'value': 'Weight',
            "sort": "false"
        }
    ];

    $scope.$on('boxInfo', function(events, data) {
        if (data != undefined) {
            $scope.items = data;
            if ($scope.items.length > 0) {
                $rootScope.boxInfo = true;
            }
        }
    });
}
boxInfoListCtrl.$inject = ['$scope', '$rootScope']; //end of box info

function homeCtrl($scope, $location, $routeParams, $http, pageTitle) {
    $scope.recentOrders = "";
    var hostAddr = $location.host()+":"+$location.port();
    var baseList = [{
            "label": "",
            "desc": "HP Order#",
            'value': 'OR'
        }, {
            "label": "",
            "desc": "Purchase Order#",
            'value': 'PO'
        }, {
            "label": "",
            "desc": "Shipment#",
            'value': 'SH'
        }
    ];

    jQuery("#orderNo").on("input, keyup", function() {
        if (jQuery("#orderNo").val().length == 0) {
            jQuery("#orderNoForId").text("");
        }
    });

    pageTitle.setTitle('Home');

    jQuery("#orderNo").autocomplete({
        open: function(event, ui) {
            jQuery(this).autocomplete("widget").css({
                "width": "auto"
            });
        },
        source: function(request, response) {
            jQuery.each(baseList, function(name, value) {
                value.label = request.term;
            });
            response(baseList);
        },
        focus: function(event, ui) {
            return false;
        },
        select: function(event, ui) {
            jQuery("#orderNo").val(ui.item.label);
            jQuery("#orderNoForId").text(" - " + ui.item.desc);
            jQuery("#orderNoFor").val(" as " + ui.item.desc);
            $scope.order.orderNoFor = ui.item.value;
            $scope.$apply();
            return false;
        }
    }).data("autocomplete")._renderItem = function(ul, item) {
        return jQuery("<li></li>").data("item.autocomplete", item)
            .append("<a>" + item.label + " as " + item.desc + "</a>").appendTo(ul);
    };
    var customerList = [{
            "label": "",
            "desc": "Customer #",
            'value': 'custno'
        }, {
            "label": "",
            "desc": "Customer Name",
            'value': 'custname'
        }
    ];

    jQuery("#customer").on("input, keyup", function() {
        if (jQuery("#customer").val().length == 0) {
            jQuery("#customerForId").text("");
        }
    });
    jQuery("#customer").autocomplete({
        open: function(event, ui) {
            jQuery(this).autocomplete("widget").css({
                "width": "auto"
            });
        },
        source: function(request, response) {
            jQuery.each(customerList, function(name, value) {
                value.label = request.term;
            });
            response(customerList);
        },
        focus: function(event, ui) {
            return false;
        },
        select: function(event, ui) {
            jQuery("#customer").val(ui.item.label);
            jQuery("#customerForId").text(" - " + ui.item.desc);
            jQuery("#customerNameNoFor").val(" as " + ui.item.desc);
            $scope.order.customerNameNoFor = ui.item.value;
            $scope.$apply();
            return false;
        }
    }).data("autocomplete")._renderItem = function(ul, item) {
        return jQuery("<li></li>").data("item.autocomplete", item)
            .append("<a>" + item.label + " as " + item.desc + "</a>").appendTo(ul);
    };

    $scope.isFormValid = function(order) {

        if ($("#RecentOrders").val() == "" && $("#orderNo").val() == "" && $("#customer").val() == "" && $("#status").val() == "" && $("#orderFromDp").val() == "" && $("#orderToDp").val() == "") {
            $(".homePage .error").slideDown(500);
        } else if ($("#orderFromDp").val() == "" && $("#orderToDp").val() != "") {
            $(".homePage .error").html('Please select Order Date(From) to continue search');
            $(".homePage .error").slideDown(500);
        } else {
            if ($("#RecentOrders").val() != "" || $("#orderFromDp").val() != "" && $("#orderToDp").val() != "") {
                $scope.searchOrder(order);
            } else {
                if ($("#orderFromDp").val() == "" && $("#orderToDp").val() != ""){
                    $(".homePage .error").html('Please select Order Date(From) to continue search');
                    $(".homePage .error").slideDown(500);
                }else if ($("#status").val() != "" && $("#orderNo").val() == "" && $("#customer").val() == "") {
                    $(".homePage .error").slideDown(500);
                    //alert("Please provide \n\n ID (HP order number / Purchase order number / Shipment number) \n or Customer ID/Name \n\n\n to avoid long running sessions which will block the database.");
                } else {
                    $scope.searchOrder(order);
                }
            }
        }

    }
    $scope.isFormValidInternal = function(order) {

        if ($("#RecentOrders").val() == "" && $("#orderNo").val() == "" && $("#customer").val() == "" && $("#status").val() == "" && $("#orderFromDp").val() == "" && $("#orderToDp").val() == "") {
            $(".homePage .errorMsg").html('Please enter additional search criteria in order to refine your search.');
            $(".homePage .errorMsg").slideDown(500);
        } else if ($("#orderFromDp").val() == "" && $("#orderToDp").val() != "") {
            $(".homePage .errorMsg").html('Please select Order Date(From) to continue search');
            $(".homePage .errorMsg").slideDown(500);
        } else {
            if ($("#RecentOrders").val() != "" && $("#orderFromDp").val() == "" && $("#orderToDp").val() == "") {
                $(".homePage .errorMsg").html('Please enter additional search criteria in order to refine your search.');
                $(".homePage .errorMsg").slideDown(500);
            } else {
                if ($("#status").val() != "" && $("#orderNo").val() == "" && $("#customer").val() == "") {
                    $(".homePage .errorMsg").slideDown(500);
                    //alert("Please provide \n\n ID (HP order number / Purchase order number / Shipment number) \n or Customer ID/Name \n\n\n to avoid long running sessions which will block the database.");
                } else {
                    $scope.searchOrder(order);
                }
            }
        }

    }

    $scope.disableFields = function(state) {
        if (state) {
            if ($scope.order.recentOrders != '') {

                $scope.isDisabled = true;
                $scope.addClassDisabled = 'disabled';
                $scope.order.orderNo = "";
                $scope.order.customer = "";

                jQuery('#orderNoForId').html("");
                jQuery('#orderFromDp').val("");
                jQuery('#orderToDp').val("");
                jQuery("#status").val("");

                $('#orderFromDp, #orderToDp').datepicker('disable');
            } else {
                $scope.isDisabled = false;
                $scope.addClassDisabled = '';
                jQuery('#orderFromDp, #orderToDp').datepicker('enable');
            }
        } else {
            if ($scope.order.recentOrders != '') {
                $scope.isDisabled = true;
                $scope.addClassDisabled = 'disabled';
                jQuery('#orderFromDp').datepicker().datepicker('setDate', -$scope.order.recentOrders);
                jQuery('#orderToDp').datepicker().datepicker('setDate', new Date());
                var fDate = jQuery('#orderFromDp').datepicker('getDate');
                jQuery("#orderToDp").datepicker().datepicker("option", "minDate", fDate);
                jQuery('#orderFromDp, #orderToDp').attr("readonly",true);
                jQuery('#orderFromDp, #orderToDp').attr("disabled",true);

            } else {
                $scope.isDisabled = false;
                $scope.addClassDisabled = '';
                jQuery('#orderFromDp, #orderToDp').attr("readonly",false);
                jQuery('#orderFromDp, #orderToDp').attr("disabled",false);
            }
        }
    }
    jQuery("#RecentOrders,  #status").change(function() {
        jQuery(".homePage .error").slideUp(500);
    });
    jQuery("#orderNo, #customer").keyup(function() {
        $(".homePage .error").slideUp(500);
    });
    $scope.searchOrder = function(order) {
        var counter = 0,
            url = "#/ex/orderSummary?";
        angular.forEach(order, function(value, key) {
            if (value != "") {
                if (counter == 0) url += key + "=" + encodeURIComponent(value);
                else url += "&" + key + "=" + encodeURIComponent(value);
                counter++;
            } else {
                delete order.key;
            }
        });
        jQuery(location).attr("href", url);
    }

    $scope.searchUser = function() {
        var counter = 0,
        url = "#/viewReports";
        jQuery(location).attr("href", url);
    }

}

homeCtrl.$inject = ['$scope', '$location', '$routeParams', '$http', 'pageTitle'];

function refineSearchCtrl($scope, $location, $routeParams) {
    $scope.$on('dataflag', function(events, data) {
        $scope.dataflag = data;
    });
    $scope.reSet = function() {
        $scope.hpOrderNo = "";
        $scope.poNo = "";
        $scope.shipmentNo = "";
        $scope.invoiceNo = "";
        $scope.orderFromDp = "";
        $scope.orderToDp = "";
        $scope.customer = "";
        $scope.customerName = "";
    }
    if ($routeParams.orderNoFor == null || $routeParams.orderNoFor == "OR") {
        if ($routeParams.orderNo != null) {
            if ($routeParams.orderNo != "undefined") {
                $scope.hpOrderNo = $routeParams.orderNo;
            } else {
                $scope.hpOrderNo = "";
            }
        } else {
            $scope.hpOrderNo = $routeParams.hpOrderNo;
        }
    }
    if ($routeParams.orderNoFor == "PO") {
        $scope.poNo = $routeParams.orderNo;
    } else {
        if($routeParams.poNo != undefined){
            $scope.poNo = $routeParams.poNo;
        }
    }
    if ($routeParams.orderNoFor == "SH") {
        $scope.shipmentNo = $routeParams.orderNo;
    } else {
        if($routeParams.shipmentNo != undefined){
            $scope.shipmentNo = $routeParams.shipmentNo;
        }
    }
    if($routeParams.custId != undefined){
        $scope.customer = $routeParams.custId;
    }if($routeParams.custName !=undefined){
        $scope.customerName = $routeParams.custName;
    }
    $scope.orderFromDp = $routeParams.orderFromDp;
    $scope.orderToDp = $routeParams.orderToDp;
    if($routeParams.invoiceNo != undefined){
        $scope.invoiceNo = $routeParams.invoiceNo;
    }
    var custdet = $routeParams.customerNameNoFor;
    if (custdet == "custname") {
        $scope.customerName = $routeParams.customer;
    } else if (custdet == "custno") {
        $scope.customer = $routeParams.customer;
    }

    $scope.isRSFormValid = function() {
        var fromDate = new Date($("#orderFromDp").val());
        var toDate = new Date($("#orderToDp").val());


        if ($('#refSearchFrom input[value!=""]').length > 0) {
            if ($("#orderFromDp").val() == "" && $("#orderToDp").val() != "") {
                jQuery(".error").html('Please select Order Date(From) to continue search');
                jQuery(".error").slideDown(500);
            } else if (fromDate > toDate) {
                jQuery(".error").html('From Date should be less than To Date to continue search');
                jQuery(".error").slideDown(500);
            } else {
                jQuery(".error").slideUp(500);
                $scope.searchOrder();
            }
        } else {
            jQuery(".error").html('Please enter atleast one search criteria.');
            jQuery(".error").slideDown(500);
        }
    }

    $scope.searchOrder = function() {
        //console.log($routeParams);
        var counter = 0;
        url = "#/ex/orderSummary?";
        if ($scope.hpOrderNo != undefined && $scope.hpOrderNo != "") {
            if (counter == 0) url += "hpOrderNo=" + encodeURIComponent($scope.hpOrderNo);
            else url += "&hpOrderNo=" + encodeURIComponent($scope.hpOrderNo);
            counter++;
        }
        if ($scope.poNo != undefined) {
            if (counter == 0) url += "poNo=" + encodeURIComponent($scope.poNo);
            else url += "&poNo=" + encodeURIComponent($scope.poNo);
            counter++;
        }
        if ($scope.shipmentNo != undefined) {
            if (counter == 0) url += "shipmentNo=" + encodeURIComponent($scope.shipmentNo);
            else url += "&shipmentNo=" + encodeURIComponent($scope.shipmentNo);
            counter++;
        }
        if ($scope.invoiceNo != undefined) {
            if (counter == 0) url += "invoiceNo=" + encodeURIComponent($scope.invoiceNo);
            else url += "&invoiceNo=" + encodeURIComponent($scope.invoiceNo);
            counter++;
        }
        if ($scope.orderFromDp != undefined) {
            if ($scope.orderFromDp != NaN && $scope.orderFromDp != "") {
                if (counter == 0) url += "orderFromDp=" + $scope.orderFromDp;
                else url += "&orderFromDp=" + $scope.orderFromDp;
                counter++;
            }
        }
        if ($scope.customer != undefined) {
            if (counter == 0) url += "custId=" + encodeURIComponent($scope.customer);
            else url += "&custId=" + encodeURIComponent($scope.customer);
            counter++;
        }
        if ($scope.orderToDp != undefined) {
            if ($scope.orderToDp != NaN && $scope.orderToDp != "") {
                if (counter == 0) url += "orderToDp=" + $scope.orderToDp;
                else url += "&orderToDp=" + $scope.orderToDp;
                counter++;
            }
        }
        if ($scope.customerName != undefined) {
            if (counter == 0) url += "custName=" + encodeURIComponent($scope.customerName);
            else url += "&custName=" + encodeURIComponent($scope.customerName);
            counter++;
        }
        //console.log('url: ' + url);
        jQuery(location).attr("href", url);
    }
    $scope.redirectToAdvSearch = function() {
        url = '#/advancedSearch';
        jQuery(location).attr('href', url);
    }
}
refineSearchCtrl.$inject = ['$scope', '$location', '$routeParams'];

function advSearchCtrl($scope, $location, $routeParams) {
    $scope.redirectToStdSearch = function() {
        url = '#/ex/orderSummary';
        jQuery(location).attr('href', url);
    }    
}
advSearchCtrl.$inject = ['$scope', '$location', '$routeParams'];

/* get reports from reportRoutes service */

function viewReportsController($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle) {
    var user = $routeParams.user;
    var aaid = $routeParams.aaid;
    
    $scope.fileErr = false;
    if ($routeParams.hasOwnProperty("err")!= false) {
            $scope.fileErr = true;
            if($routeParams.err == "1"){
                $scope.fileErrMsg = "Requested report file is not present on the server.";
            }else if($routeParams.err == "2"){
                $scope.fileErrMsg = "Could not retrieve requested report file.";
            }
    }

    $scope.showColSort = function() {};
    $("#loader, #overlay").hide();

    jQuery("#home").removeClass("current");
    jQuery("#orderSummary").removeClass("current");
    jQuery("#reports").addClass("current");

    pageTitle.setTitle('Reports');

    /* display column names in report page */
    $scope.columnNames = [{
            'id': 'name',
            'value': 'Report Name',
            "sort": "true"
        }, {
            'id': 'sched_interval',
            'value': 'Frequency',
            "sort": "true"
        }, {
            'id': 'last_change',
            'value': 'Last Change',
            "sort": "true"
        }, {
            'id': 'Download',
            'value': 'Download',
            'sort': 'false'
        }
    ]; //end of column names

    var hostAddr = $location.host()+":"+$location.port();
    var reportsUrl = "http://" + hostAddr+"/ossui/v1/ex/reports/myreports";
    var reportNames = [];
    //$scope.nodataFlag = true;
    var getUserDetailurl = "http://" + hostAddr+"/ossui/v1/ex/usersettings";
    $http.get(getUserDetailurl).success(function(data, status) {
            $scope.data = data;
            var postData = "user=" + data.user_id + "&aaid=adhoc";
            //var postData = "user=hymavathi.vajrala@hp.com&aaid=adhoc";
            $http({url : reportsUrl,
                    method:"POST",
                    data: postData,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function (data, status, headers, config) {
                    $("#loader, #overlay").hide();
                    if (data != undefined)
                    {
                        if(data.status == "S")
                        {
                            if(data.message!= ""){
                                $scope.nodataFlag = false;
                                $scope.message = data.message; 
                                jQuery("#reportsMsg").addClass("twelve columns orderdetailerror");
                            }
                            else{
                                $scope.nodataFlag = true;
                                $scope.items = data.data;
                                jQuery("#reportsMsg").removeClass("twelve columns orderdetailerror");
                                angular.forEach(data.data, function(key, val) {
                                reportNames.push(key.name);
                                }); 
                            }
                        }
                    }
                }).error(function (data, status, headers, config) {
                    console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);
                    $("#loader, #overlay").hide();
                });
        }).error(function(data, status) {
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
            $("#loader, #overlay").hide();
        });
        $scope.getReports = function(itemDetails,fileformat){
                postData = "?path="+itemDetails.path;
                var reportURL = "http://" + hostAddr+"/ossui/v1/ex/reports/getreport"+postData;
                window.open(reportURL,'_self','width=500,height=500,toolbar=0,location=0,menubar=0');
            }

    //$scope.items = reportInfo.data;
    $scope.showCol = false;
    $scope.showColSort = function() {};

    /* display excel or csv images based on data availability to download reports */
    $scope.fileExists = function(file, type) {
        if (file == undefined || file[type] == undefined) return false;
        return true;
    } // end of excel or csv

    /* autocomple report names in report dropdown */
    jQuery("#Customer").live("input", function() {
        if (jQuery("#Customer").val().trim().length == 0) {
            $scope.searchReport = '';
            $scope.$apply();
        }
    });
    jQuery("#Customer").autocomplete({
        source: reportNames,
        open: function(event, ui) {
            jQuery(this).autocomplete("widget").css({
                "width": "165px"
            });
        },
        focus: function(event, ui) {
            return false;
        },
        select: function(event, ui) {
            $scope.searchReport = ui.item.value;
            $scope.$apply();
        }
    }); //end of autocomplete

    /* to display table or panel view */
    $scope.setDisplayModel = function(displayModel) {
        var model = displayModel;
        var dislpaymodel = 'isTable';
        if (dislpaymodel == model) {
            jQuery('.tableDIV').attr("style", "display:block");
            jQuery('.tableDIV').attr("style", "margin-left:5px");
            jQuery('#panelDIV').attr("style", "display:none");
            jQuery("a.js_page_forward").removeClass('icn_forward_active');
            jQuery("a.js_page_back").addClass('icn_back_active');

            dislpaymodel = 'isPanel';
        } else {
            jQuery('#panelDIV').attr("style", "display:block");
            jQuery('#panelDIV').attr("style", "margin-left:11px");
            jQuery('.tableDIV').attr("style", "display:none");
            jQuery("a.js_page_forward").addClass('icn_forward_active');
            jQuery("a.js_page_back").removeClass('icn_back_active');
            dislpaymodel = 'isTable';
        }
    } // end of table or panel view

}
viewReportsController.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle']; // end of reports controller

/*eventBased notification controller*/
function eventBasedController($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle, createDialog) {
    pageTitle.setTitle('Event Notification');
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var notificationUrl = hostAddr+"/ossui/v1/ex/externalNotification";
    console.log(notificationUrl);
    $scope.deleteEmailList = [];
    $("#loader, #overlay").show();
   // $scope.displayData();
    $scope.displayData = function(){
        $http.get(notificationUrl).success(function(data, status) {
            $("#loader, #overlay").hide(); 
            if(data !=undefined){                
                if(data.data.enabled == 'N'){
                    $scope.enabled = false;
                }
                else{
                    $scope.enabled = true;
                }
                if(data.data.send_daily == 'N'){
                    $scope.eventsFlag = false;
                    $scope.getClass('event');
                    $rootScope.$broadcast('dailyFlag',$scope.eventsFlag);
                    angular.forEach(data.data.e_mail_list,function(val){
                        if(val != data.data.e_mail_addr) {
                           $scope.deleteEmailList.push(val); 
                        }  
                    });  
                    if($scope.deleteEmailList.length == 0){
                        $scope.deleteButton = false;
                    }  
                    else{
                        $scope.deleteButton = true;
                    }  
                    $scope.emailTo = data.data.e_mail_list.join("\n");
                    $scope.purchOrderNum = data.data.purch_order_pat;
                    $scope.attnTo = data.data.ship_to_attn_pat;
                    $scope.host = data.data.host;
                    $scope.path = data.data.path;
                    $scope.user = data.data.transport_user;
                    $scope.password = data.data.transport_passwd;
                    if(data.data.on_ack != 'N'){
                        $scope.ack = true;
                    }
                    else{
                        $scope.ack = false;
                    }
                    if(data.data.on_sdd_chg != 'N'){
                        $scope.sddChng = true;
                    }
                    else{
                        $scope.sddChng = false;
                    }
                    if(data.data.on_order_chg != 'N'){
                        $scope.ordChng = true;
                    }
                    else{
                        $scope.ordChng = false;
                    }
                    if(data.data.on_status_admin != 'N'){
                        $scope.admin = true;
                    }
                    else{
                        $scope.admin = false;
                    }
                    if(data.data.on_status_prod != 'N'){
                        $scope.prod = true;
                    }
                    else{
                        $scope.prod = false;
                    }
                    if(data.data.on_status_cons != 'N'){
                        $scope.consol = true;
                    }
                    else{
                        $scope.consol = false;
                    }
                    if(data.data.on_status_ship != 'N'){
                        $scope.ship = true;
                    }
                    else{
                        $scope.ship = false;
                    }
                    if(data.data.on_status_delv != 'N'){
                        $scope.del = true;
                    }
                    else{
                        $scope.del = false;
                    }
                    if(data.data.on_status_inv != 'N'){
                        $scope.inv = true;
                    }
                    else{
                        $scope.inv = false;
                    }
                    if(data.data.on_status_canc != 'N'){
                        $scope.cancel = true;
                    }
                    else{
                        $scope.cancel = false;
                    }
                    if(data.data.header_line != 'N'){
                        $scope.incHL = true;
                    }
                    else{
                        $scope.incHL = false;
                    }
                    $scope.daily = false;
                    $scope.timing = data.data.timing;
                    $scope.transport = data.data.transport_method;
                    $scope.msgFormat = data.data.msgformat;
                    $scope.transFormat = data.data.transport_format; 
                    if(data.data.SaveSetupButton == 1){
                        $scope.showSaveBtn = true;
                    }     
                    else{
                        $scope.showSaveBtn = false;
                    }          
                    if(data.data.internalVisible == 1){
                        $scope.intVisible = true;
                    }     
                    else{
                        $scope.intVisible = false;
                    } 
                }
                else{
                    $scope.eventsFlag = true;
                    $scope.getClass('daily');
                    angular.forEach(data.data.e_mail_list,function(val){
                        if(val != data.data.e_mail_addr) {
                            $scope.deleteEmailList.push(val);                        
                            console.log($scope.deleteEmailList.length);
                        }
                    });  
                    if($scope.deleteEmailList.length == 0){
                        $scope.deleteButton = false;
                    }  
                    else{
                        $scope.deleteButton = true;
                    }  
                    $scope.emailToDaily = data.data.e_mail_list.join("\n");
                    $scope.purchOrderNumDaily = data.data.purch_order_pat;
                    $scope.attnToDaily = data.data.ship_to_attn_pat;
                    $scope.ackDaily = data.data.on_ack;
                    $scope.sddChngDaily = data.data.on_sdd_chg;
                    $scope.ordChngDaily = data.data.on_order_chg;
                    $scope.adminDaily = data.data.on_status_admin;
                    $scope.prodDaily = data.data.on_status_prod;
                    $scope.consolDaily = data.data.on_status_cons;
                    $scope.shipDaily = data.data.on_status_ship;
                    $scope.delDaily = data.data.on_status_delv;
                    $scope.invDaily = data.data.on_status_inv;
                    $scope.cancelDaily = data.data.on_status_canc;
                    $scope.incHLDaily = data.data.header_line;
                    $scope.timingDaily = data.data.timing;
                    $scope.hostDaily = data.data.host;
                    $scope.pathDaily = data.data.path;
                    $scope.userDaily = data.data.transport_user;
                    $scope.passwordDaily = data.data.transport_passwd;
                    $scope.transportDaily = data.data.transport_method;
                    $scope.msgFormatDaily = data.data.msgformat;
                    $scope.transFormatDaily = data.data.transport_format; 
                    $scope.daily = true;
                    if(data.data.SaveSetupButton == 1){
                        $scope.showSaveBtn = true;
                    }     
                    else{
                        $scope.showSaveBtn = false;
                    } 
                    if(data.data.internalVisible == 1){
                        $scope.intVisible = true;
                    }     
                    else{
                        $scope.intVisible = false;
                    }    
                }
                $rootScope.$broadcast('flag', $scope.eventsFlag);
                $scope.loggedInEmail = data.data.e_mail_addr;
               // $scope.deleteEmailList = data.data.e_mail_list;  
            }
        }).error(function(data, status) {
            console.log('Event Notification error');
             $("#loader, #overlay").hide(); 
        });
    }
    $scope.displayData();
    $scope.disableEventNotification=function(){
        $scope.enabled = false;
        if($scope.daily == false){
            var disableData = {
                "enabled" : $scope.enabled,
                "purch_order_pat": $scope.purchOrderNum,
                "ship_to_attn_pat":$scope.attnTo,
                "on_ack":$scope.ack,
                "on_sdd_chg":$scope.sddChng,
                "on_order_chg":$scope.ordChng,
                "on_status_chg":"Y", 
                "on_status_admin":$scope.admin, 
                "on_status_prod":$scope.prod, 
                "on_status_cons":$scope.consol,
                "on_status_ship":$scope.ship, 
                "on_status_delv":$scope.del,
                "on_status_inv":$scope.inv,
                "on_status_canc":$scope.cancel,
                "timing":$scope.timing,
                "transport_method":$scope.transport, 
                "transport_format":$scope.transFormat,
                "header_line":$scope.incHL,
                "host":$scope.host, 
                "transport_user":$scope.user, 
                "transport_passwd":$scope.password, 
                "MESSAGE_FORMAT":$scope.msgFormat,
                "send_daily":$scope.daily, 
                "path": $scope.path,
                "e_mail_addr":$scope.loggedInEmail
            };
        }
        else{
            var disableData = {
                "enabled" : $scope.enabled,
                "purch_order_pat": $scope.purchOrderNumDaily,
                "ship_to_attn_pat": $scope.attnToDaily,
                "on_ack": $scope.ackDaily,
                "on_sdd_chg": $scope.sddChngDaily,
                "on_order_chg": $scope.ordChngDaily,
                "on_status_chg":"Y", 
                "on_status_admin": $scope.adminDaily, 
                "on_status_prod": $scope.prodDaily, 
                "on_status_cons": $scope.consolDaily,
                "on_status_ship": $scope.shipDaily, 
                "on_status_delv": $scope.delDaily,
                "on_status_inv": $scope.invDaily,
                "on_status_canc": $scope.cancelDaily,
                "timing": $scope.timingDaily,
                "transport_method": $scope.transportDaily, 
                "transport_format": $scope.transFormatDaily,
                "header_line": $scope.incHLDaily,
                "host": $scope.hostDaily, 
                "transport_user": $scope.userDaily, 
                "transport_passwd": $scope.passwordDaily, 
                "MESSAGE_FORMAT": $scope.msgFormatDaily,
                "send_daily": $scope.daily, 
                "path": $scope.pathDaily,
                "e_mail_addr": $scope.loggedInEmail
            };
        }

        console.log(disableData);          
        disableUrl = hostAddr+"/ossui/v1/ex/disableNotification";
        $("#loader, #overlay").show(); 
        $http({
            url: disableUrl,
            method: "POST",
            data: disableData,
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            $("#loader, #overlay").hide();
            console.log(data);
           // $scope.eventNotificationSaved();
        }).error(function (data, status, headers, config) {
            console.log("data"+data);
            $("#loader, #overlay").hide(); 
            console.log("Failed to Save Data: "+data);                         
        }); 
    }
    $scope.saveSetup = function(scope){
            $scope.showDialogDisClaimer();
            $scope.enabled = true;
            if($scope.daily == false){
                var saveSetupData = {
                    "enabled" : $scope.enabled,
                    "purch_order_pat": $scope.purchOrderNum,
                    "ship_to_attn_pat":$scope.attnTo,
                    "on_ack":$scope.ack,
                    "on_sdd_chg":$scope.sddChng,
                    "on_order_chg":$scope.ordChng,
                    "on_status_chg":"Y", 
                    "on_status_admin":$scope.admin, 
                    "on_status_prod":$scope.prod, 
                    "on_status_cons":$scope.consol,
                    "on_status_ship":$scope.ship, 
                    "on_status_delv":$scope.del,
                    "on_status_inv":$scope.inv,
                    "on_status_canc":$scope.cancel,
                    "timing":$scope.timing,
                    "transport_method":$scope.transport, 
                    "transport_format":$scope.transFormat,
                    "header_line":$scope.incHL,
                    "host":$scope.host, 
                    "transport_user":$scope.user, 
                    "transport_passwd":$scope.password, 
                    "MESSAGE_FORMAT":$scope.msgFormat,
                    "send_daily":$scope.daily, 
                    "path": $scope.path,
                    "e_mail_addr":$scope.loggedInEmail
                };
            }
            else{
                var saveSetupData = {
                    "enabled" : $scope.enabled,
                    "purch_order_pat": $scope.purchOrderNumDaily,
                    "ship_to_attn_pat": $scope.attnToDaily,
                    "on_ack": $scope.ackDaily,
                    "on_sdd_chg": $scope.sddChngDaily,
                    "on_order_chg": $scope.ordChngDaily,
                    "on_status_chg":"Y", 
                    "on_status_admin": $scope.adminDaily, 
                    "on_status_prod": $scope.prodDaily, 
                    "on_status_cons": $scope.consolDaily,
                    "on_status_ship": $scope.shipDaily, 
                    "on_status_delv": $scope.delDaily,
                    "on_status_inv": $scope.invDaily,
                    "on_status_canc": $scope.cancelDaily,
                    "timing": $scope.timingDaily,
                    "transport_method": $scope.transportDaily, 
                    "transport_format": $scope.transFormatDaily,
                    "header_line": $scope.incHLDaily,
                    "host": $scope.hostDaily, 
                    "transport_user": $scope.userDaily, 
                    "transport_passwd": $scope.passwordDaily, 
                    "MESSAGE_FORMAT": $scope.msgFormatDaily,
                    "send_daily": $scope.daily, 
                    "path": $scope.pathDaily,
                    "e_mail_addr": $scope.loggedInEmail
                };
            }

            console.log(saveSetupData);  
            $scope.$on("success", function(events, data)
            {
                saveUrl = hostAddr+"/ossui/v1/ex/saveNotification";
                $("#loader, #overlay").show(); 
                $http({
                    url: saveUrl,
                    method: "POST",
                    data: saveSetupData,
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data, status, headers, config) {
                    $("#loader, #overlay").hide();
                   // $scope.eventNotificationSaved();
                }).error(function (data, status, headers, config) {
                    $("#loader, #overlay").hide(); 
                    console.log("Failed to Save Data: "+data);                         
                });  
            });
    }
    
    $rootScope.$on('refreshPage', function(data){    	
                $("#loader, #overlay").show(); 
                $scope.displayData();
            });
    
    $scope.eventNotificationSaved = function(){
        createDialog('partials/eventNotificationSaved.html', {
              id: 'eventNotificationSaved',
              backdrop: true,
              //scope:$scope,
              success: {label: 'Success', fn: function() {
                  $rootScope.$broadcast('refreshPage');
                  console.log('eventNotificationSaved modal closed');
                }}
            });
    }
    
    $scope.showDialogDisClaimer = function(){
        createDialog('partials/disclaimer.html', {
              id: 'Disclaimer',
              backdrop: true,
              scope:$scope,
              success: {label: 'Success', fn: function() {
                  console.log('Disclaimer modal closed');
                  $scope.eventNotificationSaved();
                }}
        });
    }
    $scope.addEmailId = function(){
     console.log("called up show dialog add email method");
     createDialog('partials/addEmail.html', {
              id: 'addEmail',
              backdrop: true,
              scope: $scope,
              success: {label: 'Success', fn: function() {
                  console.log('Add Email modal closed');
                  $scope.newAddedEmail = this.newEmail;
                  var addurl = hostAddr+"/ossui/v1/ex/addNewEmail?emailaddr="+$scope.newAddedEmail;  
                  $http.get(addurl).success(function(data, status) {
                        $("#loader, #overlay").hide();
                        console.log('success' + data.message+":"+addurl);
                        $scope.message = data.message;
                        $scope.addEmailConfirmation($scope.message);
                    }).error(function(data, status) {
                        console.log(data.message);
                        $scope.message = data.message;
                        $scope.addEmailConfirmation($scope.message);
                    });
                }}
            });
    }
    $scope.addEmailConfirmation = function(msg){
        $scope.message =msg;
        createDialog('partials/addEmailConfirmation.html', {
          id: 'addEmailConfirmation',
          backdrop: true,
         // scope:$scope,
          success: {label: 'Success', fn: function() {
              console.log('addEmailConfirmation modal closed');  
              $scope.addEmailId();                            
            }}
        });
    }
    $scope.deleteEmailId = function(){
     console.log("called up deleteEmail dialog method");
     createDialog('partials/deleteEmail.html', {
          id: 'deleteEmail',
          backdrop: true,
          scope:$scope,
          success: {label: 'Success', fn: function() {
                console.log('deleteEmail modal closed');
                $scope.delEmailId = this.deleteEmail;
                  var deleteurl = hostAddr+"/ossui/v1/ex/deleteEmail?email="+$scope.delEmailId;  
                  $http.get(deleteurl).success(function(data, status) {
                    $("#loader, #overlay").hide();
                    console.log('success');
                    console.log(data);
                   //          if(data !=undefined){
                            $("#loader, #overlay").hide();//}
                           // console.log('reloading...');
                            //$route.reload();
                           // $scope.addEmailConfirmation();
                    }).error(function(data, status) {
                        console.log('error');
                    });
            }}
        });
    }
     
    $scope.getClass = function(templateName) {
      //  console.log("in the getClass function"+templateName);
        if(templateName == "event") {
            $scope.templateUrl = "partials/EventBasedInfo.html";
            $scope.activeevent = "event";
            $scope.activedaily = "false";
           // return $scope.event;                    
        }
        else if(templateName == "daily") {
            $scope.templateUrl = "partials/DailyEvents.html";
            $scope.activeevent = "false";
            $scope.activedaily = "daily";
           // return $scope.daily;                    
        }        
    }
   
    $scope.showDisclaimer = function(){
        var modalInstance = $modal.open({
      templateUrl: 'partials/disclaimer.html',
      controller: ModalInstanceCtrl,
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });
  

    modalInstance.result.then(function (selectedItem) {
      $scope.selected = selectedItem;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };
}
eventBasedController.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle','createDialog']; // end of reports controller

var ModalInstanceCtrl = function ($scope, $modalInstance, items) {

  $scope.items = items;
  $scope.selected = {
    item: $scope.items[0]
  };

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};
/* to expand or collapse  */

function expandOrCollapseCtrl($scope) {

    $scope.collapseAll = true;
    $scope.expandAll = false;
    $scope.expandOrCollapseImg = [];

    angular.forEach($scope.expandOrCollapsePanelNames, function(panelName) {
        $scope[panelName] = true;
        $scope.expandOrCollapseImg[panelName] = "expandImg";
    });

    $scope.expandOrCollapse = function(panelName, mode) {
        $scope[panelName] = !$scope[panelName];
        if (mode) {
            if (mode == 'e') {
                $scope[panelName] = true;
            } else {
                $scope[panelName] = false;
            }
        }
        if ($scope[panelName]) {
            $scope.expandOrCollapseImg[panelName] = "expandImg";
        } else {
            $scope.expandOrCollapseImg[panelName] = "collapseImg";
        }
    };
} // end of expand or collapse
/* get order hostory information for orderHistoryRoute service for order hostory page*/
function orderHistoryCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){
    var orderNo = $routeParams.orderNo;
	$scope.orderNo = orderNo;
    $scope.columnNames = [{
            'id': "date",
            'value': "Date",
            "sort": "false"
        }, {
            'id': 'statusCode',
            'value': 'Status Code',
            "sort": "false"
        }, {
            'id': 'description',
            'value': 'Status Description',
            "sort": "false"
        }
    ];

    //console.log(historyInfo);
    pageTitle.setTitle('Order History');
    jQuery("#home").removeClass("current");
    jQuery("#orderSummary").addClass("current");
    jQuery("#reports").removeClass("current");
    /* navigating to order detail Page from order summary */
    $scope.redirectToOrderDetails = function() {
        url = "#/ex/orderheaderdetail?";
        var orderNo = $routeParams.orderNo;
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);

    } //end of navigating to order detail page

    var hostAddr = $location.host()+":"+$location.port();
    var surl = "http://" + hostAddr+"/ossui/v1/ex/orderhistory?order_no=" + orderNo;
        //console.log(surl);
        $http.get(surl).success(function(data, status) {
            $("#loader, #overlay").hide();
            if (data != undefined) {
               if(data.status == "E"){
                        $scope.error = data.data;
                        $scope.noDataFlag = true;
                }else{
                        $scope.items = data.data;
                        $scope.noDataFlag = false;
                }
            }
        }).error(function(data, status) {
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
            $("#loader, #overlay").hide();
        });
}
orderHistoryCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];
function collapseExpandCtrl($scope, $rootScope){
    $scope.detailTable = false;
        $scope.$on('showhide', function(events, data) {
            $scope.detailTable = data;
        });
    }
function serialAssetInfoCtrl($scope,$routeParams,$location,$http,legacyOrder){
        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var legacyOrderNo = legacyOrder.getLegacyorderNo();
        var url = hostAddr+"/ossui/v1/in/dtechinfo?lon="+legacyOrderNo;
        //88W275273001";
        
        $scope.dataFlag = true;
        jQuery("#loader, #overlay").show();    
        $http.get(url).success(function(data, status) {
            jQuery("#loader, #overlay").hide();
            //console.log(data);
            if(data.status == "S" && data.data!=""){
                $scope.dataFlag = true;
                $scope.$broadcast('serialAssetInfoData',data.data);    
            }else if((data.status == "S" && data.data == "") || (data.status == "N" && data.data == "")){
                $scope.errorMessage = data.message;
                $scope.dataFlag = false;
                //console.log("I came:"+data.message);
            }
        }).error(function(data, status) {
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
        });
        
    
    
}
serialAssetInfoCtrl.$inject = ['$scope','$routeParams','$location','$http','legacyOrder'];


function pricingtab($scope,$routeParams,$location,$http,legacyOrder){
      $scope.columnsObj = {
         
          "item": "Item",
          "product": "Product",
          "option": "Option",
          "description": "Description",
          "orderQty": "Order Qty",
          "shippedQty": "Shipped Qty",
          "listUnitPrice": "List Unit Price",
          "netLinePrice": "Net Line Price",
          "netItemPrice": "Net Item Price",
          "paymentTerms": "Payment Terms"
        };
        
        
     var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var legacyOrderNo = legacyOrder.getLegacyorderNo();
        var url = hostAddr+"/ossui/v1/ex/pricingdetail/?hpOrderNo="+$routeParams.orderNo;
      
        $http.get(url).success(function(data, status) {
           console.log(url);
            if(data.data[0]!=null){
                $scope.$broadcast('pricingtabCtrl',data.data[0]);
                console.log("pricing external");    
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
        });
        
    
    
    
}


function shipmentInformationCtrl ($scope, $http, $location, $compile, $rootScope, $routeParams){
  var OrderNo= $routeParams.orderNo;
  var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
  var url = hostAddr+"/ossui/v1/ex/shipmenttab?order_no="+OrderNo;
  console.log(url);
  
   jQuery("#loader, #overlay").show();
   $http.get(url).success(function(data, status) {
      jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.items=data.data;                  

                } else {                   
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });   

   $scope.expandOrCollapseShipment = function(panelName, shipmentNo, hpDeliveryNo, hpLegacyOrderNo)
   { 
       var deliveryNo = hpDeliveryNo;
       var ShipNo = shipmentNo;
       var trackUrl = hostAddr+"/ossui/v1/ex/trackInfo?hpdelvno=" + deliveryNo+"&legacy_order_no="+hpLegacyOrderNo+"&shipment_no="+ShipNo;
        // var trackUrl= "http://localhost:3000/ossui/v1/in/trackInfo?hpdelvno=B668-0811596006-130816&legacy_order_no=CBR114810001&shipment_no=0811596006";
       console.log(trackUrl); 
       
       jQuery("#loader, #overlay").show();
       $http.get(trackUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();
       
            if (data != undefined) {
                    if (data.Trackinfo != "") {                        
                    $scope.trackItems=data.Trackinfo;       
                    console.log($scope.trackItems);     
                  } else {                   
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });  
        
                
       var boxUrl =  hostAddr+"/ossui/v1/ex/boxInfo?order_no="+OrderNo+"&ship_no="+ShipNo;      
       jQuery("#loader, #overlay").show();
       $http.get(boxUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();       
            if (data != undefined) {                 
                    if (data.boxdetails.items != "") {                                         
                    $scope.boxItemsheader = data.boxdetails.header;     
                    $scope.itemDetails = data.boxdetails.item;              
                    console.log($scope.itemDetails);     
                  } else {                   
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });   
        
       var itemUrl =  hostAddr+"/ossui/v1/ex/itemInfo?order_no="+OrderNo +"&shipno="+ShipNo;      
       jQuery("#loader, #overlay").show();
       $http.get(itemUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();       
            if (data != undefined) {       
                            
                    if (data.Iteminfo.header != "") {                                         
                    $scope.itemItemsheader = data.Iteminfo.header;                     
                    $scope.itemItemsDetails = data.Iteminfo.techinfo;  
                    console.log($scope.itemItemsDetails);      
                  } else {                   
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });         
        
        
         var statusUrl =  hostAddr+"/ossui/v1/ex/statusHistory?hpdelvno="+deliveryNo+"&ship_no="+ShipNo;      
       jQuery("#loader, #overlay").show();
       $http.get(statusUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();       
            if (data != undefined) {       
                            
                    if (data.Event != "") {                                         
                    $scope.statusItems = data.Event;     
                     console.log($scope.statusItems);          
                  } else {                   
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });             
        
        
       var RFUIdUrl =  hostAddr+"/ossui/v1/ex/statusHistory?order_no="+OrderNo +"&shipno="+ShipNo;      
       jQuery("#loader, #overlay").show();
       $http.get(RFUIdUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();       
            if (data != undefined) {       
                            
                    if (data.dod != "") {                                         
                    $scope.RFUIDItems = data.dod;     
                     console.log($scope.RFUIDItems);          
                  } else {                   
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });             
      
                      
       
       $scope[panelName] = !$scope[panelName];             
       if ($scope[panelName]) {
                    //$scope.expcolcls="expandImg expCloseImgDiv";
                    var shipmentNumber = "#"+panelName;
                    $scope.el = $compile(shipmentNumber)($scope);
                    $scope.el.removeClass("collapseImg expCloseImgDiv");
                    $scope.el.addClass("expandImg expCloseImgDiv");
                    
                } else {
                    //$scope.expcolcls="collapseImg expCloseImgDiv"
                    var shipmentNumber = "#"+panelName;
                    $scope.el = $compile(shipmentNumber)($scope);
                    $scope.el.removeClass("expandImg expCloseImgDiv");
                    $scope.el.addClass("collapseImg expCloseImgDiv");
                    
                }
      
   } 
   
   
   $scope.expandOrCollapseShipmentInner = function (panelName)
   {    
        $scope[panelName] = !$scope[panelName];
        
         if ($scope[panelName]) {
                    //$scope.expcolcls="expandImg expCloseImgDiv";
                    var shipmentNumber = "#"+panelName;
                    $scope.el = $compile(shipmentNumber)($scope);
                    $scope.el.removeClass("collapseImg expCloseImgDiv");
                    $scope.el.addClass("expandImg expCloseImgDiv");
                    
                } else {
                    //$scope.expcolcls="collapseImg expCloseImgDiv"
                    var shipmentNumber = "#"+panelName;
                    $scope.el = $compile(shipmentNumber)($scope);
                    $scope.el.removeClass("expandImg expCloseImgDiv");
                    $scope.el.addClass("collapseImg expCloseImgDiv");
                    
                }
   } 
        
}
