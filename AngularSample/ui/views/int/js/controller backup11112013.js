/* This js file is used to get data from services for internal customers */

function indexCtrl($scope, pageTitle) {
    $scope.pageTitle = pageTitle;
}

/* providing navigation to order summary and report page  in all pages */

function PortalCtrl($scope, $location, $http, $routeParams, $rootScope, pageTitle) {
    var hostAddr = $location.host()+":"+$location.port();
    //console.log($routeParams);
    $scope.runningStandalone = false;
    try {
        $scope.runningStandalone = !(top.location != self.location);
    } catch (e) {}

    $scope.breadcrumbs = [];
    $scope.menu =   [
        {text: 'Orders & Reporting', href:'/int/index.html', children: [
            {text:'Order Status', href:"./index.html"},
            {text:'Order Summary', href:'', click:'redirectToOrderSummary()'},
            {text:'My Reports', href:'', click:'redirectToReports()'},
            {text:'Event Notification', href:'', click:'redirectToEventNotify()', children: [
                {text:'My Notification Orders', href:'', click:'redirectToDetaildActive()'}
            ]},
            {text:'Legacy Oss', href:'', click:'redirectToLegacyOSS()'}
          ]
        },
        {text: 'Tools & Resources', href:'/int/index.html', children: [
            {text:'Administrative Tools', href:'', click:'redirectToDataMaintainTools()'},
            {text:'Customer Hierarchy', href:'', click:'redirectToCustomerHierachy()'}
            ]
        }
      ]

    url = "http://" + hostAddr+"/ossui/v1/in/usersettings";
    $http.get(url).success(function(data, status) {
        $scope.data = data;
        if (data.Data =="Unauthorized" ) {
            var url = "/int/authorizationRequest.html";
            jQuery(location).attr("href", url);
        }
         $scope.redirectToCustomerHierachy = function() {
              url = "#/in/CustomerHierarchy";
    jQuery(location).attr("href", url);
            }
        $scope.redirectToOrderSummary = function() {
            url = "#/in/orderSummary?";
            if ($routeParams.hasOwnProperty("orderNo")!= false) {
                var orderNo = encodeURIComponent($routeParams.orderNo);
                var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
                url = url + urlParams;
                jQuery(location).attr("href", url);
            }
        }
        $scope.redirectToReports = function() {
            /*url = "#/viewReports?";
            var urlParams = "user=" + data.user_id + "&aaid=adhoc";
            url = url + urlParams;*/
            url = "#/viewReports";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToDataMaintainTools = function(){
            url = "#/in/dataMaintainTools";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToLegacyOSS = function(){
                    var serurl = "http://" + hostAddr+"/ossui/v1/in/legacyOSSLink";
                    var legacyurl = "";
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
        $scope.redirectToEventNotify = function(){
            url = "#/orderBased";
            jQuery(location).attr("href", url);
        }
            
        $scope.redirectToDetaildActive = function(){
            url = "#/detailed";
            jQuery(location).attr("href", url);
        }
    }).error(function(data, status) {
        console.log('error');
        console.log(JSON.stringify(data));
        console.log('status');
        console.log(status);
    });

}
PortalCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope', 'pageTitle'];
function AuthorizationCtrl($scope, $location, $http) {
    var hostAddr = $location.host()+":"+$location.port();
    $scope.redirectToUAM = function(){
        var url = "http://" + hostAddr+"/ossui/v1/in/SandyQuickURL";
        console.log(url);
        var uamUrl = "";
        $http.get(url).success(function(data, status) {
            uamUrl = data.data;
            jQuery(location).attr("href", uamUrl);
        }).error(function(data, status) {
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
        });
    }
}

/* get orders information for orderSummaryRoute service for order summary page*/

function orderListCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle,summaryPage) {
    var scopeItems = [];
    $scope.data = [];
    var hostAddr = $location.host()+":"+$location.port();
    //$scope.showColSort = function() {};
    pageTitle.setTitle('Order Summary');

    var isFirst = false,

    url = "http://" + hostAddr+"/ossui/v1/in/ordersummary";

    var isOrderType = true;
    //console.log($routeParams);
    jQuery("#home").removeClass("current");
    jQuery("#orderSummary").addClass("current");
    jQuery("#reports").removeClass("current");

    if ($routeParams.hasOwnProperty("orderNoFor") == false) {
        isOrderType = false;
    }
    angular.forEach($routeParams, function(value, key) {
        if (key == "orderNo" && isOrderType != true) {
            url += "?hpOrderNo=" + encodeURIComponent($routeParams.orderNo);
        } else {
            if (isFirst) {
                //if(key!="customerNameNoFor")
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
            } else if (key == "poNo") {
                url += "custPoNo=" + encodeURIComponent(value);
            } else if (key == "hpOrderNo") {
                url += "hpOrderNo=" + encodeURIComponent(value);
            } else if (key == "shipmentNo") {
                url += "shipmentNo=" + encodeURIComponent(value);
            } else if (key == "invoiceNo") {
                url += "invoiceNo=" + encodeURIComponent(value);
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
    $scope.dataFetchUrl = url;

    $scope.getData = function(pageId) {
        var pageUrl = $scope.dataFetchUrl + "&pageId=" + pageId;
        var redirectURL = $location.absUrl();
        summaryPage.setPageUrl(redirectURL);
        var testurl = summaryPage.getPageUrl();
        //console.log("testurl"+redirectURL);
      // console.log('pageUrl: ' + pageUrl);
        $("#loader, #overlay").show();
        console.log('url: ' + pageUrl);
        $http.get(pageUrl).success(function(data, status) {

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
                            'quoteNo': attr.quote_no,
                            'shipToAddr1': subAttr.ship_to_addr_1,
                            'orderNo': attr.order_no,
                            'status': subAttr.status,
                            'schedShipDate': subAttr.sched_ship_date,
                            'shippedAt': subAttr.shipped_at,
                            'schedDelvDate': subAttr.sched_delv_date,
                            'podAt': subAttr.pod_at,
                            'shipmentNo': subAttr.shipment_no,
                            'orderTypeDescr': attr.order_type_descr,
                            'purchOrderDate': attr.purch_order_date,
                            'lastUpdate': subAttr.last_update,
                            'quoteCreationDate': subAttr.quote_creation_date,
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
            $rootScope.$broadcast('showhide', $scope.showhide);
            $rootScope.$broadcast('dataflag', $scope.dataflag);
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
            'id': 'schedShipDate',
            'value': 'Planned Ship Date',
            'format': 'date',
            "sort": "true"
        }, {
            'id': 'shippedAt',
            'value': 'Actual Ship Date',
            'format': 'date',
            "sort": "true"
        }, {
            'id': 'schedDelvDate',
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
            'id': 'purchOrderDate',
            'value': 'Purchase Order Date',
            'format': 'date',
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
        'schedShipDate': '',
        'shippedAt': '',
        'schedDelvDate': '',
        'podAt': '',
        'shipmentNo': '',
        'orderTypeDescr': '',
        'purchOrderDate': '',
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
    /* to sort columns */
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
        var exportTable = "<TABLE border='1' cellpadding='10' cellspacing='1' id='Order_Summary'>" + headerHtml + bodyHtml + "</TABLE>";
        exportToExcelData(exportTable,'Order_Summary');
    } // end of export to excel

    /* navigating to shipment page from order summary */
    $scope.redirectToOrderDetails = function(orderNo) {
        url = "#/in/orderheaderdetail?";
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);
    } //end of navigating to shipment page

    /* navigating to order detail Page from order summary*/
    $scope.redirectToShipmentDetails = function(hpdeliveryno) {
        if (hpdeliveryno != "") {
            url = "#/in/shipmentInformation/" + hpdeliveryno;
            //console.log(url);
            jQuery(location).attr("href", url);
        } else {
            alert("No shipments found");
        }
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
orderListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle','summaryPage']; // end of order summary controller

/* get order header information from orderDetailRoute service  for order detail page*/

function orderHeaderCtrl($scope, $http, $routeParams, $location, pageTitle,summaryPage,legacyOrder) {
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

    var surl = "http://" + hostAddr+"/ossui/v1/in/orderheaderdetail/?oid=" + orderNo + "&pageId=1";

    var orderStatus = "";
    var comments = {};
    var commentstr = "";
    var comments_str = "";
    var bloodBuildDelCodes = {};
    $scope.cdCodeFlag = false;

    var httpRequest = $http.get(surl).success(function(data, status) {
        //console.log(data.header[0].oid);
        $("#loader, #overlay").hide();
        if (data) $scope.orderHeader = data.header[0];
        var legacyOrderNo = data.header[0].oid;
        legacyOrder.setLegacyorderNo(legacyOrderNo);
        
        if (data.header[0].dc_code != null && data.header[0].dc_code != "00") {
            $scope.cdCodeFlag = true;
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
        var BuildCodelen = false;
        var DelvCodeslen = false;
        var len = false;
        /*  display hold codes */
        $scope.Holdcodesflag = false;
        if (data.header[0].hasOwnProperty("Hold_Codes") == true) {
            $scope.holdCodes = data.header[0].Hold_Codes[0].info;
            if (data.header[0].Hold_Codes[0].hasOwnProperty("bBuildCode") == true || data.header[0].Hold_Codes[0].hasOwnProperty("bBuildCode") == true || data.header[0].hasOwnProperty("delv_Codes") == true) {

                if (data.header[0].Hold_Codes[0].hasOwnProperty("bBuildCode") == true){
                    angular.forEach(data.header[0].Hold_Codes[0].bBuildCode, function(key, val) {
                        bloodBuildDelCodes[key] = val;
                    });
                }if(data.header[0].hasOwnProperty("delv_Codes") == true){
                    angular.forEach(data.header[0].delv_Codes, function(key, val) {
                        bloodBuildDelCodes[key] = val;
                    });
                }
                BuildCodelen = checkEmpty(data.header[0].Hold_Codes[0].bBuildCode);
                DelvCodeslen = checkEmpty(data.header[0].delv_Codes);
                if (BuildCodelen ==  true || DelvCodeslen ==  true) {
                    $scope.bBloodBuildCodeFlag = true;
                } else {
                    $scope.bBloodBuildCodeFlag = false;
                }
                $scope.bloodBuildDelCodes = bloodBuildDelCodes;
            }else{
                $scope.bBloodBuildCodeFlag = false;
            }


            len = checkEmpty(data.header[0].Hold_Codes[0].hide);
            if (len ==  true) {
                $scope.holdCodeMoreInfo = data.header[0].Hold_Codes[0].hide;
                $scope.moreflag = true;
            } else {
                $scope.moreflag = false;
            }
            $scope.Holdcodesflag = true;
        } // end of hold codes

        /* display comments for only internal customers */
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
        $scope.orderNotesflag = true;
        $scope.cancelReasonflag = true;
        //display cancellation reasion
        if(data.header[0].cancelation_reason == null) {
                $scope.cancelReasonflag = false;
        }
        //end cancellation reasion
        if (data.header[0].hasOwnProperty("Comments") == false && data.header[0].hasOwnProperty("Hold_Codes") == false && data.header[0].cancelation_reason == null) {
            $scope.orderNotesflag = false;
        } // end of hold codes and comments

        /* display order progression */
        orderStatus = data.header[0].order_overall_status;
        if (orderStatus == "CANCELED") {
            $scope.orderStatuses = {
                "CANCELED": 0
            };
            $scope.canceledFlag = true;
            var statusId = $scope.orderStatuses[orderStatus];
            if (statusId == undefined) statusId = -1;
            $scope.currentStatus = statusId;
        } else {
            $scope.orderStatuses = {
                "Submitted": 0,
                "Processing": 1,
                "Acked": 2,
                "Production": 3,
                "ProductionDone": 4,
                "FactShipped": 5,
                "Registered": 6,
                "Shipped": 7,
                "Delivered": 8,
                "CANCELED": 9
            };
            $scope.canceledFlag = false;
            var statusId = $scope.orderStatuses[orderStatus];
            if (statusId == undefined) statusId = -1;
            $scope.currentStatus = statusId;
        } //end of order progression
        /* display quote details */
        $scope.quoteLink = true;
        //console.log(data.header[0].hasOwnProperty("Unique_Ref_Quote_Id"));
        if (data.header[0].hasOwnProperty("Unique_Ref_Quote_Id") == false) {
            $scope.quoteLink = false;
        }else{
            $scope.quoteLink = true;
            }
        $scope.openQuoteDetails = function() {
            var Unique_Ref_Quote_Id = data.header[0].Unique_Ref_Quote_Id;
            var quoteurl = data.header[0].quote_link+Unique_Ref_Quote_Id;
            window.open(quoteurl, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
        } // end of quote details

        /*$scope.redirectToSummary = function(){
                var summaryUrl = summaryPage.getPageUrl();
                jQuery(location).attr("href", summaryUrl);
                //console.log("summaryUrl"+summaryUrl);
            }*/

        $scope.redirectToOrderHistoryDetails = function(){
            var legOid = data.header[0].oid;
            var orderNum = data.header[0].hp_order_no;
            var dtSource = data.header[0].data_source;
            var dtSource = data.header[0].data_source;
            url = "#/in/orderHistory?";
            var orderNo = encodeURIComponent(orderNum);
            var oid = encodeURIComponent(legOid);
            var dataSource = encodeURIComponent(dtSource);
            var urlParams = "orderNo="+orderNo+"&dataSource="+dataSource+"&legordNo="+oid;
            url = url + urlParams;
            jQuery(location).attr("href", url);
        }

    }).error(function(data, status) {
                console.log('error');
                console.log(JSON.stringify(data));
                console.log('status');
                console.log(status);
                $("#loader, #overlay").hide();
            });
        $scope.redirectToSaveSetUp = function(hpOrderNo,legacyOrder,wFlag){

            url = "#/eventOption?hpOrderNo="+hpOrderNo+"&legacyOrder="+legacyOrder+"&wFlag="+wFlag
            jQuery(location).attr("href", url);
        }
}
orderHeaderCtrl.$inject = ['$scope', '$http', '$routeParams', '$location', 'pageTitle','summaryPage','legacyOrder']; //end of order detail header controller

/* get line item details for order from orderDetailPage service in order detail page */

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
    $scope.applyIndent = function(indentValue){
            if(indentValue > 0){
                if(indentValue == 1){
                    return "indentOne";
                }else if(indentValue == 2){
                    return "indentTwo";
                }
            }

        }
        $scope.indentationFlag = false;
    $scope.dataFetchUrl = "http://" + hostAddr+"/ossui/v1/in/itemdetail/?oid=" + orderNo + "&pageId=1";
   // console.log($scope.dataFetchUrl);
    $scope.getData = function(pageId) {
        var pageUrl = $scope.dataFetchUrl + "&pageId=" + pageId;
        $("#loader, #overlay").show();
        $http.get(pageUrl).success(function(data, status) {
            $("#loader, #overlay").hide();
            if (data != undefined) {
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
                            'plannedShipDate': subAttr.planned_ship_date,
                            'actualShipDate': subAttr.actual_ship_date,
                            'shipmentNo': subAttr.shipment_no,
                            'invoiceNo': subAttr.invoice_no,
                            'invoiceDate': subAttr.inv_date,
                            'shipDate': subAttr.ship_date,
                            'requestedDate': attr.request_date,
                            'holdCode': subAttr.Hold_Codes,
                            'fullInvoiceNo': attr.full_invoice_no,
                            'holdItems': subAttr.Hold_Codes,
                            'hpdeliveryno' : subAttr.hpdeliveryno,
                            'system': attr.system,
                            'cancellationReason':attr.cancellation_reason,
                            'scCommitDate':attr.sc_commit_date
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
        }, {
            'id': 'cancellationReason',
            'value': 'Cancellation Reason',
            "sort": "true"
        }, {
            'id': 'scCommitDate',
            'value': 'SC Commit Date',
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
        }, {
            'id': 'cancellationReason',
            'value': 'Cancellation Reason',
            "sort": "false"
        }, {
            'id': 'scCommitDate',
            'value': 'SC Commit Date',
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
        'plannedShipDate': '',
        'actualShipDate': '',
        'plannedDeliveryDate': '',
        'actualDeliveryDate': '',
        'shipmentNo': '',
        'invoiceNo': '',
        'invoiceDate': '',
        'shipDate': '',
        'requestedDate': '',
        'cancellationReason':'',
        'scCommitDate':'',
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
            url = "http://" + hostAddr+"/ossui/v1/in/invoice?" + "order_no=" + orderNo + "&invoice_no=" +
                invoiceNo + "&full_invoice_no=" + fullInvoiceNo + "&data_source=" + system;
            jQuery(location).attr("href", url);
        }
    } //end of download invoice

    /* navigating to order detail Page from order detail*/
    $scope.redirectToShipmentDetails = function(hpdeliveryno) {
        if (hpdeliveryno != "") {
            url = "#/in/shipmentInformation/" + hpdeliveryno;
            //console.log(url);
            jQuery(location).attr("href", url);
        } else {
            alert("No shipments found");
        }
    } //end of navigating to order detail page
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
                }, {
                    "tag": "td",
                    "html": "${cancellationReason}"
                }, {
                    "tag": "td",
                    html: function(obj) {
                        if (obj.scCommitDate != "" && obj.scCommitDate != null) {
                            var dat = convertDatefromISO(obj.scCommitDate);
                            return (dat.getFullYear() + "-" + (dat.getMonth() + 1) + "-" + dat.getDate());
                        } else {
                            return ""
                        }
                    }
                }
            ]
        };
        var bodyHtml = json2html.transform(items, bodyTmpl);
        var exportTable = "<TABLE border='1' cellpadding='10' cellspacing='1' id='Order_Detail'>" + headerHtml + bodyHtml + "</TABLE>";
        exportToExcelData(exportTable,'Order_Detail');
    } // end of export to excel
}
lineItemListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location']; //end of line items for order

/* get shipment information from shipmentDetailRoute service */

function trackingListCtrl($scope, $http, $routeParams, $rootScope, $location) {
    var hpdeliveryno = $routeParams.hpdeliveryno;
    var hostAddr = $location.host()+":"+$location.port();
    $scope.showColSort = function() {};
    if (hpdeliveryno && hpdeliveryno != "") {
        var surl = "http://" + hostAddr+"/ossui/v1/in/shipmentdetail/" + hpdeliveryno;
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
        alert("no shipments found.");
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
        //console.log(tat_url);
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
trackingListCtrl.$inject = ['$scope', '$http', '$routeParams', '$rootScope', '$location']; // end of shipment information

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
    var addFourLen = 0;
    $scope.$on('shipmentHeader', function(events, data) {
        if (data.data != "") {
            $scope.items = data.data.header;
            if(data.data.header[0].hasOwnProperty("depot_to_addr_1") == true ){
                $scope.addOneFlag = true;
            }if(data.data.header[0].hasOwnProperty("depot_to_addr_2") == true ){
                $scope.addTwoFlag = true;
            }if(data.data.header[0].hasOwnProperty("depot_to_addr_3") == true ){
                $scope.addThreeFlag = checkEmpty(data.data.header[0].depot_to_addr_3);
            }
            if(data.data.header[0].hasOwnProperty("depot_to_addr_4") == true ){
                $scope.addSixFlag = checkEmpty(data.data.header[0].depot_to_addr_4);
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
        url = "#/in/orderheaderdetail?";
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
    /* diplaying column names for status histroy */
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
boxInfoListCtrl.$inject = ['$scope', '$rootScope']; // end of box information

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

    pageTitle.setTitle('Home');

    jQuery("#orderNo").on("input, keyup", function() {
        if (jQuery("#orderNo").val().length == 0) {
            jQuery("#orderNoForId").text("");
        }
    });
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
            //jQuery( "#orderNoForVal" ).val( ui.item.value );
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
        $scope.mandatory = false;
        if ($("#RecentOrders").val() == "" && $("#orderNo").val() == "" && $("#customer").val() == "" && $("#status").val() == "" && $("#orderFromDp").val() == "" && $("#orderToDp").val() == "") {
            $(".homePage .error").slideDown(500);
        } else {
            if ($("#RecentOrders").val() != "" && $("#orderFromDp").val() != "" && $("#orderToDp").val() != "" && $("#customer").val() == "") {
                jQuery(".homePage #customer").css("border-color", "red");
                jQuery(".homePage #customer").css("border-width", "2px");
                $(".homePage .errorMsg").html('Please enter the customer ID.');
                $scope.mandatory = true;
                $(".homePage .errorMsg").slideDown(500);
            } else if ($("#RecentOrders").val() != "" || $("#orderFromDp").val() != "" && $("#orderToDp").val() != "" || $("#customer").val() != "") {
                $scope.searchOrder(order);
            } else {
                if ($("#orderFromDp").val() == "" && $("#orderToDp").val() != ""){
                    $(".homePage .errorMsg").html('Please select Order Date(From) to continue search');
                    $(".homePage .errorMsg").slideDown(500);
                }else if ($("#status").val() != "" && $("#orderNo").val() == "" && $("#customer").val() == "") {
                    jQuery(".homePage #customer").css("border-color", "red");
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
            if ($("#RecentOrders").val() != "" && $("#orderFromDp").val() == "" && $("#orderToDp").val() == "" && $("#customer").val() == "") {
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
            $scope.mandatory = false;
            if ($scope.order.recentOrders != '') {
                $scope.mandatory = true;
                $scope.isDisabled = true;
                $scope.addClassDisabled = 'disabled';
                $scope.order.orderNo = "";
                $scope.order.customer = "";

                jQuery('#orderNoForId').html("");
                jQuery('#orderFromDp').val("");
                jQuery('#orderToDp').val("");
                jQuery("#status").val("");
                jQuery('#orderFromDp, #orderToDp').datepicker('disable');
                jQuery('#orderFromDp, #orderToDp').attr("readonly","readonly");
            } else {
                $scope.mandatory = false;
                $scope.isDisabled = false;
                $scope.addClassDisabled = '';
                jQuery('#orderFromDp, #orderToDp').datepicker('enable');
            }
        } else {
            $scope.mandatory = true;
            if ($scope.order.recentOrders != '') {
                $scope.mandatory = true;
                $scope.isDisabled = true;
                $scope.addClassDisabled = 'disabled';
                jQuery('#orderFromDp').datepicker().datepicker('setDate', -$scope.order.recentOrders);
                jQuery('#orderToDp').datepicker().datepicker('setDate', new Date());
                var fDate = jQuery('#orderFromDp').datepicker('getDate');
                jQuery("#orderToDp").datepicker().datepicker("option", "minDate", fDate);
                jQuery('#orderFromDp, #orderToDp').attr("readonly",true);
                jQuery('#orderFromDp, #orderToDp').attr("disabled",true);
            } else {
                $scope.mandatory = false;
                $scope.isDisabled = false;
                $scope.addClassDisabled = '';
                jQuery('#orderFromDp').val("");
                jQuery('#orderToDp').val("");
                jQuery('#orderFromDp, #orderToDp').attr("readonly",false);
                jQuery('#orderFromDp, #orderToDp').attr("disabled",false);

            }
        }
    }
    jQuery("#RecentOrders,  #status").change(function() {
        jQuery("#customer").css("border-color", "");
        jQuery(".homePage #customer").css("border-width", "");
        jQuery(".homePage .error").slideUp(500);
        jQuery(".homePage .errorMsg").slideUp(500);
    });
    jQuery("#orderNo, #customer").keyup(function() {
        jQuery(".homePage .error").slideUp(500);
        jQuery(".homePage .errorMsg").slideUp(500);
        jQuery("#customer").css("border-color", "");
        jQuery(".homePage #customer").css("border-width", "");
    });
    $scope.searchOrder = function(order) {
        var counter = 0,
            url = "#/in/orderSummary?";
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
        //console.log($routeParams.custId);
        $scope.customer = $routeParams.custId;
    }if($routeParams.custName !=undefined){
        //console.log($routeParams.custName);
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
        url = "#/in/orderSummary?";
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
        url = '#/in/orderSummary';
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
    pageTitle.setTitle('Reports');
    $scope.showColSort = function() {};
    $("#loader, #overlay").hide();

    jQuery("#home").removeClass("current");
    jQuery("#orderSummary").removeClass("current");
    jQuery("#reports").addClass("current");
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
    var reportsUrl = "http://" + hostAddr+"/ossui/v1/in/reports/myreports";
    var reportNames = [];


    var getUserDetailurl = "http://" + hostAddr+"/ossui/v1/in/usersettings";
    //$scope.nodataFlag = true;
    $("#loader, #overlay").show();
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
                var reportURL = "http://" + hostAddr+"/ossui/v1/in/reports/getreport"+postData;
                window.open(reportURL,'_self','width=500,height=500,toolbar=0,location=0,menubar=0');
            }

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
    var dataSource = $routeParams.dataSource;
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
        url = "#/in/orderheaderdetail?";
        var orderNo = $routeParams.orderNo;
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);

    } //end of navigating to order detail page

    var hostAddr = $location.host()+":"+$location.port();
    var ordNo = $routeParams.legordNo;
    var surl = "http://" + hostAddr+"/ossui/v1/in/orderhistory?order_no=" + ordNo+"&data_source="+dataSource;
        //console.log(surl);
        $http.get(surl).success(function(data, status) {
            $("#loader, #overlay").hide();
            if (data != undefined) {
                if(data.status == "E"){
                        $scope.error = data.data;
                        $scope.noDataFlag = true;
                    //    console.log($scope.noDataFlag+":"+data.data);
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

function dataMaintainToolsCtrl($scope,$http,$compile,$rootScope,$location, pageTitle,createDialog){
    var tables = {};
    
    jQuery("#home").removeClass("current");
    jQuery("#datamaintaintools").addClass("current");
    jQuery("#reports").removeClass("current");
    $scope.default_row = false;
    pageTitle.setTitle('Data Maintain Tools');
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
                var url = hostAddr+"/ossui/v1/dmt/";
                $scope.rowCount = 2;
                var myOldItems = {};

                $scope.clearAllButton = function() {
                    angular.forEach($scope.query,function(key,value){
                            $scope.query[value] = "";
                        });
                }
                $("#loader, #overlay").show();                  
                $http({
                    method: 'POST',
                    url: url,
                    }).success(function(data, status) {
                        $("#loader, #overlay").hide();
                        tables = data;
                        var ossTableNames = {};
                        angular.forEach(tables,function(key,val){
                            ossTableNames[key.table_name]= val;
                        });
                        $scope.adminTables = ossTableNames;
                        $scope.showColumns = false;
                        $scope.showTableResult = false;
                        $scope.showHeaders = false;
                        $scope.getTableDetails = function(tabledet){
                        if(tabledet!=""){
                            var tabledetails = tabledet.split("|");
                            var tableName = tabledetails[1];
                            $scope.queryTableName = "Table results for Table "+tabledetails[0];
                            $scope.queryTable = tabledetails[0];
                            $scope.showTableResult = true;
                            var propertyNames = Object.keys(tables[tableName].column_labels);
                            if($scope.count!=0){
                                $scope.count = 0;
                                $scope.count = propertyNames.length;
                            }
                        //console.log($scope.rowCount);
                            if($scope.rowCount!= 2 ){
                                $scope.rowCount = 2;
                                $(".dynamicRows").empty();
                            }
                            if(tableName!=""){
                                $scope.showColumns = true;
                                $scope.clearall_button = true;
                                $scope.default_row = true;
                                $scope.tableFields = tables[tableName].column_labels;
                                $scope.tablecolumns = tables[tableName].column_labels;
                                $scope.count_button = tables[tableName].count_button;
                                $scope.select_button = tables[tableName].select_button;
                                $scope.insert_button = tables[tableName].insert_button;
                                $scope.update_button = tables[tableName].update_button;
                                $scope.delete_button = tables[tableName].delete_button;
                                $scope.predefined_values =  tables[tableName].predefined_values.BLOCK_CATEGORY;
                            }else{
                                $scope.showColumns = false;
                            }
                                $scope.add_new_row_button= "Y";
                        }else{
                            $scope.showTableResult = false;
                            $scope.showTable = false;
                            $scope.showColumns = false;
                            $scope.tableQuery = "";
                            $scope.queryTableName = "";
                            $scope.tableFields="";
                            $scope.count_button = "N";
                            $scope.select_button = "N";
                            $scope.insert_button = "N";
                            $scope.update_button = "N";
                            $scope.delete_button = "N";
                            $scope.edit_record_button = "N";
                            $scope.add_new_row_button= "N";
                            $scope.clearall_button = false;
                            $(".dynamicRows").empty();
                        }
                    }
                        $scope.showTable = false;
                        $scope.showTableQuery = false;
                        $scope.showQueryTable = false;
                        $scope.showEditTable = false;
                        $scope.delete_button1 = false;
                $scope.insert_button1 = false;
                $scope.edit_rows_button1 = false;
                $scope.save_button1 = false;
                    angular.forEach(tables,function(key,val){
                        ossTableNames[key.table_name]= val;
                    });
                    $scope.adminTables = ossTableNames;
                    $scope.showColumns = false;
                    $scope.showTableResult = false;
                    $scope.showHeaders = false;
		$scope.getTableDetails = function(tabledet){
			if(tabledet!=""){
			var tabledetails = tabledet.split("|");
			var tableName = tabledetails[1];
			$scope.queryTableName = "Table results for Table "+tabledetails[0];
			$scope.queryTable = tabledetails[0];
			$scope.showTableResult = true;
			var propertyNames = Object.keys(tables[tableName].column_labels);
			if($scope.count!=0){
				$scope.count = 0;
				$scope.count = propertyNames.length;
			}
			//console.log($scope.rowCount);
			if($scope.rowCount!= 2 ){
				$scope.rowCount = 2;
				$(".dynamicRows").empty();
			}			
			if(tableName!=""){
				$scope.showColumns = true;
				$scope.clearall_button = true;
				$scope.default_row = true;
				$scope.tableFields = tables[tableName].column_labels;
				$scope.tablecolumns = tables[tableName].column_labels;
				$scope.count_button = tables[tableName].count_button;
				$scope.select_button = tables[tableName].select_button;
				$scope.insert_button = tables[tableName].insert_button;
				$scope.update_button = tables[tableName].update_button;
				$scope.delete_button = tables[tableName].delete_button;
                $scope.delete_button = tables[tableName].add_new_row_button;
				$scope.predefined_values =  tables[tableName].predefined_values;
            }else{
				$scope.showColumns = false;
			}
                $scope.add_new_row_button= "Y";
			}else{
                
				$scope.showTableResult = false;
				$scope.showTable = false;
				$scope.showColumns = false;
				$scope.tableQuery = "";
				$scope.queryTableName = "";
				$scope.tableFields="";
				$scope.count_button = "N";
				$scope.select_button = "N";
				$scope.insert_button = "N";
				$scope.update_button = "N";
				$scope.delete_button = "N";
				$scope.edit_record_button = "N";
				$scope.add_new_row_button= "N";
				$scope.clearall_button = false;
				$(".dynamicRows").empty();
			}
		}	
		$scope.showTable = false;
		$scope.showTableQuery = false;
		$scope.showQueryTable = false;
		$scope.showEditTable = false;

        }).error(function(data, status) {
            console.log('error');
                console.log(JSON.stringify(data));
                console.log('status');
                console.log(status);
                $("#loader, #overlay").hide();
        });
        $scope.isDropDown = function(columnName){
                if(columnName!=""){
                    $scope.showDropdown = false;
                    var sampleString = "";
                    var colName = sampleString+columnName.toUpperCase();
                    var dropDown = $scope.predefined_values[colName];
                    $scope.dropDownList = $scope.predefined_values[colName];
                    if(dropDown!=undefined ){
                        $scope.showDropdown = true;
                    }
                    return $scope.showDropdown;
                }
            }
         

        $scope.executeQuery = function(){
                //console.log($scope.query);
                $scope.showQueryTable = true;
                $scope.showEditTable = false;
                $scope.showHeaders = true;
                $scope.edit_record_button = "N";
                var cnt = 0;
                var qryUrl = url;
                var serviceUrl = qryUrl+"&action=select";
                var columnNames=[];
                $scope.columnNames=[];
                angular.forEach($scope.query,function(key,value){
                    if(cnt == 0){
                        if(value == "table"){
                            var tabledetails = key.split("|");
                            var tableName = tabledetails[0];
                            qryUrl +="?"+value+"="+tableName;
                            }
                    }else if(cnt > 0){
                        //if(value!=""){
                            qryUrl +="&"+value+"="+encodeURIComponent(key);
                        //}
                    }
                    cnt++;
                });
			
                var serviceUrl = qryUrl+"&action=select";
                $scope.totalRows = 0;
                $("#loader, #overlay").show();
                $http({
                    method: 'POST',
                    url:serviceUrl
                }).success(function(data, status) {
                    $("#loader, #overlay").hide();
                    $scope.items = data.data;
                    columnNames = Object.keys(data.data[0]);
                    var len = columnNames.length;
                    var count = 0;
                    angular.forEach(columnNames, function(key,value){
                        if(count < len/2){
                            $scope.columnNames.push(key);
                        }
                        count++; 
                    });
                    $scope.totalRows = data.data.length;
                    $scope.tableQuery = data.message;
                    $scope.columnNames = $scope.columnNames.sort();

                }).error(function(data, status) {
                    console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);
                    $("#loader, #overlay").hide();
                });
                var tabledetails = $scope.query.table.split("|");
                var tableName = tabledetails[0];
                $scope.showTable= true;
                $scope.showTableQuery = true;
            }
            $scope.editTable = function(){
                $scope.showTable = true;
                $scope.showEditTable = true;
                $scope.showHeaders = true;
                $scope.showTableQuery = true;
                
                $scope.delete_button1 = true;
                $scope.insert_button1 = true;
                $scope.edit_rows_button1 = true;
                $scope.save_button1 = true;
                var columnNames=[];
                $scope.columnNames=[];
        
                $("#loader, #overlay").show();
                $scope.showQueryTable = false;
                
                $scope.showEditTable = true;
                $scope.edit_record_button = "Y";
                var cnt = 0;
                var qryUrl = url;
                angular.forEach($scope.query,function(key,value){
                    if(cnt == 0){
                        if(value == "table"){
                            var tabledetails = key.split("|");
                            var tableName = tabledetails[0];
                            qryUrl +="?"+value+"="+tableName;
                            }
                    }else if(cnt > 0){
                        qryUrl +="&"+value+"="+encodeURIComponent(key);
                    }
                    cnt++;
                });
                var serviceUrl = qryUrl+"&action=select";
                $scope.totalRows = 0;
                $("#loader, #overlay").show();
                $http({
                    method: 'POST',
                    url:serviceUrl
                }).success(function(data, status) {
                    $("#loader, #overlay").hide();
                    $scope.items = data.data;
                    columnNames = Object.keys(data.data[0]);
                    var len = columnNames.length;
                    var count = 0;
                    angular.forEach(columnNames, function(key,value){
                        if(count < len/2){
                            $scope.columnNames.push(key);
                        }
                        count++; 
                    });
                    $scope.totalRows = data.data.length;
                    $scope.tableQuery = data.message;
                    $scope.columnNames = $scope.columnNames.sort();
                }).error(function(data, status) {
                    console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);
                    $("#loader, #overlay").hide();
                    var tabledetails = $scope.query.table.split("|");
                });
            }
            $scope.showCount = function(){
                    createDialog('partials/showCount.html', {
              id: 'showCount',
              //title: 'A Simple Modal Dialog',
              backdrop: true,
              scope:$scope,
              //controller: 'eventBasedController',
              success: {label: 'Success', fn: function() {
                  console.log('Show count modal closed');
                  //$scope.redirectToEventNotify();
                  }}
            });
                };
            $scope.updatedItems = {};    
		
        $scope.selectAll = function(selcectall){
            
            /*if(selcectall == true){	
                var rowid="row_";
                for(i=0;i<$scope.totalRows;i++){
                    elementid = $scope.rowid+i);
                }
			}else{
                $scope.rowid=false;
                for(i=0;i<$scope.totalRows;i++){
                    elementid = "#row_"+i;
                    $scope.el.click();
                    $scope.el = $compile(elementid)($scope);
                    $scope.el.attr("checked",false);
                }
                }*/
                console.log(selcectall+":"+$scope.totalRows);
		}
		//console.log(tables);
		$scope.saveRecords =function(updatedItem){
			//console.log(updatedItem);
			//console.log($scope);
			$scope.$on('myOldItems',function(data){
				//console.log("I came");
				//console.log(data);
			});
			$scope.$on('myOldItems', function(events, data) {
				//console.log("I came once again");
			//console.log(data);
			});
			//console.log(JSON.stringify(updatedItem))
			//console.log("I was clicked i came:")
		}
		$scope.saveRecords =function(){
			//console.log($scope)
			//console.log("I was clicked:");
			
			//console.log(myOldItems);
			
		}

};

//MyCtrl.$inject = ['$scope','$http','$compile'];
function lookupByCbnController($scope,$http,$location,rolelist){
     $("#loader, #overlay").hide();
     $scope.noData="false"
     var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    $scope.searchById=function(entryid){
         $("#loader, #overlay").show();
       
$scope.cbn=[];
$scope.image1=true;
$scope.image2=true;
$scope.image3=true;
$scope.image4=true;
$scope.image5=true;
$scope.image6=true;
  $scope.showHideImage=function(uparrow){
      if(uparrow=="uparrow"){
          $scope.image2=false;
          $scope.image1=false;
          
      }else if(uparrow=="downarrow"){
          $scope.image2=true;
          $scope.image1=true;
      }
      if(uparrow=="uparrow2"){
          $scope.image4=false;
          $scope.image3=false;
          
    }
    else if(uparrow=="downarrow2"){
         $scope.image3=true;
          $scope.image4=true;
        
    }
    if(uparrow=="uparrow3"){
          $scope.image6=false;
          $scope.image5=false;
          
    }
    else if(uparrow=="downarrow4"){
         $scope.image6=true;
          $scope.image5=true;
        
    }
    
       
       }

var url=hostAddr+"/ossui/v1/in/customerHierarchyCBN/?entryID="+entryid+"&mode=lookupByCBN"; 

     $http.get(url).success(function(data, status) {
         //console.log(url);
         
         console.log(data);
        if(data.status=='S'){
            $scope.dataisthere="true";
        $("#loader, #overlay").hide();
        var CBNS=data.header[0];
    $scope.cbn.push(CBNS);
   // console.log("Hi this is the")
    //console.log($scope.cbn[0]);
    
    $scope.items = $scope.cbn[0].sold_To;
    $scope.items_shipto=$scope.cbn[0].ship_To;
    $scope.items_invoiceto=$scope.cbn[0].invoice_To;
    //console.log($scope.items);
   
            }
            else if(data.status=='N'){
                //console.log("No data Found");
                //alert("No data Found");
            }
        })        
        }
        $scope.fetchBycbnId=function(cbnid){
           
            $scope.cbnId=cbnid;
            console.log($scope.cbnId);
            var urlsdata=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+$scope.cbnId+"&mode=lookupByid&hideLevel=false";
            
            $http.get(urlsdata).success(function(data, status) {
            if(data.status=='S'){
                console.log(urlsdata);
               
        
            $scope.roleList = data.header;
            var rolelistdata=data.header;
            
            rolelist.setRoleList(rolelistdata);
            
            //console.log($scope.roleList);
            var urltab = "#/in/CustomerHierarchy";
            jQuery(location).attr("href", urltab);
            //console.log(urltab);
            $scope.roleList = rolelistdata;
            }
            else if(data.status=='N'){
                //alert("No data found");
                
            }

});
}
   $scope.columnNames = [{
            'id': "siteID",
            'value': "SiteID",
            "sort": "false"
        }, {
            'id': 'level4',
            'value': 'Level 4',
            "sort": "false"
        }, {
            'id': 'level3',
            'value': 'Level3',
            "sort": "false"
        },
        {
            'id': 'level2',
            'value': 'Level2',
            "sort": "false"
        },
        
        {
            'id': 'Name',
            'value': 'Name',
            "sort": "false"
        },
        {
            'id': 'System',
            'value': 'System',
            "sort": "false"
        }
    ]


 
    
}
function customernameCtrl($scope,$http,rolelist,$location,$route){
    
    $("#loader, #overlay").hide();
    $scope.roleList="";
    
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    
     $scope.FetchId = function(mynode){
        
        alert("Fetch Id");
        alert(JSON.stringify(mynode.id));

        var id=JSON.stringify(mynode.id);

        id=id.substring(1,id.length-1);
        
        var urlsdatarole=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+id+"&mode=lookupByid&hideLevel=false";
        $http.get(urlsdatarole).success(function(data, status) {
         
            if(data.status=='S'){
                //alert("data is sucess");
                //alert("this data is comming here");
                var rolelistdata=data.header;
                rolelist.setRoleList(rolelistdata);
                alert(rolelistdata);
                var rolelist1=rolelist.getRoleList();
                //console.log(rolelist1);
                //console.log("hi here fetcheing");
                 //var url = "#/in/CustomerHierarchy";
                    //jQuery(location).attr("href", url);
                    $location.path("in/CustomerHierarchy");
                    
               $route.reload();

                //alert("redirect here");
                }
                else if(data.status=='N'){
                    
                    $scope.noDatafoundFlage=true;
                    $scope.errormsg=data.message
                   // console.log($scope.errormsg);
                    $("#loader, #overlay").hide();
                    
                }
            });
      
        }
    
    $scope.selectedlevels = "All";
    $scope.selectelevelvalue="";
    var urls="";
    $scope.selectedLevelMethod=function(selectedLevels){
      $scope.selectelevelvalue=selectedLevels;
        //console.log("111"+ $scope.selectelevelvalue);
    }
    $scope.searchById=function(name,hideBasicInfo){
        //console.log(name)
        
        
    if(hideBasicInfo==undefined){
        hideBasicInfo="false";
        //console.log("333>>>>"+$scope.selectelevelvalue)
     var urls=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+name+"&mode=lookupByName&hideLevel="+hideBasicInfo+"&levelOptions="+$scope.selectelevelvalue;   
     //console.log(urls) ;
     // console.log("setting it as false so need select option"+urls)
        
    } else{
            var urls=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+name+"&mode=lookupByName&hideLevel="+hideBasicInfo; 
             
            //console.log("seleced check box need not Combo box"+urls) ;

         }  
   
       $("#loader, #overlay").show();
	    $http.get(urls).success(function(data, status) {
         //console.log(urls);
         
         //console.log(data);
        if(data.status=='S'){
            //alert("data should not come here");
            //console.log("url>>>>"+urls);
            $("#loader, #overlay").hide();
            $scope.roleList = data.header;
            //console.log($scope.roleList);
        } else if(data.status=='N'){
   
                $scope.noDatafoundFlage=true;
                $scope.errormsg=data.message;
                //console.log($scope.errormsg);
                $("#loader, #overlay").hide();
            
        }
    
	});
   
    }
    
   
}

function CustomerHierarchyCtrl($scope,$http,$location,createDialog,rolelist){
   
    $("#loader, #overlay").hide();
      var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
     $scope.roleList="";
      
      
     // console.log(hostAddr);
    $scope.columnNames = [{
            'id': "Adress",
            'value': "Adresses",
            "sort": "false"
        }, {
            'id': 'Site/locator Id',
            'value': 'Site/Locator Id',
            "sort": "false"
        }, {
            'id': 'Source Systems',
            'value': 'Source Systems',
            "sort": "false"
        },
       
    ]



    $scope.FetchId=function(node){
     var id=JSON.stringify(node.id);
      var id=id.substring(1,id.length-1);
      
       
       
         var urls=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+id+"&mode=lookupByid&hideLevel=false";
         //console.log("My Url  "+urls);
         $http.get(urls).success(function(data, status) {
            // console.log(data);
                if(data.status=='S'){
                        //console.log(data.header);
                        
                    $scope.roleList = data.header;
                    var url = "#/in/CustomerHierarchy";
                    jQuery(location).attr("href", url);
                        //console.log(data);
                }
                    else if(data.status=='N'){
                    //console.log("No data Found");
                
            }
             });
        
         }
          $scope.showIdsPopUp = function(){
        createDialog('partials/showId.html', {
              id: 'eventNotificationSaved',
              //title: 'A Simple Modal Dialog',
              backdrop: true,
              scope:$scope,
              //controller: 'eventBasedController',
              success: {label: 'Success', fn: function() {
                  //console.log('eventNotificationSaved modal closed');
                 
                  }}
            });
    }
         $scope.showIds=function(node){
           $scope.showids =[];
            var id=JSON.stringify(node.id);
            //alert(id);
             var id=id.substring(1,id.length-1);
             $scope.cnId= id;
            //alert("hi this the Id of" +id);
           // http://localhost:3000/ossui/v1/in/customerHierarchy/entryID=800065638&mode=lookupBySiteId&hideLevel=false
             var urls=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+id+"&mode=lookupBySiteId&hideLevel=false";
             //console.log(urls);
                $("#loader, #overlay").show();
             $http.get(urls).success(function(data, status) {
                    //console.log(urls);
                    if(data.status=='S'){
                        $scope.showIdsPopUp();
                            $("#loader, #overlay").hide();
                           // console.log(data.header);
                            var show=data.header;
                    $scope.showids.push(show);
                     //on click of Showids contoller will come here//

                    $scope.fetchBySiteLocaterId=function(showid){
   
   
    jQuery("#showidbody").hide();
    jQuery(".modal-body").css({'max-height': '0px','padding':' 0px','top':'0'});
    jQuery(".modal-backdrop").css({'opacity': '0','top':'0'});
    jQuery(".modal-backdrop.fade.in").css({'opacity': '0','top':'0'});
    //jQuery("#modelbody").hide();
    
   
     var urls=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+showid+"&mode=lookupByid&hideLevel=false";
     //console.log(hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+showid+"&mode=lookupByid&hideLevel=false");
        $http.get(urls).success(function(data, status) {
            // console.log(data);
                if(data.status=='S'){
                     
                        //console.log(data.header);
                  alert("Here is my data");
                    $scope.roleList = data.header;
                    $scope.entryid="";
                        //console.log( $scope.roleList);
                }
                    else if(data.status=='N'){
                    //console.log("No data Found");
                
            }
             });
        
         }
                    

                    //console.log( $scope.showids);
                    //$scope.items=$scope.showids;
                    }
           });
       }
      

$scope.selectedlevels = "All";
    $scope.selectelevelvalue="";
    var urls="";
    $scope.selectedLevelMethod=function(selectedLevels){
      $scope.selectelevelvalue=selectedLevels;
        //console.log("111"+$scope.selectelevelvalue);
    }
        $scope.searchById=function(entryid,hideBasicInfo){
            
         	
if(hideBasicInfo==undefined){
    hideBasicInfo="false";
    //console.log("333>>>>"+$scope.selectelevelvalue);
 var urls=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+entryid+"&mode=lookupByid&hideLevel="+hideBasicInfo+"&levelOptions="+$scope.selectelevelvalue;    
  //console.log("setting it as false so need select option"+urls)
    
}
else{
    var urls=hostAddr+"/ossui/v1/in/customerHierarchy/?entryID="+entryid+"&mode=lookupByid&hideLevel="+hideBasicInfo; 
     
    //console.log("seleced check box need not Combo box"+urls) ;

 }   	 

            
        //console.log("checked value>>>"+hideBasicInfo);
   
       $("#loader, #overlay").show();
	  //console.log(urls);
	$http.get(urls).success(function(data, status) {
         //console.log(url);
         
         //console.log(data);
        if(data.status=='S'){
   

	//console.log("url>>>>"+urls);
    $("#loader, #overlay").hide();
	$scope.roleList = data.header;
	//console.log($scope.roleList);
}
  

else if(data.status=='N'){
   // alert("no data found");
   
     $scope.noDatafoundFlage=true;
        $scope.errormsg=data.message;
    //console.log($scope.errormsg);
     $("#loader, #overlay").hide();
    
    
    
    
}

	});
  
    
    }
     if(rolelist.getRoleList()!==null){
      //console.log("By service Fetching");
      $scope.roleList=rolelist.getRoleList();
        //console.log("By service Fetching");
        //console.log($scope.roleList);
    }
}
(function(l){l.module("angularTreeview",[]).directive("treeModel",function($compile){return{restrict:"A",link:function(a,g,c){var e=c.treeModel,h=c.nodeLabel||"label",d=c.nodeChildren||"children",k='<ul><li data-ng-repeat="node in '+e+'"><i class="collapsed" data-ng-show="node.'+d+'.length && node.collapsed" data-ng-click="selectNodeHead(node, $event)"></i><i class="expanded" data-ng-show="node.'+d+'.length && !node.collapsed" data-ng-click="selectNodeHead(node, $event)"></i><i class="normal" data-ng-hide="node.'+
d+'.length"></i> <span data-ng-class="node.selected" data-ng-click="selectNodeLabel(node, $event)">{{node.'+h+'}}</span><span style="cursor:pointer;color:blue;" title="clickhere" ng-click=FetchId(node)>,&nbsp;{{node.id}}</span><span style="color:blue;" title="clickhere" ng-show="node.show_id_flag">,&nbsp;&#39;<span style=color:red;font-weight:bold;">CBN</span>&#39;&nbsp;<a href="" style="cursor:pointer;" ng-click="showIds(node)">[show IDs]</a></span><div><div data-ng-hide="node.collapsed" data-tree-model="node.'+d+'" data-node-id='+(c.nodeId||"id")+" data-node-label="+h+" data-node-children="+d+"></div></li></ul>";e&&e.length&&(c.angularTreeview?(a.$watch(e,function(m,b){g.empty().html($compile(k)(a))},!1),a.selectNodeHead=a.selectNodeHead||function(a,b){b.stopPropagation&&b.stopPropagation();b.preventDefault&&b.preventDefault();b.cancelBubble=
!0;b.returnValue=!1;a.collapsed=!a.collapsed},a.selectNodeLabel=a.selectNodeLabel||function(c,b){b.stopPropagation&&b.stopPropagation();b.preventDefault&&b.preventDefault();b.cancelBubble=!0;b.returnValue=!1;a.currentNode&&a.currentNode.selected&&(a.currentNode.selected=void 0);c.selected="selected";a.currentNode=c}):g.html($compile(k)(a)))}}})})(angular);


/* to get active orders details*/
function eventNotificationCtrl($scope, $location, $http, $routeParams, $rootScope, pageTitle) {

    pageTitle.setTitle('Event Notification');

    $scope.noDataFlag = false;

    $scope.columnNames = [{
        'id': "watchOrderFlag",
        'value': "Status",
        'sort' : "false"
        }, {
        'id': "orderno",
        'value': "HP Order#",
        'sort' : "false"
        }, {
            'id': "custname",
            'value': "Customer Name",
            'sort' :"false"
        }, {
            'id': "purchorderno",
            'value': "Purchase Order #",
            'sort' :"false"
        }, {
            'id': "purchOrderDate",
            'value': "Order Date",
            'sort' :"false"
        }, {
            'id': "Notification",
            'value': "Action",
            'sort' :"false"
        }];
            
        $rootScope.$broadcast('columnNames', $scope.columnNames);
        $scope.search = {
            'orderno': '',
            'custname': '',
            'purchorderno': '',
            'purchOrderDate': ''
        };
        $scope.showCol = false;
        $scope.showColSort = function() {
            $filter('filter')($scope.items, function(item) {
                item.showItem = true;
            });
        };

    /* search an order to setup notification */

    $scope.searchOrderForNotify = function(OrderNo) {

        $scope.msgFlag=false;

        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        url = hostAddr+"/ossui/v1/in/searchOrders?hpOrderNo="+OrderNo;
        console.log(url);

        $("#loader, #overlay").show();

        $http.get(url).success(function(data, status) {

            $("#loader, #overlay").hide();
            if (data != undefined) {

                if(data.status == "E"){
                    $("#loader, #overlay").hide();
                    $scope.noDataFlag = false;
                    $scope.errorMsg = data.message;
                    $scope.msgFlag=true;
                } else {
                    $("#loader, #overlay").hide();
                    $scope.items = data.data;
                    $scope.noDataFlag = true;
                }

            }
        }).error(function(data, status) {
            console.log('error');
        });
    }
    $scope.redirectToSaveSetUp = function(hpOrderNo,legacyOrder,wFlag){

        var text ="order";
        url = "#/eventOption?hpOrderNo="+hpOrderNo+"&legacyOrder="+legacyOrder+"&wFlag="+wFlag+"&text="+text
        jQuery(location).attr("href", url);
    }

   }

function saveSetUpCtrl($scope, $location, $http, $routeParams, $rootScope, pageTitle,createDialog,$compile) {

    pageTitle.setTitle('Setup Notification');
    
    //$scope.statusShow = false;
     $scope.mouseover = function(){ 
       jQuery(".statusShow").show();
     // $scope.statusShow = true;
    };
    $scope.mouseleave = function(){
        
        jQuery(".statusShow").hide();
    
    //$scope.statusShow = false;
    };

    
    $scope.rowCount = 2;
    $scope.wFlag=$routeParams.wFlag; 
    $scope.wflag=$routeParams.wflag; 
    
    $scope.hpOrderNo = $routeParams.hpOrderNo;
    $scope.legacyOrder = $routeParams.legacyOrder;
    
    $scope.profileName = $routeParams.profileName;
    $scope.profile = $routeParams.profile;
    $scope.id=$routeParams.id;
    
    $scope.text = $routeParams.text;
   
    
    $scope.testFlag=false;
    $scope.orderTextFlag=false;
    $scope.profileTextFlag=false;
   
    if ($scope.text == "order") {
        $scope.testFlag=true;
         if ($scope.wFlag=="true"){
             $scope.orderTextFlag=true;
         }else{
             $scope.orderTextFlag=false;
        } 
    } else {
        $scope.testFlag=false;
        if ($scope.wflag=="true"){
            $scope.profileTextFlag=true;
        }
    }
  
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var url="";
    $scope.emaildetails = {};
    $scope.emaildet = {};   
    
    if($scope.text=="order") {
        url = hostAddr+"/ossui/v1/in/showOrderSettings?legacy_order_no="+$scope.legacyOrder; 
    } else if($scope.text=="profile") {
        url = hostAddr+"/ossui/v1/in/showProfileSettings?profile="+$scope.id;
    }
    console.log(url);
    
    $("#loader, #overlay").show();
    $http.get(url).success(function(data, status) {
            if(data !=undefined){
                $("#loader, #overlay").hide();
                
                if(data.data[0].weblogin !=undefined){
                    $scope.weblogin = data.data[0].weblogin;
                }
                
                if(data.data[0].timing !=undefined){
                    $scope.timing = data.data[0].timing;
                }
                var usersVal=data.data[0].users;
                if(usersVal !=null){
                   $scope.users = usersVal;
                   var users1 = $scope.users.split(" ");
                   var propLen = users1.length;
                  
                   var compelement = "";
                   var cnt = 2;
                   angular.forEach(users1,function(key,val){
                        if(cnt <=(propLen/2)){
                        compelement += '<div class="ddropdown'+cnt+'" id="ddropdown'+cnt+'">';
                        compelement += '   <select class="dd2" id="resp'+cnt+'" style="font-size:15px;color:#9a9a9a;margin-top:-3px;" ng-model="emaildetails.emailType'+cnt+'">';
                        compelement += '		<br><br><br><option value="C">CC</option><option value="T">To</option>';
                        compelement += '	</select>';
                        compelement += '</div>';
                        compelement += '<input type="text" id="emailaddress'+cnt+'" class="txtfield1" id="aqqq" ng-model="emaildetails.emailaddress'+cnt+'"/>';
                        }
                        cnt++
                    });
                    $scope.el = $compile(compelement)($scope);
                    $('.dynamicRows').append($scope.el);
                }
                
                var arrind = 0;
                if($scope.users !=undefined){
                var emailObj = $scope.getNthWord($scope.users,propLen);
            
                    angular.forEach(emailObj,function(key,val){
                      
                        $scope.emaildetails["emailType"+(arrind+1)]=key.emailType;
                        $scope.emaildetails["emailaddress"+(arrind+1)]=key.emailAddress;
                        arrind++;
                    });
                }
                
                $scope.watchOrder=data.data[0].watchOrder;
                $scope.Ack = data.data[0].optionSettings.Ack;
                $scope.orderChn = data.data[0].optionSettings.orderChn;
                $scope.sddChn = data.data[0].optionSettings.sddChn;
                $scope.statSubmit = data.data[0].optionSettings.statSubmit;
                $scope.statAdmin = data.data[0].optionSettings.statAdmin;
                $scope.statAcked = data.data[0].optionSettings.statAcked;
                $scope.statProd = data.data[0].optionSettings.statProd;
                $scope.statPDone = data.data[0].optionSettings.statPDone;
                $scope.statRegis = data.data[0].optionSettings.statRegis;
                $scope.statDelv = data.data[0].optionSettings.statDelv;
                $scope.statShip = data.data[0].optionSettings.statShip;
                $scope.statShipF = data.data[0].optionSettings.statShipF;
                $scope.statInv = data.data[0].optionSettings.statInv;
                $scope.statCanc = data.data[0].optionSettings.statCanc;
                $scope.holdEntry = data.data[0].optionSettings.holdEntry;
                $scope.holdFulfil = data.data[0].optionSettings.holdFulfil;
                $scope.holdShip = data.data[0].optionSettings.holdShip;
                $scope.holdBill = data.data[0].optionSettings.holdBill;
                $scope.holdFallout = data.data[0].optionSettings.holdFallout;
                $scope.formatHead = data.data[0].formatSettings.formatHead;
                $scope.formatItem = data.data[0].formatSettings.formatItem;
                $scope.formatPrice = data.data[0].formatSettings.formatPrice;
                $scope.formatShip = data.data[0].formatSettings.formatShip;
                $scope.formatSplit = data.data[0].formatSettings.formatSplit;
                $scope.timing = data.data[0].timing;
            }
        }).error(function(data, status) {
            console.log('user profile error');
            $("#loader, #overlay").hide();
    });
    
   
    $scope.emaildetails.emailType1="C";
    
    $scope.getNthWord  = function(users1, n){
       
        var words = users1.split(" ");
        var emailDet = {};
        for(var i=0;i<words.length;i=i+2){
            var emailDet1 = {};    
            emailDet1.emailType = words[i];
            emailDet1.emailAddress = words[i+1];
            emailDet[i]=emailDet1;
            }
        return emailDet;
    }

    $scope.saveSetup =function(scope){
        
        var selectedOptions="";
        var selectedFormat="";
        var selectedUsers="";
       
        timing=$scope.timing;
        
        $scope.chkOptions = {
            
            "Ack":$scope.Ack,
            "sddChn":$scope.sddChn,
            "orderChn":$scope.orderChn,
            "statSubmit":$scope.statSubmit,
            "statAdmin":$scope.statAdmin,
            "statAcked":$scope.statAcked,
            "statProd":$scope.statProd,
            "statPDone":$scope.statPDone,
            "statShipF":$scope.statShipF,
            "statRegis":$scope.statRegis,
            "statShip":$scope.statShip,
            "statDelv":$scope.statDelv,
            "statCanc":$scope.statCanc,
            "statInv":$scope.statInv,
            "holdEntry":$scope.holdEntry,
            "holdFulfill":$scope.holdFulfil,
            "holdShip":$scope.holdShip,
            "holdBill":$scope.holdBill,
            "holdFallout":$scope.holdFallout
        }
        
        $scope.chkFormat = {
            
            "formatHead":$scope.formatHead,
            "formatItem":$scope.formatItem,
            "formatPrice":$scope.formatPrice, 
            "formatSplit":$scope.formatSplit,
            "formatShip":$scope.formatShip 
        }
        
        angular.forEach($scope.chkOptions,function(key,val){
           
            if(key==true){
               selectedOptions+=val+" ";
            } 
        });
        console.log(selectedOptions);
       
        
        angular.forEach($scope.chkFormat,function(key,val){
            
            if(key==true){
                selectedFormat+=val+" ";
            } 
            
        });
        console.log(selectedFormat);
       
        $scope.users=$scope.emaildetails.emailaddress1;
        $scope.users1=$scope.emaildetails.emailaddress;
        
        //console.log(JSON.stringify($scope.emaildetails));
       
        var type = $scope.emaildetails.emailType1;
        var type1 = $scope.emaildetails.emailType;
        var emailFlag = true;
        var count =0;
        var propties = Object.keys($scope.emaildetails);
        var propLen = propties.length;

       
       angular.forEach($scope.emaildetails,function(key,val){
          
            count++;
            var emailtype = "emailType"+count;
            var emailaddress = "emailaddress"+count;

            if($scope.emaildetails[emailaddress] !=undefined){
            
                if($scope.emaildetails[emailaddress].match("@hp.com") || $scope.emaildetails[emailaddress].match("@.hp.com" ) || $scope.emaildetails[emailaddress].match("@compaq.com") ||  $scope.emaildetails[emailaddress].match("@cpqcorp.net") || $scope.emaildetails[emailaddress] == "") {
                
                    if(count <=(propLen/2)){
                     
                    selectedUsers += $scope.emaildetails[emailtype]+" "+$scope.emaildetails[emailaddress]+" " ;
                    console.log("selectedUsers="+selectedUsers);
                    
                    } 
                } else {
                    $scope.validEmail();
                    emailFlag = false;
                    return emailFlag;
                
                }
            }
        });
       
       
        if($scope.text=="order") {
            
            url=hostAddr+"/ossui/v1/in/saveWatch";
            var saveSetupData = {
               
                "os":$scope.legacyOrder,
                "options":selectedOptions,
                "format":selectedFormat,
                "timing":timing,
                "users":selectedUsers
            };
            
        } else if($scope.text=="profile") {
            
            url=hostAddr+"/ossui/v1/in/saveProfile";
            var saveSetupData = {
                
            "profile":$scope.id,
            "options":selectedOptions,
            "format":selectedFormat,
            "timing":timing,
            "users":selectedUsers
           
            };
        }
        
           
        console.log("saveurl"+url); 
        console.log(saveSetupData); 
        
        
        if(emailFlag!=false){
            $("#loader, #overlay").show();

            $http({
                url: url,
                method: "POST",
                data: saveSetupData,
                headers: {'Content-Type': 'application/json'},
            }).success(function (data, status, headers, config) {
                $("#loader, #overlay").hide();
               $scope.eventNotificationSaved();
            }).error(function (data, status, headers, config) {
                $("#loader, #overlay").hide(); 
                console.log("Failed to Save Data: "+data);                         
            });  
        }
    }
    
    $scope.validEmail = function(){
        createDialog('partials/emailValidation.html', {
          id: 'emailValid',
          //title: 'A Simple Modal Dialog',
          backdrop: true,
          scope:$scope,
          //controller: 'eventBasedController',
          success: {label: 'Success', fn: function() {
              console.log('emailValid modal closed');
              $scope.redirectToEventNotify();
            }}
        });
    }
    $scope.eventNotificationSaved = function(){
        createDialog('partials/saveNotification.html', {
          id: 'eventNotificationSaved',
          //title: 'A Simple Modal Dialog',
          backdrop: true,
          scope:$scope,
          //controller: 'eventBasedController',
          success: {label: 'Success', fn: function() {
              console.log('eventNotificationSaved modal closed');
              $scope.redirectToEventNotify();
            }}
        });
    }

    $scope.deleteSetup =function(id){

       var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
       if ($scope.text=="order"){
        
        delUrl = hostAddr+ "/ossui/v1/in/deleteWatch?os="+id;
       
        } else if($scope.text=="profile"){
        
        delUrl = hostAddr+ "/ossui/v1/in/deleteProfile?profile="+id;
        
        }
        console.log("delUrl"+delUrl);
        $("#loader, #overlay").show();
        
        $http.get(delUrl).success(function(data, status) {
            if(data !=undefined){
                $("#loader, #overlay").hide();
                url = "#/eventdelete?hpOrderNo="+id;
                $scope.eventNotificationDeleted();
            }
        }).error(function(data, status) {
            console.log('Delete Notification error');
            $("#loader, #overlay").hide();
        });
    }
    $scope.eventNotificationDeleted = function(){
        createDialog('partials/deleteNotification.html', {
          id: 'eventNotificationDeleted',
          //title: 'A Simple Modal Dialog',
          backdrop: true,
          scope:$scope,
          //controller: 'eventBasedController',
          success: {label: 'Success', fn: function() {
              console.log('eventNotificationDeleted modal closed');
              $scope.redirectToEventNotify();
            }}
        });
    }

    $scope.redirectToEventNotify = function(){
        url = "#/orderBased";
        jQuery(location).attr("href", url);
    }
}

/* get detailed active orders information */
function detailedactiveOrderCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){

    pageTitle.setTitle('Detailed Active Orders');
    $scope.noDataFlag = false;

    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var surl =  hostAddr+"/ossui/v1/in/detaildactiveOrders";
    console.log(surl);

        $http.get(surl).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            if (data != undefined) {

                if (data.data != "") {
                    var lineItems=data.data;
                    var items = {
                        data: []
                    };
                    $filter('filter')(lineItems, function(attr) {
                    var counter = 0;
                    $filter('filter')(attr.sched_Line, function(subAttr) {
                        var showItem = (counter == 0) ? true : false;
                        var lineItem = {
                            'showItem': showItem,
                            'customerPoNo': attr.customer_po_no,
                            'salesOrg': attr.sales_org,
                            'customerOrder': attr.customer_order,
                            'customerName': attr.customer_name,
                            'nearestActionDate': attr.nearest_action_date,
                            'custInformed': attr.cust_informed,
                            'orderNo': attr.order_no,
                            'status': attr.status,
                            'lastUpdate': attr.last_update,
                            'commentText': attr.comment_text,
                            'legacyOrder': attr.legacyOrder,
                            'deliveryStatus': subAttr.delivery_status
                        };
                        counter++;
                        items.data[(items.data.length)++] = lineItem;
                    });
                });

            $scope.items=items.data;

            } else {
                $scope.noDataFlag = true;
                $scope.error=data.message;
            }
        }
    }).error(function(data, status) {
            console.log('error');
        });

    $scope.columnNames = [{
            'id': "customerPoNo",
            'value': "Purchase Order #",
            'sort' :"true"
        }, {
            'id': "salesOrg",
            'value': "Sales Organisation",
            'sort' :"true"
        }, {
            'id': "orderNo",
            'value': "HP Order # ",
            'sort' :"true"
        }, {
            'id': 'status',
            'value': 'Status ',
            'sort' :'true'
        }, {
            'id': 'deliverySatus',
            'value': 'Delivery Comment',
            'sort' :'true'
        }, {
            'id': 'description',
            'value': 'HP Delivery #',
            'sort' :'true'
        }, {
            'id': 'customerOrder',
            'value': 'Customer Order',
            'sort' :'true'
        }, {
            'id': 'customerName',
            'value': 'Customer Name',
            'sort' :'true'
        }, {
            'id': 'lastUpdate',
            'value': 'Last Order Change',
            'sort' :'true'
        }, {
            'id': 'commentText',
            'value': 'Comment',
            'sort' :'true'
        }, {
            'id': 'nearestActionDate',
            'value': 'Next Action Date',
            'sort' :'true'
        }, {
            'id': 'custInformed',
            'value': 'Customer Informed',
            'sort' :'true'
        }
    ];
    $rootScope.$broadcast('columnNames', $scope.columnNames);
    $scope.search = {
            'customerPoNo': '',
            'salesOrg': '',
            'customerOrder': '',
            'customerName': '',
            'nearestActionDate': '',
            'custInformed': '',
            'orderNo': '',
            'status': '',
            'lastUpdate': '',
            'deliveryStatus': ''
        };
        $scope.showCol = false;
        $scope.showColSort = function() {
            $filter('filter')($scope.items, function(item) {
                item.showItem = true;
            });
        };
    $scope.redirectToOrderDetails = function(orderNo) {
    url = "#/in/orderheaderdetail?";
    var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
    url = url + urlParams;
    jQuery(location).attr("href", url);

    } //end of navigating to order detail page
    
    jQuery('a.trigger').live("click", function() {
        jQuery(this).parent().find('.OrderStatusPopup').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.OrderStatusPopup').hide();
    });
    $scope.getEventDetails = function(legacyOrder) {
        
        url = hostAddr+"/ossui/v1/in/showOrderSettings?legacy_order_no="+legacyOrder; 
        
        $http.get(url).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.events=data.data;
                    $scope.noDataFlag = false;
                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });
    
    }


}
detailedactiveOrderCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];

/* get detailed active orders information */
function currentActiveOrderCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){

    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var url =  hostAddr+"/ossui/v1/in/ActiveOrders";
  
        $http.get(url).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                
                if (data.data != "") {
                    $scope.noDataFlag = false;
                    $scope.items=data.data;

                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });

    $scope.columnNames = [{
            'id': "view",
            'value': "",
            'sort' :'false'
        }, {
            'id': "customerpono",
            'value': "Purchase Order #",
            'sort' :'true'
        }, {
            'id': "orderno",
            'value': "HP Order # ",
            'sort' :'true'
        },  {
            'id': 'customername',
            'value': 'Customer Name',
            'sort' :'true'
        }, {
            'id': 'lastupdate',
            'value': 'Last Order Change',
            'sort' :'true'
        }
    ];
    $rootScope.$broadcast('columnNames', $scope.columnNames);
    $scope.search = {
            'customerPoNo': '',
            'customerName': '',
            'orderNo': '',
            'lastUpdate': ''
        };
        $scope.showCol = false;
        $scope.showColSort = function() {
            $filter('filter')($scope.items, function(item) {
                item.showItem = true;
            });
        };
    $scope.redirectToOrderDetails = function(orderNo) {
    url = "#/in/orderheaderdetail?";
    var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
    url = url + urlParams;
    jQuery(location).attr("href", url);

    } //end of navigating to order detail page
    
    jQuery('a.trigger').live("click", function() {
        jQuery(this).parent().find('.OrderStatusPopup').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.OrderStatusPopup').hide();
    });

    $scope.getEventDetails = function(legacyOrder) {
        
        url = hostAddr+"/ossui/v1/in/showOrderSettings?legacy_order_no="+legacyOrder; 
        
        $http.get(url).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.events=data.data;
                    $scope.noDataFlag = false;
                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });
    
    }

}
currentActiveOrderCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];

/* get  active profiles information */
function myPersonalProfileCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){

    pageTitle.setTitle('Profile Based');
    $scope.noDataFlag = false;

    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();

    var surl =  hostAddr+"/ossui/v1/in/myProfiles";
        jQuery("#loader, #overlay").show();

        $http.get(surl).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.items=data.data;
                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;
                    console.log($scope.error);
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });

   $scope.columnNames = [{
            'id': "iobject_name",
            'value': "Profile"
        }
    ];
    $rootScope.$broadcast('columnNames', $scope.columnNames);
    
      $scope.redirectToSaveProfile = function(profileName,wflag,id){
        var text ="profile";
        console.log("wflag="+wflag);
        url = "#/eventOption?profileName="+profileName+"&wflag="+wflag+"&text="+text+"&id="+id
        jQuery(location).attr("href", url);
    }
   
}
myPersonalProfileCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];


/* get  active profiles information */
function activeProfileCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){

    pageTitle.setTitle('Active Profiles');
    $scope.noDataFlag = false;
    $scope.wFlag=false;

    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();

    var surl =  hostAddr+"/ossui/v1/in/activeProfiles";
    console.log(surl);

        $http.get(surl).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.items=data.data;
                    $scope.wFlag=true;

                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;
                    
                    console.log($scope.error);
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });
    $scope.redirectToSaveProfile = function(profileName,wflag,id){
        var text ="profile";
        console.log("wflag="+wflag);
        url = "#/eventOption?profileName="+profileName+"&wflag="+wflag+"&text="+text+"&id="+id
        jQuery(location).attr("href", url);
    }

}
activeProfileCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];

