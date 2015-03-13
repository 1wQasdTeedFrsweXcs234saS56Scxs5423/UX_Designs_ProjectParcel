/* This js file is used to get data from services for external customers */

function indexCtrl($scope, pageTitle) {
    $scope.pageTitle = pageTitle;
}

function URLPrefix(location) {
  if (location.absUrl().match(/\/sso\/os\/ext/) ) return '/sso/os';
  return ''
}

/* providing navigation to order summary and report page  in all pages */
function PortalCtrl($scope, $location, $http, $routeParams) {
    var currentdate = new Date();
    $scope.currentYr = currentdate.getFullYear();
    var hostAddr = $location.host()+":"+$location.port();
    var s = $location.$$path;
    if(s.indexOf("productDetails") != -1  || s.indexOf("shipmentInformation") != -1 || (s.indexOf("status") != -1)){
        $scope.prdDet = false;
    }
    else{
        $scope.prdDet = true;
    }
    $scope.breadcrumbs = [];
    $scope.menu =   [
        {text: 'Orders & Reporting', href:'/ext/index.html', children: [
            {text:'Order Status', href:"./index.html"},
            {text:'Order Summary', href:'', click:'redirectToOrderSummary()'},
            {text:'My Reports', href:'', click:'redirectToReports()'},
          /*  {text:'Event Notification', href:'', click:'redirectToEventNotification()'},*/
            {text:'Legacy Oss', href:'', click:'redirectToLegacyOSS()'}
          ]
        }/*,
        {text: 'Tools & Resources', href:'/ext/index.html', children: [
            {text:'Administrative Tools',click:'redirectToEventNotification()'},
            {text:'Customer Hierarchy', href:'#', click:'redirectToLegacyOSS()'}
            ]
        }*/
    ]

    url = URLPrefix($location)+"/ossui/v1/ex/usersettings";
    $http.get(url).success(function(data, status) {
        $scope.data = data;
        $scope.redirectToOrderSummary = function() {
            url = "#/ex/orderSummary";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToReports = function() {
            var url = "#/viewReports";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToEventNotification = function(){
            var url = "#/ex/eventBased";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToLegacyOSS = function(){
                var serurl = URLPrefix($location)+"/ossui/v1/ex/legacyOSSLink";
                var legacyurl = "";
                $http.get(serurl).success(function(data, status) {
                legacyurl = data.data;
                jQuery(location).attr("href", legacyurl);
            }).error(function(data, status) {
            });
        }
    }).error(function(data, status) {
    });
}
/* get orders information for orderSummaryRoute service for order summary page*/
function orderListCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle, summaryPage, searchObject, $compile, createDialog, customerrormsgs,hpyOrderNumber,legacyOrderNumber) {
    
    var scopeItems = [];
    $scope.data = [];
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var searchObj = searchObject.getSearchObject();
    pageTitle.setTitle('Order Summary');

    if(searchObj!=""){
        var searchUrl =  URLPrefix($location) +"/ossui/v1/ex/ordersummary";
        $("#loader, #overlay").show();
        $http({
            url: searchUrl,
            method: "POST",
            data: searchObj,
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            $scope.showResult = true;
            $("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.data != "") {
                    var lineItems=data.data;
                    $scope.showhide = false;
                    $scope.dataflag = false;
                    $scope.orders = data.data;
                } else {
                    $scope.showhide = true;
                    $scope.dataflag = true;
                    document.getElementById("nodatafound").innerHTML = customerrormsgs(data.message);
                    $("#loader, #overlay").hide();
                }
            }
            $rootScope.$broadcast('showhide', $scope.showhide);
            $rootScope.$broadcast('dataflag', $scope.dataflag);
        }).error(function(data, status) {
            $scope.showResult = true;
            $scope.showhide = true;
            $scope.dataflag = true;
            document.getElementById("nodatafound").innerHTML = customerrormsgs(data.message);
            $("#loader, #overlay").hide();
        });
    }
    $scope.$on('summarySearchData', function(events, data){
        var searchUrl = URLPrefix($location) + "/ossui/v1/ex/ordersummary";
        $("#loader, #overlay").show();
        $http({
            url: searchUrl,
            method: "POST",
            data: data,
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            $scope.showResult = true;
            $("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.data != "") {
                    var lineItems=data.data;
                    $scope.showhide = false;
                    $scope.dataflag = false;
                    $scope.orders = data.data;
                } else {
                    $scope.showhide = true;
                    $scope.dataflag = true;
                    document.getElementById("nodatafound").innerHTML = customerrormsgs(data.message);
                    $("#loader, #overlay").hide();
                }
            }
            $rootScope.$broadcast('showhide', $scope.showhide);
            $rootScope.$broadcast('dataflag', $scope.dataflag);
        }).error(function(data, status) {
            $scope.showResult = true;
            $scope.showhide = true;
            $scope.dataflag = true;
            document.getElementById("nodatafound").innerHTML = customerrormsgs(data.message);
            $("#loader, #overlay").hide();
        });
    });

    /* displaying column names in order summary page*/
    $scope.columnNames = [{
            'id': "icon",
            'value': ""
        }, {
            'id': "order_no",
            'value': "HP Order#"
        }, {
            'id': 'purchase_order_no',
            'value': 'Purchase Order#'
        }, {
            'id': 'dlr_total_price',
            'value': 'Total Price/Total Price USD'
        }, {
            'id': 'order_overall_status',
            'value': 'Summarized Status'
        }, {
            'id': 'total_order_value',
            'value': 'Total Order Value'
        }, {
            'id': 'total_net_price',
            'value': 'Net Order Value'
        }, {
            'id': 'order_type_descr',
            'value': 'Order Type'
        }, {
            'id': 'purch_order_date',
            'value': 'Purchase Order Date'
        }, {
            'id': 'quote_no',
            'value': 'Quote#'
        }, {
            'id': 'so_no',
            'value': 'SAP Order Number (Header)'
        }, {
            'id': 'ship_to_addr_1',
            'value': 'Ship To Address'
        }, {
            'id': 'last_update',
            'value': 'Last Order Change'
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
        $filter('filter')($scope.orders, function(item) {
            item.showItem = true;
        });
    };
    jQuery('a.trigger').live("click", function() {
        jQuery(this).parent().find('.OrderStatusPopup').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.OrderStatusPopup').hide();
    });
    jQuery('img.productflag').live("click", function() {
        jQuery(this).parent().find('.flag_tip').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.flag_tip').hide();
    });
    jQuery('.udf_details').live("click", function() {
        jQuery(this).parent().find('.udfDetails').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.udfDetails').hide();
    });
    $scope.params = $routeParams;

    /* to display quote details */
    $scope.openQuoteDetails = function(quote_no) {
        var quoteurl = "http://d2t0020g.austin.hp.com:8580/q2cngom/ngom#/quotationdetails/";
        window.open(quoteurl + quote_no, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
    }

    /* display column names for line items in order detail page */
    $scope.productCharsColumnNames= [{
            'id': "charac_id",
            'value': "Product ID"
        },{
            'id': "charac_id_descr",
            'value': "Product Description"
        },{
            'id': "charac_value",
            'value': "Product Value"
        },{
            'id': "charac_value_descr",
            'value': "Product Value Description"
        },{
            'id': "charac_line",
            'value': "Product Character Line"
        }
    ];
    /* display column names for line items in order detail page */
    $scope.lineItemsColumnNames = [{
            'id': "exCol",
            'value': ""
        }, {
            'id': "itemSubItem",
            'value': "Item"
        }, {
            'id': 'product',
            'value': 'Product'
        },{
            'id': 'config_id',
            'value': 'Config Id'
        }, {
            'id': 'itemStatus',
            'value': 'Item Status'
        }, {
            'id': 'productDescr',
            'value': 'Description'
        }, {
            'id': 'openQty',
            'value': 'Order Qty'
        }, {
            'id': 'shippedQty',
            'value': 'Partial Qty'
        }, {
            'id': 'hpDeliveryNo',
            'value': 'HP Delivery#'
        }, {
            'id': 'dealId',
            'value': 'Deal ID/Price ID'
        }, {
            'id': 'bundlePrice',
            'value': 'Bundle Price'
        }, {
            'id': 'plannedShipDate',
            'value': 'Planned Ship Date'
        }, {
            'id': 'actualShipDate',
            'value': 'Actual Ship Date'
        }, {
            'id': 'plannedDeliveryDate',
            'value': 'Planned Delivery Date'
        }, {
            'id': 'actualDeliveryDate',
            'value': 'Actual Delivery Date'
        }, {
            'id': 'shipmentNo',
            'value': 'Shipment#'
        }, {
            'id': 'invoiceNo',
            'value': 'Invoice#'
        }, {
            'id': 'invoiceDate',
            'value': 'Invoice Date'
        }, {
            'id': 'shipDate',
            'value': 'Ship Date'
        }, {
            'id': 'requestedDate',
            'value': 'Requested Date'
        }, {
            'id': 'cancellationReason',
            'value': 'Cancellation Reason'
        }, {
            'id': 'scCommitDate',
            'value': 'SC Commit Date'
        }, {
            'id': 'entitlement_id',
            'value': 'Entitlement ID',
            "sort": "false"
        }, {
            'id': 'billing_plan',
            'value': 'Billing Plan',
            "sort": "false"
        }, {
            'id': 'factory_shipped_date',
            'value': 'Factory Shipped Date',
            "sort": "false"
        }, {
            'id': 'actual_customer_ship_date',
            'value': 'Actual Customer Ship Date',
            "sort": "false"
        }
    ];
    $rootScope.$broadcast('lineItemsColumnNames', $scope.lineItemsColumnNames);
    $scope.lineItemsWithProductColumnNames = [{
            'id': "exCol",
            'value': "Show Prodcut Chars",
            "sort": "false"
        },
        {
            'id': "exCol",
            'value': "",
            "sort": "false"
        },
        {
        'id': "itemSubItem",
            'value': "Item",
            "sort": "false"
        }, {
            'id': 'product',
            'value': 'Product',
            "sort": "false"
        },{
            'id': 'config_id',
            'value': 'Config Id',
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
            'id': 'hpDeliveryNo',
            'value': 'HP Delivery#',
            "sort": "false"
        }, {
            'id': 'dealId',
            'value': 'Deal ID/Price ID',
            "sort": "false"
        }, {
            'id': 'bundlePrice',
            'value': 'Bundle Price',
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
            'id': 'itemCanceledOn',
            'value': 'Item Canceled Date',
            "sort": "false"
        }, {
            'id': 'scCommitDate',
            'value': 'SC Commit Date',
            "sort": "false"
        }, {
            'id': 'entitlement_id',
            'value': 'Entitlement ID',
            "sort": "false"
        }, {
            'id': 'billing_plan',
            'value': 'Billing Plan',
            "sort": "false"
        }, {
            'id': 'factory_shipped_date',
            'value': 'Factory Shipped Date',
            "sort": "false"
        }, {
            'id': 'actual_customer_ship_date',
            'value': 'Actual Customer Ship Date',
            "sort": "false"
        }, {
            'id': 'last_price_date',
            'value': 'Last Price Date',
            "sort": "false"
        }
    ];
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

    $scope.lineItemShow = false;
    var panelsSelected = [];
    var flag;
    $scope.lineItemColExp = function(panelName,hpOrderNo){
        var hpOrderNo = hpOrderNo;
        var index;
        for(var i=0; i<panelsSelected.length; i++) {
            if(panelsSelected[i] == panelName){
                flag = true;
                break;
            } else
                flag =false;
        }
        if(!flag)
            panelsSelected.push(panelName);
        else {
            var lineItemscls = "#"+panelName;
            $scope.el = $compile(lineItemscls)($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
            $scope.lineitemflg = panelName;
            $scope.showLineItem = false;
            panelsSelected = [];
            flag = false;
            return;
        }
        if (!flag) {
            $scope.lineitemflg = panelName;
            $scope.showLineItem = true;
            var lineItemscls = "#"+panelName;
            $scope.el = $compile(lineItemscls)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
            $scope.lineItemShow = true;
            $scope.getLineItemDetails(panelName,hpOrderNo);
        }
        for(var i=0; i<panelsSelected.length; i++) {
             if(panelName != panelsSelected[i]){
                var lineItemscls = "#"+panelsSelected[i];
                $scope.el = $compile(lineItemscls)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
                index = panelsSelected.indexOf(panelsSelected[i]);
            }
        }
        if(index != undefined)
            panelsSelected.splice(index, 1);
    }

    var nestedLineItem;
    var itemFlag;
    $scope.itemLstArry = [];
    $scope.lineItemColpseExpand = function(panelName, prefix){
        if($scope.itemLstArry.length == 0) {
            var deliveryGroupscls = "#"+prefix+panelName;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
            $scope.itemLstArry.push(deliveryGroupscls);
            return;
        }
        var prefPanelNm = "#"+prefix+panelName;
        var flag = false;
        for(var i=0; i<$scope.itemLstArry.length ; i++){
            if(prefPanelNm == $scope.itemLstArry[i]) {
                $scope.el = $compile(prefPanelNm)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
                $scope.itemLstArry.splice($scope.itemLstArry.indexOf(prefPanelNm), 1);
                return;
            } else {
                flag = true;
            }
        }
        if(flag){
            $scope.itemLstArry.push(prefPanelNm);
            $scope.el = $compile(prefPanelNm)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
        }
    }
    $scope.showTbl = function(panelName, prefix) {
        var prefPanelNm;
        prefPanelNm = "#"+prefix+panelName;
        for(var i=0; i<$scope.itemLstArry.length ; i++){
            if(prefPanelNm == $scope.itemLstArry[i]) {
                return true;
            }
        }
    }

    $scope.showBundleChildElements = function(panelName,level,showBundleIndex,mode,orderNo, orderSumIndex){
        $scope[panelName] = !$scope[panelName];
        $scope[showBundleIndex] = !$scope[showBundleIndex];
        if (mode) {
            if (mode == 'e') {
                $scope[panelName] = true;
            } else {
                $scope[panelName] = false;
            }
        }
        if ($scope[panelName]) {
            var deliveryGroupscls = "#bundleChild"+level+orderNo+orderSumIndex;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
            var childElements = $scope.bundleGroups[level];
            angular.forEach(childElements,function(key,value){
                $scope["bundleChildItem"+key+orderNo]=true;
                var childItem = "#bundleChild"+key+orderNo+orderSumIndex;
                $scope.el1 = $compile(childItem)($scope);
                $scope.el1.removeClass("expandImg expCloseImgDiv");
                $scope.el1.addClass("collapseImg expCloseImgDiv");
            });
        } else {
            var deliveryGroupscls = "#bundleChild"+level+orderNo+orderSumIndex;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
        }
    }

    $scope.showBundleImage = function(itemVal,bundleName){
        var groups = {};
        angular.forEach($scope.BundleItems[bundleName], function(item,i) {
            var level = item.higher_level;
            if(groups[level]) {
                groups[level].push(item.item_subitem);
            } else {
                groups[item.higher_level] = [item.item_subitem];
            }
        });
        if(groups[itemVal]!=undefined){
            if(groups[itemVal].length > 0){
                return true;
            }
        } else{
            return false;
        }
    }

    $scope.showBundleItems = function(val){
        if(val.length == undefined){
            return false;
        } else{
            return true;
        }
    };
    $scope.showChildElements = function(panelName,level, mode,orderNo, orderSumIndex){
        $scope[panelName] = !$scope[panelName];
        if (mode) {
            if (mode == 'e') {
                $scope[panelName] = true;
            } else {
                $scope[panelName] = false;
            }
        }
        if ($scope[panelName]) {
            var deliveryGroupscls = "#child"+level+orderNo+orderSumIndex;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
            var childElements = $scope.groupItems[level];
            angular.forEach(childElements,function(key,value){
                $scope["childItem"+key+orderNo]=true;
                var childItem = "#child"+key+orderNo+orderSumIndex;
                $scope.el1 = $compile(childItem)($scope);
                $scope.el1.removeClass("expandImg expCloseImgDiv");
                $scope.el1.addClass("collapseImg expCloseImgDiv");
            });
        } else {
            var deliveryGroupscls = "#child"+level+orderNo+orderSumIndex;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
        }
    }
    $scope.showImage = function(itemVal){
        var groups = {};
        angular.forEach($scope.noBundleItems, function(item,i) {
            var level = item.higher_level;
            if(groups[level]) {
                groups[level].push(item.item_subitem);
            } else {
                groups[item.higher_level] = [item.item_subitem];
            }
        });
        if(groups[itemVal]!=undefined){
            if(groups[itemVal].length > 0){
                return true;
            }
        } else{
            return false;
        }
    }
    $scope.showProductCharacteristics = function(prodchar){
        if(prodchar!=""){
            return true;
        } else{
            return false;
        }
    }

    $scope.getLineItemDetails = function (orderNo,hpOrderNo) {
        var orderNo = orderNo;
        hpyOrderNumber.setHpOrderNo(hpOrderNo);
        legacyOrderNumber.setLegacyOrderNo(orderNo);
        var hpOrderNo=hpOrderNo;
        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var surl = URLPrefix($location) + "/ossui/v1/ex/newitemdetail?oid="+orderNo;
        var items = {
            data: []
        };
        $scope.showNonBundle=false;
        $("#smallLoader, #overlaySmall").show();
        $http.get(surl).success(function(data, status) {
            $("#smallLoader, #overlaySmall").hide();
            var bundleitemscontent = {
                data: []
            };
            $scope.bundleitemsdataoption = {};
            $scope.bundleItems = {};
            $scope.bundlePrices = {};
            var keyMap = [];
            var bundleNames=[];
            var lineItemBundles = {};
            var showBundleKey = true;
            angular.forEach(data.data, function(key,bundleNonBundlearray){
                if(bundleNonBundlearray == "NoBundle_total_price"){
                    $scope.NoBundleTotalPrice = key;
                }
                var bundleprice = bundleNonBundlearray;
                var patt = /_total_price/g;
                var result = patt.test(bundleNonBundlearray);
                $scope.showBundleDetails = function(name){
                    var patt = /_total_price/g;
                    var result1 = patt.test(name);
                    if(name == "NoBundle" || name == "NoBundle_total_price" || result1 ==true){
                        return false;
                    } else{
                        return true;
                    }
                }
                if(bundleNonBundlearray!="NoBundle" && bundleNonBundlearray!= "NoBundle_total_price" && result!=true){
                    $scope.BundleItems = data.data;
                    showBundleKey = true;
                    bundleitemscontent.data = [];
                    var groups = {};
                    angular.forEach($scope.BundleItems[bundleNonBundlearray], function(item,i) {
                        var level = item.higher_level;
                        if(groups[level]) {
                            groups[level].push(item.item_subitem);
                        } else {
                            groups[item.higher_level] = [item.item_subitem];
                        }
                    });
                    $scope.bundleGroups = groups;
                    angular.forEach(groups, function(item,i) {
                        if(i!=0){
                            $scope["bundleChildItem"+i+orderNo]=true;
                        }
                    });
                    $scope.showBundelProductCharFlag = "false";
                    var showProductCharCount = 0;
                    angular.forEach(key,function(attr,key1){
                        var counter1=0;
                        var entitlement_id = "";
                        var billing_plan = "";
                        var factory_shipped_date = "";
                        var actual_customer_ship_date = "";
                        var udf_text = "";
                        var udfTextFlag = false;
                        if(attr.hasOwnProperty("product_chars") == true){
                            showProductCharCount++;
                        }
                        if(attr.hasOwnProperty("udf_text") == true){
                            if(attr.udf_text!="" || attr.udf_text!=null){
                                udfTextFlag = true;
                                udf_text = attr.udf_text;
                            }else{
                                udf_text = "";
                                udfTextFlag = false;
                            }
                        }else{
                                udfTextFlag = false;
                        }
                        if(attr.entitlement_id == "null"){
                            entitlement_id = "";
                        }else{
                            entitlement_id = attr.entitlement_id;
                        }
                        if(attr.billing_plan == "null"){
                            billing_plan = "";
                        }else{
                            billing_plan = attr.billing_plan;
                        }
                        var bundlePrice = data.data[bundleNonBundlearray+"_total_price"];
                        if (bundleNames.indexOf(bundleNonBundlearray) > -1){
                                showBundleKey = false;
                        }
                        bundleNames.push(bundleNonBundlearray);
                        if(attr.higher_level == "0"){
                            keyMap.push(attr.item_subitem);
                        }
                        var counter1 = 0;
                        $filter('filter')(attr.sched_Line, function(subAttr) {
                            var holdCode = false;
                            if(subAttr.hasOwnProperty("Hold_Codes") == true){
                                if(subAttr.Hold_Codes.length > 0){
                                        holdCode = true;
                                } else{
                                    holdCode = false;
                                }
                            }else{
                                holdCode = false;
                            }
                            if(subAttr.factory_shipped_date == "null"){
                                factory_shipped_date = "";
                            }else{
                                factory_shipped_date = subAttr.factory_shipped_date;
                            }
                            if(subAttr.actual_customer_ship_date == "null"){
                                actual_customer_ship_date = "";
                            }else{
                                actual_customer_ship_date = subAttr.actual_customer_ship_date;
                            }
                            var showItemtab =(counter1 == 0) ? true : false;
                            var shedLinelength = attr.sched_Line.length;
                            var showProdFlag = true;
                            if(counter1 == 0 && shedLinelength >= 1){
                                if((attr.hasOwnProperty("product_chars") == true)){
                                    showProdFlag = true;
                                }else{
                                    showProdFlag = false;
                                }
                            }else{
                                showProdFlag = false;
                            }
                            lineItemBundles = {
                                'bundlekey':bundleNonBundlearray,
                                'bundlePrice': attr.bundle_price,
                                'showItemcontent':showItemtab,
                                'level_indent': attr.level_indent,
                                'itemSubItem': attr.item_subitem,
                                'product': attr.product_no,
                                'configId': attr.config_id,
                                'itemStatus': subAttr.status,
                                'productDescr': attr.description,
                                'openQty': attr.order_qty,
                                'shippedQty': subAttr.qty,
                                'hpDeliveryNo' : attr.hpdeliveryno,
                                'dealId': attr.deal_id,
                                'plannedDeliveryDate': subAttr.planned_delivery_date,
                                'actualDeliveryDate': subAttr.actual_delivery_date,
                                'plannedShipDate': subAttr.planned_ship_date,
                                'actualShipDate': subAttr.actual_ship_date,
                                'shipmentNo': subAttr.shipment_no,
                                'invoiceNo': subAttr.invoice_no,
                                'invoiceDate': subAttr.inv_date,
                                'shipDate': subAttr.ship_date,
                                'requestedDate': attr.request_date,
                                'holdCode': holdCode,
                                'fullInvoiceNo': attr.full_invoice_no,
                                'holdItems': subAttr.Hold_Codes,
                                'hpdeliveryno' : subAttr.hpdeliveryno,
                                'system': attr.system,
                                'cancellationReason':attr.cancellation_reason,
                                'higherLevel': attr.higher_level,
                                'productCharacteristics': attr.product_chars,
                                'legacyorderno':orderNo,
                                'scCommitDate':attr.sc_commit_date,
                                'entitlementID':attr.entitlement_id,
                                'billingPlan':billing_plan,
                                'factShippedDate':factory_shipped_date,
                                'actualCustShipDate':actual_customer_ship_date,
                                'udfText':udf_text,
                                'udfTextFlag':udfTextFlag,
                                'showBundleProductCharFlag':showProdFlag,
                                'showBundleKey':showBundleKey
                            };
                        });
                        if(showBundleKey == true){
                            bundleitemscontent.data[(bundleitemscontent.data.length)] = lineItemBundles;
                            $scope.bundleItems[bundleNonBundlearray]=lineItemBundles;
                        }else{
                            bundleitemscontent.data[(bundleitemscontent.data.length)++] = lineItemBundles;
                            $scope.bundleItems[bundleNonBundlearray]=bundleitemscontent.data;
                        }
                    });
                    if(showProductCharCount >= 1){
                        $scope.showBundelProductCharFlag = "true";
                    }else{
                        $scope.showBundelProductCharFlag = "false";
                    }
                    $scope.bundlePrice = data.data[bundleNonBundlearray+"_total_price"];
                    $scope.bundlePrices[bundleNonBundlearray] = $scope.bundlePrice;
                    if($scope.bundlePrice!=undefined){
                        $scope.showbundlePrice = "true";
                    }else{
                        $scope.showbundlePrice = "false";
                    }
                }
            });
            if(data.data.NoBundle != undefined){
                $scope.noBundleItems = data.data.NoBundle;
                $scope.groupItems = "";
                if(data.data.NoBundle.length > 0) {
                    $scope.showNonBundle=true;
                    var groups = {};
                    angular.forEach(data.data.NoBundle, function(item,i) {
                        var level = item.higher_level;
                        if(groups[level]) {
                            groups[level].push(item.item_subitem);
                        } else {
                            groups[item.higher_level] = [item.item_subitem];
                        }
                    });
                    $scope.groupItems = groups;
                    angular.forEach(groups, function(item,i) {
                        if(i!=0){
                            $scope["childItem"+i+orderNo]=true;
                        }
                    });
                    var showProductCharCnt=0;
                    $filter('filter')(data.data.NoBundle, function(attr) {
                        var counter = 0;
                        var entitlement_id = "";
                        var billing_plan = "";
                        var factory_shipped_date = "";
                        var actual_customer_ship_date = "";
                        var udf_text = "";
                        var udfTextFlag = false;
                        $scope.showProductCharFlag = false;
                        if(attr.hasOwnProperty("product_chars") == true){
                            showProductCharCnt++;
                        }
                        $scope.nonBundleCurrency = data.data.NoBundle[0].currency;
                        if(attr.hasOwnProperty("udf_text") == true){
                            if(attr.udf_text!="" || attr.udf_text!=null){
                                udfTextFlag = true;
                                udf_text = attr.udf_text;
                            }else{
                                udf_text = "";
                                udfTextFlag = false;
                            }
                        }else{
                                udfTextFlag = false;
                        }
                        if(attr.entitlement_id == "null"){
                            entitlement_id = "";
                        }else{
                            entitlement_id = attr.entitlement_id;
                        }
                        if(attr.billing_plan == "null"){
                            billing_plan = "";
                        }else{
                            billing_plan = attr.billing_plan;
                        }
                        $filter('filter')(attr.sched_Line, function(subAttr) {
                            var nonBundleHoldCode = false;
                            if(subAttr.hasOwnProperty("Hold_Codes") == true){
                                if(subAttr.Hold_Codes.length > 0){
                                    nonBundleHoldCode = true;
                                }else{
                                    nonBundleHoldCode = false;
                                }
                            }else{
                                nonBundleHoldCode = false;
                            }
                            if(subAttr.factory_shipped_date == "null"){
                                factory_shipped_date = "";
                            }else{
                                factory_shipped_date = subAttr.factory_shipped_date;
                            }
                            if(subAttr.actual_customer_ship_date == "null"){
                                actual_customer_ship_date = "";
                            }else{
                                actual_customer_ship_date = subAttr.actual_customer_ship_date;
                            }

                            var showItem = (counter == 0) ? true : false;
                            var shedLinelength = attr.sched_Line.length;
                            var showProdFlag = true;
                            if(counter == 0 && shedLinelength >= 1){
                                if((attr.hasOwnProperty("product_chars") == true)){
                                    showProdFlag = true;
                                }else{
                                    showProdFlag = false;
                                }
                            }else{
                                showProdFlag = false;
                            }
                            var lineItemNonBundles = {
                                'showItem':showItem,
                                'itemSubItem': attr.item_subitem,
                                'level_indent': attr.level_indent,
                                'product': attr.product_no,
                                'configId': attr.config_id,
                                'itemStatus': subAttr.status,
                                'productDescr': attr.description,
                                'openQty': attr.order_qty,
                                'shippedQty': subAttr.qty,
                                'hpDeliveryNo' : attr.hpdeliveryno,
                                'dealId': attr.deal_id,
                                'bundlePrice': attr.bundle_price,
                                'plannedDeliveryDate': subAttr.planned_delivery_date,
                                'actualDeliveryDate': subAttr.actual_delivery_date,
                                'plannedShipDate': subAttr.planned_ship_date,
                                'actualShipDate': subAttr.actual_ship_date,
                                'shipmentNo': subAttr.shipment_no,
                                'invoiceNo': subAttr.invoice_no,
                                'invoiceDate': subAttr.inv_date,
                                'shipDate': subAttr.ship_date,
                                'requestedDate': attr.request_date,
                                'nonBundleHoldCode': nonBundleHoldCode,
                                'fullInvoiceNo': attr.full_invoice_no,
                                'holdItems': subAttr.Hold_Codes,
                                'hpdeliveryno' : subAttr.hpdeliveryno,
                                'system': attr.system,
                                'cancellationReason':attr.cancellation_reason,
                                'higherLevel': attr.higher_level,
                                'productCharacteristics': attr.product_chars,
                                'legacyorderno':orderNo,
                                'scCommitDate':attr.sc_commit_date,
                                'billingPlan':billing_plan,
                                'entitlementID':attr.entitlement_id,
                                'factShippedDate':factory_shipped_date,
                                'actualCustShipDate':actual_customer_ship_date,
                                'udfText':udf_text,
                                'showProductCharFlag':showProdFlag,
                                'udfTextFlag':udfTextFlag,
                            };
                            counter++;
                            items.data[(items.data.length)++] = lineItemNonBundles;
                        });
                    });
                    if(showProductCharCnt >= 1){
                        $scope.showProductCharFlag = "true";
                    }else{
                        $scope.showProductCharFlag = "false";
                    }
                }
                $scope.nonBundleItems=items.data;
            }
        }).error(function(data, status) {
            $("#smallLoader, #overlaySmall").hide();
        });
        $scope.searchInvoice = function(invoiceNo, fullInvoiceNo, system) {
            if (invoiceNo != "") {
                url = URLPrefix($location)+"/ossui/v1/ex/invoice?" + "order_no=" + hpOrderNo + "&invoice_no=" +
                    invoiceNo + "&full_invoice_no=" + fullInvoiceNo + "&data_source=" + system;
               jQuery(location).attr("href", url);
            }
        }
        $scope.showProductChars = function(panelName, mode,indexVal)
        {
            $scope[panelName] = !$scope[panelName];
            if (mode) {
                if (mode == 'e') {
                    $scope[panelName] = true;
                } else {
                    $scope[panelName] = false;
                }
            }
            if ($scope[panelName]) {
                $scope["showProductCharacteristics"+indexVal] = true;
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("productCollapseImg productExpCloseImgDiv");
                $scope.el.addClass("productExpandImg productExpCloseImgDiv");
                $scope.el.attr("title","Hide product characteristics");
            } else {
                $scope["showProductCharacteristics"+indexVal] = false;
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("productExpandImg productExpCloseImgDiv");
                $scope.el.addClass("productCollapseImg productExpCloseImgDiv");
                $scope.el.attr("title","Show product characteristics");
            }
        }
        $scope.showBundelProductChars = function(panelName, mode,indexVal,showBundleIndex)
        {
            $scope[panelName] = !$scope[panelName];
            $scope[showBundleIndex] = !$scope[showBundleIndex];
            if (mode) {
                if (mode == 'e') {
                    $scope[panelName] = true;
                } else {
                    $scope[panelName] = false;
                }
            }
            if ($scope[panelName]) {
                $scope["showBundleProductCharacteristics"+indexVal] = true;
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("productCollapseImg productExpCloseImgDiv");
                $scope.el.addClass("productExpandImg productExpCloseImgDiv");
                $scope.el.attr("title","Hide product characteristics");
            } else {
                $scope["showBundleProductCharacteristics"+indexVal] = false;
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("productExpandImg productExpCloseImgDiv");
                $scope.el.addClass("productCollapseImg productExpCloseImgDiv");
                $scope.el.attr("title","Show product characteristics");
            }
        }
    }

    /* navigating to shipment page from order summary */
    $scope.getShipmentDetails = function(hpdeliveryno,legacyNo) {
        if (hpdeliveryno != "") {
            var shipmenturl = "#/ex/shipmentInformation/" + hpdeliveryno +"/"+legacyNo;
            jQuery(location).attr("href", shipmenturl);
            //window.open(shipmenturl, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0');
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

    $scope.showProductDetails = function(itemNo,orderNo){
        var orderNo = orderNo;
        var productDetailsUrl = "#/ex/productDetails/"+orderNo+"/"+itemNo;
        window.open(productDetailsUrl, '_blank', 'width=1200,height=600,toolbar=0,location=0,menubar=0,status=0,title=0,scrollbars=yes,resizable=yes')
    }
}
orderListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle', 'summaryPage', 'searchObject' ,'$compile','createDialog', 'customerrormsgs','hpyOrderNumber','legacyOrderNumber']; // end of order summary controller

/* get order header information from orderDetailRoute service  for order detail page*/
function orderHeaderCtrl($scope, $http, $routeParams, $location, pageTitle,legacyOrder,searchObject,$rootScope,hpyOrderNumber,legacyOrderNumber) {
    var orderNo = $routeParams.orderNo;
    legacyOrderNumber.setLegacyOrderNo(orderNo);
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
    jQuery('a.delveryCodesinfo').live("click", function() {
        jQuery(this).parent().find('.moreButtonpopup').show();
    });
     jQuery('a.accountDetails').live("click", function() {
        jQuery(this).parent().find('.accountButton').show();
    });

     jQuery('a.closeBtn').live("click", function() {
        jQuery('.moreButtonpopup').hide();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.accountButton').hide();
    });
    jQuery('#holecodemoreinfo').live("click", function() {
        jQuery(this).parent().find('.holdCodeMoreInfo').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.holdCodeMoreInfo').hide();
    });
    jQuery('#billingCodesinfo').live("click", function() {
        jQuery(this).parent().find('.billingCodesMoreInfo').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.billingCodesMoreInfo').hide();
    });
    jQuery('#delveryCodesinfo').live("click", function() {
        jQuery(this).parent().find('.delveryCodesMoreInfo').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.delveryCodesMoreInfo').hide();
    });

    jQuery('img.productflag').live("click", function() {
        jQuery(this).parent().find('.flag_tip').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.flag_tip').hide();
    });


    var surl = URLPrefix($location)+"/ossui/v1/ex/orderheaderdetail/?oid=" + orderNo + "&pageId=1";
    //console.log(surl);
    var orderStatus = "";
    var comments = {};
    var commentstr = "";
    var comments_str = "";
    $scope.orderTypeFlag = false;
    
    var httpRequest = $http.get(surl).success(function(data, status) {
        //console.log(surl);
        $scope.cdCodeFlag = true;

        if (data.status=='S') {
            $scope.showDataFlag = false;
            $scope.orderHeader = data.header[0];
            var legacyOrderNo = data.header[0].oid;
            legacyOrder.setLegacyorderNo(legacyOrderNo);
            hpyOrderNumber.setHpOrderNo(data.header[0].hp_order_no);
            //console.log(data.header[0].hp_order_no);

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
                        comments_str += val + " : " + key + "\n\r";
                    }else{
                        comments_str += key + "\n\r";
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
            //Hiding the shipment tab based condition SW/HW
            if(data.header[0].om_system == "NGOM-SW"){
                $scope.orderTypeFlag = true;
            }else{
                $scope.orderTypeFlag = false;
            }
        } else {
            $scope.showDataFlag = true;
            $scope.errorFlag = data.message;
        }
    }).error(function(data, status) {
               /* console.log('error');
                console.log(JSON.stringify(data));
                console.log('status');
                console.log(status);*/
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
        $scope.backToSummary =function(){
        var searchObj = searchObject.getSearchObject()
        $scope.hpOrderNo = searchObj.hpOrderNo;
        $scope.poNo = searchObj.custPoNo;
        $scope.shipmentNo = searchObj.shipmentNo;
        $scope.orderStatusSelected = searchObj.status;
        $scope.attentionTo = searchObj.attTo;
        var searchData = {
                "hpOrderNo" :$scope.hpOrderNo,
                "custPoNo":$scope.poNo,
                "shipNo":$scope.shipmentNo,
                "attTo":$scope.attentionTo,
                "status":$scope.orderStatusSelected,
                "custId":undefined,
                "custName":undefined,
                "poDateFrom":undefined,
                "poDateTo":undefined,
                "recentOrders":undefined,
                "invoiceNo":undefined,
                "prodLine":undefined,
                "refContract":undefined,
                "product":undefined,
                "cProduct":undefined,
                "changedSince":undefined,
                "ordDateFrom":undefined,
                "ordDateTo":undefined,
                "shipDateFrom":undefined,
                "shipDateTo":undefined,
                "delvDateFrom":undefined,
                "delvDateTo":undefined,
                "crdDateFrom":undefined,
                "crdDateTo":undefined,
                "shipZip":undefined,
                "pagent":undefined,
                "soldTo":undefined,
                "shipTo":undefined,
                "billTo":undefined,
                "shipC":undefined,
                "shipS":undefined
            }
            //console.log(searchData);
            searchObject.setSearchObject(searchData);
            $rootScope.$broadcast('summarySearchData', searchData);
            url = "#/ex/orderSummary";
            jQuery(location).attr("href", url);
        }

}
orderHeaderCtrl.$inject = ['$scope', '$http', '$routeParams', '$location', 'pageTitle','legacyOrder','searchObject','$rootScope','hpyOrderNumber','legacyOrderNumber']; //end of order detail header controller

/* get line item details for order in order detail page */

function lineItemListCtrl($scope, $filter, $http, $routeParams, $rootScope, $location,$compile,hpyOrderNumber) {
    var orderNo = $routeParams.orderNo;
    var hostAddr = $location.host()+":"+$location.port();
    $scope.productCharsColumnNames= [{
            'id': "charac_id",
            'value': "Product ID",
        },{
            'id': "charac_id_descr",
            'value': "Product Description",
        },{
            'id': "charac_value",
            'value': "Product Value",
        },{
            'id': "charac_value_descr",
            'value': "Product Value Description",
        },{
            'id': "charac_line",
            'value': "Product Character Line",
        }];
    /* display column names for line items in order detail page */
    $scope.lineItemsColumnNames = [{
            'id': "exCol",
            'value': "",
            "sort": "false"
        },
        {
        'id': "itemSubItem",
            'value': "Item",
            "sort": "false"
        }, {
            'id': 'product',
            'value': 'Product',
            "sort": "false"
        },{
            'id': 'config_id',
            'value': 'Config Id',
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
            'id': 'hpDeliveryNo',
            'value': 'HP Delivery#',
            "sort": "false"
        }, {
            'id': 'dealId',
            'value': 'Deal ID/Price ID',
            "sort": "false"
        }, {
            'id': 'bundlePrice',
            'value': 'Bundle Price',
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
        }, {
            'id': 'entitlement_id',
            'value': 'Entitlement ID',
            "sort": "false"
        }, {
            'id': 'billing_plan',
            'value': 'Billing Plan',
            "sort": "false"
        }, {
            'id': 'factory_shipped_date',
            'value': 'Factory Shipped Date',
            "sort": "false"
        }, {
            'id': 'actual_customer_ship_date',
            'value': 'Actual Customer Ship Date',
            "sort": "false"
        }
    ];
    
    $scope.lineItemsWithProductColumnNames = [{
            'id': "exCol",
            'value': "",
            "sort": "false"
        },
        {
            'id': "exCol",
            'value': "",
            "sort": "false"
        },
        {
        'id': "itemSubItem",
            'value': "Item",
            "sort": "false"
        }, {
            'id': 'product',
            'value': 'Product',
            "sort": "false"
        },{
            'id': 'config_id',
            'value': 'Config Id',
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
            'id': 'hpDeliveryNo',
            'value': 'HP Delivery#',
            "sort": "false"
        }, {
            'id': 'dealId',
            'value': 'Deal ID/Price ID',
            "sort": "false"
        }, {
            'id': 'bundlePrice',
            'value': 'Bundle Price',
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
            'id': 'itemCanceledOn',
            'value': 'Item Canceled Date',
            "sort": "false"
        }, {
            'id': 'scCommitDate',
            'value': 'SC Commit Date',
            "sort": "false"
        }, {
            'id': 'entitlement_id',
            'value': 'Entitlement ID',
            "sort": "false"
        }, {
            'id': 'billing_plan',
            'value': 'Billing Plan',
            "sort": "false"
        }, {
            'id': 'factory_shipped_date',
            'value': 'Factory Shipped Date',
            "sort": "false"
        }, {
            'id': 'actual_customer_ship_date',
            'value': 'Actual Customer Ship Date',
            "sort": "false"
        }, {
            'id': 'last_price_date',
            'value': 'Last Price Date',
            "sort": "false"
        }
    ];
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
    jQuery('.udf_details').live("click", function() {
        jQuery(this).parent().find('.udfDetails').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.udfDetails').hide();
    });
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var surl = URLPrefix($location) + "/ossui/v1/ex/newitemdetail?oid="+$routeParams.orderNo;
    var items = {
        data: []
    };
    $scope.showNonBundle=false;
    $http.get(surl).success(function(data, status) {
        jQuery("#loader, #overlay").hide();
        var bundleitemscontent = {
                    data: []
                };
        $scope.bundleitemsdataoption = {};
        $scope.bundleItems = {};
        $scope.bundlePrices = {};
        var keyMap = [];
        var bundleNames=[];
        var lineItemBundles = {};
        var showBundleKey = true;

        angular.forEach(data.data, function(key,bundleNonBundlearray){
            if(bundleNonBundlearray == "NoBundle_total_price"){
                $scope.NoBundleTotalPrice = key;
            }
            var bundleprice = bundleNonBundlearray;
            var patt = /_total_price/g;
            var result = patt.test(bundleNonBundlearray);
            $scope.showBundleDetails = function(name){
                var patt = /_total_price/g;
                var result1 = patt.test(name);
                    if(name == "NoBundle" || name == "NoBundle_total_price" || result1 ==true){
                        return false;
                    }else{
                        return true;
                        }
                }
            if(bundleNonBundlearray!="NoBundle" && bundleNonBundlearray!= "NoBundle_total_price" && result!=true){
                $scope.BundleItems = data.data;
                showBundleKey = true;
                bundleitemscontent.data = [];
                var groups = {};
                angular.forEach($scope.BundleItems[bundleNonBundlearray], function(item,i) {
                    var level = item.higher_level;
                    if(groups[level]) {
                        groups[level].push(item.item_subitem);
                    } else {
                        groups[item.higher_level] = [item.item_subitem];
                    }
                });
                $scope.bundleGroups = groups;
                angular.forEach(groups, function(item,i) {
                    if(i!=0){
                        $scope["bundleChildItem"+i]=true;
                    }
                });
                $scope.showBundelProductCharFlag = "false";
                var showProductCharCount = 0;
                angular.forEach(key,function(attr,key1){
                    var counter1=0;
                    var bundlePrice = data.data[bundleNonBundlearray+"_total_price"];
                    if (bundleNames.indexOf(bundleNonBundlearray) > -1){
                            showBundleKey = false;
                        }
                        bundleNames.push(bundleNonBundlearray);
                    if(attr.higher_level == "0"){
                        keyMap.push(attr.item_subitem);
                        }
                    var counter1 = 0;
                    var entitlement_id = "";
                    var billing_plan = "";
                    var factory_shipped_date = "";
                    var actual_customer_ship_date = "";
                    var udf_text = "";
                    var udfTextFlag = false;
                    if(attr.hasOwnProperty("product_chars") == true){
                        showProductCharCount++;
                        showBundleProductCharFlag = false;
                    }else{
                        showBundleProductCharFlag = true;
                    }
                    if(attr.hasOwnProperty("udf_text") == true){
                        if(attr.udf_text!="" || attr.udf_text!=null){
                            udfTextFlag = true;
                            udf_text = attr.udf_text;
                        }else{
                            udf_text = "";
                            udfTextFlag = false;
                        }
                    }else{
                        udfTextFlag = false;
                    }
                    if(attr.entitlement_id == "null"){
                        entitlement_id = "";
                    }else{
                        entitlement_id = attr.entitlement_id;
                    }
                    if(attr.billing_plan == "null"){
                        billing_plan = "";
                    }else{
                        billing_plan = attr.billing_plan;
                    }
                    $filter('filter')(attr.sched_Line, function(subAttr) {
                        var holdCode = false;
                        if(subAttr.hasOwnProperty("Hold_Codes") == true){
                            if(subAttr.Hold_Codes.length > 0){
                                holdCode = true;
                            }else{
                                holdCode = false;
                                }
                        }else{
                            holdCode = false;
                        }
                        if(subAttr.factory_shipped_date == "null"){
                            factory_shipped_date = "";
                        }else{
                            factory_shipped_date = subAttr.factory_shipped_date;
                        }
                        if(subAttr.actual_customer_ship_date == "null"){
                            actual_customer_ship_date = "";
                        }else{
                            actual_customer_ship_date = subAttr.actual_customer_ship_date;
                        }
                        var showItemtab =(counter1 == 0) ? true : false;
                        lineItemBundles =
                            {
                                'bundlekey':bundleNonBundlearray,
                                'bundlePrice': attr.bundle_price,
                                'showItemcontent':showItemtab,
                                'level_indent': attr.level_indent,
                                'itemSubItem': attr.item_subitem,
                                'product': attr.product_no,
                                'configId': attr.config_id,
                                'itemStatus': subAttr.status,
                                'productDescr': attr.description,
                                'openQty': attr.order_qty,
                                'shippedQty': subAttr.qty,
                                'hpDeliveryNo' : attr.hpdeliveryno,
                                'dealId': attr.deal_id,
                                'plannedDeliveryDate': subAttr.planned_delivery_date,
                                'actualDeliveryDate': subAttr.actual_delivery_date,
                                'plannedShipDate': subAttr.planned_ship_date,
                                'actualShipDate': subAttr.actual_ship_date,
                                'shipmentNo': subAttr.shipment_no,
                                'invoiceNo': subAttr.invoice_no,
                                'invoiceDate': subAttr.inv_date,
                                'shipDate': subAttr.ship_date,
                                'requestedDate': attr.request_date,
                                'holdCode': holdCode,
                                'fullInvoiceNo': attr.full_invoice_no,
                                'holdItems': subAttr.Hold_Codes,
                                'hpdeliveryno' : subAttr.hpdeliveryno,
                                'system': attr.system,
                                'cancellationReason':attr.cancellation_reason,
                                'higherLevel': attr.higher_level,
                                'productCharacteristics': attr.product_chars,
                                'scCommitDate':attr.sc_commit_date,
                                'entitlementID':entitlement_id,
                                'billingPlan':billing_plan,
                                'factShippedDate':factory_shipped_date,
                                'actualCustShipDate':actual_customer_ship_date,
                                'udfText':udf_text,
                                'udfTextFlag':udfTextFlag,
                                'showBundleKey':showBundleKey,
                                'showBundleProductCharFlag':showBundleProductCharFlag,
                                'legacyorderno':orderNo
                            };
                        });
                        if(showBundleKey == true){
                                bundleitemscontent.data[(bundleitemscontent.data.length)] = lineItemBundles;
                                $scope.bundleItems[bundleNonBundlearray]=lineItemBundles;
                            }else{
                                bundleitemscontent.data[(bundleitemscontent.data.length)++] = lineItemBundles;
                                $scope.bundleItems[bundleNonBundlearray]=bundleitemscontent.data;
                            }
                    });
                    if(showProductCharCount >= 1){
                        $scope.showBundelProductCharFlag = "true";
                    }else{
                        $scope.showBundelProductCharFlag = "false";
                    }
                    $scope.bundlePrice = data.data[bundleNonBundlearray+"_total_price"];
                    $scope.bundlePrices[bundleNonBundlearray] = $scope.bundlePrice;
                    if($scope.bundlePrice!=undefined){
                            $scope.showbundlePrice = "true";
                        }else{
                            $scope.showbundlePrice = "false";
                        }
                }
        });
        $scope.showBundleChildElements = function(panelName,level,showBundleIndex,mode)
        {
            $scope[panelName] = !$scope[panelName];
            $scope[showBundleIndex] = !$scope[showBundleIndex];
            if (mode) {
                if (mode == 'e') {
                    $scope[panelName] = true;
                } else {
                    $scope[panelName] = false;
                }
            }
            if ($scope[panelName]) {
                var deliveryGroupscls = "#bundleChild"+level;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
                var childElements = $scope.bundleGroups[level];
                angular.forEach(childElements,function(key,value){
                        $scope["bundleChildItem"+key]=true;
                        var childItem = "#bundleChild"+key;
                        $scope.el1 = $compile(childItem)($scope);
                        $scope.el1.removeClass("expandImg expCloseImgDiv");
                        $scope.el1.addClass("collapseImg expCloseImgDiv");
                    });
                var showBundlecls = "#"+showBundleIndex;
                $scope.el2 = $compile(showBundlecls)($scope);
                $scope.el2.removeClass("expandImg expCloseImgDiv");
                $scope.el2.addClass("collapseImg expCloseImgDiv");

            }else{
                var deliveryGroupscls = "#bundleChild"+level;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("collapseImg expCloseImgDiv");
                $scope.el.addClass("expandImg expCloseImgDiv");
                var showBundlecls = "#"+showBundleIndex;
                $scope.el2 = $compile(showBundlecls)($scope);
                $scope.el2.removeClass("collapseImg expCloseImgDiv");
                $scope.el2.addClass("expandImg expCloseImgDiv");
            }
        }
        $scope.showBundleImage = function(itemVal,bundleName)
        {
            var groups = {};
            angular.forEach($scope.BundleItems[bundleName], function(item,i) {
                var level = item.higher_level;
                if(groups[level]) {
                    groups[level].push(item.item_subitem);
                } else {
                    groups[item.higher_level] = [item.item_subitem];
                }
            });
            if(groups[itemVal]!=undefined){
                    if(groups[itemVal].length > 0){
                        return true;
                    }
                }
                else{
                    return false;
                }
        }
        $scope.showBundleItems = function(val)
        {
                if(val.length == undefined){
                    return false;
                }else{
                    return true;
                    }
        };
        $scope.lineItemColpseExpand = function(panelName, mode)
        {
            $scope[panelName] = !$scope[panelName];
            if (mode) {
                if (mode == 'e') {
                    $scope[panelName] = true;
                } else {
                    $scope[panelName] = false;
                }
            }
            if ($scope[panelName]) {
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("collapseImg expCloseImgDiv");
                $scope.el.addClass("expandImg expCloseImgDiv");
            } else {
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
            }
        }
        $scope.noBundleItems = data.data.NoBundle;
        $scope.groupItems = "";
        if(data.data.NoBundle.length > 0) {
            $scope.showNonBundle=true;
            var groups = {};
            angular.forEach(data.data.NoBundle, function(item,i) {
                var level = item.higher_level;
                if(groups[level]) {
                    groups[level].push(item.item_subitem);
                } else {
                    groups[item.higher_level] = [item.item_subitem];
                }
            });
            $scope.groupItems = groups;
            angular.forEach(groups, function(item,i) {
                if(i!=0){
                $scope["childItem"+i]=true;
                }
            });
            var showProductCharCnt=0;
            $filter('filter')(data.data.NoBundle, function(attr) {
                var counter = 0;
                var entitlement_id = "";
                var billing_plan = "";
                var factory_shipped_date = "";
                var actual_customer_ship_date = "";
                var udf_text = "";
                var udfTextFlag = false;
                $scope.nonBundleCurrency = data.data.NoBundle[0].currency;
                $scope.showProductCharFlag = false;
                if(attr.hasOwnProperty("product_chars") == true){
                    showProductCharCnt++;
                    showProductCharFlag = false;
                }else{
                    showProductCharFlag = true;
                }
                if(attr.hasOwnProperty("udf_text") == true){
                    if(attr.udf_text!="" || attr.udf_text!=null){
                        udfTextFlag = true;
                        udf_text = attr.udf_text;
                    }else{
                        udf_text = "";
                        udfTextFlag = false;
                    }
                }else{
                    udfTextFlag = false;
                }
                if(attr.entitlement_id == "null"){
                    entitlement_id = "";
                }else{
                    entitlement_id = attr.entitlement_id;
                }
                if(attr.billing_plan == "null"){
                    billing_plan = "";
                }else{
                    billing_plan = attr.billing_plan;
                }
                $filter('filter')(attr.sched_Line, function(subAttr) {
                    var nonBundleHoldCode = false;
                    if(subAttr.hasOwnProperty("Hold_Codes") == true){
                        if(subAttr.Hold_Codes.length > 0){
                            nonBundleHoldCode = true;
                        }else{
                            nonBundleHoldCode = false;
                        }
                    }else{
                        nonBundleHoldCode = false;
                    }
                    if(subAttr.factory_shipped_date == "null"){
                            factory_shipped_date = "";
                    }else{
                        factory_shipped_date = subAttr.factory_shipped_date;
                    }
                    if(subAttr.actual_customer_ship_date == "null"){
                        actual_customer_ship_date = "";
                    }else{
                        actual_customer_ship_date = subAttr.actual_customer_ship_date;
                    }
                    var showItem = (counter == 0) ? true : false;
                    var lineItemNonBundles = {
                            'showItem':showItem,
                            'itemSubItem': attr.item_subitem,
                            'level_indent': attr.level_indent,
                            'product': attr.product_no,
                            'configId': attr.config_id,
                            'itemStatus': subAttr.status,
                            'productDescr': attr.description,
                            'openQty': attr.order_qty,
                            'shippedQty': subAttr.qty,
                            'hpDeliveryNo' : attr.hpdeliveryno,
                            'dealId': attr.deal_id,
                            'bundlePrice': attr.bundle_price,
                            'plannedDeliveryDate': subAttr.planned_delivery_date,
                            'actualDeliveryDate': subAttr.actual_delivery_date,
                            'plannedShipDate': subAttr.planned_ship_date,
                            'actualShipDate': subAttr.actual_ship_date,
                            'shipmentNo': subAttr.shipment_no,
                            'invoiceNo': subAttr.invoice_no,
                            'invoiceDate': subAttr.inv_date,
                            'shipDate': subAttr.ship_date,
                            'requestedDate': attr.request_date,
                            'nonBundleHoldCode': nonBundleHoldCode,
                            'fullInvoiceNo': attr.full_invoice_no,
                            'holdItems': subAttr.Hold_Codes,
                            'hpdeliveryno' : subAttr.hpdeliveryno,
                            'system': attr.system,
                            'cancellationReason':attr.cancellation_reason,
                            'higherLevel': attr.higher_level,
                            'productCharacteristics': attr.product_chars,
                            'scCommitDate':attr.sc_commit_date,
                            'billingPlan':billing_plan,
                            'entitlementID':entitlement_id,
                            'factShippedDate':factory_shipped_date,
                            'actualCustShipDate':actual_customer_ship_date,
                            'udfText':udf_text,
                            'udfTextFlag':udfTextFlag,
                            'showProductCharFlag':showProductCharFlag,
                            'legacyorderno':orderNo
                        };
                        counter++;
                        items.data[(items.data.length)++] = lineItemNonBundles;
                });

            });
            if(showProductCharCnt >= 1){
                $scope.showProductCharFlag = "true";
            }else{
                $scope.showProductCharFlag = "false";
            }
        }
    });
    $scope.showChildElements = function(panelName,level, mode){
        $scope[panelName] = !$scope[panelName];
        if (mode) {
            if (mode == 'e') {
                $scope[panelName] = true;
            } else {
                $scope[panelName] = false;
            }
        }
        if ($scope[panelName]) {
            var deliveryGroupscls = "#child"+level;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
            var childElements = $scope.groupItems[level];
            angular.forEach(childElements,function(key,value){
                    $scope["childItem"+key]=true;
                    var childItem = "#child"+key;
                    $scope.el1 = $compile(childItem)($scope);
                    $scope.el1.removeClass("expandImg expCloseImgDiv");
                    $scope.el1.addClass("collapseImg expCloseImgDiv");
                });
        } else {
            var deliveryGroupscls = "#child"+level;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
        }
    }
    $scope.showImage = function(itemVal){
        var groups = {};
        angular.forEach($scope.noBundleItems, function(item,i) {
            var level = item.higher_level;
            if(groups[level]) {
                groups[level].push(item.item_subitem);
            } else {
                groups[item.higher_level] = [item.item_subitem];
            }
        });
        if(groups[itemVal]!=undefined){
                if(groups[itemVal].length > 0){
                    return true;
                }
            }
            else{
                return false;
            }
    }
    $scope.showProductCharacteristics = function(prodchar){
        if(prodchar!=""){
            return true;
        }else{
            return false;
            }
    }
    $scope.nonBundleItems=items.data;
    $scope.showProductDetails = function(itemNo){
        var orderNo = $routeParams.orderNo;
        var productDetailsUrl = "#/ex/productDetails/"+orderNo+"/"+itemNo;
        window.open(productDetailsUrl, '_blank', 'width=1200,height=600,toolbar=0,location=0,menubar=0,status=0,title=0,scrollbars=yes,resizable=yes')
    }
    $scope.searchInvoice = function(invoiceNo, fullInvoiceNo, system) {
        var hpOrderNumber = hpyOrderNumber.getHpOrderNo();
        if (invoiceNo != "") {
            url = URLPrefix($location)+"/ossui/v1/ex/invoice?" + "order_no=" + hpOrderNumber + "&invoice_no=" +
                invoiceNo + "&full_invoice_no=" + fullInvoiceNo + "&data_source=" + system;
            jQuery(location).attr("href", url);
        }
    }
    /* navigating to shipment page from line item details */
    $scope.getShipmentDetails = function(hpdeliveryno,legacyNo) {
        if (hpdeliveryno != "") {
            var shipmenturl = "#/ex/shipmentInformation/" + hpdeliveryno+"/"+legacyNo;
            jQuery(location).attr("href", shipmenturl);
            //window.open(shipmenturl, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
        } else {
            alert("No shipments found");
        }
    } //end of navigating to shipment page
    
    $scope.showProductChars = function(panelName, mode,indexVal)
    {
        $scope[panelName] = !$scope[panelName];
        if (mode) {
            if (mode == 'e') {
                $scope[panelName] = true;
            } else {
                $scope[panelName] = false;
            }
        }
        if ($scope[panelName]) {
            $scope["showProductCharacteristics"+indexVal] = true;
            var deliveryGroupscls = "#"+panelName;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("productCollapseImg productExpCloseImgDiv");
            $scope.el.addClass("productExpandImg productExpCloseImgDiv");
            $scope.el.attr("title","Hide product characteristics");
        } else {
            $scope["showProductCharacteristics"+indexVal] = false;
            var deliveryGroupscls = "#"+panelName;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("productExpandImg productExpCloseImgDiv");
            $scope.el.addClass("productCollapseImg productExpCloseImgDiv");
            $scope.el.attr("title","Show product characteristics")
        }
    }
    $scope.showBundelProductChars = function(panelName, mode,indexVal,showBundleIndex)
    {
        $scope[showBundleIndex] = !$scope[showBundleIndex];
        $scope[panelName] = !$scope[panelName];
        if (mode) {
            if (mode == 'e') {
                $scope[panelName] = true;
            } else {
                $scope[panelName] = false;
            }
        }
        if ($scope[panelName]) {
            $scope["showBundleProductCharacteristics"+indexVal] = true;
            var deliveryGroupscls = "#"+panelName;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("productCollapseImg productExpCloseImgDiv");
            $scope.el.addClass("productExpandImg productExpCloseImgDiv");
            $scope.el.attr("title","Hide product characteristics");
        } else {
            $scope["showBundleProductCharacteristics"+indexVal] = false;
            var deliveryGroupscls = "#"+panelName;
            $scope.el = $compile(deliveryGroupscls)($scope);
            $scope.el.removeClass("productExpandImg productExpCloseImgDiv");
            $scope.el.addClass("productCollapseImg productExpCloseImgDiv");
            $scope.el.attr("title","Show product characteristics")
        }
    }
}
lineItemListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location','$compile','hpyOrderNumber'];
//end of line items for order

/* get shipment information from shipmentDetailRoute service */

function trackingListCtrl($scope, $http, $routeParams, $rootScope, $location,legacyOrderNumber) {
    var hpdeliveryno = $routeParams.hpdeliveryno;
    $scope.showColSort = function() {};
    if (hpdeliveryno && hpdeliveryno != "") {
        var surl = URLPrefix($location)+"/ossui/v1/ex/shipmentdetail/" + hpdeliveryno;
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
           /* console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
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

        if (tat_url != "") {
            var trackAndTraceFlag =confirm("You are about to leave HP's website!\nHP is not responsible for information outside the HP website.");
            if (trackAndTraceFlag==true){
                window.open(tat_url, '_blank', 'width=700,height=500,toolbar=0,location=0,menubar=0')
            }
        }
    } // end of track and trace

    $scope.displayCarrier= function(carrierWebSite) {
        if(carrierWebSite != "") {
            var carrierFlag =confirm("You are about to leave HP's website!\nHP is not responsible for information outside the HP website.");
            if (carrierFlag=true) {
                window.open(carrierWebSite,'_blank','width=700,height=500,toolbar=0,location=0,menubar=0')
            }
        }
    }
}
trackingListCtrl.$inject = ['$scope', '$http', '$routeParams', '$rootScope', '$location','legacyOrderNumber'];

/* get shipment header details */

function shipmentHeaderCtrl($scope,$routeParams,pageTitle,legacyOrderNumber) {
    pageTitle.setTitle('Shipment Detail');
    $scope.addOneFlag = false;
    $scope.addTwoFlag = false;
    $scope.addThreeFlag = false;
    $scope.addFourFlag = false;
    $scope.addFiveFlag = false;
    $scope.addSixFlag = false;
    $scope.addSevenFlag = false;
    $scope.multiOrderFlag=false;
    var legacyNo=$routeParams.legacyNo;
    $scope.$on('shipmentHeader', function(events, data) {
        if (data.data != "") {
            $scope.items = data.data.header;
            if(data.data.header.length > 1){
                $scope.multiOrders={};
                $scope.multiOrderFlag=true;
                $scope.mOrders=legacyNo;
                $scope.multiOrderSelected=$scope.mOrders;
                angular.forEach(data.data.header,function(key,value) {
                   $scope.orderValue=key.hp_order_no;
                   $scope.legacyOrderValue=key.legacy_order_no
                   $scope.multiOrders[$scope.orderValue]=$scope.legacyOrderValue;
                });

            } else{
                $scope.multiOrderFlag=false;
            }
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
shipmentHeaderCtrl.$inject = ['$scope', '$routeParams','pageTitle','legacyOrderNumber']; //end of shipment header details

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

function homeCtrl($scope, $location, $routeParams, $http, pageTitle, $rootScope, searchObject) {
    $scope.recentOrders = "";
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
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
                jQuery('#orderFromDp, #orderToDp').datepicker('disable');
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
        $scope.hpOrderNo = undefined;
        $scope.custPoNo = undefined;
        $scope.shipmentNo = undefined;
        $scope.custId = undefined;
        $scope.custName = undefined;
        $scope.status = undefined;
        $scope.poDateFrom = undefined;
        $scope.poDateTo = undefined;
        $scope.recentOrders = undefined;
        if (order.hasOwnProperty("orderNoFor") == false && order.orderNo != undefined) {
            $scope.hpOrderNo = order.orderNo;
        }
        if (order.hasOwnProperty("customerNameNoFor") == false && order.customer != undefined) {
            $scope.custId = order.customer;
        }
        if(order.hasOwnProperty("orderNoFor") == true && order.hasOwnProperty("customerNameNoFor")  == true){
            if(order.orderNoFor == "OR"){
                 $scope.hpOrderNo = order.orderNo;
            }else if(order.orderNoFor == "PO"){
                $scope.custPoNo= order.orderNo;
            }else if(order.orderNoFor == "SH"){
                $scope.shipmentNo= order.orderNo;
            }if(order.customerNameNoFor == "custname"){
                $scope.custName= order.customer;
            }else if(order.customerNameNoFor == "custno"){
                $scope.custId= order.customer;
            }
            $scope.status= order.status;
            $scope.poDateFrom= order.orderFromDp;
            $scope.poDateTo= order.orderToDp;
            $scope.recentOrders= order.recentOrders;
        }
        else if(order.hasOwnProperty("orderNoFor") == true){
            if(order.orderNoFor == "OR"){
                 $scope.hpOrderNo = order.orderNo;
            }else if(order.orderNoFor == "PO"){
                $scope.custPoNo= order.orderNo;
            }else if(order.orderNoFor == "SH"){
                $scope.shipmentNo= order.orderNo;
            }
            $scope.status= order.status;
            $scope.poDateFrom= order.orderFromDp;
            $scope.poDateTo= order.orderToDp;
            $scope.recentOrders= order.recentOrders;
        }else if(order.hasOwnProperty("customerNameNoFor")  == true ){
            if(order.customerNameNoFor == "custname"){
                $scope.custName= order.customer;
            }else if(order.customerNameNoFor == "custno"){
                $scope.custId= order.customer;
            }
            $scope.status= order.status;
            $scope.poDateFrom= order.orderFromDp;
            $scope.poDateTo= order.orderToDp;
            $scope.recentOrders= order.recentOrders;
        }
        else{
            $scope.status= order.status;
            $scope.poDateFrom= order.orderFromDp;
            $scope.poDateTo= order.orderToDp;
            $scope.recentOrders= order.recentOrders;
        }
        if($scope.poDateFrom != undefined){
            if($scope.poDateFrom != ""){
                var poDateFrom = dateConversion($scope.poDateFrom);
            }
        }
        if($scope.poDateTo != undefined){
            if($scope.poDateTo != ""){
                var poDateTo = dateConversion($scope.poDateTo);
            }
        }
        var searchData = {
            "hpOrderNo" :$scope.hpOrderNo,
            "custPoNo":$scope.custPoNo,
            "custId":$scope.custId,
            "custName":$scope.custName,
            "shipNo":$scope.shipmentNo,
            "status":$scope.status,
            "poDateFrom":poDateFrom,
            "poDateTo":poDateTo,
            "recentOrders":$scope.recentOrders
        }

        searchObject.setSearchObject(searchData);
        url = "#/ex/orderSummary";
        jQuery(location).attr("href", url);
    }
    $scope.searchUser = function() {
        url = "#/viewReports";
        jQuery(location).attr("href", url);
    }
}
homeCtrl.$inject = ['$scope', '$location', '$routeParams', '$http', 'pageTitle', '$rootScope','searchObject'];

function refineSearchCtrl($scope, $location, $routeParams, $http, $rootScope,createDialog,searchObject) {
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var searchObj = searchObject.getSearchObject();
    $scope.hpOrderNo = searchObj.hpOrderNo;
    $scope.poNo = searchObj.custPoNo;
    $scope.shipmentNo = searchObj.shipmentNo;
    $scope.orderFromDp = searchObj.poDateFrom;
    $scope.orderToDp = searchObj.poDateTo;
    $scope.customer = searchObj.custId;
    $scope.customerName = searchObj.custName;
    $scope.attentionTo = searchObj.attTo;

    $scope.getHelp = function(text){
        if(text=="status"){
            var helpURL =  "#/ex/status";
        } else {
            return false;
        }
        window.open(helpURL,'_blank','width=800,height=500,toolbar=0,location=0,menubar=0');
    }

    var fieldsUrl = URLPrefix($location) + "/ossui/v1/ex/advanceSearchFields";
    jQuery("#loader, #overlay").show();
    $http.get(fieldsUrl).success(function(data, status) {
        if(searchObj == undefined || searchObj == ""){
            jQuery("#loader, #overlay").hide();
        }
        $scope.orderStatus = [];
        angular.forEach(data.data.fields.OrderStatus,function(name,val){
                var osObj = {
                "name": name,
                "val": val
            };
            if(typeof osObj.name != "object") {
                $scope.orderStatus.push(osObj);
                if(osObj.val == searchObj.status){
                    $scope.orderStatusSearch=osObj.val;
                }
            }
        });
        $scope.shipInvStatusList = [];
        $scope.cumulativeStatusList = [];
        angular.forEach(data.data.fields.OrderStatus.ShipInvoiceStatus,function(name,val){
                var osObj = {
                "name": name,
                "val": val
            };
            $scope.shipInvStatusList.push(osObj);
        });
        angular.forEach(data.data.fields.OrderStatus.CumulativeStatus,function(name,val){
                var osObj = {
                "name": name,
                "val": val
            };
            $scope.cumulativeStatusList.push(osObj);
        });

    //Advanced Search fetch start
    $scope.searchRefContract={};
    $scope.rowCountRef=1;
    $scope.defaultRef="quote";
    $scope.searchRefContract['searchName0']= $scope.defaultRef;
    $scope.refContract=data.data.fields.RefContract;
    $scope.SearchbyLocation =   data.data.fields.ShipToRegionState;

    $scope.countryCodes={};
    angular.forEach(Object.keys($scope.SearchbyLocation),function(countryCode) {
        $scope.countryCodes[countryCode]=$scope.SearchbyLocation[countryCode]["country"];
    });
    $scope.shipToCountry=function(){
        $scope.shipS="";
    }
    $scope.searhByProdLine = function(){
        $scope.prodList=[];
        $scope.data = data.data.fields.ProductLines;
        if($scope.data.length !=0) {
            angular.forEach($scope.data,function(name,val){
                if(val!="$$hashKey"){
                    var prodObj = {
                        "name": name,
                        "val": val
                    };
                    $scope.prodList.push(prodObj);
                }
            });
            createDialog('partials/searchbyProdLines.html', {
                id: 'prodList',
                backdrop: true,
                scope:$scope,
                success: {label: 'Success', fn: function() {
                    $scope.prodLine = this.prodLine;
                }}
            });
        } else {
            alert("Product Lines are not Found");
        }
    }

    $scope.searchByCountry=function(){
        $scope.locList=[];
        $scope.data = data.data.fields.ShipToCountry;
        if($scope.data.length !=undefined) {
            angular.forEach($scope.data,function(name,val){
                if(val!="$$hashKey"){
                    var payObj = {
                        "name": name,
                        "val": val
                    };
                    $scope.locList.push(payObj);
                }
            });
            createDialog('partials/searchByProductLines.html', {
                id: 'locList',
                backdrop: true,
                scope:$scope,
                success: {label: 'Success', fn: function() {
                    $scope.shipC = this.shipC;
                }}
            });
        } else {
            $scope.shipC="";
        }

    }

    $scope.searchByShipRegion = function(scope){
        if($scope.shipC !=undefined && $scope.shipC !=""){
            $scope.shipRegion="";
            $scope.data   = data.data.fields.ShipToRegionState[$scope.shipC];
            angular.forEach($scope.data,function(key,val){
                $scope.statesList=key;
            });
            createDialog('partials/searchbyStates.html', {
                id: 'statList',
                backdrop: true,
                scope:$scope,
                success: {label: 'Success', fn: function() {
                    $scope.shipS=this.shipS;
                    //$scope.shipC=$scope.shipS;
                }}
            });
        } else {
            $scope.shipS="";
            alert("Please select ShipToCountry to continue");
        }
    }
    //Advanced Search fetch end

    $scope.$on('dataflag', function(events, data) {
        $scope.dataflag = data;
    });
    $scope.reSet = function() {
        $scope.hpOrderNo = undefined;
        $scope.poNo = undefined;
        $scope.shipmentNo = undefined;
        $scope.attentionTo = undefined;
        $scope.orderStatusSelected = [];
        $scope.invoiceNo = undefined;
        $scope.cProduct = undefined;
        $scope.product = undefined;
        $scope.changedSince = undefined;
        $scope.searchRefContract.searchNum0 = undefined;
        $scope.orderStartDate = undefined;
        $scope.orderEndDate = undefined;
        $scope.orderFromDp = undefined;
        $scope.delvEnd = undefined;
        $scope.shipStartDate = undefined;
        $scope.shipEndDate = undefined;
        $scope.reqStart = undefined;
        $scope.reqEnd = undefined;
        $scope.pagent = undefined;
        $scope.shipC = undefined;
        $scope.shipZip = undefined;
        $scope.soldToId = undefined;
        $scope.shipS = [];
        $scope.prodLine = undefined;
        $scope.billToId = undefined;
    }
    $scope.checkNumeric = function(selectedValue){
        if (!(isNaN(selectedValue)) && selectedValue <=99){
            return true;
        } else {
            alert('Changed since must be numeric and must not exceed 99 !');
            return false;
        }
    }
    $scope.isRSFormValid = function() {
        var fromDate = new Date($("#orderFromDp").val());
        var toDate = new Date($("#orderToDp").val());

        if(jQuery('#changedSince').val() !="") {
            var selectedVal=jQuery('#changedSince').val();
            if($scope.checkNumeric(selectedVal)==true){
                $scope.searchOrder();
            }
        } else if (jQuery('#refSearchFrom input[value!=""]').length > 0) {
            jQuery(".error").slideUp(500);
            $scope.searchOrder();
        }
        else if(jQuery('#orderStatusSelected').length > 0){
            if(jQuery("#hpOrderNo").val() != "" || jQuery("#poNo").val() != "" || jQuery("#shipmentNo").val() != ""){
                jQuery(".error").slideUp(500);
                $scope.searchOrder();
            }
            else{
                jQuery(".error").html('Please enter at least one of these search criteria :&nbsp HP Order#,&nbsp PO#,&nbsp Shipment#');
                jQuery(".error").slideDown(500);
            }
        }
        else {
            jQuery(".error").html('Please enter at least one search criteria.');
            jQuery(".error").slideDown(500);
        }
    }

        $scope.searchOrder = function() {
            if(jQuery("#searchNum0").val() != undefined){
                $scope.selectedContract=$scope.getSearchDates($scope.searchRefContract,2);
            }
            if($scope.orderStartDate != undefined){
                if($scope.orderStartDate != ""){
                    var orderStartDate = dateConversion($scope.orderStartDate);
                }
            }
            if($scope.orderEndDate != undefined){
                if($scope.orderEndDate != ""){
                    var orderEndDate = dateConversion($scope.orderEndDate);
                }
            }
            if($scope.shipStartDate != undefined){
                if($scope.shipStartDate != ""){
                    var shipStartDate = dateConversion($scope.shipStartDate);
                }
            }
            if($scope.shipEndDate != undefined){
                if($scope.shipEndDate != ""){
                    var shipEndDate = dateConversion($scope.shipEndDate);
                }
            }
            if($scope.delvStart != undefined){
                if($scope.delvStart != ""){
                    var delvStart = dateConversion($scope.delvStart);
                }
            }
            if($scope.delvEnd != undefined){
                if($scope.delvEnd != ""){
                    var delvEnd = dateConversion($scope.delvEnd);
                }
            }
            if($scope.reqStart != undefined){
                if($scope.reqStart != ""){
                    var reqStart = dateConversion($scope.reqStart);
                }
            }
            if($scope.reqEnd != undefined){
                if($scope.reqEnd != ""){
                    var reqEnd = dateConversion($scope.reqEnd);
                }
            }
            var searchData = {
                "hpOrderNo" :$scope.hpOrderNo,
                "custPoNo":$scope.poNo,
                "shipNo":$scope.shipmentNo,
                "attTo":$scope.attentionTo,
                "status":$scope.orderStatusSelected,
                "custId":undefined,
                "custName":undefined,
                "recentOrders":undefined,
                "invoiceNo":$scope.invoiceNo,
                "prodLine":$scope.prodLine,
                "refContract":$scope.selectedContract,
                "product":$scope.product,
                "cProduct":$scope.cProduct,
                "changedSince":$scope.changedSince,
                "poDateFrom":$scope.orderStartDate,
                "poDateTo":$scope.orderEndDate,
                "shipDateFrom":$scope.shipStartDate,
                "shipDateTo":$scope.shipEndDate,
                "delvDateFrom":$scope.delvStart,
                "delvDateTo":$scope.delvEnd,
                "crdDateFrom":$scope.reqStart,
                "crdDateTo":$scope.reqEnd,
                "shipZip":$scope.shipZip,
                "pagent":$scope.pagent,
                "soldTo":$scope.soldToId,
                "shipTo":$scope.shipToId,
                "billTo":$scope.billToId,
                "shipC":$scope.shipC,
                "shipS":$scope.shipS
            }
            //console.log(searchData);
            searchObject.setSearchObject(searchData);
            $rootScope.$broadcast('summarySearchData', searchData);
            url = "#/ex/orderSummary";
            jQuery(location).attr("href", url);
        }
    }).error(function(data, status) {
        //console.log('Refine Search error');
    });

    $scope.redirectToAdvSearch = function() {
        $scope.advSearch = true;
    }
    $scope.redirectToStdSearch = function() {
        $scope.advSearch = false;
    }
    $scope.getSearchDates=function(searchData,index){
        var searchOrders={};
        var searchByDates={};
        var c=0;
        var searchNames=[];
        searchOrders=searchData;

        for(var i=0;i<Object.keys(searchData).length;i=i+index) {
            var keyName="searchName"+c;
            var keyNum="searchNum"+c;
            var keyVal="searchVal"+c;
            if(searchNames.indexOf(searchData[keyName]) == -1) {
                searchByDates[searchData[keyName]]=[];
                if(index==3) {
                    searchByDates[searchData[keyName]].push(searchData[keyNum]+" "+searchData[keyVal]);
                } else {
                    searchByDates[searchData[keyName]].push(searchData[keyNum]);
                }
            }else {
                if(index==3) {
                    if(searchByDates[searchData[keyName]].indexOf(searchData[keyNum]+" "+searchData[keyVal]) > -1) {
                        alert(" Duplicate values are not allowed");
                        return false;
                    }
                    searchByDates[searchData[keyName]].push(searchData[keyNum]+" "+searchData[keyVal]);
                } else {
                    if(searchByDates[searchData[keyName]].indexOf(searchData[keyNum]) > -1) {
                        alert(" Duplicate values are not allowed");
                        return false;
                    }
                    searchByDates[searchData[keyName]].push(searchData[keyNum]);
                }
            }
            c++;
            searchNames.push(searchData[keyName]);
        }
        return searchByDates;
    }
}
refineSearchCtrl.$inject = ['$scope', '$location', '$routeParams', '$http', '$rootScope','createDialog','searchObject'];

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

    var reportsUrl = URLPrefix($location)+"/ossui/v1/ex/reports/myreports";
    var reportNames = [];
    $scope.nodataFlag = true;
    var getUserDetailurl = URLPrefix($location)+"/ossui/v1/ex/usersettings";

    $http.get(getUserDetailurl).success(function(data, status) {
            $scope.data = data;
            var postData = "user=" + data.user_id + "&aaid="+data.aaid;
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
                    /*console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);*/
                    $("#loader, #overlay").hide();
                });
        }).error(function(data, status) {
           /* console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
            $("#loader, #overlay").hide();
        });
        $scope.getReports = function(itemDetails,fileformat){
                postData = "?path="+itemDetails.path;
                var reportURL = URLPrefix($location)+"/ossui/v1/ex/reports/getreport"+postData;
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
    var notificationUrl = URLPrefix($location) +  "/ossui/v1/ex/externalNotification";
    //console.log(notificationUrl);
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
                            //console.log($scope.deleteEmailList.length);
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
           // console.log('Event Notification error');
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

        //console.log(disableData);
        var disableUrl = URLPrefix($location) + "/ossui/v1/ex/disableNotification";
        $("#loader, #overlay").show();
        $http({
            url: disableUrl,
            method: "POST",
            data: disableData,
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            $("#loader, #overlay").hide();
            //console.log(data);
           // $scope.eventNotificationSaved();
        }).error(function (data, status, headers, config) {
            //console.log("data"+data);
            $("#loader, #overlay").hide();
           // console.log("Failed to Save Data: "+data);
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

           // console.log(saveSetupData);
            $scope.$on("success", function(events, data)
            {
                var saveUrl = URLPrefix($location) + "/ossui/v1/ex/saveNotification"; 
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
                    //console.log("Failed to Save Data: "+data);
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
                  //console.log('eventNotificationSaved modal closed');
                }}
            });
    }

    $scope.showDialogDisClaimer = function(){
        createDialog('partials/disclaimer.html', {
              id: 'Disclaimer',
              backdrop: true,
              scope:$scope,
              success: {label: 'Success', fn: function() {
                  //console.log('Disclaimer modal closed');
                  $scope.eventNotificationSaved();
                }}
        });
    }
    $scope.addEmailId = function(){
     //console.log("called up show dialog add email method");
     createDialog('partials/addEmail.html', {
              id: 'addEmail',
              backdrop: true,
              scope: $scope,
              success: {label: 'Success', fn: function() {
                  //console.log('Add Email modal closed');
                  $scope.newAddedEmail = this.newEmail;
                  var addurl = URLPrefix($location) + "/ossui/v1/ex/addNewEmail?emailaddr="+$scope.newAddedEmail;
                  $http.get(addurl).success(function(data, status) {
                        $("#loader, #overlay").hide();
                        //console.log('success' + data.message+":"+addurl);
                        $scope.message = data.message;
                        $scope.addEmailConfirmation($scope.message);
                    }).error(function(data, status) {
                       // console.log(data.message);
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
              //console.log('addEmailConfirmation modal closed');
              $scope.addEmailId();
            }}
        });
    }
    $scope.deleteEmailId = function(){
     //console.log("called up deleteEmail dialog method");
     createDialog('partials/deleteEmail.html', {
          id: 'deleteEmail',
          backdrop: true,
          scope:$scope,
          success: {label: 'Success', fn: function() {
                //console.log('deleteEmail modal closed');
                $scope.delEmailId = this.deleteEmail;
                  var deleteurl = URLPrefix($location) + "/ossui/v1/ex/deleteEmail?email="+$scope.delEmailId;
                  $http.get(deleteurl).success(function(data, status) {
                    $("#loader, #overlay").hide();
                   // console.log('success');
                   // console.log(data);
                   //          if(data !=undefined){
                            $("#loader, #overlay").hide();//}
                           // console.log('reloading...');
                            //$route.reload();
                           // $scope.addEmailConfirmation();
                    }).error(function(data, status) {
                        //console.log('error');
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
    var dataSource = $routeParams.dataSource;
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
        var orderNo = $routeParams.legordNo;
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);

    } //end of navigating to order detail page

    var ordNo = $routeParams.legordNo;

    var surl = URLPrefix($location)+"/ossui/v1/ex/orderhistory?order_no=" + ordNo+"&data_source="+dataSource;
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
           /* console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
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
    $scope.columnsObj = {
      "item": "Item",
      "prod": "Product",
      "desc": "Description",
      "coo_excl": "CoO Exclusion",
      "serial_number": "Serial#",
      "box_no": "Box#",
      "coo_code": "CoO Code",
      "coo_name": "CoO Name",
      "shipment_id":"Shipment#",
      "asset_tag":"Asset Tag",
      "first_mac":"Primary Mac",
      "second_mac":"2nd Mac",
      "third_mac":"3rd Mac",
      "fourth_mac":"4th Mac",
      "esn":"ESN",
      "imei":"IMEI",
      "iccid":"ICCID",
      "iccid_act_key":"ICCID Activation Key",
      "status":"Status",
    };
    $scope.getColumnDescription = function(serchText){
        if ($scope.columnsObj.hasOwnProperty(serchText) == true) {
            return $scope.columnsObj[serchText];
        }
    }
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var legacyOrderNo = legacyOrder.getLegacyorderNo();
    var shipedURL = URLPrefix($location)+"/ossui/v1/ex/serialassetinfo?lon="+legacyOrderNo+"&section=shipped";
    var openURL = URLPrefix($location)+"/ossui/v1/ex/serialassetinfo?lon="+legacyOrderNo+"&section=open";
    $scope.dataShipFlag = true;
    $scope.dataOpenFlag = true;
    jQuery("#loader, #overlay").show();
    $http.get(shipedURL).success(function(data, status) {
            jQuery("#loader, #overlay").hide();
            if(data.status == "S" && data.data!=""){
                $scope.dataShipFlag = true;
                var respObject = {cols:[],rows:[]};
                $scope.shippedColumns = [];
                $scope.shippedItems = {data : []};
                angular.forEach(data.data.columns,function(itmVisible,itmval){    // column names
                    var exportColumnsObject = {};
                    if(itmVisible == "Y"){
                        $scope.shippedColumns.push(itmval);
                        var colName = $scope.getColumnDescription(itmval);
                        exportColumnsObject["caption"] = colName;
                        exportColumnsObject["type"] = "string";
                        respObject.cols[(respObject.cols.length)++] = exportColumnsObject;
                    }
                });
                angular.forEach(data.data.delivery,function(key,val){
                        var exportRowsObject = [];
                        $scope.shippedItems.data[$scope.shippedItems.data.length++]=key;
                        angular.forEach(data.data.columns,function(itmVisible,itmval){    // column names
                            if(itmVisible == "Y"){
                                if(key[itmval] == "" || key[itmval] == null){
                                    exportRowsObject[(exportRowsObject.length)++] = "";
                                    }else{
                                    exportRowsObject[(exportRowsObject.length)++] = key[itmval];
                                }
                            }
                        });
                        respObject.rows[(respObject.rows.length)++] = exportRowsObject;
                });
                $scope.shippedHeadings = $scope.shippedColumns;
                $scope.exportShippedData = function(){
                    var postData = respObject;
                    var reportsUrl = URLPrefix($location)+"/ossui/v1/exportexcelpost";
                    $http({url : reportsUrl,
                        method:"POST",
                        data: $.param(postData),
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).success(function (data, status, headers, config) {
                    }).error(function (data, status, headers, config) {
                        /*console.log('error');
                        console.log(JSON.stringify(data));
                        console.log('status');
                        console.log(status);*/
                        jQuery("#loader, #overlay").hide();
                    });
                }
            }else if((data.status == "S" && data.data == "") || (data.status == "N" && data.data == "")){
                $scope.errorShipMessage = "No shipped items found.";
                $scope.dataShipFlag = false;
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
           /* console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
            jQuery("#loader, #overlay").hide();
        });
        $http.get(openURL).success(function(data, status) {
            jQuery("#loader, #overlay").hide();
            if(data.status == "S" && data.data!=""){
                $scope.dataOpenFlag = true;
                var respObject = {cols:[],rows:[]};
                $scope.openColumns = [];
                $scope.openItems = {data : []};
                angular.forEach(data.data.columns,function(itmVisible,itmval){    // column names
                    var exportColumnsObject = {};
                    if(itmVisible == "Y"){
                        $scope.openColumns.push(itmval);
                        var colName = $scope.getColumnDescription(itmval);
                        exportColumnsObject["caption"] = colName;
                        exportColumnsObject["type"] = "string";
                        respObject.cols[(respObject.cols.length)++] = exportColumnsObject;
                    }
                });
                angular.forEach(data.data.delivery,function(key,val){
                        var exportRowsObject = [];
                        $scope.openItems.data[$scope.openItems.data.length++]=key;
                        angular.forEach(data.data.columns,function(itmVisible,itmval){    // column names
                            if(itmVisible == "Y"){
                                if(key[itmval] == "" || key[itmval] == null){
                                    exportRowsObject[(exportRowsObject.length)++] = "";
                                    }else{
                                    exportRowsObject[(exportRowsObject.length)++] = key[itmval];
                                }
                            }
                        });
                        respObject.rows[(respObject.rows.length)++] = exportRowsObject;
                });
                $scope.openHeadings = $scope.openColumns;
                $scope.exportOpenData = function(){
                    var postData = respObject;
                    var reportsUrl = URLPrefix($location)+"/ossui/v1/exportexcelpost";
                    $http({url : reportsUrl,
                        method:"POST",
                        data: $.param(postData),
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).success(function (data, status, headers, config) {
                    }).error(function (data, status, headers, config) {
                        /*console.log('error');
                        console.log(JSON.stringify(data));
                        console.log('status');
                        console.log(status);*/
                    });
                }
            }else if((data.status == "S" && data.data == "") || (data.status == "N" && data.data == "")){
                $scope.errorOpenMessage = "No open items found.";
                $scope.dataOpenFlag = false;
                //console.log("I came:"+data.message);
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
           /* console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
            jQuery("#loader, #overlay").hide();
        });
}
serialAssetInfoCtrl.$inject = ['$scope','$routeParams','$location','$http','legacyOrder'];

function pricingtab($scope,$routeParams,$location,$http,legacyOrder){

    jQuery("#loader, #overlay").show();
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var legacyOrderNo = legacyOrder.getLegacyorderNo();
    var url = URLPrefix($location)+"/ossui/v1/ex/pricingdetail/?hpOrderNo="+$routeParams.orderNo;
    $http.get(url).success(function(data, status) {
        jQuery("#loader, #overlay").hide();
        if(data.data[0]!=null){
            $scope.$broadcast('pricingtabCtrl',data.data[0]);
        }
    }).error(function(data, status) {
        jQuery("#loader, #overlay").hide();
    });

}

function shipmentInformationCtrl ($scope, $http, $location, $compile, $rootScope, $routeParams, $filter, createDialog){
  var OrderNo= $routeParams.orderNo;
  var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
  var url = URLPrefix($location)+"/ossui/v1/ex/shipmenttab?order_no="+OrderNo;

   jQuery("#loader, #overlay").show();
   $http.get(url).success(function(data, status) {
      jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                    if (data.data != "") {
                    var shipItems=data.data;
                    var shipItemsList =  {
                        data: []
                    };
                    var shipList = null;
                    var carrierFlag = null;
                    var compID = null;
                    var podImage = null;
                    var packList = null;

                    $filter('filter')(shipItems, function(attr) {
                      if(attr.carrierwebpage != null)
                         {
                             carrierFlag = true;
                         }
                         else {
                                carrierFlag = false;
                              }

                        if(attr.compId == "{}")
                        {
                           compID = null;
                        }else
                        {
                           compID = attr.compId;
                        }

                        if(attr.hasPodImage != '0')
                        {
                            podImage = attr.PackListURL+"?pod="+attr.hpdeliveryno+"&carrier="+attr.carriername+"&shipmentno="+attr.shipmentno+"&pod_os="+attr.legacy_order_no;
                        }
                        else
                        {
                            podImage = null;
                        }


                        if(attr.hasPackList != 0)
                        {
                            packList = attr.PackListURL+"?getixosdoc="+attr.getixosdoc+"&contRep="+attr.contRep+"&compId="+compID+"&contenttype="+attr.contenttype;
                        }
                        else
                        {
                            packList = null;
                        }

                         shipList = {
                                  "packlist": packList,
                                  "podimage": podImage,
                                  "PackListURL": attr.PackListURL,
                                  "carrierFlag": carrierFlag,
                                  "sourcesystem": attr.sourcesystem,
                                  "legacy_order_no": attr.legacy_order_no,
                                  "hpdeliveryno": attr.hpdeliveryno,
                                  "shipmentno": attr.shipmentno,
                                  "ship_conditions": attr.ship_conditions,
                                  "region": attr.region,
                                  "ref_shipment_no": attr.ref_shipment_no,
                                  "alt_shipment_no": attr.alt_shipment_no,
                                  "iso_country": attr.iso_country,
                                  "depotcountry": attr.depotcountry,
                                  "depot_to_addr_3": attr.depot_to_addr_3,
                                  "depot_to_addr_2": attr.depot_to_addr_2,
                                  "plant_code": attr.plant_code,
                                  "unitofmeasure": attr.unitofmeasure,
                                  "dod_flag": attr.dod_flag,
                                  "rfid_flag": attr.rfid_flag,
                                  "box_count": attr.box_count,
                                  "depot_to_addr_4": attr.depot_to_addr_4,
                                  "depot_to_addr_5": attr.depot_to_addr_5,
                                  "depot_to_addr_6": attr.depot_to_addr_6,
                                  "depot_to_addr_7": attr.depot_to_addr_7,
                                  "wawfNumber": attr.wawfNumber,
                                  "shipmentdate": attr.shipmentdate,
                                  "deliverydate": attr.deliverydate,
                                  "ship_method": attr.ship_method,
                                  "ship_conditions": attr.ship_conditions,
                                  "delivery_comment": attr.delivery_comment,
                                  "delvtocity": attr.delvtocity,
                                  "quantity": attr.quantity,
                                  "country_name": attr.country_name,
                                  "weight": attr.weight,
                                  "depot_to_addr_1": attr.depot_to_addr_1,
                                  "truckid": attr.truckid,
                                  "delvtozipcode": attr.delvtozipcode,
                                  "carrierwebpage": attr.carrierwebpage,
                                  "carriername": attr.carriername,
                                  "carrier_website": attr.carrier_website,
                                  "tat_url": attr.tat_url
                             }
                         shipItemsList.data[(shipItemsList.data.length)++] = shipList;
                      });
                         $scope.shipments = shipItemsList.data;
                } else {
                    jQuery("#loader, #overlay").hide();
                    $scope.showhideShipment = true;
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
           jQuery("#loader, #overlay").hide();
        });

   $scope.getData = function(panelName, shipmentNo, hpDeliveryNo, hpLegacyOrderNo)
   {
       var deliveryNo = hpDeliveryNo;
       var ShipNo = shipmentNo;
       $scope.shipmentNum = shipmentNo;
       var trackUrl = URLPrefix($location)+"/ossui/v1/ex/trackInfo?hpdelvno=" + deliveryNo+"&legacy_order_no="+hpLegacyOrderNo+"&shipment_no="+ShipNo;

       jQuery("#loader, #overlay").show();
       $http.get(trackUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();

            if (data != undefined) {
                    if (data.Trackinfo != "") {
                    var trackinfo = data.Trackinfo;
                    var trackInfoList =  {
                        data: []
                    };
                    var trackList = null;
                    var taturlFlag = null;
                    var carrierurlFlag = null;

                    $filter('filter')(trackinfo, function(attr) {
                      if(attr.tat_url != "")
                         {
                             taturlFlag = true;
                         }
                         else {
                                taturlFlag = false;
                              }
                       if(attr.carrier_website != "")
                         {
                            carrierurlFlag = true;
                         }
                         else {
                                 carrierurlFlag = false;
                              }
                         trackList = {
                                  "taturlFlag": taturlFlag,
                                  "carrierurlFlag": carrierurlFlag,
                                  "hpdeliveryno": attr.hpdeliveryno,
                                  "id": attr.id,
                                  "shipmentno": attr.shipmentno,
                                  "trackingno": attr.trackingno,
                                  "carriername": attr.carriername,
                                  "carrierdeliveryno": attr.carrierdeliveryno,
                                  "recipientname": attr.recipientname,
                                  "masterbillno": attr.masterbillno,
                                  "housebillno": attr.housebillno,
                                  "departlocation": attr.departlocation,
                                  "arrivallocation": attr.arrivallocation,
                                  "status_count": attr.status_count,
                                  "transportflightno": attr.transportflightno,
                                  "carrier_website": attr.carrier_website,
                                  "tat_url": attr.tat_url
                             }
                         trackInfoList.data[(trackInfoList.data.length)++] = trackList;
                      });
                         $scope.trackItems = trackInfoList.data;

                         if($scope.trackItems != null)
                         {$scope.trackflag = true;}
                         else {$scope.trackflag = false;}
                  } else {
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
       });
       $scope.errorFlag = false;
       var boxUrl =  URLPrefix($location)+"/ossui/v1/ex/boxInfo?order_no="+hpLegacyOrderNo+"&ship_no="+ShipNo;
       jQuery("#loader, #overlay").show();
       $http.get(boxUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();
            if (data.data != "") {
                $scope.errorFlag = false;
                if (data.boxdetails.header != "") {
                    var lineItemsHeader=data.boxdetails.header;
                    $scope.boxItemsItem = data.boxdetails.header;
                    var lineItem =null;
                    var items = {
                        data: []
                    };
                    var innerItems = {
                        data: []
                    };
                    var innerlineItems = null;
                    var groupItems = {};
                    var groupBoxes = {};
                    var groupsParentItems = {};
                    var groupsParentBoxes = {};
                    if (data.boxdetails.HighestLevel == 0) {
                        angular.forEach(data.boxdetails.header, function(item,i) {
                            var level = item.boxno;
                            if(level!=null){
                                if(groupItems[level]) {
                                    groupItems[level].push(item);
                                } else {
                                    groupItems[item.boxno] = [item];
                                }
                            }else{
                                if(groupBoxes[level]) {
                                    groupBoxes[level].push(item);
                                } else {
                                    groupBoxes[item.boxno] = [item];
                                }
                            }
                        });
                    }
                    if (data.boxdetails.HighestLevel == 1) {
                        angular.forEach(data.boxdetails.header, function(item,i) {
                            var level = item.parent_box_no;
                            var levelBox = item.boxno;
                            if(level!=null){
                                if(groupsParentItems[level]) {
                                    groupsParentItems[level].push(item);
                                } else {
                                    groupsParentItems[item.parent_box_no] = [item];
                                }
                            }else{
                                if(groupsParentBoxes[levelBox]) {
                                    groupsParentBoxes[levelBox].push(item);
                                } else {
                                    groupsParentBoxes[item.boxno] = [item]
                                }
                            }
                        });
                    }
                    var newObject = merge_options(groupsParentItems,groupsParentBoxes);
                    $scope.groupsParentItems = newObject;
                    $scope.groupsParentBoxes = groupsParentBoxes;
                    
                    if (data.boxdetails.HighestLevel == 1)
                    {
                        $filter('filter')(lineItemsHeader, function(attr) {
                        if(attr.box_level == 1)
                        {
                            $scope.showinnerlineItems = true;
                            lineItem = {
                                'shipment_no': attr.shipment_no1,
                                'box_no': attr.boxno,
                                'weight': attr.weight,
                                'width': attr.width,
                                'length': attr.len,
                                'height': attr.height,
                                'qty': attr.headerbox_qty,
                                'sc_recv': attr.sc_recv,
                                'epc': attr.epc,
                                'sc_ship': attr.sc_ship,
                                'hasTracking': attr.hasTracking
                            }
                            items.data[(items.data.length)++] = lineItem;
                            lineItem = null;
                        }
                        });
                    }
                  else
                  {
                    var itemBoxes = {};
                    $scope.showinnerlineItems = false;
                    angular.forEach(groupItems, function (val1,key1) {
                        items.data = [];
                        angular.forEach(val1, function (val,key) {
                            lineItem = {
                                'shipment_no': val.shipment_no1,
                                'box_no': val.boxno,
                                'weight': val.weight,
                                'width': val.width,
                                'length': val.len,
                                'height': val.height,
                                'qty': val.headerbox_qty,
                                'sc_recv': val.sc_recv,
                                'epc': val.epc,
                                'sc_ship': val.sc_ship,
                                'item_subitem': val.item_subitem,
                                'material_no': val.material_no,
                                'product_descr': val.product_descr,
                                'itembox_qty': val.itembox_qty,
                                'hasTracking': val.hasTracking
                            }
                            items.data[(items.data.length)++] = lineItem;
                        });
                            itemBoxes[key1]=items.data;
                        });
                        items.data = itemBoxes;
                    }
                 $scope.boxItems = items.data;
                 $filter('filter')(data.boxdetails.header, function (attr) {
                        if (attr.box_level == 0) {
                            innerlineItems = {
                                'shipment_no': attr.shipment_no1,
                                'box_no': attr.boxno,
                                'weight': attr.weight,
                                'width': attr.width,
                                'length': attr.len,
                                'height': attr.height,
                                'qty': attr.headerbox_qty,
                                'sc_recv': attr.sc_recv,
                                'epc': attr.epc,
                                'sc_ship': attr.sc_ship,
                                'item_subitem': attr.item_subitem,
                                'material_no': attr.material_no,
                                'product_descr': attr.product_descr,
                                'box_qty': attr.itembox_qty,
                                'hasTracking': attr.hasTracking
                            }
                            innerItems.data[(innerItems.data.length)++] = innerlineItems;
                        }
                    });
                    $scope.errorFlag = false;
                } else {
                    $scope.errorFlag = true;
                    $scope.error = data.message;
                }
                $scope.innerboxItems = groupsParentItems;
                if ($scope.boxItemsItem != null) {
                    $scope.innerflag = true;
                } else {
                    $scope.innerflag = false;
                }
            }else {
                    $scope.errorFlag = true;
                    $scope.errorMessage = data.message;
                }
        }).error(function(data, status) {

       });

       var itemUrl =  URLPrefix($location)+"/ossui/v1/ex/itemInfo?order_no="+hpLegacyOrderNo+"&shipno="+ShipNo;
       jQuery("#loader, #overlay").show();
       $http.get(itemUrl).success(function(data, status) {
           jQuery("#loader, #overlay").hide();
           $scope.itemItemsheader = null;
           $scope.itemItemsDetails = null;
           if (data.Iteminfo.techinfo != "") {
                $scope.itemItemsDetails = data.Iteminfo.techInfo;
              } else {
                $scope.error=data.message;
            }
            var groupItems = {};
            var itemsGroups = [];
            angular.forEach(data.Iteminfo.techInfo, function(item,i) {
                if(item.item_subitem!=null){
                    if(groupItems.hasOwnProperty(item.item_subitem)!=true){
                        itemsGroups = [];
                        itemsGroups[itemsGroups.length++] = item;
                        groupItems[item.item_subitem] = itemsGroups;
                    }else{
                        itemsGroups[itemsGroups.length++] = item;
                        groupItems[item.item_subitem] = itemsGroups;
                    }
                }
            });
            $scope.techInfoItems = groupItems;
               if (data != undefined) {
                    if (data.Iteminfo.header != "") {
                    var ItemInfo = data.Iteminfo.header;
                    var itemInfoData = {
                        data: []
                    };
                    var itemList = null;
                    var showItem = null;
                     $filter('filter')(ItemInfo, function(attr) {
                       if(attr.hasTechInfo == 1)
                             {showItem = true;}
                             else
                             {showItem = false;}
                        if($scope.techInfoItems)
                        var techInfo = $scope.techInfoItems[attr.item_subitem];     
                         itemList = {
                                 "show_tech_info" : showItem,
                                 "delivery_group": attr.delivery_group,
                                 "item_subitem": attr.item_subitem,
                                 "material_no": attr.material_no,
                                 "product_descr" : attr.product_descr,
                                 "so_line_item_qty": attr.so_line_item_qty,
                                 "sched_line_qty": attr.sched_line_qty,
                                 "logistics_codes": attr.logistics_codes,
                                 "ship_from" : attr.ship_from,
                                 "lsp_name": attr.lsp_name,
                                 "hasTechInfo" : attr.hasTechInfo,
                                 "techInfo": techInfo
                          }
                          itemInfoData.data[(itemInfoData.data.length)++] = itemList;
                });
                  $scope.itemItemsheader = itemInfoData.data;
                  } else {
                    $scope.error=data.message;
                }

            }
            if (data.Iteminfo.itembox.length > 0) {
                $scope.hideBox = true;
                var itemBox = {
                    data: []
                };
                var itemBoxComplete = {
                    data: []
                };
                var boxItem = null;
                var boxCount = null;
                $scope.parentBox = false;
                var groups = {};
                var parentGroupItems = {};
                var parentFlag = {};
                var groupsWithParentItems = {};
                var boxItems = [];
                var boxInfo = {};
                angular.forEach(data.Iteminfo.itembox, function(item,i) {
                    if(item.parent_box_no!=null){
                        $scope.parentBox = true;
                        parentFlag[item.item_subitem]="parentBox";
                        var level = item.parent_box_no;
                        var parentItem = item.item_subitem;
                        if(groups[level]) {
                            groups[level].push(item.box_no);
                        } else {
                            groups[item.parent_box_no] = [item.box_no];
                        }
                        var levelItem = item.item_subitem;
                        boxItems.push(item.parent_box_no);
                        parentGroupItems[item.item_subitem] = boxItems;
                        var prentItem = item.parent_box_no;
                        if(groupsWithParentItems[prentItem]) {
                            groupsWithParentItems[prentItem].push(item.item_subitem);
                        }else{
                            groupsWithParentItems[item.parent_box_no] =[item.item_subitem];
                        }
                    }else{
                        parentFlag[item.item_subitem]="box";
                        $scope.parentBox = false;
                        var level = item.item_subitem;
                        if(groups[level]) {
                            groups[level].push(item.box_no);
                        } else {
                            groups[item.item_subitem] = [item.box_no];
                        }
                    }
                });
                $scope.groups = groups;
                $scope.parentGroupItems = parentGroupItems;
                $scope.groupsWithParentItems = groupsWithParentItems;
                $scope.parentFlag = parentFlag;
            } else {
                $scope.hideBox = false;
                $scope.error=data.message;
            }
            if($scope.itemItemsDetails != null)
                {$scope.itemflag = true;}
             else {$scope.itemflag = false;}
        }).error(function(data, status) {
          jQuery("#loader, #overlay").hide();
        });
        $scope.showItemMore = function(itemVal){
            var parentBoxes = [];
            if($scope.groups[itemVal]!=undefined){
                $scope.boxCount = $scope.groups[itemVal].length;
                if ($scope.boxCount <= 4) {
                    $scope.hideMore = false;
                    if($scope.boxCount == 1){
                        $scope.itemItemBox4 = $scope.groups[itemVal].slice(0, 1).join();
                    }else{
                        $scope.itemItemBox4 = $scope.groups[itemVal].slice(0, 4).join();
                    }
                }else{
                    $scope.hideMore = true;
                    $scope.showFourItems = $scope.groups[itemVal].slice(0, 4).join();
                }
            }else if($scope.parentGroupItems[itemVal]!=undefined){
                angular.forEach($scope.groups, function (key,val) {
                $scope.boxCount = key.length;
                    key.sort(function(a,b){return a-b});
                        parentBoxes.push(val);
                });
                $scope.hideMore = true;
                $scope.showFourItems = $scope.parentGroupItems[itemVal][0];
            }else{
                $scope.itemItemBox4 = "";
                $scope.hideMore = false;
            }
        }
            $scope.itemItemBoxComplete = $scope.itemItemBoxCompleted;
            return $scope.hideMore;
        }
        $scope.boxItemColpseExpand = function(panelName, mode)
        {
            $scope[panelName] = !$scope[panelName];
            if (mode) {
                if (mode == 'e') {
                    $scope[panelName] = true;
                } else {
                    $scope[panelName] = false;
                }
            }
            if ($scope[panelName]) {
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("collapseImg expCloseImgDiv");
                $scope.el.addClass("expandImg expCloseImgDiv");
            } else {
                var deliveryGroupscls = "#"+panelName;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
            }
        }
       var statusUrl =  URLPrefix($location)+"/ossui/v1/ex/statusHistory?hpdelvno="+deliveryNo+"&ship_no="+ShipNo;
       jQuery("#loader, #overlay").show();
       $http.get(statusUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();
            if (data != undefined) {

                    if (data.Event != "") {
                    $scope.statusItems = data.Event;

                     if($scope.statusItems != null)
                         {$scope.statusflag = true;}
                         else {$scope.statusflag = false;}
                  } else {
                    $scope.error=data.message;
                }

                   /*Code For Master and Housing Bill Popup*/
                   $scope.getBillingDetails= function(index){
                     var masterBill = null;
                     var housingBill = null;
                     var billingItem = {
                        data: []
                     };
                     var item = null;
                     $scope.numIndex = index;
                     $filter('filter')(data.Event, function(attr) {
                     if(attr.masterbillno != null){
                         masterBill = attr.masterbillno;
                      }else{
                         masterBill = "-";
                      }

                      if(attr.housebillno != null){
                         housingBill = attr.housebillno;
                      }else{
                         housingBill = "-";
                      }
                     item = {
                                 "masterbillno": masterBill,
                                 "housebillno": housingBill,
                                 "index": attr.statusCount
                            }
                     billingItem.data[(billingItem.data.length)++] = item;
                });
                     $scope.billingData = billingItem.data;

                 createDialog('partials/statusPopup.html', {
                 id: 'trackStatus',
                 backdrop: true,
                 scope:$scope
                });
              }
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
        });


       /*var RFUIdUrl =  URLPrefix($location)+"/ossui/v1/ex/dodInfo?order_no="+hpLegacyOrderNo+"&shipno="+ShipNo;
       jQuery("#loader, #overlay").show();
       $http.get(RFUIdUrl).success(function(data, status) {
       jQuery("#loader, #overlay").hide();
            if (data != undefined) {

                    if (data.dod != "") {
                    $scope.RFIDItems = data.dod;
                     if($scope.RFIDItems != null)
                         {$scope.RFIDflag = true;}
                         else {$scope.RFIDflag = false;}
                  } else {
                    $scope.error=data.message;
                }
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
        });*/

   $scope[panelName] = !$scope[panelName];
   if ($scope[panelName]) {
                    var shipmentNumber = "#"+panelName;
                    $scope.el = $compile(shipmentNumber)($scope);
                    $scope.el.removeClass("collapseImg expCloseImgDiv");
                    $scope.el.addClass("expandImg expCloseImgDiv");

                } else {
                    var shipmentNumber = "#"+panelName;
                    $scope.el = $compile(shipmentNumber)($scope);
                    $scope.el.removeClass("expandImg expCloseImgDiv");
                    $scope.el.addClass("collapseImg expCloseImgDiv");
           }
   }

   var panelsSelected = [];
   var flag;
   $scope.expandOrCollapseShipment = function(panelName, shipmentNo, hpDeliveryNo, hpLegacyOrderNo)
   {
      var index;
        for(var i=0; i<panelsSelected.length; i++) {
            if(panelsSelected[i] == panelName){
             flag = true;
             break;
            } else
             flag =false;
        }
        if(!flag)
        panelsSelected.push(panelName);
        else {
            var lineItemscls = "#"+panelName;
            $scope.el = $compile(lineItemscls)($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
            $scope.lineitemflg = panelName;
            $scope.showLineItem = false;
            panelsSelected = [];
            flag = false;
            return;
        }
        var lineItemscls = "#"+panelName;
        if (!flag) {
            $scope.lineitemflg = panelName;
            $scope.showLineItem = true;
            var lineItemscls = "#"+panelName;
            $scope.el = $compile(lineItemscls)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
            $scope.lineItemShow = true;
            $scope.getData(panelName, shipmentNo, hpDeliveryNo, hpLegacyOrderNo);
        }
        for(var i=0; i<panelsSelected.length; i++)
         {
             if(panelName != panelsSelected[i]){
                var lineItemscls = "#"+panelsSelected[i];
                $scope.el = $compile(lineItemscls)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
                index = panelsSelected.indexOf(panelsSelected[i]);
            }
        }
        if(index != undefined)
        panelsSelected.splice(index, 1);
   }

  $scope.expandOrCollapseShipmentInner = function (panelName,shipSumIndex)
   {
        $scope[panelName] = !$scope[panelName];
         if ($scope[panelName]) {
                    var panel = "#"+ panelName+shipSumIndex;
                    $scope.el = $compile(panel)($scope);
                    $scope.el.removeClass("collapseImg expCloseImgDiv");
                    $scope.el.addClass("expandImg expCloseImgDiv");

                } else {
                    var panel = "#"+panelName+shipSumIndex;
                    $scope.el = $compile(panel)($scope);
                    $scope.el.removeClass("expandImg expCloseImgDiv");
                    $scope.el.addClass("collapseImg expCloseImgDiv");
                }
   }

   $scope.redirectUrl= function (url)
   {
       if (url != null)
       {
          var urlFlag =confirm("You are about to leave HP's website!\nHP is not responsible for information outside the HP website.");
           if (urlFlag == true) {
                window.open(url,'_blank','width=700,height=500,toolbar=0,location=0,menubar=0')
            }
       }
   }

   $scope.redirectToShipment = function(hpDeliveryNo,legacyNo)
   {
        var url = "#/ex/shipmentInformation/" + hpDeliveryNo+"/"+legacyNo;
        if (hpDeliveryNo != null)
        {
           window.open(url,'_blank','width=700,height=500,toolbar=0,location=0,menubar=0');
        }
   }

   $scope.openPodnPack = function(url)
   {
       if (url != null && url != "")
       {
           window.open(url,'_blank','width=700,height=500,toolbar=0,location=0,menubar=0');
       }
       else
       {
           alert("No Records Found");
       }
   }

$scope.showShipAddress = function(shipNumber) {
     $scope.shipmentNum =  shipNumber;
        var shiplineItem =null;
        var items = {
            data: []
        };
        $filter('filter')($scope.shipments, function(attr) {
            shiplineItem = {
                'depot_to_addr_2': attr.depot_to_addr_2,
                'depot_to_addr_3': attr.depot_to_addr_3,
                'depot_to_addr_4': attr.depot_to_addr_4,
                'depot_to_addr_5': attr.depot_to_addr_5,
                'depot_to_addr_6': attr.depot_to_addr_6,
                'depot_to_addr_7': attr.depot_to_addr_7,
                'shipmentno' : attr.shipmentno
            }
            items.data[(items.data.length)++] = shiplineItem;
        });
        $scope.shipAddItems = items.data;
        createDialog('partials/shipAddressDetails.html', {
            id: 'shidAddress',
            backdrop: true,
            scope:$scope
        });
 }

   $scope.showItemBox = function(itemVal){
        $scope.displayFlag = $scope.parentFlag[itemVal];
        if($scope.parentFlag[itemVal] == 'box'){
            $scope.itemItemBoxComplete = $scope.groups[itemVal];
        }else if($scope.parentFlag[itemVal] == 'parentBox'){
            if($scope.groups[itemVal]!=undefined){
                $scope.itemItemBoxComplete = $scope.groups;
            }else{
                var parentArr = $scope.parentGroupItems[itemVal];
                var parentItems = {};
                angular.forEach($scope.groups,function(key,val){
                    angular.forEach(parentArr,function(key1,val1){
                        if(val == key1){
                            parentItems[key1]=key;
                        }
                    });   
                });
                angular.forEach(parentItems,function(key,val){
                    key.sort(function(a,b){return a-b});
                });
                $scope.itemItemBoxComplete = parentItems;
            }
        }else{
            $scope.itemItemBoxComplete = $scope.groups;
        }
       createDialog('partials/itemBoxPopup.html', {
              id: 'shidAddress',
              backdrop: true,
              scope:$scope
            });
}
function productDetailsCtrl($scope, $location, $http, $routeParams, $rootScope,$compile,pageTitle){
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();

    $scope.lineItemsColumnNames = [{
            'id': "country",
            'value': "Country",
            "sort": "false"
        }, {
            'id': 'country_code',
            'value': 'Country Code',
            "sort": "false"
        }, {
            'id': 'export_code',
            'value': 'ECCN Code',
            "sort": "false"
        }, {
            'id': 'US_export_code',
            'value': 'Import Tariff Code',
            "sort": "false"
        }, {
            'id': 'description',
            'value': 'Description',
            "sort": "false"
        }
    ];
    pageTitle.setTitle('Product Details');
    var itemNo = $routeParams.itemNo;
    var orderNo = $routeParams.orderNo;
    var productDetailsURL = URLPrefix($location) +"/ossui/v1/ex/productDetails?os="+orderNo+"&item="+itemNo;
    $http.get(productDetailsURL).success(function(data, status) {
                    $("#loader, #overlay").hide();
                    $scope.productitems = data.data[0];
                    var exportDeails = data.data[0].wwClassInfo;
                    if(exportDeails.length > 1){
                        $scope.showExportDetailsFlag = true;
                        }else{
                            $scope.showExportDetailsFlag = false;
                            }
                }).error(function (data, status, headers, config) {
                    /*console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);*/
                    $("#loader, #overlay").hide();
                });
}
productDetailsCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope','$compile','pageTitle','legacyOrder'];

