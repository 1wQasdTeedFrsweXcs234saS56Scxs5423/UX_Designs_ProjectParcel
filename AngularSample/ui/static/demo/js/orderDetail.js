function orderHeaderCtrl($scope,$http){
    var orderNo = localStorage.getItem("orderNo");
    if ( orderNo == undefined ) {
    	orderNo = "26Z049598001";
    }
    $scope.orderHeader = orderInfo[orderNo]['orderHeader'];
    $scope.holdCodes = orderInfo[orderNo]['orderHeader']['HoldCode'];
    $scope.comments = orderInfo[orderNo]['Comments'];
	console.log(orderInfo[orderNo]);
	//console.log($scope.holdCodes);
    /*$scope.orderHeader = {'PO_No':'SCEO121219-01','Sales_Org':'LA18','HP_Order_No':'18V761449001','Quote_No':'3000000763,3000000764','Order_Date':'11-Nov-05',
	'Total_Order_Value':'19926.97 USD','Net_Order_Value':'19926.97 USD','Ship_To_Address_1':'HP','Ship_To_Address_2':'ADDRESS3',
	'Ship_To_Address_3':'RG12 1HN BRACKNELL','Ship_To_Address_4':'','Ship_To_Address_5':'','Ship_To_Attention_1':'HP',
	'Ship_To_Attention_2':'ping.chen4@hp.com','Ship_To_Attention_3':'Phone: 07980 612 321','Ship_To_Attention_4':'','Ship_To_Attention_5':'',
	'Last_Change':'16-Nov-2006 22:44 hrs','Tax':'5.40 GBP','Shipping_Charges':'10.00 GBP','Payment_Terms':'Paid:Cash in Advance',
	'Payment_Method':'Wire','Customer_No':'180002740','Customer_Name':'INTCOMEX, S.A','Delivery_Type':'Complete Delivery','Sold_To_Address_1':'HP167',
	'Sold_To_Address_2':'ADDRESS167','Sold_To_Address_3':'RG12 1HN BRACKNELL','Sold_To_Address_4':'','Sold_To_Address_5':'','Sold_To_Attention_1':'HP167',
	'Sold_To_Attention_2':'ping.chen4@hp.com','Sold_To_Attention_3':'Phone: 07980 612 321','Sold_To_Attention_4':'','Sold_To_Attention_5':''};
    
    $scope.orderHeader.HP_Order_No = orderNo;

    var surl = "http://g1t0205g.austin.hp.com:8080/orders/" + orderNo + ".json?callback=JSON_CALLBACK";
    var httpRequest = $http.jsonp(surl).success(function(data, status) {
    	if (data) $scope.orderHeader = data;
    });*/
}
orderHeaderCtrl.$inject = ['$scope','$http'];