/* get  active profiles information */
function sharedProfileCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){

    pageTitle.setTitle('Active Profiles');
    $scope.noDataFlag = false;
    $scope.wFlag=false;

    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();

    var surl =  hostAddr+"/ossui/v1/in/myProfiles";
    console.log(surl);

        $http.get(surl).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.items=data.data;
                    $scope.wFlag=true;

                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            console.log('error');
        });
    $scope.redirectToSaveProfile = function(profileName,wflag,id){
        var text ="profile";
        url = "#/eventOption?profileName="+profileName+"&wflag="+wflag+"&text="+text+"&id="+id
        jQuery(location).attr("href", url);
    }

}
activeProfileCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];

function serialAssetInfoCtrl($scope,$routeParams,$location,$http,legacyOrder){
    
        $scope.columnsObj = {
          "item": "Item",
          "prod": "Product No",
          "desc": "Description",
          "coo_excl": "CoO Exclusion",
          "serial": "Serial No (Asset Tag, Ethernet Mac Addresses)",
          "box": "Box No",
          "coo_code": "CoO Code",
          "coo_name": "CoO Name"
        };
        $scope.getColumnDescription = function(serchText){
            if ($scope.columnsObj.hasOwnProperty(serchText) == true) {
                return $scope.columnsObj[serchText];
            }
        }
        /*var jsonObj = {
  "status": "S",
  "message": "",
  "data": {
    "delivery": [
      {
        "delvNo": "030101209017",
        "delvType": "Shipment",
        "columns": {
          "item": "Item",
          "prod": "Product No",
          "desc": "Description",
          "coo_excl": "CoO Exclusion",
          "serial": "Serial No (Asset Tag, Ethernet Mac Addresses)",
          "box": "Box No",
          "coo_code": "CoO Code",
          "coo_name": "CoO Name"
        },
        "items": [
          {
            "item": "1",
            "prod": "NM360A8#ABA",
            "desc": "HP Promo LA1905w LCD Monitor US",
            "coo_excl": "Y",
            "serial": [
              "CNC1150XGT"
            ],
            "box": [
              "1"
            ],
            "coo_code": [
              ""
            ],
            "coo_name": [
              ""
            ]
          },
          {
            "item": "2",
            "prod": "NQ576AA",
            "desc": "HP LCD Speaker Bar",
            "coo_excl": null,
            "serial": [
              "CNC1150XCF (prim_mac)",
              "CNC1150XDD (asset prim_mac)  WWAN IMEI: IMEI1234 ICCID:  ActivateKey:",
              "CNC1150XEE (asset prim_mac)",
              "CNC1150XXX (asset prim_mac)  WWAN IMEI: IMEI1234 ICCID:  ActivateKey:",
              "",
              ""
            ],
            "box": [
              "",
              "4",
              "",
              "5",
              "",
              ""
            ],
            "coo_code": [
              "",
              "US",
              "",
              "MX",
              "",
              "MX"
            ],
            "coo_name": [
              "",
              "United States",
              "",
              "Mexico",
              "",
              "Mexico"
            ]
          }
        ]
      },
      {
        "delvNo": "030101209018",
        "delvType": "Shipment",
        "columns": {
          "item": "Item",
          "prod": "Product No",
          "desc": "Description",
          "serial": "Serial No (Asset Tag, Ethernet Mac Addresses)",
          "box": "Box No"
        },
        "items": [
          {
            "item": "1",
            "prod": "BV459AV",
            "desc": "HP DVD5-ROM",
            "serial": [
              "CNC1150XCF (prim_mac)",
              "CNC1150XDD (prim_mac)",
              ""
            ],
            "box": [
              "2",
              "4",
              ""
            ]
          }
        ]
      }
    ]
  }
};  $scope.dataFlag = true;
    $scope.jsonObj = jsonObj;
    $scope.$broadcast('serialAssetInfoData',$scope.jsonObj);
    jQuery("#loader, #overlay").hide();*/
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
            jQuery("#loader, #overlay").hide();
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
        });
        
    
}    
serialAssetInfoCtrl.$inject = ['$scope','$routeParams','$location','$http','legacyOrder'];

