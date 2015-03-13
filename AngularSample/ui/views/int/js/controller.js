/* This js file is used to get data from services for internal customers */

function indexCtrl($scope, pageTitle) {
    $scope.pageTitle = pageTitle;
}

function URLPrefix(location) {
  if (location.absUrl().match(/\/os\/int/) ) return '/os';
  return ''
}

/* providing navigation to order summary and report page  in all pages */
function PortalCtrl($scope, $location, $http, $routeParams, $rootScope, pageTitle) {
    var currentdate = new Date();
    $scope.currentYr = currentdate.getFullYear();
    var hostAddr = $location.host()+":"+$location.port();
    var s = $location.$$path;
    if((s.indexOf("productDetails") != -1) || (s.indexOf("shipmentInformation") != -1) || (s.indexOf("numbers") != -1) || (s.indexOf("codes") != -1)
     || (s.indexOf("status") != -1) || (s.indexOf("dates") != -1) || (s.indexOf("amount") != -1)){
        $scope.prdDet = false;
    }else{
        $scope.prdDet = true;
    }
    $scope.runningStandalone = false;
    try {
        $scope.runningStandalone = !(top.location != self.location);
    } catch (e) {}
    $scope.breadcrumbs = [];
    $scope.menu = [
        {text: 'Orders & Reporting', href:'/int/index.html', children: [
            {text:'Order Status', href:"./index.html"},
            {text:'Order Summary', href:'', click:'redirectToOrderSummary()'},
            {text:'My Reports', href:'', click:'redirectToReports()'},
           /* {text:'Event Notification', href:'', click:'redirectToEventNotify()', children: [
                {text:'My Notification Orders', href:'', click:'redirectToDetaildActive()'}
            ]},*/
            {text:'Legacy Oss', href:'', click:'redirectToLegacyOSS()'}
          ]
        }/*,
        {text: 'Tools & Resources', href:'/int/index.html', children: [
            {text:'Administrative Tools', href:'', click:'redirectToDataMaintainTools()'},
            {text:'Customer Hierarchy', href:'', click:'redirectToCustomerHierachy()'}
            ]
        }*/
    ]
    url = URLPrefix($location)+"/ossui/v1/in/usersettings";
    $http.get(url).success(function(data, status) {
        $scope.data = data;

        $rootScope.Config = {};
        if (data && data.config) {
            $rootScope.Config.links = data.config.links;
        }

        if (data.Data =="Unauthorized" ) {
            var url = URLPrefix($location)+"/int/authorizationRequest.html";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToCustomerHierachy = function() {
            url = "#/in/CustomerHierarchy";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToOrderSummary = function() {
            url = "#/in/orderSummary";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToReports = function() {
            url = "#/viewReports";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToDataMaintainTools = function(){
            url = "#/in/dataMaintainTools";
            jQuery(location).attr("href", url);
        }
        $scope.redirectToLegacyOSS = function(){
            var serurl = URLPrefix($location)+"/ossui/v1/in/legacyOSSLink";
            var legacyurl = "";
            $http.get(serurl).success(function(data, status) {
                legacyurl = data.data;
                jQuery(location).attr("href", legacyurl);
            }).error(function(data, status) {
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
    });
}
PortalCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope', 'pageTitle'];

function AuthorizationCtrl($scope, $location, $http) {
    $scope.redirectToUAM = function(){
        var url = URLPrefix($location)+"/ossui/v1/in/SandyQuickURL";
        var uamUrl = "";
        $http.get(url).success(function(data, status) {
            uamUrl = data.data;
            jQuery(location).attr("href", uamUrl);
        }).error(function(data, status) {
        });
    }
}

/* get orders information for orderSummaryRoute service for order summary page*/                                               /* get orders information for orderSummaryRoute service for order summary page*/
function orderListCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle, summaryPage, searchObject, $compile, createDialog, customerrormsgs,hpyOrderNumber,legacyOrderNumber) {
    var scopeItems = [];
    $scope.data = [];
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var searchObj = searchObject.getSearchObject();

    if ($routeParams.hpOrderNo) {
      if (searchObj == "") {
        searchObj = {}
      }
      searchObj.hpOrderNo = $routeParams.hpOrderNo;
    }

    pageTitle.setTitle('Order Summary');
    $scope.showStatus = function(){
        createDialog('partials/showOrderProgression.html', {
            id: 'showCount',
            backdrop: true,
            scope:$scope,
            success: {label: 'Success', fn: function() {
            }}
        });
    };
    if(searchObj!=""){
        searchUrl = URLPrefix($location)+"/ossui/v1/in/orderSummary";
        $("#loader, #overlay").show();
        $http({
            url: searchUrl,
            method: "POST",
            data: searchObj,
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            $scope.showResult = true;
            //$("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.data != "") {
                    var lineItems=data.data;
                    $scope.showhide = false;
                    $scope.dataflag = false;
                    $scope.orders = data.data;
                    $("#loader, #overlay").hide();
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
        searchUrl = URLPrefix($location)+"/ossui/v1/in/orderSummary";
        $("#loader, #overlay").show();
        $http({
            url: searchUrl,
            method: "POST",
            data: data,
            headers: {'Content-Type': 'application/json'}
        }).success(function (data, status, headers, config) {
            $scope.showResult = true;
           // $("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.data != "") {
                    //Order status progression code is added
                    orderStatus = data.data[0].order_overall_status;
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
                    var lineItems=data.data;
                    $scope.showhide = false;
                    $scope.dataflag = false;
                    $scope.orders = data.data;
                    $("#loader, #overlay").hide();
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
    $scope.columnNames = [
        {
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
        var quoteurl = "http://q2com-pro.austin.hp.com/q2cngom/ngom#/quotationdetails/";
        window.open(quoteurl + quote_no, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
    }
    /* display column names for line items in order detail page */
    $scope.productCharsColumnNames= [
        {
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
    /* display column names for line items for order details */
    $scope.lineItemsColumnNames = [
        {
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
            'id': 'itemCanceledOn',
            'value': 'Item Canceled Date'
        },{
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
        }, {
            'id': 'last_price_date',
            'value': 'Last Price Date',
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
    $rootScope.$broadcast('lineItemsColumnNames', $scope.lineItemsColumnNames);
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
        //resetting the status of child items
        for(var i=0; i<$scope.itemLstArry.length ; i++){
            $scope.el = $compile($scope.itemLstArry[i])($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
            $scope.itemLstArry.splice($scope.itemLstArry.indexOf($scope.itemLstArry[i]), 1);
        }
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
        for(var i=0; i<panelsSelected.length; i++){
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
                //console.log("prefpanelNm is qual to itemlstarray");
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
        $scope.hpOrderNo = hpOrderNo;
        var orderNo = orderNo;
        legacyOrderNumber.setLegacyOrderNo(orderNo);
        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var surl = URLPrefix($location)+"/ossui/v1/in/newitemdetail?oid="+orderNo;
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
                        var last_price_date = "";
                        var udfTextFlag = false;
                        var udf_text = "";
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
                        if(attr.last_price_date == "null"){
                            last_price_date = "";
                        }else{
                            last_price_date = attr.last_price_date;
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
                            var showProdFlag = true;
                            var shedLinelength = attr.sched_Line.length;
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
                                'currency': attr.currency,
                                'cancellationReason':attr.cancellation_reason,
                                'itemCanceledOn':attr.canceled_at,
                                'higherLevel': attr.higher_level,
                                'productCharacteristics': attr.product_chars,
                                'legacyorderno':orderNo,
                                'scCommitDate':attr.sc_commit_date,
                                'entitlementID':attr.entitlement_id,
                                'billingPlan':billing_plan,
                                'factShippedDate':factory_shipped_date,
                                'actualCustShipDate':actual_customer_ship_date,
                                'lastPriceDate':last_price_date,
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
                        var last_price_date = "";
                        var udfTextFlag = false;
                        var udf_text = "";
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
                        if(attr.last_price_date == "null"){
                            last_price_date = "";
                        }else{
                            last_price_date = attr.last_price_date;
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
                            var showProdFlag = true;
                            var shedLinelength = attr.sched_Line.length;
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
                                'currency': attr.currency,
                                'cancellationReason':attr.cancellation_reason,
                                'itemCanceledOn':attr.canceled_at,
                                'higherLevel': attr.higher_level,
                                'productCharacteristics': attr.product_chars,
                                'legacyorderno':orderNo,
                                'scCommitDate':attr.sc_commit_date,
                                'billingPlan':billing_plan,
                                'entitlementID':entitlement_id,
                                'factShippedDate':factory_shipped_date,
                                'actualCustShipDate':actual_customer_ship_date,
                                'udfText':udf_text,
                                'udfTextFlag':udfTextFlag,
                                'showProductCharFlag':showProdFlag,
                                'lastPriceDate':last_price_date
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
                url = URLPrefix($location)+"/ossui/v1/in/invoice?" + "order_no=" + $scope.hpOrderNo + "&invoice_no=" +
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

    /* navigating to order detail Page from order summary*/
    $scope.redirectToOrderDetails = function(orderNo) {
        url = "#/in/orderheaderdetail?";
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);
    } //end of navigating to order detail page

    /* navigating to shipment page from order summary */
    $scope.getShipmentDetails = function(hpdeliveryno,legacyNo) {
        if (hpdeliveryno != "") {
            var shipmenturl = "#/in/shipmentInformation/" + hpdeliveryno +"/"+ legacyNo;
            jQuery(location).attr("href", shipmenturl);
            //window.open(shipmenturl, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
        } else {
            alert("No shipments found");
        }
    } //end of navigating to shipement detail page //end of navigating to shipment page
    $scope.showProductDetails = function(itemNo,orderNo){
        var hpOrderNo = hpyOrderNumber.getHpOrderNo();
        var orderNo = orderNo;
        var productDetailsUrl = "#/in/productDetails/"+orderNo+"/"+itemNo+"/"+hpOrderNo;
        window.open(productDetailsUrl, '_blank', 'width=1200,height=600,toolbar=0,location=0,menubar=0,status=0,title=0,scrollbars=yes,resizable=yes')
    }
}
orderListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle', 'summaryPage', 'searchObject' ,'$compile','createDialog', 'customerrormsgs','hpyOrderNumber','legacyOrderNumber']; // end of order summary controller

/* get order header information from orderDetailRoute service  for order detail page*/
function orderHeaderCtrl($scope, $http, $routeParams, $location, pageTitle,summaryPage,legacyOrder,createDialog,$rootScope,searchObject,hpyOrderNumber,legacyOrderNumber) {
    var hostAddr = $location.host()+":"+$location.port();
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
    jQuery('img.bludbuildflagNoAccnt').live("click", function() {
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

    var surl = URLPrefix($location)+"/ossui/v1/in/orderheaderdetail/?oid=" + orderNo + "&pageId=1";
    //console.log(surl);
    var orderStatus = "";
    var comments = {};
    var commentstr = "";
    var comments_str = "";
    var bloodBuildDelCodes = {};
    var billingCodes = {};
    var billCodes = {};
    var delveryCodes = {};
    var delveryCode = {};
    $scope.cdCodeFlag = false;
    $scope.orderTypeFlag = false;
    //$scope.errMsgFlag = false;
    $("#loader, #overlay").show();

    var httpRequest = $http.get(surl).success(function(data, status)
    {
        if(data.status == "S")
        {
            $scope.taxstatus;
            $scope.taxEstTax;
            $scope.errMsgFlag = true;
            $scope.dealpriceId="";
            $scope.sold=data.header[0].sold_to_attn
            if (data) $scope.orderHeader = data.header[0];
            hpyOrderNumber.setHpOrderNo(data.header[0].hp_order_no);
            $scope.taxval=null
            if($scope.orderHeader.taxValue==0.00){
             $scope.taxval=null;
            }
            if($scope.orderHeader.big_deal_id!=null&&$scope.orderHeader.opg_code!=null){
                $scope.dealpriceId= $scope.orderHeader.big_deal_id+"/"+ $scope.orderHeader.opg_code;
            }
            else if( $scope.orderHeader.big_deal_id==null&& $scope.orderHeader.opg_code!=null){
               $scope.dealpriceId= $scope.orderHeader.opg_code;
            }
            else if($scope.orderHeader.big_deal_id!=null&&$scope.orderHeader.opg_code==null){
               $scope.dealpriceId= $scope.orderHeader.big_deal_id;
            }
            else if( $scope.orderHeader.big_deal_id==null&& $scope.orderHeader.opg_code==null){
               $scope.dealpriceId;
            }
            $scope.originatingsystem="";
            if($scope.orderHeader.submission_method!=null){
                $scope.originatingsystem=$scope.orderHeader.originating_system+"/"+$scope.orderHeader.submission_method;
            }
            else{
                $scope.originatingsystem=$scope.orderHeader.originating_system;
            }
            jQuery("#loader, #overlay").hide();
             if($scope.orderHeader.tax_status_descr!=null){
                $scope.taxstatus=$scope.orderHeader.tax_status+":"+$scope.orderHeader.tax_status_descr;
            }
             else{
                  $scope.taxstatus=$scope.orderHeader.tax_status;
             }
             if($scope.orderHeader.est_tax!=null){
                $scope.taxEstTax=$scope.orderHeader.taxValue+" "+$scope.orderHeader.currency +"/"+$scope.orderHeader.est_tax+""+$scope.orderHeader.currency;
            }
             else{
                  $scope.taxEstTax=$scope.orderHeader.taxValue+""+$scope.orderHeader.currency;
             }
            var legacyOrderNo = data.header[0].oid;
            $scope.setGereenFlage=false;
            if($scope.orderHeader.order_state=="closed"||$scope.orderHeader.order_state=="CLOSED"){
              $scope.setGereenFlage=true;
            }
            legacyOrder.setLegacyorderNo(legacyOrderNo);
            $rootScope.$broadcast('legacyOrderNo', legacyOrderNo);
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
            if(data.header[0].hasOwnProperty("Hold_Codes") == true)
            {
                $scope.holdCodes = data.header[0].Hold_Codes[0].info;
                if (data.header[0].Hold_Codes[0].hasOwnProperty("bBuildCode") == true) {
                    if (data.header[0].Hold_Codes[0].hasOwnProperty("bBuildCode") == true){
                        angular.forEach(data.header[0].Hold_Codes[0].bBuildCode, function(key, val) {
                            bloodBuildDelCodes[key] = val;
                        });
                    }
                    BuildCodelen = checkEmpty(data.header[0].Hold_Codes[0].bBuildCode);
                    if (BuildCodelen ==  true) {
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
            if (data.header[0].hasOwnProperty("Comments") == true)
            {
                angular.forEach(data.header[0].Comments, function(key, val) {
                    if(key.key!=""){
                        if (comments.hasOwnProperty(key.key) == true) {
                            commentstr = "\n" + key.value;
                            //commentstr =  key.value+"<br>";
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
                    //comments_str += val + " : " + key +"<br>";
                    }else{
                    comments_str += key + "\n\r";
                    //comments_str += key +"<br>";
                    }
                });
                $scope.comments = comments_str;
                //$('#commentssection').append("<br/>");
                //console.log( $scope.comments);
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

            //start of billing codes
            if(data.header[0].hasOwnProperty("billing_Codes") == true)
            {
                $scope.billingCodesFlag = true;
                if(data.header[0].billing_Codes[0].hasOwnProperty("info") == true ||
                    data.header[0].billing_Codes[0].hasOwnProperty("hide ") == true)
                    {
                            angular.forEach(data.header[0].billing_Codes[0].info, function(key, val) {
                                billingCodes[key] = val;
                            });
                            angular.forEach(data.header[0].billing_Codes[0].hide, function(key, val) {
                                billingCodes[key] = val;
                            });
                    }
                    if(data.header[0].billing_Codes[0].hasOwnProperty("billCodes") == true)
                    {
                        $scope.billCodesFlag = true;
                        angular.forEach(data.header[0].billing_Codes[0].billCodes, function(key, val) {
                            billCodes[key] = val;
                            billingCodes[key] = val;
                        });
                        billCodelen = checkEmpty(data.header[0].billing_Codes[0].billCodes);
                        if (billCodelen ==  true) {
                            $scope.billCodesFlag = true;
                        }else{
                            $scope.billCodesFlag = false;
                        }
                    }else{
                        $scope.billCodesFlag = false;
                    }
                    $scope.billingCodes = billingCodes;
                    $scope.billCodes = billCodes;
            }else{
                    $scope.billingCodesFlag = false;
                    $scope.billCodesFlag = false;
                }
                //end of billing codes
                //start of delivery blockcodes
            if(data.header[0].hasOwnProperty("delv_Codes") == true)
            {
                $scope.delveryCodesFlag = true;
                if(data.header[0].delv_Codes[0].hasOwnProperty("info") == true ||
                    data.header[0].delv_Codes[0].hasOwnProperty("hide") == true)
                {
                    angular.forEach(data.header[0].delv_Codes[0].info, function(key, val) {
                        delveryCodes[key] = val;
                    });
                    angular.forEach(data.header[0].delv_Codes[0].hide, function(key, val) {
                        delveryCodes[key] = val;
                    });
                    if(data.header[0].delv_Codes[0].hasOwnProperty("delvCodes") == true){
                        angular.forEach(data.header[0].delv_Codes[0].delvCodes, function(key, val) {
                            delveryCodes[key] = val;
                            delveryCode[key] = val;
                        });
                        delveryCodelen = checkEmpty(data.header[0].delv_Codes[0].delvCodes);
                        if (delveryCodelen ==  true) {
                            $scope.delveryCodeFlag = true;
                        } else {
                            $scope.delveryCodeFlag = false;
                        }
                    }else{
                        $scope.delveryCodeFlag = false;
                    }
                    $scope.delveryCodes = delveryCodes;
                    $scope.delveryCode = delveryCode;
                }else{
                    $scope.delveryCodesFlag = false;
                    $scope.delveryCodeFlag = false;
                }
            }else{
                    $scope.delveryCodesFlag = false;
                    $scope.delveryCodeFlag = false;
                }
                //end of delivery blockcodes
            /* display order progression */
            orderStatus = data.header[0].order_overall_status;
            $scope.summerisedStatus = data.header[0].order_overall_status;

            if(data.header[0].order_overall_status=="Shipped") {

                $scope.summerisedStatus="Shipped to Customer";
            }
            if (orderStatus == "CANCELED") {
                $scope.orderStatuses = {
                    "CANCELED": 0
                };
                $scope.canceledFlag = true;
                var statusId = $scope.orderStatuses[orderStatus];
                if (statusId == undefined) statusId = -1;
                $scope.currentStatus = statusId;
            }else{
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
        } else {
            $scope.errMsgFlag = false;
            $scope.errMsg = data.message;
            $("#loader, #overlay").hide();
        }
        //more Details//
        $scope.detailsvalues=[];
        var detailsOfMore={};
        var columnsValues={};
        var moreValues={};
        $scope.showMoreDetails={};
        $scope.showMoreDetailsAdress=[];
        $scope.moreadress=[];
        $scope.showMoreReseleradress=[];
        $scope.showMoreForwarderAdress=[];
        $scope.showmoreDetailFalge=false;
        if(data.header[0].hasOwnProperty("moreDetail") == true)
        {
            $scope.showmoreDetailFalge=true;
            angular.forEach(data.header[0].moreDetail[0],function(key,val){
             if(val=="columns"){
                    angular.forEach(key,function(keys,vals){
                    detailsOfMore[vals]=keys;
                    });
             }
                if(val=="details"){
                    angular.forEach(key,function(k,v){
                    columnsValues[v]=k;
                    });
                }
                /*if(val=="address") {
                    angular.forEach(key,function(k,v){
                    moreValues[v]=k;
                    });
                }*/
            });
            angular.forEach(columnsValues,function(k1,v1){
                angular.forEach(detailsOfMore,function(k2,v2){
                    if(v1==v2) {
                    moreValues[k2]=k1;
                    }
                });
            });
            $scope.showMoreDetails=moreValues;
            $scope.endcustflage=false;
            $scope.reselleraddflage=false;
            $scope.forwarderaddflage=false;

            if($scope.orderHeader.end_cust_addr_no!=null){
                 $scope.endcustflage=true;
                 angular.forEach(data.header[0].moreDetail[0].address,function(adreekey,addressval){
                     if(addressval.match("endCustAddr_")){
                     $scope.showMoreDetailsAdress.push(adreekey);
                     }
                 });
               }
              if($scope.orderHeader.reseller_addr_no!=null){
                   $scope.reselleraddflage=true;
                 angular.forEach(data.header[0].moreDetail[0].address,function(reserllerkey,reserllerval){
                   if(reserllerval.match("resellerAddr_")){
                     $scope.showMoreReseleradress.push(reserllerkey);
                     }
                 });

             }
              if($scope.orderHeader.forwarder_addr_no!=null){
                   $scope.forwarderaddflage=true;
                 angular.forEach(data.header[0].moreDetail[0].address,function(forwarderkey,forwarderval){
                   if(forwarderval.match("forwarderAddr_")){
                     $scope.showMoreForwarderAdress.push(forwarderkey);
                    }
                 });

             }
        }
        $scope.accountdetails=false;
        var AccountDetails={};
        //$scope.showAccountDetails={};
            if(data.header[0].hasOwnProperty("accountDetails") == true){
                $scope.accountdetails=true;
                angular.forEach(data.header[0].accountDetails[0],function(keys,values){

                    AccountDetails[values]=keys;

                  });
                   $scope.showAccountDetails=AccountDetails
            }
        //Hiding the shipment tab based condition SW/HW
        if(data.header[0].om_system == "NGOM-SW"){
            $scope.orderTypeFlag = true;
        }else{
            $scope.orderTypeFlag = false;
        }

    }).error(function(data, status) {
                /*console.log('error');
                console.log(JSON.stringify(data));
                console.log('status');
                console.log(status);*/
                $("#loader, #overlay").hide();
    });
    $scope.backToSummary =function()
    {
        var searchObj = searchObject.getSearchObject();
        $scope.hpOrderNo = searchObj.hpOrderNo;
        $scope.poNo = searchObj.custPoNo;
        $scope.shipmentNo = searchObj.shipmentNo;
        $scope.orderFromDp = searchObj.poDateFrom;
        $scope.orderToDp = searchObj.poDateTo;
        $scope.customer = searchObj.custId;
        $scope.customerName = searchObj.custName;
        $scope.orderStatusSelected = searchObj.status;
        $scope.invoiceNo = searchObj.invoiceNo;
        $scope.orderTypeSelected = searchObj.type;
        $scope.sapOrderNo = searchObj.soNo;
        $scope.orderOrigin = searchObj.origin;
        $scope.salesAdmin = searchObj.csr;
        $scope.advancedFlag=searchObj.advancedFlag;
        $scope.searchByNumber=searchObj.searchByNumber;
        $scope.searchByCodes=searchObj.searchByCode;
        $scope.searchStatus=searchObj.SearchByStatuses;
        $scope.searchLocation=searchObj.SearchByLocationType;
        $scope.repositoryValue=searchObj.repository;
        $scope.searchDates=searchObj.SearchByDates;
        $scope.searchAmount=searchObj.SearchTotalOrderAmount;
        $scope.groupby=searchObj.group;
        $scope.byDate=searchObj.byDate;
        $scope.sDate0=searchObj.sDate0;
        $scope.eDate0=searchObj.eDate0;
        $scope.byAmount=searchObj.byAmount;
        $scope.searchtotal=searchObj.searchtotal;
        $scope.amounttax0=searchObj.amounttax0;
        $scope.byLocation=searchObj.byLocation;
        $scope.state0=searchObj.state0;
        $scope.location0=searchObj.location0;
        $scope.country0=searchObj.country0;
        $scope.byCodes0=searchObj.byCodes0;
        $scope.searchCodes0=searchObj.searchCodes0;

        var searchData = {
            "hpOrderNo" :$scope.hpOrderNo,
            "custPoNo":$scope.poNo,
            "custId":$scope.customer,
            "custName":$scope.customerName,
            "shipmentNo":$scope.shipmentNo,
            "invoiceNo":$scope.invoiceNo,
            "status":$scope.orderStatusSelected,
            "poDateFrom":$scope.orderFromDp,
            "poDateTo":$scope.orderToDp,
            "soNo":$scope.sapOrderNo,
            "csr":$scope.salesAdmin,
            "type":$scope.orderTypeSelected,
            "origin":$scope.orderOrigin,
            "searchByNumber":$scope.searchByNumber,
            "searchByCode":$scope.searchByCodes,
            "group":$scope.groupby,
            "SearchByStatuses":$scope.searchStatus,
            "SearchByLocationType":$scope.searchLocation,
            "repository":$scope.repositoryValue,
            "SearchByDates":$scope.searchDates,
            "SearchTotalOrderAmount":$scope.searchAmount,
            "advancedFlag":$scope.advancedFlag,
            "byDate":$scope.byDate,
            "sDate0":$scope.sDate0,
            "eDate0":$scope.eDate0,
            "byAmount":$scope.byAmount,
            "searchtotal":$scope.searchtotal,
            "amounttax0":$scope.amounttax0,
            "state0":$scope.state0,
            "byLocation":$scope.byLocation,
            "location0":$scope.location0,
            "country0":$scope.country0,
            "byCodes0":$scope.byCodes0,
            "searchCodes0":$scope.searchCodes0

        }
            $rootScope.$broadcast('summarySearchData', searchData);
            url = "#/in/orderSummary";
            jQuery(location).attr("href", url);
    }
}
orderHeaderCtrl.$inject = ['$scope', '$http', '$routeParams', '$location', 'pageTitle','summaryPage','legacyOrder','createDialog','$rootScope','searchObject','hpyOrderNumber','legacyOrderNumber']; //end of order detail header controller


/* get line item details for order from orderDetailPage service in order detail page */
function lineItemListCtrl($scope, $filter, $http, $routeParams, $rootScope, $location,$compile,hpyOrderNumber){
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
    jQuery('.udf_details').live("click", function() {
        jQuery(this).parent().find('.udfDetails').show();
    });
    jQuery('a.closeBtn').live("click", function() {
        jQuery('.udfDetails').hide();
    });
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
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var surl = URLPrefix($location)+"/ossui/v1/in/newitemdetail?oid="+$routeParams.orderNo;
    var items = {
        data: []
    };
    $scope.showNonBundle=false;
    $http.get(surl).success(function(data, status)
    {
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
        angular.forEach(data.data, function(key,bundleNonBundlearray)
        {
            if(bundleNonBundlearray == "NoBundle_total_price"){
                $scope.NoBundleTotalPrice = key;
            }
            var bundleprice = bundleNonBundlearray;
            var patt = /_total_price/g;
            var result = patt.test(bundleNonBundlearray);
            $scope.showBundleDetails = function(name)
            {
                var patt = /_total_price/g;
                var result1 = patt.test(name);
                if(name == "NoBundle" || name == "NoBundle_total_price" || result1 ==true){
                    return false;
                }else{
                    return true;
                    }
            }
            if(bundleNonBundlearray!="NoBundle" && bundleNonBundlearray!= "NoBundle_total_price" && result!=true)
            {
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
                angular.forEach(key,function(attr,key1)
                {
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
                    var last_price_date = "";
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
                    if(attr.last_price_date == "null"){
                        last_price_date = "";
                    }else{
                        last_price_date = attr.last_price_date;
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
                                    'currency': attr.currency,
                                    'cancellationReason':attr.cancellation_reason,
                                    'itemCanceledOn':attr.canceled_at,
                                    'higherLevel': attr.higher_level,
                                    'productCharacteristics': attr.product_chars,
                                    'scCommitDate':attr.sc_commit_date,
                                    'entitlementID':entitlement_id,
                                    'billingPlan':billing_plan,
                                    'factShippedDate':factory_shipped_date,
                                    'actualCustShipDate':actual_customer_ship_date,
                                    'lastPriceDate':last_price_date,
                                    'udfText':udf_text,
                                    'udfTextFlag':udfTextFlag,
                                    'showBundleKey':showBundleKey,
                                    'showBundleProductCharFlag':showProdFlag,
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
            if(mode){
                if (mode == 'e') {
                    $scope[panelName] = true;
                } else {
                    $scope[panelName] = false;
                }
            }
            if($scope[panelName])
            {
                var deliveryGroupscls = "#bundleChild"+level;
                $scope.el = $compile(deliveryGroupscls)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
                var childElements = $scope.bundleGroups[level];
                angular.forEach(childElements,function(key,value)
                {
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
        if(data.data.NoBundle.length > 0)
        {
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
            $filter('filter')(data.data.NoBundle, function(attr)
            {
                var counter = 0;
                var entitlement_id = "";
                var billing_plan = "";
                var factory_shipped_date = "";
                var actual_customer_ship_date = "";
                var last_price_date = "";
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
                if(attr.last_price_date == "null"){
                    last_price_date = "";
                }else{
                    last_price_date = attr.last_price_date;
                }
                $filter('filter')(attr.sched_Line, function(subAttr)
                {
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
                            'currency': attr.currency,
                            'cancellationReason':attr.cancellation_reason,
                            'itemCanceledOn':attr.canceled_at,
                            'higherLevel': attr.higher_level,
                            'productCharacteristics': attr.product_chars,
                            'scCommitDate':attr.sc_commit_date,
                            'billingPlan':billing_plan,
                            'entitlementID':entitlement_id,
                            'factShippedDate':factory_shipped_date,
                            'actualCustShipDate':actual_customer_ship_date,
                            'udfText':udf_text,
                            'udfTextFlag':udfTextFlag,
                            'lastPriceDate':last_price_date,
                            'showProductCharFlag':showProdFlag,
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
    $scope.showChildElements = function(panelName,level, mode)
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
    $scope.showImage = function(itemVal)
    {
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
    var hpOrderNo = hpyOrderNumber.getHpOrderNo();
    $scope.showProductDetails = function(itemNo){
            var orderNo = $routeParams.orderNo;
            var productDetailsUrl = "#/in/productDetails/"+orderNo+"/"+itemNo+"/"+hpOrderNo;
            window.open(productDetailsUrl, '_blank', 'width=1200,height=600,toolbar=0,location=0,menubar=0,status=0,title=0,scrollbars=yes,resizable=yes')
    }

    /* to display entitlements details */
    $scope.openEntitlementsDetails = function(orgid, entitlement_id) {

        var entitlementUI_url = $rootScope.Config.links.EntitlementViewURL;

        entitlementUI_url += '&OrgId='+encodeURIComponent(orgid) + '&entitlement_id='+encodeURIComponent(entitlement_id);
        window.open( entitlementUI_url, '_blank', 'width=1100,height=800,toolbar=0,location=0,menubar=1,status=0,title=0')
    }


    $scope.searchInvoice = function(invoiceNo, fullInvoiceNo, system)
    {
        if (invoiceNo != "") {
            url = URLPrefix($location)+"/ossui/v1/in/invoice?" + "order_no=" + hpOrderNo + "&invoice_no=" +
                invoiceNo + "&full_invoice_no=" + fullInvoiceNo + "&data_source=" + system;
            jQuery(location).attr("href", url);
        }
    }
    $scope.nonBundleItems=items.data;
    //start of navigating to shipement detail page
    $scope.getShipmentDetails = function(hpdeliveryno,legacyNo) {
        if (hpdeliveryno != "") {
            var shipmenturl = "#/in/shipmentInformation/" + hpdeliveryno+"/"+legacyNo;
            jQuery(location).attr("href", shipmenturl);
            //window.open(shipmenturl, '_blank', 'width=800,height=500,toolbar=0,location=0,menubar=0,status=0,title=0')
        } else {
            alert("No shipments found");
        }
    } //end of navigating to shipement detail page
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
            $scope.el.attr("title","Show product characteristics");
        }
    }
}
lineItemListCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location','$compile','hpyOrderNumber']; //end of line items for order

/* get shipment information from shipmentDetailRoute service */

function trackingListCtrl($scope, $http, $routeParams, $rootScope, $location,legacyOrderNumber) {
    var hpdeliveryno = $routeParams.hpdeliveryno;

    $scope.showColSort = function() {};
    if (hpdeliveryno && hpdeliveryno != "") {
        var surl = URLPrefix($location)+"/ossui/v1/in/shipmentdetail/" + hpdeliveryno;
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
trackingListCtrl.$inject = ['$scope', '$http', '$routeParams', '$rootScope', '$location','legacyOrderNumber']; // end of shipment information

/* get shipment header details */

function shipmentHeaderCtrl($scope, $routeParams, pageTitle,legacyOrderNumber) {
    pageTitle.setTitle('Shipment Detail');
    $scope.addOneFlag = false;
    $scope.addTwoFlag = false;
    $scope.addThreeFlag = false;
    $scope.addFourFlag = false;
    $scope.addFiveFlag = false;
    $scope.addSixFlag = false;
    $scope.addSevenFlag = false;
    $scope.multiOrderFlag=false;
    var addFourLen = 0;
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
    $scope.redirectToOrderDetails = function(legacyOrderNo) {
        url = "#/in/orderheaderdetail?";
        console.log(legacyOrderNo);
        var urlParams = "orderNo=" + legacyOrderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);
    }
}
shipmentHeaderCtrl.$inject = ['$scope','$routeParams', 'pageTitle']; //end of shipment header details

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

function homeCtrl($scope, $location, $routeParams, $http, pageTitle, $rootScope, searchObject, $filter) {
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
                } else {
                    $scope.searchOrder(order);
                }
            }
        }
    }
     /*$scope.redirectToOrderSummary = function() {
            url = "#/in/orderSummary";
            jQuery(location).attr("href", url);
        }*/

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
        $scope.hpOrderNo = undefined;
        $scope.custPoNo = undefined;
        $scope.shipmentNo = undefined;
        $scope.custId = undefined;
        $scope.custName = undefined;
        $scope.status = undefined;
        $scope.poDateFrom = undefined;
        $scope.poDateTo = undefined;
        $scope.recentOrders = undefined;
        $scope.invoiceNo = undefined;
        $scope.sapOrderNo = undefined;
        $scope.salesAdmin = undefined;
        $scope.orderTypeSelected = undefined;
        $scope.orderOrigin = undefined;
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
            $scope.poDateFrom= order.orderFromDp;
            $scope.poDateTo= order.orderToDp;
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
            "shipmentNo":$scope.shipmentNo,
            "status":$scope.status,
            "poDateFrom":poDateFrom,
            "poDateTo":poDateTo,
            "recentOrders":$scope.recentOrders,
            "invoiceNo":$scope.invoiceNo,
            "soNo":$scope.sapOrderNo,
            "csr":$scope.salesAdmin,
            "type":$scope.orderTypeSelected,
            "origin":$scope.orderOrigin
        }
        searchObject.setSearchObject(searchData);
        url = "#/in/orderSummary";
        jQuery(location).attr("href", url);
    }

    $scope.searchUser = function() {
        url = "#/viewReports";
        jQuery(location).attr("href", url);
    }
    $scope.showCol = false;
    $scope.showColSort = function() {};
    /* displaying column names for last view orders page*/
    $scope.columnNames = [
        {
            'id': 'orderNo',
            'value': 'HP Order#',
            "sort": "true"
        },{
            'id': "purchaseOrderNo",
            'value': "PO#",
            "sort": "true"
        }, {
            'id': 'status',
            'value': 'Order Status',
            "sort": "true"
        },{
            'id': 'customerName',
            'value': 'Customer Name',
            "sort": "true"
        },{
            'id': 'customerNo',
            'value': 'Customer#',
            "sort": "true"
        },{
            'id': 'orderType',
            'value': 'Order Type',
            "sort": "true"
        },{
            'id': 'totalPrice',
            'value': 'Total Price',
            "sort": "true"
        },{
            'id': 'currency',
            'value': 'Currency',
            "sort": "true"
        },{
            'id': 'lastChange',
            'value': 'Last Change',
            'format': 'date',
            "sort": "true"
        }
    ];
    $rootScope.$broadcast('columnNames', $scope.columnNames); // end of column names

    var lastViewOrdersurl = URLPrefix($location)+"/ossui/v1/in/myLastViwedOrders";
    $("#loader, #overlay").show();
    $scope.showLastViewOrdersFlag = false;
    $http.get(lastViewOrdersurl).success(function(data, status) {
        $("#loader, #overlay").hide();
        $scope.lastvieworders = data.data;
        if(data.data.length > 0){
            $scope.showLastViewOrdersFlag = true;
        }else{
            $scope.showLastViewOrdersFlag = false;
            }
        $rootScope.$broadcast('lastvieworders', $scope.lastvieworders);
    }).error(function (data, status, headers, config) {
        $("#loader, #overlay").hide();
    });
}
homeCtrl.$inject = ['$scope', '$location', '$routeParams', '$http', 'pageTitle', '$rootScope','searchObject','$filter'];

function refineSearchCtrl($rootScope, $scope, $location, $routeParams, $http, $route, createDialog,searchObject,$compile) {
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    $scope.selectallarays=[];
    var searchObj = searchObject.getSearchObject();
    $scope.hpOrderNo = searchObj.hpOrderNo;
    $scope.poNo = searchObj.custPoNo;
    $scope.shipmentNo = searchObj.shipmentNo;
    $scope.orderFromDp = searchObj.poDateFrom;
    $scope.orderToDp = searchObj.poDateTo;
    $scope.customer = searchObj.custId;
    $scope.customerName = searchObj.custName;
    $scope.invoiceNo = searchObj.invoiceNo;
    $scope.sapOrderNo = searchObj.soNo;
    $scope.salesAdmin = searchObj.csr;
    $scope.orderTypeSelected = searchObj.type;
    $scope.orderOrigin = searchObj.origin;
    var fieldsUrl = URLPrefix($location)+"/ossui/v1/in/advanceSearchFields";
    jQuery("#loader, #overlay").show();
    $http.get(fieldsUrl).success(function(data, status) {
        if(searchObj == undefined || searchObj == ""){
            jQuery("#loader, #overlay").hide();
        }
        $scope.orderOriginList = function(){
            $scope.originSystemList = [];
            $scope.subMethodList = [];
            $scope.oeSystemList = [];
            $scope.ofSystemList = [];
            angular.forEach(data.data.fields.OrderOrigin.OriginatingSystem,function(name,val){
                var osObj = {
                    "name": name,
                    "val": val
                };
                $scope.originSystemList.push(osObj);
            });
            angular.forEach(data.data.fields.OrderOrigin.SubmissionMethod,function(name,val){
                    var osObj = {
                    "name": name,
                    "val": val
                };
                $scope.subMethodList.push(osObj);
            });
            angular.forEach(data.data.fields.OrderOrigin.OESystem,function(name,val){
                    var osObj = {
                    "name": name,
                    "val": val
                };
                $scope.oeSystemList.push(osObj);
            });
            angular.forEach(data.data.fields.OrderOrigin.OFSystem,function(name,val){
                var osObj = {
                    "name": name,
                    "val": val
                };
                $scope.ofSystemList.push(osObj);
            });

            createDialog('partials/orderOrigin.html', {
              id: 'orderOrigin',
              backdrop: true,
              scope:$scope,
              success: {label: 'Success', fn: function() {
                    $scope.orderOrigin = this.orderOrigin;
                    $rootScope.$broadcast('orderOriginVal', $scope.orderOrigin);
                }}
            });
        }

        $scope.orderType = data.data.fields.OrderType;
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
        $scope.headerStatusList = [];
        angular.forEach(data.data.fields.OrderStatus.ShipInvoiceStatus,function(name,val){
                var osObj = {
                "name": name,
                "val": val
            };
            $scope.shipInvStatusList.push(osObj);
        });
        angular.forEach(data.data.fields.OrderStatus.HeaderStatus,function(name,val){
                var osObj = {
                "name": name,
                "val": val
            };
            $scope.headerStatusList.push(osObj);
        });

        // Advanced search
        $scope.countries = {};
        $scope.rowCount=1;
        $scope.rowCountNum=1;
        $scope.rowCountCode=1;
        $scope.rowCountLoc=1;
        $scope.rowCountCountry=1;
        $scope.rowCountDate=1;
        $scope.rowCountAmt=1;
        $scope.paymentMethod = [];
        $scope.total=[];
        $scope.codesFlag=false;
        $scope.statusFlag=false;

        $scope.SearchbyNumbers  =   data.data.fields.SearchByNumbers;
        $scope.SearchbyCodes    =   data.data.fields.SearchByCodes;
        $scope.SearchbyDates    =   data.data.fields.SearchByDates;
        $scope.SearchbyStatus   =   data.data.fields.SearchByStatuses;
        $scope.SearchbyAmount   =   data.data.fields.SearchTotalOrderAmount;
        $scope.Tax              =   data.data.fields.SearchTotalOrderAmount.TotalAmountInclTax;
        $scope.SearchbyLocation =   data.data.fields.SearchByLocationType;
        $scope.SearchbyPortal   =   data.data.fields.PortalUserID;
        $scope.searchbyGroups   =   data.data.fields.GroupFilter;
        $scope.repository       =   data.data.fields.Repository;
        $scope.countryCodes={};
        angular.forEach(Object.keys($scope.SearchbyLocation["ShipToRegionState"]),function(countryCode) {
            $scope.SearchbyLocation["ShipToRegionState"][countryCode]["country"];
            $scope.countryCodes[countryCode]=$scope.SearchbyLocation["ShipToRegionState"][countryCode]["country"];
        });
        $scope.searchByNumbers={};
        $scope.searchByCodes={};
        $scope.groupby={};
        $scope.searchByPortal={};
        $scope.searchByLocation={};
        $scope.searchByStatus={};
        $scope.searchByDates={};
        $scope.searchByAmount={};

        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().searchByNumber==undefined){
            $scope.defaultNum="web_order_no";
            $scope.searchByNumbers['searchName0']= $scope.defaultNum;
        }
        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().searchByCode==undefined){
            $scope.defaultCodes="TelewebAgentID";
            $scope.searchByCodes['searchName0']=$scope.defaultCodes;
        }
        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().group==undefined){
            $scope.defaultgroupby=  'all';
            $scope.groupby=$scope.defaultgroupby;
        }
        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().repository==undefined){
            $scope.defaultresp = 'all';
            $scope.repositoryValue=$scope.defaultresp
        }
        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().SearchByStatuses==undefined){
            $scope.defaultStatus="Sapuserstatus";
            $scope.searchByStatus['searchName0']=$scope.defaultStatus;
        }
        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().SearchByDates==undefined){
            $scope.defaultDate="orderDate";
            $scope.searchByDates['searchName0']=$scope.defaultDate;
        }
        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().SearchByLocationType==undefined){
            $scope.defaultLocation="OMRegion";
            $scope.searchByLocation['searchName0']=$scope.defaultLocation;
        }
        if(searchObject.getSearchObject()=="" || searchObject.getSearchObject().SearchTotalOrderAmount==undefined){
            $scope.defaultAmount="TotalAmountInclTax";
            $scope.searchByAmount['searchName0']=$scope.defaultAmount;
            $scope.defaultTax="approx_with_comma";
            $scope.searchByAmount['searchNum0']=$scope.defaultTax;
        }


        $scope.getHelp = function(text){
            if(text=="numbers"){
                var helpURL =  "#/in/numbers";
            } else if(text=="codes"){
                var helpURL =  "#/in/codes";
            } else if(text=="status"){
                var helpURL =  "#/in/status";
            } else if(text=="dates"){
                var helpURL =  "#/in/dates";
            } else if(text=="amount"){
                var helpURL =  "#/in/amount";
            } else {
                return false;
            }
            window.open(helpURL,'_blank','width=800,height=500,toolbar=0,location=0,menubar=0');
        }

        $scope.searhByCodes = function(){
            $scope.data="";
            $scope.paymentMethod = [];
            angular.forEach($scope.searchByCodes,function(key,val){
                var sIndex="searchName"+($scope.rowCountCode-1);
                if(val==sIndex){
                    $scope.codeName = key;
                    if(data.data.fields.SearchByCodes[key].length !=0) {
                        $scope.codesFlag=true;
                        angular.forEach(data.data.fields.SearchByCodes[key],function(name,val){
                            var payObj = {
                                "name": name,
                                "val": val
                            };
                            $scope.paymentMethod.push(payObj);
                        });
                    }else{
                        $scope.codesFlag=false;
                    }
                }
            });
            createDialog('partials/searchbyCodes.html', {
                id: 'codes',
                backdrop: true,
                scope:$scope,
                success: {label: 'Success', fn: function() {
                    var regionVal = jQuery("#codes #codesvalue").val();
                    var str="";
                    angular.forEach(regionVal,function(key,val){
                        str=str+key+",";
                    });
                    str=str.substr(0,str.length-1);
                    $scope.searchByCodes["searchNum"+($scope.rowCountCode-1)]=str;
                }}
            });
        }

        $scope.searchbyStatus = function(){
            $scope.statusFlag = false;
            $scope.statusList = [];
            $scope.selectallarays =[];

            angular.forEach($scope.searchByStatus,function(key,val){
                var sIndex="searchName0";
                if(val==sIndex){

                    $scope.data= data.data.fields.SearchByStatuses[key];
                    $scope.statusName = key;
                    if($scope.data.length !=0 || $scope.data != undefined) {
                        $scope.statusFlag=true;
                        $scope.showorderEntry=data.data.fields.SearchByStatuses.UserStatusCategory.OrderEntry;
                        $scope.showShippingOrder=data.data.fields.SearchByStatuses.UserStatusCategory.Shipping;
                        $scope.showBillingOrder=data.data.fields.SearchByStatuses.UserStatusCategory.Billing;
                        $scope.showfallouts=data.data.fields.SearchByStatuses.UserStatusCategory.FallOut;
                        $scope.showstatus=data.data.fields.SearchByStatuses.UserStatusCategory.Status;
                        $scope.showFactoryfullments=data.data.fields.SearchByStatuses.UserStatusCategory.FactoryFulfillment;
                    } else {
                        $scope.statusFlag=false;
                    }
                }
            });

            $scope.singlesel=function(test,val){
                if(test==true){
                 $scope.selectallarays.push(val);
                }else{
                    var idx = $scope.selectallarays.indexOf(val);
                    if (idx > -1) {
                      $scope.selectallarays.splice(idx, 1);
                    }
                }
            }
            $scope.orderEntrySel=function(){
                $scope.selectallarays =[];
                jQuery('div.showorderEntry input').attr('checked', true);
                if (jQuery('#orderentryid').is(':checked')) {
                    var inputs = jQuery('div.showorderEntry input').attr('checked', true);
                    var checkboxes = [];
                    $scope.selectallarays =[];
                    for (var i = 0; i < inputs.length; i++) {
                        if (inputs[i].type == "checkbox") {
                            inputs[i].checked = true;
                            $scope.selectallarays.push(inputs[i].value);
                        }else{
                            var idx = $scope.selectallarays.indexOf(val);
                            if (idx > -1) {
                                $scope.selectallarays.splice(idx, 1);
                            }
                        }
                        $scope.$broadcast('arrayselected', $scope.selectallarays);
                    }
                } else {
                    jQuery('div.showorderEntry input').attr('checked', false);
                }
            }
            $scope.factoryFulfillmentSel=function(){
                $scope.selectallarays =[];
                jQuery('div.showfactory input').attr('checked', true);
                if (jQuery('#factoryfullfilment').is(':checked')) {
                    var inputs = jQuery('div.showfactory input').attr('checked', true);
                    var checkboxes = [];
                    $scope.selectallarays =[];
                    for (var i = 0; i < inputs.length; i++) {
                        if (inputs[i].type == "checkbox") {
                            inputs[i].checked = true;
                            $scope.selectallarays.push(inputs[i].value);
                        }else{
                            var idx = $scope.selectallarays.indexOf(val);
                            if (idx > -1) {
                                $scope.selectallarays.splice(idx, 1);
                            }
                        }
                        $scope.$broadcast('arrayselected', $scope.selectallarays);
                    }
                } else {
                    jQuery('div.showfactory input').attr('checked', false);
                }
            }
            $scope.shipmentSel=function(){
                $scope.selectallarays =[];
                jQuery('div.shipid input').attr('checked', true);
                if (jQuery('#mainid').is(':checked')) {
                    var inputs = jQuery('div.shipid input').attr('checked', true);
                    var checkboxes = [];
                    $scope.selectallarays =[];
                    for (var i = 0; i < inputs.length; i++) {
                        if (inputs[i].type == "checkbox") {
                            inputs[i].checked = true;
                            $scope.selectallarays.push(inputs[i].value);
                        }else{
                            var idx = $scope.selectallarays.indexOf(val);
                            if (idx > -1) {
                                $scope.selectallarays.splice(idx, 1);
                            }
                        }
                        $scope.$broadcast('arrayselected', $scope.selectallarays);
                    }
                } else {
                    jQuery('div.shipid input').attr('checked', false);
                }
            }
            $scope.billingSel=function(){
                $scope.selectallarays =[];
                jQuery('div.bills input').attr('checked', true);
                if (jQuery('#mainids').is(':checked')) {
                    var inputs = jQuery('div.bills input').attr('checked', true);
                    var checkboxes = [];
                    $scope.selectallarays =[];
                    for (var i = 0; i < inputs.length; i++) {
                        if (inputs[i].type == "checkbox") {
                            inputs[i].checked = true;
                            $scope.selectallarays.push(inputs[i].value);
                        }else{
                            var idx = $scope.selectallarays.indexOf(val);
                            if (idx > -1) {
                                $scope.selectallarays.splice(idx, 1);
                            }
                        }
                        $scope.$broadcast('arrayselected', $scope.selectallarays);
                    }
                } else {
                    jQuery('div.bills input').attr('checked', false);
                }
            }
            $scope.statusSel=function(){
                $scope.selectallarays =[];
                jQuery('div.showstatus input').attr('checked', true);
                if (jQuery('#showstatusid').is(':checked')) {
                    var inputs = jQuery('div.showstatus input').attr('checked', true);
                    var checkboxes = [];
                    $scope.selectallarays =[];
                    for (var i = 0; i < inputs.length; i++) {
                        if (inputs[i].type == "checkbox") {
                            inputs[i].checked = true;
                            $scope.selectallarays.push(inputs[i].value);
                        }else{
                            var idx = $scope.selectallarays.indexOf(val);
                            if (idx > -1) {
                                $scope.selectallarays.splice(idx, 1);
                            }
                        }
                        $scope.$broadcast('arrayselected', $scope.selectallarays);
                    }
                } else {
                    jQuery('div.showstatus input').attr('checked', false);
                }
            }
            $scope.falloutSel=function(){
                $scope.selectallarays =[];
                jQuery('div.fallouts input').attr('checked', true);
                if (jQuery('#falloutsids').is(':checked')) {
                    var inputs = jQuery('div.fallouts input').attr('checked', true);
                    var checkboxes = [];
                    $scope.selectallarays =[];
                    for (var i = 0; i < inputs.length; i++) {
                        if (inputs[i].type == "checkbox") {
                            inputs[i].checked = true;
                            $scope.selectallarays.push(inputs[i].value);
                        }else{
                            var idx = $scope.selectallarays.indexOf(val);
                            if (idx > -1) {
                                $scope.selectallarays.splice(idx, 1);
                            }
                        }
                        $scope.$broadcast('arrayselected', $scope.selectallarays);
                    }
                } else {
                    jQuery('div.fallouts input').attr('checked', false);
                }
            }
            createDialog('partials/searchByStatus.html', {
              id: 'statusList',
              backdrop: true,
              scope:$scope,
              success: {label: 'Success', fn: function() {
                var str="";
                    angular.forEach($scope.selectallarays,function(key,val){
                       str=str+key+",";
                    });
                    str=str.substr(0,str.length-1);
                    $scope.searchByStatus.searchNum0=str;

                }}
            });
        }

        $scope.searchByShipRegion = function(){
            $scope.states={};
            angular.forEach($scope.searchByLocation,function(key,val){
            var sIndex="searchCountry"+($scope.rowCountLoc-1);
                if(val==sIndex){
                    $scope.data   = data.data.fields.SearchByLocationType["ShipToRegionState"][key];
                    if(Object.keys($scope.data.state).length !=0){
                        angular.forEach($scope.data,function(key,val){
                            $scope.statesList=key;
                        });
                        createDialog('partials/searchbyStates.html', {
                            id: 'statList',
                            backdrop: true,
                            scope:$scope,
                            success: {label: 'Success', fn: function() {
                                var regionVal = jQuery("#statList #statesvalue").val();
                                var str="";
                                angular.forEach(regionVal,function(key,val){
                                    str=str+key+",";
                                });
                                str=str.substr(0,str.length-1);
                                $scope.searchByLocation["searchNum"+($scope.rowCountLoc-1)]=str;
                            }}
                        });
                    } else {
                        alert("No States Found");
                    }
                }
            });
        }
        $scope.checkAll=function(){
            var inputs = document.getElementsByTagName("input");
            var checkboxes = [];
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].type == "checkbox") {
                    inputs[i].checked = true;
                    $scope.selectallarays.push(inputs[i].value);
                }
                $scope.$broadcast('arrayselected', $scope.selectallarays);
            }
        }

        $scope.resetAll=function(){
            var inputs = document.getElementsByTagName("input");
            var checkboxes = [];
            for (var i = 0; i < inputs.length; i++) {
                if (inputs[i].type == "checkbox") {
                    inputs[i].checked = false;
                     var idx = $scope.selectallarays.indexOf(inputs[i].value);
                    if (idx > -1) {
                        $scope.selectallarays.splice(idx, 1);
                    }
                }
            }
        }

        $scope.searchByLoc = function(){
            $scope.searchcountry={};
            $scope.locList=[];
            $scope.locFlag=false;
            $scope.shipToFlag=false;

            angular.forEach($scope.searchByLocation,function(key,val){

                var sIndex="searchName"+($scope.rowCountLoc-1)
                if(val==sIndex){
                    $scope.data   = data.data.fields.SearchByLocationType[key];
                    $scope.LocName = key;
                    if($scope.data !=undefined ) {
                        $scope.locFlag=true;
                        angular.forEach($scope.data,function(name,val){
                            if(val!="$$hashKey"){
                                var countryObj = {
                                    "name": name,
                                    "val": val
                                };
                                $scope.locList.push(countryObj);
                            }
                        });
                        createDialog('partials/searchByLoc.html', {
                            id: 'countryList',
                            backdrop: true,
                            scope:$scope,
                            success: {label: 'Success', fn: function() {
                                var regionVal = jQuery("#countryList #selectedlookup").val();
                                $scope.regionVal=regionVal;
                                var str="";
                                angular.forEach(regionVal,function(key,val){
                                    str=str+key+",";
                                });
                                str=str.substr(0,str.length-1);
                                $scope.searchByLocation["searchNum"+($scope.rowCountLoc-1)]=str;
                            }}
                         })
                    } else {
                        alert("No Location Found");
                        $scope.locFlag=false;
                    }
                }
            });
        }

        $scope.searchByCountry=function(value){
            $scope.shipToFlag=false;
            var countryCodes={};
            angular.forEach($scope.searchByLocation,function(key,val){
                var sIndex="searchName"+(value);
                    if(val==sIndex){
                        if(key=="ShipToRegionState"){
                            $scope["shipToFlag"+(value)]=true;
                        } else {
                            $scope["shipToFlag"+(value)]=false;
                        }
                    }
            });
        }

        $scope.lookupValues = function(index){
            $scope.lookupFlag=false;
            angular.forEach($scope.searchByCodes,function(key,val){
                var sIndex="searchName"+($scope.rowCountCode-1)
                if(val==sIndex){
                    if(data.data.fields.SearchByCodes[key].length !=0) {
                        $scope["lookupFlag"+($scope.rowCountCode-1)]=true;
                    } else {
                        $scope["lookupFlag"+($scope.rowCountCode-1)]=false;
                    }
                }
            });
        }
        $scope.lookupStatus = function(){
            $scope.lookupStatusFlag=false;
            angular.forEach($scope.searchByStatus,function(key,val){
                var sIndex="searchName0";
                if(val==sIndex){
                    if(data.data.fields.SearchByStatuses[key].length !=0) {
                        $scope.lookupStatusFlag=true;
                    } else {
                        $scope.lookupStatusFlag=false;
                    }
                }
            });
        }
        // End of advanced search

        $scope.$on('orderOriginVal', function(events, data) {
            $scope.orderOrigin = data;
        });

        $scope.$on('dataflag', function(events, data) {
            $scope.dataflag = data;
        });

        $scope.advSearch = false;
        $scope.redirectToAdvSearch = function() {
            $scope.advSearch = true;
        }
        $scope.redirectToStdSearch = function() {
            $scope.advSearch = false;
        }

        //to retain values for advanced search from detail
        var searchFlag = searchObject.getSearchObject();
        $scope.advancedFlag = searchFlag.advancedFlag;

        if($scope.advancedFlag==true){
            $scope.advSearch = true;
            $scope.searchAdvObj= searchObject.getSearchObject();

            if($scope.searchAdvObj.searchByNumber !=undefined){
                angular.forEach(Object.keys($scope.searchAdvObj.searchByNumber),function(numSelected){
                    $scope.searchByNumbers={};
                    $scope.defaultNum=numSelected;
                    $scope.searchByNumbers['searchName0']= $scope.defaultNum;
                    $scope["searchByNumbers"].searchNum0=$scope.searchAdvObj.searchByNumber[numSelected][0];
                });
            }
            if($scope.searchAdvObj.searchByCode !=undefined){
                $scope.defaultCodes=$scope.searchAdvObj.byCodes0;
                $scope.searchByCodes['searchName0']= $scope.defaultCodes;
                $scope["searchByCodes"].searchNum0=$scope.searchAdvObj.searchCodes0;
                /*angular.forEach(Object.keys($scope.searchAdvObj.searchByCode),function(codeSelected){
                    $scope.searchByCodes={};
                    $scope.defaultCodes=codeSelected;
                    $scope.searchByCodes['searchName0']= $scope.defaultCodes;
                    $scope["searchByCodes"].searchNum0=$scope.searchAdvObj.searchByCode[codeSelected];
                });*/
            }
            $scope.defaultgroupby=$scope.searchAdvObj.group;
            $scope.groupby = $scope.defaultgroupby;

            if($scope.searchAdvObj.SearchByStatuses !=undefined){
                angular.forEach(Object.keys($scope.searchAdvObj.SearchByStatuses),function(statusSelected){
                    $scope.searchByStatus={};
                    $scope.defaultStatus=statusSelected;
                    $scope.searchByStatus['searchName0']=$scope.defaultStatus;
                    $scope["searchByStatus"].searchNum0=$scope.searchAdvObj.SearchByStatuses[statusSelected];
                });
            }
            if($scope.searchAdvObj.SearchByLocationType !=undefined){
                if($scope.searchAdvObj.byLocation=='ShipToRegionState'){
                    $scope.shipToFlag0=true;
                    $scope.defaultLocation=$scope.searchAdvObj.byLocation;
                    $scope.searchByLocation['searchName0']=$scope.defaultLocation;

                    $scope.defaultState=$scope.searchAdvObj.state0;
                    $scope["searchByLocation"].searchCountry0=$scope.defaultState;
                    $scope["searchByLocation"].searchNum0=$scope.searchAdvObj.location0;
                } else {
                    $scope.shipToFlag0=false;
                    $scope.defaultLocation=$scope.searchAdvObj.byLocation;
                    $scope.searchByLocation['searchName0']=$scope.defaultLocation;
                    $scope["searchByLocation"].searchNum0=$scope.searchAdvObj.country0;
                }
                /*angular.forEach(Object.keys($scope.searchAdvObj.SearchByLocationType),function(regionSelected,val){
                    $scope.searchByLocation={};
                    if(regionSelected=='ShipToRegion'){
                        $scope.shipToFlag0=true;
                        $scope.defaultLocation=regionSelected;
                        $scope.searchByLocation['searchName0']=$scope.defaultLocation;

                        angular.forEach(Object.keys($scope.searchAdvObj.SearchByLocationType[regionSelected]),function(countrySel){
                        $scope["searchByLocation"].searchCountry0=$scope.searchAdvObj.SearchByLocationType[regionSelected][countrySel];
                        $scope["searchByLocation"].searchNum0=$scope.searchAdvObj.SearchByLocationType[regionSelected][countrySel][0];
                        })
                    } else {
                        $scope.shipToFlag0=false;
                        $scope.defaultLocation=regionSelected;
                        $scope.searchByLocation['searchName0']=$scope.defaultLocation;
                        $scope["searchByLocation"].searchNum0=$scope.searchAdvObj.SearchByLocationType[regionSelected];
                    }
                });*/
            }
            if($scope.searchAdvObj.SearchByDates !=undefined){
                $scope.defaultDate=$scope.searchAdvObj.byDate;
                $scope.searchByDates['searchName0']=$scope.defaultDate;
                $scope["searchByDates"].searchNum0=$scope.searchAdvObj.sDate0;
                $scope["searchByDates"].searchVal0=$scope.searchAdvObj.eDate0;

                /*angular.forEach(Object.keys($scope.searchAdvObj.SearchByDates),function(dateSelected){
                    $scope.searchByDates={};
                    $scope.defaultDate=dateSelected;
                    $scope.searchByDates['searchName0']=$scope.defaultDate;
                    angular.forEach(Object.keys($scope.searchAdvObj.SearchByDates[dateSelected]),function(fromVal){
                        if(fromVal=="from"){
                            $scope["searchByDates"].searchNum0=$scope.searchAdvObj.SearchByDates[dateSelected][fromVal];
                        } else if(fromVal=="to"){
                            $scope["searchByDates"].searchVal0=$scope.searchAdvObj.SearchByDates[dateSelected][fromVal];
                        }
                     });
                });*/
            }
            if($scope.searchAdvObj.SearchTotalOrderAmount !=undefined){
                $scope.defaultAmount=$scope.searchAdvObj.byAmount;
                $scope.searchByAmount['searchName0']=$scope.defaultAmount;
                $scope.defaultTax=$scope.searchAdvObj.searchtotal;
                $scope.searchByAmount['searchNum0']=$scope.defaultTax;
                $scope["searchByAmount"].searchVal0=$scope.searchAdvObj.amounttax0;

                /*angular.forEach(Object.keys($scope.searchAdvObj.SearchTotalOrderAmount),function(totalSelected){
                    $scope.searchByAmount={};
                    $scope.defaultAmount=totalSelected;
                    $scope.searchByAmount['searchName0']=$scope.defaultAmount;
                    angular.forEach(Object.keys($scope.searchAdvObj.SearchTotalOrderAmount[totalSelected]),function(totaltax,val){
                        $scope.defaultTax=totaltax;
                        $scope.searchByAmount['searchNum0']=$scope.defaultTax;
                        $scope["searchByAmount"].searchVal0=$scope.searchAdvObj.SearchTotalOrderAmount[totalSelected][totaltax][0];
                    });
                });*/
            }
            $scope.defaultresp=$scope.searchAdvObj.repository;
            $scope.repositoryValue = $scope.defaultresp;
        }

        if($scope.advancedFlag=="undefined"){
            $scope.advSearch =false;
        }

        $scope.reSet = function() {
            $scope.hpOrderNo = undefined;
            $scope.poNo = undefined;
            $scope.shipmentNo = undefined;
            $scope.invoiceNo = undefined;
            $scope.orderFromDp = undefined;
            $scope.orderToDp = undefined;
            $scope.customer = undefined;
            $scope.customerName = undefined;
            $scope.orderStatusSelected = [];
            $scope.sapOrderNo = undefined;
            $scope.salesAdmin = undefined;
            $scope.orderTypeSelected = [];
            $scope.orderOrigin = [];
            angular.forEach($scope.searchByNumbers,function(key,val){
                var str=val.substr(0,val.length-1);
                if(str == "searchNum" ){
                    $scope.searchByNumbers[val] = "";
                }
            });
            angular.forEach($scope.searchByCodes,function(key,val){
                var str=val.substr(0,val.length-1);
                if(str == "searchNum" ){
                    $scope.searchByCodes[val] = "";
                }
            });
            $scope.searchByStatus.searchNum0 = "";
            angular.forEach($scope.searchByLocation,function(key,val){
                var str=val.substr(0,val.length-1);
                if(str == "searchNum" || str == "searchCountry"){
                    $scope.searchByLocation[val] = "";
                }
            });
            angular.forEach($scope.searchByDates,function(key,val){
                var str=val.substr(0,val.length-1);
                if(str == "searchNum" || str == "searchVal"){
                    $scope.searchByDates[val] = "";
                }
            });
            angular.forEach($scope.searchByAmount,function(key,val){
                var str=val.substr(0,val.length-1);
                if(str == "searchVal" ){
                    $scope.searchByAmount[val] = "";
                }
            });
        }

    $scope.isRSFormValid = function() {
        var fromDate = new Date($("#orderFromDp").val());
        var toDate = new Date($("#orderToDp").val());

        if (jQuery('#refSearchForm input[value!=""]').length > 0) {
            if (jQuery("#orderFromDp").val() == "" && jQuery("#orderToDp").val() != "") {
                jQuery(".error").html('Please select Order Date(From) to continue search');
                jQuery(".error").slideDown(500);
            } else if (fromDate > toDate) {
                jQuery(".error").html('From Date should be less than To Date to continue search');
                jQuery(".error").slideDown(500);
            } else if(jQuery('#status').val()!="" && jQuery("#hpOrderNo").val() == "" && jQuery("#customerName").val() == "" && jQuery("#poNo").val() == "" && jQuery("#customer").val() == "" && jQuery("#shipmentNo").val() == ""
                && jQuery("#searchNum0").val() == "" && jQuery("#searchCodes0").val() == ""
                && jQuery("#amounttax0").val() == "" && jQuery("#country0").val() == ""
                && jQuery("#sDate0").val() == "" ){
                    jQuery(".error").html('Please enter at least one of these search criteria :&nbsp HP Order#,&nbsp PO#,&nbsp Shipment#,&nbsp Customer#,&nbsp Customer Name.');
                    jQuery(".error").slideDown(500);
            } else if(jQuery('#orderOrigin').val() != "" && jQuery("#orderFromDp").val() == "" && jQuery("#orderToDp").val() == ""
                && jQuery("#hpOrderNo").val() == "" && jQuery("#customerName").val() == ""
                && jQuery("#poNo").val() == "" && jQuery("#customer").val() == ""
                && jQuery("#shipmentNo").val() == "" && jQuery("#searchNum0").val() == ""
                && jQuery("#searchCodes0").val() == "" && jQuery("#amounttax0").val() == ""
                && jQuery("#country0").val() == "" && jQuery("#sDate0").val() == ""
                && jQuery("#eDate").val() == undefined && jQuery("#status").val() == "") {
                    jQuery(".error").html('Please enter at least one of these search criteria :&nbsp HP Order#,&nbsp PO#,&nbsp Shipment#,&nbsp Customer#,&nbsp Customer Name.');
                    jQuery(".error").slideDown(500);
            } else {
                jQuery(".error").slideUp(500);
                $scope.searchOrder();
            }
        } else {
            if(jQuery('#orderStatusSelected').length > 0 || jQuery('#groupby').length > 0 || jQuery('#repositoryValue').length > 0 || jQuery('#orderTypeSelected').length > 0 || jQuery('#orderOrigin').val() != ""){
                if(jQuery("#hpOrderNo").val() != "" || jQuery("#orderFromDp").val() != "" || jQuery("#orderToDp").val() != "" || jQuery("#customerName").val() != "" || jQuery("#poNo").val() != "" || jQuery("#customer").val() != "" || jQuery("#shipmentNo").val() != ""){
                    jQuery(".error").slideUp(500);
                    $scope.searchOrder();
                }
                else{
                    jQuery(".error").html('Please enter at least one of these search criteria :&nbsp HP Order#,&nbsp PO#,&nbsp Shipment#,&nbsp Customer#,&nbsp Customer Name.');
                    jQuery(".error").slideDown(500);
                }
            }
            else{
                jQuery(".error").html('Please enter at least one search criteria.');
                jQuery(".error").slideDown(500);
            }
        }
    }

    $scope.searchOrder = function() {
        if($scope.orderFromDp != undefined){
            if($scope.orderFromDp != ""){
                var poDateFrom = dateConversion($scope.orderFromDp);
            }
        }
        if($scope.orderToDp != undefined){
            if($scope.orderToDp != ""){
                var poDateTo = dateConversion($scope.orderToDp);
            }
        }
        if(jQuery("#searchNum0").val() != ""){
            $scope.searchNumbers=$scope.getSearchObject($scope.searchByNumbers,2);
        }
        if(jQuery("#searchCodes0").val() != ""){
            $scope.searchCodes=$scope.getSearchObject($scope.searchByCodes,2);
        }
        if(jQuery("#amounttax0").val() != ""){
            $scope.searchAmount=$scope.getSearchObject($scope.searchByAmount,3);
        }
        if(jQuery("#country0").val() != ""){
            $scope.searchLocation=$scope.getSearchLocation($scope.searchByLocation);
        }
        if(jQuery("#sDate0").val() != "" &&  jQuery("#eDate").val() != ""){
            $scope.searchDates=$scope.getSearchData($scope.searchByDates);
        }

        if($scope.searchByStatus.searchNum0 !=undefined){
            var searchStatus={};
            searchStatus[$scope.searchByStatus.searchName0]=[];
            angular.forEach($scope.searchByStatus.searchNum0.split(","),function(i) {
                searchStatus[$scope.searchByStatus.searchName0].push(i);
            });
        }

        var searchData = {
            "hpOrderNo" :$scope.hpOrderNo,
            "custPoNo":$scope.poNo,
            "custId":$scope.customer,
            "custName":$scope.customerName,
            "shipmentNo":$scope.shipmentNo,
            "invoiceNo":$scope.invoiceNo,
            "status":$scope.orderStatusSelected,
            "poDateFrom":poDateFrom,
            "poDateTo":poDateTo,
            "soNo":$scope.sapOrderNo,
            "csr":$scope.salesAdmin,
            "type":$scope.orderTypeSelected,
            "origin":$scope.orderOrigin,
            "searchByNumber":$scope.searchNumbers,
            "searchByCode":$scope.searchCodes,
            "group":$scope.groupby,
            "SearchByStatuses":searchStatus,
            "SearchByLocationType":$scope.searchLocation,
            "repository":$scope.repositoryValue,
            "SearchByDates":$scope.searchDates,
            "SearchTotalOrderAmount":$scope.searchAmount,
            "advancedFlag":$scope.advSearch,
            "byDate":$scope.searchByDates.searchName0,
            "sDate0":$scope.searchByDates.searchNum0,
            "eDate0":$scope.searchByDates.searchVal0,
            "byAmount":$scope.searchByAmount.searchName0,
            "searchtotal":$scope.searchByAmount.searchNum0,
            "amounttax0":$scope.searchByAmount.searchVal0,
            "byLocation":$scope.searchByLocation.searchName0,
            "state0":$scope.searchByLocation.searchCountry0,
            "location0":$scope.searchByLocation.searchNum0,
            "country0":$scope.searchByLocation.searchNum0
        }
        searchObject.setSearchObject(searchData);
        $rootScope.$broadcast('summarySearchData', searchData);
        url = "#/in/orderSummary";
        jQuery(location).attr("href", url);
    }

    }).error(function(data, status) {
    });


    /*$scope.redirectToAdvSearch = function() {
        $scope.advSearch = true;
    }
    $scope.redirectToStdSearch = function() {
        $scope.advSearch = false;
    }*/
    $scope.getSearchData=function(searchData){
        var searchByData={};
        var index=3;
        var c=0;
        var searchNames=[];
        for(var i=0;i<Object.keys(searchData).length;i=i+index) {
            var keyName="searchName"+c;
            var keyNum="searchNum"+c;
            var keyVal="searchVal"+c;
            searchByData[searchData[keyName]]={};
            if(searchData[keyNum] != undefined){
                if(searchData[keyNum] != ""){
                    searchByData[searchData[keyName]]["from"]=dateConversion(searchData[keyNum]);
                }
            }
            if(searchData[keyVal] != undefined){
                if(searchData[keyVal] != ""){
                   searchByData[searchData[keyName]]["to"]=dateConversion(searchData[keyVal]);
               }
            }
            c++;
        }
        return searchByData;
    }

    $scope.getSearchObject=function(searchData,index){
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
                    searchByDates[searchData[keyName]]={};
                    searchByDates[searchData[keyName]][searchData[keyNum]]=[];
                    if(searchData[keyVal].match(/[!@#&\$]/) || searchData[keyVal].match(/\.$/)){
                        alert("Please check the Price Format.It is incorrect");
                        return false;
                    } else {
                        searchByDates[searchData[keyName]][searchData[keyNum]].push(searchData[keyVal]);
                    }
                } else {

                    angular.forEach(searchData[keyNum].split(","),function(i) {
                        searchByDates[searchData[keyName]].push(i);
                    });
                }
            }else {
                if(index==3) {
                    if(searchData[keyNum] in Object.keys(searchByDates[searchData[keyName]])) {
                        if(searchData[keyVal].match(/[!@#&\$]/) || searchData[keyVal].match(/\.$/)){
                            alert("Please check the Price Format.It is incorrect");
                            return false;
                        } else {
                            searchByDates[searchData[keyName]][searchData[keyNum]].push(searchData[keyVal]);
                        }
                    }else {
                        searchByDates[searchData[keyName]][searchData[keyNum]]=[];
                        if(searchData[keyVal].match(/[!@#&\$]/) || searchData[keyVal].match(/\.$/)){
                            alert("Please check the Price Format.It is incorrect");
                            return false;
                        } else {
                        searchByDates[searchData[keyName]][searchData[keyNum]].push(searchData[keyVal]);
                        }
                    }
                } else {
                    if(searchByDates[searchData[keyName]].indexOf(searchData[keyNum]) > -1) {
                        alert(" Duplicate values are not allowed");
                        return false;
                    }
                    angular.forEach(searchData[keyNum].split(","),function(i) {
                        searchByDates[searchData[keyName]].push(i);
                    });
                }
            }
            c++;
            searchNames.push(searchData[keyName]);
        }
        return searchByDates;
    }

    $scope.getSearchLocation=function(searchData){
        var searchOrders={};
        var searchByLocations={};
        var c=0;
        var searchNames=[];
        searchOrders=searchData;
        searchByLocations["ShipToRegion"]={};
        var patt = /searchName/;
        var countries=[];
        angular.forEach(Object.keys(searchData),function(element,value) {
            if(patt.test(element)) {
                var keyName="searchName"+c;
                var keyNum="searchNum"+c;
                var keyVal="searchVal"+c;

                if(searchData[keyName]=="ShipToRegionState") {
                    var keyCountry="searchCountry"+c;

                    if(countries.indexOf(searchData[keyCountry])==-1) {
                        searchByLocations["ShipToRegion"][searchData[keyCountry]]=[];
                    }else {
                        angular.forEach(searchData[keyNum].split(","),function(pat) {
                            var matcher = new RegExp(pat,"g");
                            var str=searchByLocations["ShipToRegion"][searchData[keyCountry]].join(":");
                            var found = matcher.test(str);
                            if(found==true) {
                                alert(" Duplicate");
                                return false;
                            }
                        });
                    }
                    angular.forEach(searchData[keyNum].split(","),function(i) {
                        searchByLocations["ShipToRegion"][searchData[keyCountry]].push(i);
                    });
                    countries.push(searchData[keyCountry]);
                }else {
                    searchByLocations[searchData[keyName]]=[];
                    angular.forEach(searchData[keyNum].split(","),function(i) {
                        searchByLocations[searchData[keyName]].push(i);
                    });
                }
                c++;
                searchNames.push(searchData[keyName]);

            }
        });
        return searchByLocations;
    }
}
refineSearchCtrl.$inject = ['$rootScope', '$scope', '$location', '$routeParams', '$http', '$route', 'createDialog','searchObject','$compile'];

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
    var reportsUrl = URLPrefix($location)+"/ossui/v1/in/reports/myreports";
    var reportNames = [];
    //$scope.nodataFlag = true;
    var getUserDetailurl = URLPrefix($location)+"/ossui/v1/in/usersettings";

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
                    /*console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);*/
                    $("#loader, #overlay").hide();
                });
        }).error(function(data, status) {
            /*console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
            $("#loader, #overlay").hide();
        });
        $scope.getReports = function(itemDetails,fileformat){
            postData = "?path="+itemDetails.path;

            var reportURL = URLPrefix($location)+"/ossui/v1/in/reports/getreport"+postData;

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
        var orderNo = $routeParams.legordNo;
        var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
        url = url + urlParams;
        jQuery(location).attr("href", url);

    } //end of navigating to order detail page

    //var ordNo = $routeParams.legordNo;

    var surl = URLPrefix($location)+"/ossui/v1/in/orderhistory?order_no=" + orderNo+"&data_source="+dataSource;

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
            /*console.log('error');
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

function dataMaintainToolsCtrl($scope,$http,$compile,$rootScope,$location, pageTitle,createDialog){
    var tables = {};

    jQuery("#home").removeClass("current");
    jQuery("#datamaintaintools").addClass("current");
    jQuery("#reports").removeClass("current");
    $scope.default_row = false;
    pageTitle.setTitle('Data Maintain Tools');
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var url = URLPrefix($location)+"/ossui/v1/dmt/";
               // console.log(url);
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
            /*console.log('error');
                console.log(JSON.stringify(data));
                console.log('status');
                console.log(status);*/
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
                    /*console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);*/
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
                    /*console.log('error');
                    console.log(JSON.stringify(data));
                    console.log('status');
                    console.log(status);*/
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
                  //console.log('Show count modal closed');
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
                //console.log(selcectall+":"+$scope.totalRows);
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

                }else if(uparrow=="downarrow2"){
                     $scope.image3=true;
                      $scope.image4=true;

                }
                if(uparrow=="uparrow3"){
                      $scope.image6=false;
                      $scope.image5=false;

                }else if(uparrow=="downarrow4"){
                     $scope.image6=true;
                      $scope.image5=true;

                }
            }
            var url=URLPrefix($location)+"/ossui/v1/in/customerHierarchyCBN/?entryID="+entryid+"&mode=lookupByCBN";
            $http.get(url).success(function(data, status) {
                if(data.status=='S'){
                    $scope.dataisthere="true";
                    $("#loader, #overlay").hide();
                    var CBNS=data.header[0];
                    $scope.cbn.push(CBNS);
                    $scope.items = $scope.cbn[0].sold_To;
                    $scope.items_shipto=$scope.cbn[0].ship_To;
                    $scope.items_invoiceto=$scope.cbn[0].invoice_To;
                }else if(data.status=='N'){

                    }
                })
        }
        $scope.fetchBycbnId=function(cbnid){
            $scope.cbnId=cbnid;
            var urlsdata = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+$scope.cbnId+"&mode=lookupByid&hideLevel=false";
            $http.get(urlsdata).success(function(data, status) {
            if(data.status=='S'){
               $scope.roleList = data.header;
               var rolelistdata=data.header;
               rolelist.setRoleList(rolelistdata);
               var urltab = "#/in/CustomerHierarchy";
               jQuery(location).attr("href", urltab);
               $scope.roleList = rolelistdata;
            }
            else if(data.status=='N'){
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
        var id=JSON.stringify(mynode.id);
        id=id.substring(1,id.length-1);
        var urlsdatarole = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+id+"&mode=lookupByid&hideLevel=false";
        $http.get(urlsdatarole).success(function(data, status) {
            if(data.status=='S'){
                var rolelistdata=data.header;
                rolelist.setRoleList(rolelistdata);
                var rolelist1=rolelist.getRoleList();
                $location.path("in/CustomerHierarchy");
                $route.reload();
            }else if(data.status=='N'){
                    $scope.noDatafoundFlage=true;
                    $scope.errormsg=data.message
                    $("#loader, #overlay").hide();
             }
        });
        }
    $scope.selectedlevels = "All";
    $scope.selectelevelvalue="";
    var urls="";
    $scope.selectedLevelMethod=function(selectedLevels){
      $scope.selectelevelvalue=selectedLevels;
    }
    $scope.searchById=function(name,hideBasicInfo){
          if(hideBasicInfo==undefined){
            hideBasicInfo="false";
            var urls = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+name+"&mode=lookupByName&hideLevel="+hideBasicInfo+"&levelOptions="+$scope.selectelevelvalue;
           }else {
            var urls = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+name+"&mode=lookupByName&hideLevel="+hideBasicInfo;
           }
           $("#loader, #overlay").show();
           $http.get(urls).success(function(data, status) {
            if(data.status=='S'){
                $("#loader, #overlay").hide();
                $scope.roleList = data.header;
              } else if(data.status=='N'){
                    $scope.noDatafoundFlage=true;
                    $scope.errormsg=data.message;
                    $("#loader, #overlay").hide();
            }

            });
     }

}
function CustomerHierarchyCtrl($scope,$http,$location,createDialog,rolelist){
    $("#loader, #overlay").hide();
      var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
     $scope.roleList="";
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
        var urls = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+id+"&mode=lookupByid&hideLevel=false";
        $http.get(urls).success(function(data, status) {
            if(data.status=='S'){
                $scope.roleList = data.header;
                var url = "#/in/CustomerHierarchy";
                jQuery(location).attr("href", url);
            }else if(data.status=='N'){

            }

        });
    }
      $scope.showIdsPopUp = function(){
        createDialog('partials/showId.html', {
              id: 'eventNotificationSaved',
              backdrop: true,
              scope:$scope,
              success: {label: 'Success', fn: function() {
                  }}

            });
        }
        $scope.showIds=function(node){
        $scope.showids =[];
            var id=JSON.stringify(node.id);
            var id=id.substring(1,id.length-1);
            $scope.cnId= id;
            var urls= URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+id+"&mode=lookupBySiteId&hideLevel=false";
            $("#loader, #overlay").show();
            $http.get(urls).success(function(data, status) {
                if(data.status=='S'){
                    $scope.showIdsPopUp();
                    $("#loader, #overlay").hide();
                    var show=data.header;
                    $scope.showids.push(show);
                    $scope.fetchBySiteLocaterId=function(showid){
                        jQuery("#showidbody").hide();
                        jQuery(".modal-body").css({'max-height': '0px','padding':' 0px','top':'0'});
                        jQuery(".modal-backdrop").css({'opacity': '0','top':'0'});
                        jQuery(".modal-backdrop.fade.in").css({'opacity': '0','top':'0'});
                         var urls = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+showid+"&mode=lookupByid&hideLevel=false";
                         $http.get(urls).success(function(data, status) {
                               if(data.status=='S'){
                                   $scope.roleList = data.header;
                                   $scope.entryid="";
                               }else if(data.status=='N'){
                                 }
                         });
                     }
                }
           });
       }
        $scope.selectedlevels = "All";
        $scope.selectelevelvalue="";
            var urls="";
            $scope.selectedLevelMethod=function(selectedLevels){
              $scope.selectelevelvalue=selectedLevels;
            }
        $scope.searchById=function(entryid,hideBasicInfo){
                if(hideBasicInfo==undefined){
                    hideBasicInfo="false";
                    var urls = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+entryid+"&mode=lookupByid&hideLevel="+hideBasicInfo+"&levelOptions="+$scope.selectelevelvalue;
                 }else{
                     var urls = URLPrefix($location)+"/ossui/v1/in/customerHierarchy/?entryID="+entryid+"&mode=lookupByid&hideLevel="+hideBasicInfo;
                 }
               $("#loader, #overlay").show();
                $http.get(urls).success(function(data, status) {
                        if(data.status=='S'){
                               $("#loader, #overlay").hide();
                                $scope.roleList = data.header;
                        }else if(data.status=='N'){
                             $scope.noDatafoundFlage=true;
                            $scope.errormsg=data.message;
                             $("#loader, #overlay").hide();
                        }

                 });
           }
     if(rolelist.getRoleList()!==null){
      $scope.roleList=rolelist.getRoleList();
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
        url = URLPrefix($location)+"/ossui/v1/in/searchOrders?hpOrderNo="+OrderNo;
        //console.log(url);

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
            //console.log('error');
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
        url = URLPrefix($location)+"/ossui/v1/in/showOrderSettings?legacy_order_no="+$scope.legacyOrder;
    } else if($scope.text=="profile") {
        url = URLPrefix($location)+"/ossui/v1/in/showProfileSettings?profile="+$scope.id;
    }
    //console.log(url);

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
                   angular.forEach(users1,function(key,val){a
                        if(cnt <=(propLen/2)){
                        compelement += '<div class="ddropdown'+cnt+'" id="ddropdown'+cnt+'">';
                        compelement += '   <select class="dd2" id="resp'+cnt+'" style="font-size:15px;color:#9a9a9a;margin-top:-3px;" ng-model="emaildetails.emailType'+cnt+'">';
                        compelement += '		<br><br><br><option value="C">CC</option><option value="T">To</option>';
                        compelement += '</select>';
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
            //console.log('user profile error');
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
        //console.log(selectedOptions);


        angular.forEach($scope.chkFormat,function(key,val){

            if(key==true){
                selectedFormat+=val+" ";
            }

        });
        //console.log(selectedFormat);

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
                    //console.log("selectedUsers="+selectedUsers);

                    }
                } else {
                    $scope.validEmail();
                    emailFlag = false;
                    return emailFlag;

                }
            }
        });


        if($scope.text=="order") {

            url = URLPrefix($location)+"/ossui/v1/in/saveWatch";
            var saveSetupData = {

                "os":$scope.legacyOrder,
                "options":selectedOptions,
                "format":selectedFormat,
                "timing":timing,
                "users":selectedUsers
            };

        } else if($scope.text=="profile") {

            url = URLPrefix($location)+"/ossui/v1/in/saveProfile";
            var saveSetupData = {

            "profile":$scope.id,
            "options":selectedOptions,
            "format":selectedFormat,
            "timing":timing,
            "users":selectedUsers

            };
        }


        //console.log("saveurl"+url);
        //console.log(saveSetupData);


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
                //console.log("Failed to Save Data: "+data);
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
              //console.log('emailValid modal closed');
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
             // console.log('eventNotificationSaved modal closed');
              $scope.redirectToEventNotify();
            }}
        });
    }

    $scope.deleteSetup =function(id){

       var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
       if ($scope.text=="order"){

        delUrl = URLPrefix($location)+ "/ossui/v1/in/deleteWatch?os="+id;

        } else if($scope.text=="profile"){

        delUrl = URLPrefix($location)+ "/ossui/v1/in/deleteProfile?profile="+id;

        }
        //console.log("delUrl"+delUrl);
        $("#loader, #overlay").show();

        $http.get(delUrl).success(function(data, status) {
            if(data !=undefined){
                $("#loader, #overlay").hide();
                url = "#/eventdelete?hpOrderNo="+id;
                $scope.eventNotificationDeleted();
            }
        }).error(function(data, status) {
            //console.log('Delete Notification error');
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
              //console.log('eventNotificationDeleted modal closed');
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
    var surl =  URLPrefix($location)+"/ossui/v1/in/detaildactiveOrders";
    //console.log(surl);

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
            //console.log('error');
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

        url = URLPrefix($location)+"/ossui/v1/in/showOrderSettings?legacy_order_no="+legacyOrder;

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
            //console.log('error');
        });

    }


}
detailedactiveOrderCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];

/* get detailed active orders information */
function currentActiveOrderCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){

    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var url =  URLPrefix($location)+"/ossui/v1/in/ActiveOrders";

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
            //console.log('error');
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

        url = URLPrefix($location)+"/ossui/v1/in/showOrderSettings?legacy_order_no="+legacyOrder;

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
            //console.log('error');
        });

    }

}
currentActiveOrderCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];

/* get  active profiles information */
function myPersonalProfileCtrl($scope, $filter, $http, $routeParams, $rootScope, $location, pageTitle){

    pageTitle.setTitle('Profile Based');
    $scope.noDataFlag = false;

    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();

    var surl =  URLPrefix($location)+"/ossui/v1/in/myProfiles";
        jQuery("#loader, #overlay").show();

        $http.get(surl).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.items=data.data;
                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;
                   // console.log($scope.error);
                }
            }
        }).error(function(data, status) {
           // console.log('error');
        });

   $scope.columnNames = [{
            'id': "iobject_name",
            'value': "Profile"
        }
    ];
    $rootScope.$broadcast('columnNames', $scope.columnNames);

      $scope.redirectToSaveProfile = function(profileName,wflag,id){
        var text ="profile";
        //console.log("wflag="+wflag);
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

    var surl =  URLPrefix($location)+"/ossui/v1/in/activeProfiles";
   // console.log(surl);

        $http.get(surl).success(function(data, status) {

            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                    if (data.data != "") {
                    $scope.items=data.data;
                    $scope.wFlag=true;

                } else {
                    $scope.noDataFlag = true;
                    $scope.error=data.message;

                    //console.log($scope.error);
                }
            }
        }).error(function(data, status) {
           // console.log('error');
        });
    $scope.redirectToSaveProfile = function(profileName,wflag,id){
        var text ="profile";
        //console.log("wflag="+wflag);
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

    var surl =  URLPrefix($location)+"/ossui/v1/in/myProfiles";
   // console.log(surl);

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
           // console.log('error');
        });
    $scope.redirectToSaveProfile = function(profileName,wflag,id){
        var text ="profile";
        url = "#/eventOption?profileName="+profileName+"&wflag="+wflag+"&text="+text+"&id="+id
        jQuery(location).attr("href", url);
    }

}
activeProfileCtrl.$inject = ['$scope', '$filter', '$http', '$routeParams', '$rootScope', '$location', 'pageTitle'];

function serialAssetInfoCtrl($scope,$routeParams,$location,$http,legacyOrder,$compile){
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
        var shipedURL = URLPrefix($location)+"/ossui/v1/in/serialassetinfo?lon="+legacyOrderNo+"&section=shipped";
        var openURL = URLPrefix($location)+"/ossui/v1/in/serialassetinfo?lon="+legacyOrderNo+"&section=open";
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
serialAssetInfoCtrl.$inject = ['$scope','$routeParams','$location','$http','legacyOrder','$compile'];

function orderLifeCycleCtrl($scope, $location, $http, $routeParams, $rootScope, pageTitle,hpyOrderNumber){
        var orderNo = $routeParams.orderNo;
        $scope.orderNo = $routeParams.orderNo;
        $scope.hpOrderNo = hpyOrderNumber.getHpOrderNo();
        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var url = URLPrefix($location)+"/ossui/v1/in/orderlifecycle?order_no="+orderNo+"&action=details";
        $http.get(url).success(function(data, status) {
            jQuery("#loader, #overlay").hide();
            if(data.status == "S" && data.data!=""){
                $scope.headerInformation = data.data.header;
            }else if((data.status == "S" && data.data == "") || (data.status == "N" && data.data == "")){
                $scope.errorMessage = data.message;
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
          /*  console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
        });
}
orderLifeCycleCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope', 'pageTitle','hpyOrderNumber'];


function orderLifeCycleDetailsCtrl($scope, $location, $http, $routeParams, $rootScope,$compile){
        var orderNo = $routeParams.orderNo;
        $scope.orderNo = $routeParams.orderNo;
        $scope.colpseexpandflag = false;
        $scope.orderLifeCyleColpseExpand = function(panelName, mode)
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
        }];
        $rootScope.$broadcast('columnNames', $scope.columnNames);
        var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
        var url = URLPrefix($location)+"/ossui/v1/in/orderlifecycle?order_no="+orderNo+"&action=details";
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
            }else if((data.status == "S" && data.data == "") || (data.status == "N" && data.data == "")){
                $scope.errorMessage = data.message;
            }
        }).error(function(data, status) {
            jQuery("#loader, #overlay").hide();
            /*console.log('error');
            console.log(JSON.stringify(data));
            console.log('status');
            console.log(status);*/
        });
}
orderLifeCycleDetailsCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope','$compile'];

function pricingTabCtrl($scope, $location, $http, $routeParams, $rootScope,$filter,$compile){
    $scope.lineItemColpseExpand = function(panelName, mode){
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
    $scope.columnNames = [{
            'id': "item",
            'value': "Item No",
            "sort": "false"
        },{
            'id': 'productv',
            'value': 'HP Product#',
            "sort": "false"
        },{
            'id': 'option',
            'value': 'Option',
            "sort": "false"
        },{
            'id': 'description',
            'value': 'Description',
            "sort": "false"
        },{
            'id': 'idCode',
            'value': 'Id Code',
            "sort": "false"
        },{
            'id': 'orderQty',
            'value': 'OrderQty',
            "sort": "false"
        },{
            'id': 'shippedQty',
            'value': 'ShippedQty',
            "sort": "false"
        },{
            'id': 'listUnitPrice',
            'value': 'List Unit Price',
            "sort": "false"
        },{
            'id': 'listExtPrice',
            'value': 'List Ext Price',
            "sort": "false"
        },{
            'id': 'Discount',
            'value': 'Discount%',
            "sort": "false"
        },{
            'id': 'Discount',
            'value': 'Discount',
            "sort": "false"
        },{
            'id': 'NetLinePrice',
            'value': 'Net Line Price',
            "sort": "false"
        },{
            'id': 'Currency',
            'value': 'Currency',
            "sort": "false"
        },{
            'id': 'Shipfrom',
            'value': 'Ship from',
            "sort": "false"
        },{
            'id': 'lspname',
            'value': 'Vendor Name',
            "sort": "false"
        }
    ];
    //calling serivce
    jQuery("#loader, #overlay").show();
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();
    var surl = URLPrefix($location)+"/ossui/v1/in/pricingdetail/?hpOrderNo="+$routeParams.orderNo;
    var items = {
        data: []
    };
    $http.get(surl).success(function(data, status) {
        $scope.totallistExtPrice=data.data[0].pricing.totallistExtPrice;
        $scope.totalDiscValue=data.data[0].pricing.totalDiscValue;
        $scope.totalDiscPersentage=data.data[0].pricing.totalDiscPersentage;
        $scope.totalNetPrice=data.data[0].pricing.totalNetPrice;
        $scope.currency=data.data[0].pricing.currency;
        jQuery("#loader, #overlay").hide();
        var bundleitemscontent = {
            data: []
        };
        $scope.bundlekeys={};
        var keyMap = [];
        var bundleNames=[];
        var showBundleKey = true;
        var indexPricing = 1;
        angular.forEach(data.data[0].pricing.item, function(key,bundleNonBundlearray){
            if(bundleNonBundlearray!="NoBundle"){
                var currentBundleName="";
                var previousBundleName="";
                $filter('filter')(data.data[0].pricing.item[bundleNonBundlearray], function(attr) {
                    var counter1=0;
                    $filter('filter')(attr.option, function(subAttr) {
                        currentBundleName=bundleNonBundlearray;
                        if(previousBundleName=="") {
                            showBundleKey = true;
                        }
                        if(bundleNames.indexOf(bundleNonBundlearray) >-1 && currentBundleName==previousBundleName){
                            showBundleKey = false;
                        }
                        previousBundleName=currentBundleName;
                        bundleNames.push(bundleNonBundlearray);
                        var showItemtab =(counter1 == 0) ? true : false;
                        var priceitemtabbundle =
                        {
                            'bundlekey':bundleNonBundlearray,
                            'showItemcontent':showItemtab,
                            'BundleItemno':attr.item,
                            'Bundlehpproduct':attr.product,
                            'Bundledescription':subAttr.description,
                            'BundleorderQty':subAttr.orderQty,
                            'Bundleidcode':subAttr.idCode,
                            'Bundlelistunitprice':subAttr.listUnitPrice,
                            'Bundleshipqty':subAttr.shippedQty,
                            'BundlelistExtprice': subAttr.listExtPrice,
                            'Bundlenetlineprice': subAttr.netLinePrice,
                            'Bundlediscount1': subAttr.discPer,
                            'Bundlediscount': subAttr.disValue,
                            'Bundlecurrency':subAttr.currency,
                            'BundleshipFrom': subAttr.shipFrom,
                            'BundlevendorName': subAttr.lspname,
                            'BundleOption': subAttr.Option,
                            'showBundleKey':showBundleKey,
                            'indexPricing':indexPricing
                        };
                        counter1++;
                        bundleitemscontent.data[(bundleitemscontent.data.length)++] = priceitemtabbundle;
                        $scope.bundleitemsdataoption=bundleitemscontent.data;
                    });
                });
            }
            indexPricing++;
        });

        //implementing nonbundle
        $scope.showNonBundle=false;
        if(data.data[0].pricing.item.NoBundle.length>0){
             $scope.showNonBundle=true;;
        }
        $filter('filter')(data.data[0].pricing.item.NoBundle, function(attr) {
            var counter = 0;
            $filter('filter')(attr.option, function(subAttr) {
                var showItem = (counter == 0) ? true : false;
                var priceitemtab = {
                    'showItem':showItem,
                    'Itemno':attr.item,
                    'hpproduct':attr.product,
                    'description':subAttr.description,
                    'orderQty':subAttr.orderQty,
                    'idcode':subAttr.idCode,
                    'listunitprice':subAttr.listUnitPrice,
                    'shipqty':subAttr.shippedQty,
                    'listExtprice': subAttr.listExtPrice,
                    'netlineprice': subAttr.netLinePrice,
                    'discount1': subAttr.discPer,
                    'discount': subAttr.disValue,
                    'currency':subAttr.currency,
                    'shipFrom': subAttr.shipFrom,
                    'vendorName': subAttr.lspname,
                    'option': subAttr.Option
                };
                counter++;
                items.data[(items.data.length)++] = priceitemtab;
            });
        });
    });
    $scope.items=items.data;
        $scope.toggleDetail = function($index) {
        $scope.activePosition = $scope.activePosition == $index ? -1 : $index;
    };
}

function productDetailsCtrl($scope, $location, $http, $routeParams, $rootScope,$compile,pageTitle,legacyOrder){
    var hostAddr = $location.protocol()+"://"+$location.host()+":"+$location.port();

    $scope.columnNames = [{
            'id': "sched_line_qty",
            'value': "Partial Qty",
            "sort": "false"
        }, {
            'id': 'status',
            'value': 'Status',
            "sort": "false"
        }, {
            'id': 'fact_delv_no',
            'value': 'Internal Deliveries',
            "sort": "false"
        }, {
            'id': 'cust_delv_no',
            'value': 'External Deliveries',
            "sort": "false"
        }, {
            'id': 'eshp_actual',
            'value': 'Planned Factory Ship date',
            "sort": "false"
        }, {
            'id': 'supplier_sdd',
            'value': 'Supplier Planned Delivery Date',
            "sort": "false"
        }, {
            'id': 'pgi_actual',
            'value': 'Prod Done Fact Shipped',
            "sort": "false"
        }, {
            'id': 'last_ack_date',
            'value': 'Hub Received Customer Shipped',
            "sort": "false"
        }
    ];

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
            'value': 'Export Code',
            "sort": "false"
        }, {
            'id': 'US_export_code',
            'value': 'US Export Code',
            "sort": "false"
        }, {
            'id': 'Harmonized_important_code',
            'value': 'Hormonized Import',
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
    $scope.hpOrderNo = $routeParams.hpOrderNo;
    var productDetailsURL = URLPrefix($location)+"/ossui/v1/in/productDetails?os="+orderNo+"&item="+itemNo;

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
        $("#loader, #overlay").hide();
    });
}
productDetailsCtrl.$inject = ['$scope', '$location', '$http', '$routeParams', '$rootScope','$compile','pageTitle','legacyOrder'];

function shipmentInformationCtrl($scope, $http, $location, $compile, $rootScope, $routeParams, $filter, createDialog,legacyOrderNumber) {
    var OrderNo = $routeParams.orderNo;
    var hostAddr = $location.protocol() + "://" + $location.host() + ":" + $location.port();
    var url = URLPrefix($location) + "/ossui/v1/in/shipmenttab?order_no=" + OrderNo;

    jQuery("#loader, #overlay").show();
    $http.get(url).success(function (data, status) {
        jQuery("#loader, #overlay").hide();
        if (data != undefined) {
            if (data.data != "") {
                var shipItems = data.data;
                var shipItemsList = {
                    data: []
                };
                var shipList = null;
                var podImage = null;
                var packList = null;

                $filter('filter')(shipItems, function (attr) {
                    if (attr.hasPodImage != '0') {
                        podImage = attr.PackListURL + "?pod=" + attr.hpdeliveryno + "&carrier=" + attr.carriername + "&shipmentno=" + attr.shipmentno + "&pod_os=" + attr.legacy_order_no;
                    } else {
                        podImage = null;
                    }

                    if (attr.hasPackList != 0) {
                        packList = attr.PackListURL + "?getixosdoc=" + attr.getixosdoc + "&contRep=" + attr.contRep + "&compId=" + attr.compId + "&contenttype=" + attr.contenttype;
                    } else {
                        packList = null;
                    }

                    shipList = {
                        "packlist": packList,
                        "podimage": podImage,
                        "PackListURL": attr.PackListURL,
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
                $scope.error = data.message;
            }
        }
    }).error(function (data, status) {
        jQuery("#loader, #overlay").hide();
        $scope.showhideShipment = true;
    });

    $scope.getData = function (panelName, shipmentNo, hpDeliveryNo, hpLegacyOrderNo) {
        var deliveryNo = hpDeliveryNo;
        var ShipNo = shipmentNo;
        $scope.shipmentnum = shipmentNo;

        var trackUrl = URLPrefix($location) + "/ossui/v1/in/trackInfo?hpdelvno=" + deliveryNo + "&legacy_order_no=" + hpLegacyOrderNo + "&shipment_no=" + ShipNo;
        jQuery("#loader, #overlay").show();
        $http.get(trackUrl).success(function (data, status) {
            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.Trackinfo != "") {
                    var trackinfo = data.Trackinfo;
                    var trackInfoList = {
                        data: []
                    };
                    var trackList = null;
                    var taturlFlag = null;
                    var carrierurlFlag = null;

                    $filter('filter')(trackinfo, function (attr) {
                        if (attr.tat_url != "") {
                            taturlFlag = true;
                        } else {
                            taturlFlag = false;
                        }

                        if (attr.carrier_website != "") {
                            carrierurlFlag = true;
                        } else {
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

                    if ($scope.trackItems != null) {
                        $scope.trackflag = true;
                    } else {
                        $scope.trackflag = false;
                    }
                } else {
                    $scope.error = data.message;
                }
            }
        }).error(function (data, status) {
            jQuery("#loader, #overlay").hide();
        });
        $scope.errorFlag = false;
        var boxUrl = URLPrefix($location) + "/ossui/v1/in/boxInfo?order_no=" + hpLegacyOrderNo + "&ship_no=" + ShipNo;
        jQuery("#loader, #overlay").show();
        $http.get(boxUrl).success(function (data, status) {
            jQuery("#loader, #overlay").hide();
            if (data.data != "") {
                $scope.errorFlag = false;
                $scope.boxItemsItem = data.boxdetails.header;
                if (data.boxdetails.header != "") {
                    var lineItem = null;
                    var items = {
                        data: []
                    };
                    var innerItems = {
                        data: []
                    };
                    var innerlineItems = null;
                    var groupItems = {};
                    var groupBoxes = {};
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
                    var groupsParentItems = {};
                    var groupsParentBoxes = {};
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
                    if (data.boxdetails.HighestLevel == 1) {
                        $filter('filter')(data.boxdetails.header, function (attr) {
                            if (attr.box_level == 1) {
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
                                    'item_subitem': attr.item_subitem,
                                    'material_no': attr.material_no,
                                    'product_descr': attr.product_descr,
                                    'box_qty': attr.itembox_qty,
                                    'hasTracking': attr.hasTracking
                                }
                                items.data[(items.data.length)++] = lineItem;
                                lineItem = null;
                            }
                        });
                    } else {
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

        }).error(function (data, status) {
            jQuery("#loader, #overlay").hide();
        });

        var itemUrl = URLPrefix($location) + "/ossui/v1/in/itemInfo?order_no=" + hpLegacyOrderNo + "&shipno=" + ShipNo;
        jQuery("#loader, #overlay").show();
        $http.get(itemUrl).success(function (data, status) {
            jQuery("#loader, #overlay").hide();
            $scope.itemItemsDetails = null;
            if (data.Iteminfo.techinfo != "") {
                $scope.itemItemsDetails = data.Iteminfo.techInfo;
            } else {
                $scope.error = data.message;
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
                    $filter('filter')(ItemInfo, function (attr) {
                        if (attr.hasTechInfo == 1) {
                            showItem = true;
                        } else {
                            showItem = false;
                        }
                        if($scope.techInfoItems)
                        var techInfo = $scope.techInfoItems[attr.item_subitem];
                        itemList = {
                            "show_tech_info": showItem,
                            "delivery_group": attr.delivery_group,
                            "item_subitem": attr.item_subitem,
                            "material_no": attr.material_no,
                            "product_descr": attr.product_descr,
                            "so_line_item_qty": attr.so_line_item_qty,
                            "sched_line_qty": attr.sched_line_qty,
                            "logistics_codes": attr.logistics_codes,
                            "ship_from": attr.ship_from,
                            "lsp_name": attr.lsp_name,
                            "hasTechInfo": attr.hasTechInfo,
                            "techInfo": techInfo
                        }
                        itemInfoData.data[(itemInfoData.data.length)++] = itemList;
                    });
                    $scope.itemItemsheader = itemInfoData.data;
                } else {
                    $scope.error = data.message;
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
                $scope.error = data.message;
            }
        }).error(function (data, status) {
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
        var statusUrl = URLPrefix($location) + "/ossui/v1/in/statusHistory?hpdelvno=" + deliveryNo + "&ship_no=" + ShipNo;
        jQuery("#loader, #overlay").show();
        $http.get(statusUrl).success(function (data, status) {
            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.Event != "") {
                    $scope.statusItems = data.Event;
                    if ($scope.statusItems != null) {
                        $scope.statusflag = true;
                    } else {
                        $scope.statusflag = false;
                    }
                } else {
                    $scope.error = data.message;
                }
                /*Code For Master and Housing Bill Popup*/
                $scope.getBillingDetails = function (index) {
                    var masterBill = null;
                    var housingBill = null;
                    var billingItem = {
                        data: []
                    };
                    var item = null;
                    $scope.numIndex = index;
                    $filter('filter')(data.Event, function (attr) {
                        if (attr.masterbillno != null) {
                            masterBill = attr.masterbillno;
                        } else {
                            masterBill = "-";
                        }

                        if (attr.housebillno != null) {
                            housingBill = attr.housebillno;
                        } else {
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
                        scope: $scope
                    });
                }
            }
        }).error(function (data, status) {
            jQuery("#loader, #overlay").hide();
        });

        var RFUIdUrl = URLPrefix($location) + "/ossui/v1/in/dodInfo?order_no=" + hpLegacyOrderNo + "&shipno=" + ShipNo;
        jQuery("#loader, #overlay").show();
        $http.get(RFUIdUrl).success(function (data, status) {
            jQuery("#loader, #overlay").hide();
            if (data != undefined) {
                if (data.dod != "") {
                    $scope.RFIDItems = data.dod;
                    if ($scope.RFIDItems != null) {
                        $scope.RFIDflag = true;
                    } else {
                        $scope.RFIDflag = false;
                    }
                } else {
                    $scope.error = data.message;
                }
            }
        }).error(function (data, status) {
            jQuery("#loader, #overlay").hide();
        });
    }

    var panelsSelected = [];
    var flag;
    $scope.expandOrCollapseShipment = function (panelName, shipmentNo, hpDeliveryNo, hpLegacyOrderNo) {
        var index;
        for (var i = 0; i < panelsSelected.length; i++) {
            if (panelsSelected[i] == panelName) {
                flag = true;
                break;
            } else
                flag = false;
        }
        if (!flag)
            panelsSelected.push(panelName);
        else {
            var lineItemscls = "#" + panelName;
            $scope.el = $compile(lineItemscls)($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
            $scope.lineitemflg = panelName;
            $scope.showLineItem = false;
            panelsSelected = [];
            flag = false;
            return;
        }
        var lineItemscls = "#" + panelName;
        if (!flag) {
            $scope.lineitemflg = panelName;
            $scope.showLineItem = true;
            var lineItemscls = "#" + panelName;
            $scope.el = $compile(lineItemscls)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
            $scope.lineItemShow = true;
            $scope.getData(panelName, shipmentNo, hpDeliveryNo, hpLegacyOrderNo);
        }
        for (var i = 0; i < panelsSelected.length; i++) {
            if (panelName != panelsSelected[i]) {
                var lineItemscls = "#" + panelsSelected[i];
                $scope.el = $compile(lineItemscls)($scope);
                $scope.el.removeClass("expandImg expCloseImgDiv");
                $scope.el.addClass("collapseImg expCloseImgDiv");
                index = panelsSelected.indexOf(panelsSelected[i]);
            }
        }
        if (index != undefined)
            panelsSelected.splice(index, 1);
    }

    $scope.expandOrCollapseShipmentInner = function (panelName, shipSumIndex) {
        $scope[panelName] = !$scope[panelName];
        if ($scope[panelName]) {
            var panel = "#" + panelName + shipSumIndex;
            $scope.el = $compile(panel)($scope);
            $scope.el.removeClass("collapseImg expCloseImgDiv");
            $scope.el.addClass("expandImg expCloseImgDiv");
        } else {
            var panel = "#" + panelName + shipSumIndex;
            $scope.el = $compile(panel)($scope);
            $scope.el.removeClass("expandImg expCloseImgDiv");
            $scope.el.addClass("collapseImg expCloseImgDiv");
        }
    }

    $scope.redirectUrl = function (url) {
        if (url != null) {
            var urlFlag = confirm("You are about to leave HP's website!\nHP is not responsible for information outside the HP website.");
            if (urlFlag == true) {
                window.open(url, '_blank', 'width=700,height=500,toolbar=0,location=0,menubar=0');
            }
        }
    }

    $scope.redirectToShipment = function (hpDeliveryNo,legacyNo) {

        var url = "#/in/shipmentInformation/" + hpDeliveryNo+"/"+ legacyNo;
        if (hpDeliveryNo != null) {
            window.open(url, '_blank', 'width=700,height=500,toolbar=0,location=0,menubar=0');
        }

    }

    $scope.openPodnPack = function (url) {
        if (url != null && url != "") {
            window.open(url, '_blank', 'width=700,height=500,toolbar=0,location=0,menubar=0');
        } else {
            alert("No Records Found");
        }
    }

    $scope.showShipAddress = function (shipNumber) {
        $scope.shipmentNum = shipNumber;
        var shiplineItem = null;
        var items = {
            data: []
        };
        $filter('filter')($scope.shipments, function (attr) {
            shiplineItem = {
                'depot_to_addr_2': attr.depot_to_addr_2,
                'depot_to_addr_3': attr.depot_to_addr_3,
                'depot_to_addr_4': attr.depot_to_addr_4,
                'depot_to_addr_5': attr.depot_to_addr_5,
                'depot_to_addr_6': attr.depot_to_addr_6,
                'depot_to_addr_7': attr.depot_to_addr_7,
                'shipmentno': attr.shipmentno
            }
            items.data[(items.data.length)++] = shiplineItem;
        });
        $scope.shipAddItems = items.data;
        createDialog('partials/shipAddressDetails.html', {
            id: 'shidAddress',
            backdrop: true,
            scope: $scope
        });
    }

    $scope.showItemBox = function (itemVal) {
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
            scope: $scope
        });
    }
}