function lineItemListCtrl($scope, $filter,$http) {
    var orderNo = localStorage.getItem("orderNo");
    if ( orderNo == undefined ) {
    	orderNo = "26Z049598001";
    }
    $scope.items = orderInfo[orderNo]['lineItems'];
	//console.log(orderInfo[orderNo]['lineItems']['HoldCode']);
	//console.log($scope.holdItems);
	
    $scope.mouseoverflag = function(data){
    	//$scope.productHeader = [];
    	console.log("Test"+data);
	//console.log(orderInfo[orderNo][data]['productdetails']);
	$scope.holdItemHeader=data[0];
	$scope.holdItems = data.splice(1, data.length);
	console.log(data);
	$scope.showPopup = true;
    };
    
    $scope.mouseleaveflag = function(){
	$scope.showPopup = false;
    };
	
	
    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 8;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    /*$scope.items = [{'item_subitem':'100','Product':'378737-001','product_descr':'HP DL380 G4 X3.4GHz 2MB US Rack Srvr','open_qty':'5','shipped_qty':'5',
	'PlannedDeliveryDate':'03-Feb-06','ActualDeliveryDate':'21-Dec-05','PlannedShipDate':'03-Feb-06','ActualShipDate':'13-Dec-05','ItemStatus':'Delivered',
	'ShipmentNo':'88513533','ContractNo':'823423210','InvoiceNo':'2500254772','RequestedDate':'25-Nov-05','ListUnitPrice':'3086.13','NetLinePrice':'13270.35'},
	{'item_subitem':'101','Product':'378750-B21','product_descr':'Intel X3.4GHz 2MB 370/380 G4 Processor','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'06-Dec-05','ActualDeliveryDate':'30-Nov-05','PlannedShipDate':'30-Nov-05','ActualShipDate':'30-Nov-05','ItemStatus':'Shipped',
	'ShipmentNo':'88499210','ContractNo':'','InvoiceNo':'2500251063','RequestedDate':'25-Nov-05','ListUnitPrice':'825.69','NetLinePrice':'1420.18'},
	{'item_subitem':'102','Product':'355892-001','product_descr':'HP DL380 G4 US NEMA Hot Plug RPS','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'07-Dec-05','ActualDeliveryDate':'30-Nov-05','PlannedShipDate':'30-Nov-05','ActualShipDate':'30-Nov-05','ItemStatus':'Delivered',
	'ShipmentNo':'NIA5187682','ContractNo':'88513533','InvoiceNo':'2500251214','RequestedDate':'25-Nov-05','ListUnitPrice':'260.58','NetLinePrice':'448.2'},
	{'item_subitem':'103','Product':'293048-B21','product_descr':'HP DL380 G4 Redundant Fan Option Kit','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'06-Dec-05','ActualDeliveryDate':'29-Nov-05','PlannedShipDate':'29-Nov-05','ActualShipDate':'29-Nov-05','ItemStatus':'Delivered',
	'ShipmentNo':'NFE0038062','ContractNo':'','InvoiceNo':'2500249846','RequestedDate':'25-Nov-05','ListUnitPrice':'201.16','NetLinePrice':'346'},
	{'item_subitem':'104','Product':'378737-001','product_descr':'HP DL380 G4 X3.4GHz 2MB US Rack Srvr','open_qty':'5','shipped_qty':'5',
	'PlannedDeliveryDate':'03-Feb-06','ActualDeliveryDate':'21-Dec-05','PlannedShipDate':'13-Dec-05','ActualShipDate':'13-Dec-05','ItemStatus':'Delivered',
	'ShipmentNo':'88513533','ContractNo':'88242310','InvoiceNo':'2500254772','RequestedDate':'25-Nov-05','ListUnitPrice':'3086.13','NetLinePrice':'13270.35'},
	{'item_subitem':'105','Product':'378750-B21','product_descr':'Intel X3.4GHz 2MB 370/380 G4 Processor','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'06-Dec-05','ActualDeliveryDate':'30-Nov-05','PlannedShipDate':'30-Nov-05','ActualShipDate':'30-Nov-05','ItemStatus':'Shipped',
	'ShipmentNo':'88499210','ContractNo':'','InvoiceNo':'2500251063','RequestedDate':'25-Nov-05','ListUnitPrice':'825.69','NetLinePrice':'1420.18'},
	{'item_subitem':'106','Product':'355892-001','product_descr':'HP DL380 G4 US NEMA Hot Plug RPS','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'07-Dec-05','ActualDeliveryDate':'30-Nov-05','PlannedShipDate':'30-Nov-05','ActualShipDate':'30-Nov-05','ItemStatus':'Delivered',
	'ShipmentNo':'NIA5187682','ContractNo':'88234210','InvoiceNo':'2500251214','RequestedDate':'25-Nov-05','ListUnitPrice':'260.58','NetLinePrice':'448.2'},
	{'item_subitem':'107','Product':'293048-B21','product_descr':'HP DL380 G4 Redundant Fan Option Kit','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'06-Dec-05','ActualDeliveryDate':'29-Nov-05','PlannedShipDate':'29-Nov-05','ActualShipDate':'29-Nov-05','ItemStatus':'Delivered',
	'ShipmentNo':'NFE0038062','ContractNo':'','InvoiceNo':'2500249846','RequestedDate':'25-Nov-05','ListUnitPrice':'201.16','NetLinePrice':'346'},
	{'item_subitem':'108','Product':'293048-B21','product_descr':'HP DL380 G4 Redundant Fan Option Kit','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'06-Dec-05','ActualDeliveryDate':'29-Nov-05','PlannedShipDate':'29-Nov-05','ActualShipDate':'29-Nov-05','ItemStatus':'Delivered',
	'ShipmentNo':'NFE0038062','ContractNo':'88234210','InvoiceNo':'2500249846','RequestedDate':'25-Nov-05','ListUnitPrice':'201.16','NetLinePrice':'346'},
	{'item_subitem':'109','Product':'293048-B21','product_descr':'HP DL380 G4 Redundant Fan Option Kit','open_qty':'2','shipped_qty':'2',
	'PlannedDeliveryDate':'06-Dec-05','ActualDeliveryDate':'29-Nov-05','PlannedShipDate':'29-Nov-05','ActualShipDate':'29-Nov-05','ItemStatus':'Delivered',
	'ShipmentNo':'NFE0038062','ContractNo':'','InvoiceNo':'2500249846','RequestedDate':'25-Nov-05','ListUnitPrice':'201.16','NetLinePrice':'346'}];
    
    var surl = "http://g1t0205g.austin.hp.com:8080/orders/" + orderNo + "/items.json?callback=JSON_CALLBACK";
    $http.jsonp(surl).success(function(data, status) {
    	if ( data.items != undefined ) {
		$scope.items= data.items;
	}
    }).error(function(data, status) {
    	//alert('error');
    });*/
    
    $scope.totalPages= Math.ceil($scope.items.length / $scope.itemsPerPage);
    
    // init the filtered items
    $scope.init = function () {
        $scope.filteredItems = $filter('filter')($scope.items, function (item) {
            for(var attr in item) {
                    return true;
            }
            return false;
        });
        $scope.currentPage = 0;
        // now group by pages
        $scope.groupToPages();
    };

    // calculate page in place
    $scope.groupToPages = function () {
        $scope.pagedItems = [];
        
        for (var i = 0; i < $scope.filteredItems.length; i++) {
            if (i % $scope.itemsPerPage === 0) {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
            } else {
                $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
            }
        }
    };
    $scope.range = function (start, end) {
        var ret = [];
        if (!end) {
            end = start;
            start = 0;
        }
        for (var i = start; i < end; i++) {
            ret.push(i);
        }
        return ret;
    };
    $scope.prevPage = function () {
        if ($scope.currentPage > 0) {
            $scope.currentPage--;
        }
    };
    $scope.nextPage = function () {
        if ($scope.currentPage < $scope.pagedItems.length - 1) {
            $scope.currentPage++;
        }
    };
    $scope.setPage = function () {
        $scope.currentPage = this.n;
    };
    $scope.gotoPage = function () {
    	if ($scope.pageNo) {
	   $scope.currentPage = $scope.pageNo - 1;
    	}
    };
    $scope.init();

    $scope.columnNames = ['item_subitem','ItemStatus','Product','product_descr','open_qty','shipped_qty','ListUnitPrice','NetLinePrice',
    	'PlannedShipDate','ActualShipDate','PlannedDeliveryDate','ActualDeliveryDate','ShipmentNo','ContractNo',
    	'InvoiceNo','RequestedDate'];

    $scope.search = {'item_subitem':'','ItemStatus':'','Product':'','product_descr':'','open_qty':'','shipped_qty':'','ListUnitPrice':'','NetLinePrice':'',
    	'PlannedShipDate':'','ActualShipDate':'','PlannedDeliveryDate':'','ActualDeliveryDate':'','ShipmentNo':'','ContractNo':'',
    	'InvoiceNo':'','RequestedDate':''};
    
    $scope.sort = {
	column: "",
	descending: false
    };
    $scope.getClass = function(column) {
	return column == $scope.sort.column && "sort-" + $scope.sort.descending;
    };
    $scope.changeSorting = function(column) {
	if (column == undefined) {
		$scope.sort.column = '';
	} else {
		if ($scope.sort.column == column) {
			$scope.sort.descending = !$scope.sort.descending;
		} else {
			$scope.sort.column = column;
			$scope.sort.descending = false;
		}
	}
    };
	
	$scope.productHeaderData = orderInfo[orderNo][Product];
	
	/*$scope.productHeaderData =  {'378737-001':{'item_subitem':'104','Product':'378737-001','product_descr':'HP DL380 G4 X3.4GHz 2MB US Rack Srvr','deal_id':'88046140','RequestedDate':'25-Nov-05'},
    		'378750-B21':{'item_subitem':'105','Product':'378750-B21','product_descr':'Intel X3.4GHz 2MB 370/380 G4 Processor','deal_id':'88046140','RequestedDate':'25-Nov-05'},
    		'355892-001':{'item_subitem':'106','Product':'355892-001','product_descr':'HP DL380 G4 US NEMA Hot Plug RPS','deal_id':'88046140','RequestedDate':'25-Nov-05'} }; 
    */
	$scope.mouseover = function(data){
    	//$scope.productHeader = [];
    	//console.log("Test"+data);
		//console.log(orderInfo[orderNo][data]['productdetails']);
    	$scope.productHeader = orderInfo[orderNo][data]['productdetails'];
    	$scope.hide = false;
    	$scope.show = true;
    };
    
    $scope.mouseleave = function(){
		$scope.hide = true;
    };
}
lineItemListCtrl.$inject = ['$scope', '$filter','$http'];