function orderLifeCycleCtrl($scope, $location, $http, $routeParams, $rootScope, pageTitle){
        var orderNo = $routeParams.orderNo;
        $scope.orderNo = $routeParams.orderNo;
        
        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var url = hostAddr+"/ossui/v1/in/orderlifecycle?order_no="+orderNo+"&action=details";
        //jQuery("#loader, #overlay").show();    
        $http.get(url).success(function(data, status) {
            jQuery("#loader, #overlay").hide();
            //console.log(data);
            if(data.status == "S" && data.data!=""){
                $scope.headerInformation = data.data.header;
                //$scope.dataFlag = true;
                //$scope.$broadcast('orderLifeCycleData',data.data);    
            }else if((data.status == "S" && data.data == "") || (data.status == "N" && data.data == "")){
                $scope.errorMessage = data.message;
                //$scope.dataFlag = false;
                //console.log("I came:"+data.message);
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
        });
}
orderLifeCycleCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope', 'pageTitle'];


function orderLifeCycleDetailsCtrl($scope, $location, $http, $routeParams, $rootScope,$compile){
        var orderNo = $routeParams.orderNo;
        $scope.orderNo = $routeParams.orderNo;
        $scope.colpseexpandflag = false;
        $scope.hpcolpseexpand = function(panelName, mode,index){
                $scope[panelName] = !$scope[panelName];
                console.log($scope[panelName]);
                if (mode) {
                    if (mode == 'e') {
                        $scope[panelName] = true;
                    } else {
                        $scope[panelName] = false;
                    }
                }
                if ($scope[panelName]) {
                    var deliveryGroupscls = "#deliveryGroupscls"+index;
                    $scope.el = $compile(deliveryGroupscls)($scope);
                    $scope.el.removeClass("collapseImg expCloseImgDiv");
                    $scope.el.addClass("expandImg expCloseImgDiv");
                } else {
                    var deliveryGroupscls = "#deliveryGroupscls"+index;
                    $scope.el = $compile(deliveryGroupscls)($scope);
                    $scope.el.removeClass("expandImg expCloseImgDiv");
                    $scope.el.addClass("collapseImg expCloseImgDiv");
                }
            }
            console.log($scope);
         $scope.itemscolpseexpand = function(panelName, mode,index){
                    $scope[panelName] = !$scope[panelName];
                    if (mode) {
                        if (mode == 'e') {
                            $scope[panelName] = true;
                        } else {
                            $scope[panelName] = false;
                        }
                    }
                    if ($scope[panelName]) {
                        var deliveryGroupscls = "#lifecycleitemgrid"+index;
                        $scope.el = $compile(deliveryGroupscls)($scope);
                        $scope.el.removeClass("collapseImg expCloseImgDiv");
                        $scope.el.addClass("expandImg expCloseImgDiv");
                    } else {
                        var deliveryGroupscls = "#lifecycleitemgrid"+index;
                        $scope.el = $compile(deliveryGroupscls)($scope);
                        $scope.el.removeClass("expandImg expCloseImgDiv");
                        $scope.el.addClass("collapseImg expCloseImgDiv");
                    }
                }   
            
        $scope.columnNames = [{
            'id': "item_subitem",
            'value': "Item No",
            "sort": "false"
        }, {
            'id': 'sched_line_qty',
            'value': 'Qty',
            "sort": "false"
        }, {
            'id': 'status',
            'value': 'Status',
            "sort": "false"
        }, {
            'id': 'material_no',
            'value': 'Product Number',
            "sort": "false"
        }, {
            'id': 'product_descr',
            'value': 'Product Description',
            "sort": "false"
        }
    ];
        $rootScope.$broadcast('columnNames', $scope.columnNames);
        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var url = hostAddr+"/ossui/v1/in/orderlifecycle?order_no="+orderNo+"&action=details";
        jQuery("#loader, #overlay").show();    
        $http.get(url).success(function(data, status) {
            jQuery("#loader, #overlay").hide();
            if(data.status == "S" && data.data!=""){
                $scope.deliveryGroups = data.data.delivery_groups;
                angular.forEach($scope.deliveryGroups,function(key,val){
                    var hideDiv = "lifecycleitemgrid"+val;
                    $scope[hideDiv] = false;
                    var hideDelveryGroupDiv = "deliveryGroups"+val;
                    $scope[hideDelveryGroupDiv] = true;
                    var deliveryGroupscls = "#deliveryGroupscls"+val;
                    $scope.el = $compile(deliveryGroupscls)($scope);
                    $scope.el.addClass("expandImg expCloseImgDiv");
                });
                //console.log($scope);
                //$scope.dataFlag = true;
                //$scope.$broadcast('orderLifeCycleData',data.data);    
            }else if((data.status == "S" && data.data == "") || (data.status == "N" && data.data == "")){
                $scope.errorMessage = data.message;
                //$scope.dataFlag = false;
                //console.log("I came:"+data.message);
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
            console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);
        });
}
orderLifeCycleDetailsCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope','$compile'];
