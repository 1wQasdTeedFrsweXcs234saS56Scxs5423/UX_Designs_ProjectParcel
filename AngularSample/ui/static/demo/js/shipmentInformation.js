function trackingListCtrl($scope,$http){
    
	var shipmentNo1 = localStorage.getItem("shipmentNo");
	var	shipmentNo=shipmentNo1.trim();
	$scope.shipmentheader = shipmentInfo[shipmentNo]['shipmentheader'];
	$scope.ShipmentNo =shipmentNo;
	/*$scope.shipmentheader = {'Purchase_Order':'52Q025678','HP_Order':'18V761449001','Customer_Number':'ZHP1800','Country':'chile','Carrier':'EAGLE GLOBAL LOGISTICS',
	'Weight':'169.50 KG','Plant':'5252','Delivered_to':'17050-2411 MECHANICSBURG','Ship_Date':'2005-12-13 03:07','Delivery_date':'2005-12-13 03:07',
	'Reference_Shipment':'','Alternate Shipment':'','Truck_id':'','No_of_Boxes':'1',
	'Delivered_to':'0000 SANTIAGO','Last_Change':'24-Dec-2005 12:57 IST'};*/
    
}
trackingListCtrl.$inject = ['$scope','$http'];

function trackInfoListCtrl($scope,$http) {
  
  var shipmentNo1 = localStorage.getItem("shipmentNo");
  var shipmentNo=shipmentNo1.trim();
	$scope.items = shipmentInfo[shipmentNo]['trackingInformation'];
    /*$scope.items = [{'tracking':'02267462','carrierName':'Customer PickUp','carrier':'','signature':'',
	'Flight':'','Master_Bill':'','House_Bill':'','Depart_from':'','Arrive_at':''},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','carrier':'40418534246','signature':'',
	'Flight':'318','Master_Bill':'40418534246','House_Bill':'02267462','Depart_from':'VIRACOPOSBR','Arrive_at':'MIAMI,FL US'}];*/
	
    $scope.columnNames = {'Item':'tracking','Item Status':'carrierName','Product':'carrier','Description':'signature','Order Qty':'Flight',
    	'List Unit Price':'Master_Bill','Net Line Price':'House_Bill','Planned Ship Date':'Depart_from','Actual Ship Date':'Arrive_at'};

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
    };}
trackInfoListCtrl.$inject = ['$scope','$http'];

function statusHistoryListCtrl($scope,$http) {
	var shipmentNo1 = localStorage.getItem("shipmentNo");
  var shipmentNo=shipmentNo1.trim();
$scope.items = shipmentInfo[shipmentNo]['statusHistory'];
  
   /* $scope.items = [{'tracking':'02267462','carrierName':'Customer PickUp','Location':'','status':'Customer PickUp',
	'Reason':'','Date':'2005-12-13 00:00','Loaded':'2005-12-13 06:02',},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'VIRACOPOS BR','status':'Dispatched',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'VIRACOPOS BR','status':'Connecting Line PickUp',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'VIRACOPOS BR','status':'EST To Depart Terminal Location',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'VIRACOPOS BR','status':'Eta at Carrier Terminal',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'VIRACOPOS BR','status':'Depart from port Export',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'MIAMI,FL US','status':'Arrived at port of entry',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'MIAMI,FL US','status':'Notified Broker',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},
	{'tracking':'02267462','carrierName':'EAGLE GLOBAL LOGISTICS','Location':'MIAMI,FL US','status':'Delivered',
	'Reason':'Normal Status','Date':'2005-12-13 11:00','Loaded':'2005-12-13 18:34'},];*/
   
    $scope.columnNames = {'Item':'tracking','Item Status':'carrierName','Product':'Location','Description':'status','Order Qty':'Reason',
    	'List Unit Price':'Date','Net Line Price':'Loaded'};

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
    };}
statusHistoryListCtrl.$inject = ['$scope','$http'];

function boxInfoListCtrl($scope,$http) {
	var shipmentNo1 = localStorage.getItem("shipmentNo");
	var shipmentNo=shipmentNo1.trim();
  
   /* $scope.items = [{'order':'18V761449001','box':'ACDS0000000103346563','weight':'169.50'}]; */
   
   $scope.items = shipmentInfo[shipmentNo]['boxInformation'];
	
	$scope.columnNames = {'Item':'order','Item Status':'box','Product':'weight'};

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
    };}
boxInfoListCtrl.$inject = ['$scope','$http'];


