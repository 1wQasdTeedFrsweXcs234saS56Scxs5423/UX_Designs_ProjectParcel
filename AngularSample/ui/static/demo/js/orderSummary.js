
function orderListCtrl($scope, $filter,$http) {
    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 10;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    $scope.items = [{'po_number':'1050000159','hp_order_number':'32853695','order_type':'Trade Order','order_status':'OPEN','quote_no':'VISTAWEB-002455537','order_date':'2013-01-04','actual_delivery_date':'','actual_ship_date':'2013-01-11','planned_delivery_date':'2013-01-14','planned_ship_date':'2013-03-13','shipment_no':'66766332PO#6004923'},{'po_number':'PO100179','hp_order_number':'31426276','order_type':'Trade Order','order_status':'Shipped to Customer','quote_no':'VISTAWEB-002349993','order_date':'2012-02-16','actual_delivery_date':'','actual_ship_date':'','planned_delivery_date':'2012-02-21','planned_ship_date':'2012-02-16','shipment_no':'8201942180'},{'po_number':'CONTRATO K160-41116-600','hp_order_number':'K10054242002','order_type':'Leasing Order','order_status':'Shipped to Customer','quote_no':'','order_date':'2006-06-15','actual_delivery_date':'','actual_ship_date':'2006-06-21','planned_delivery_date':'2006-06-19','planned_ship_date':'','shipment_no':'CURTIN'},{'po_number':'95248571','hp_order_number':'20Z021199001','order_type':'Trade Order','order_status':'Delivered','quote_no':'CANN-56256-00','order_date':'2012-04-27','actual_delivery_date':'2012-05-08','actual_ship_date':'2012-05-02','planned_delivery_date':'2012-05-10','planned_ship_date':'2012-05-04','shipment_no':'5796824748'},{'po_number':'1070000018','hp_order_number':'26Z041879001','order_type':'Trade Order','order_status':'CLOSED','quote_no':'GBS-74308-00','order_date':'2012-11-06','actual_delivery_date':'2012-12-06','actual_ship_date':'2012-11-26','planned_delivery_date':'2012-12-06','planned_ship_date':'2013-01-22','shipment_no':'59710824PO#5856860'},{'po_number':'0080023895','hp_order_number':'72R894314001','order_type':'Trade Order','order_status':'Production','quote_no':'1018612122',
  'order_date':'2013-04-03','actual_delivery_date':'','actual_ship_date':'','planned_delivery_date':'2013-05-03','planned_ship_date':'2013-04-23','shipment_no':'0811092776'},{'po_number':'95365714','hp_order_number':'72R103596001','order_type':'Trade Order','order_status':'OPEN','quote_no':'8001-86004-02','order_date':'2012-07-24','actual_delivery_date':'','actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':'0811092771'},{'po_number':'CONTRATO K160-4111','hp_order_number':'K10054242001','order_type':'Leasing Order','order_status':'Shipped to Customer ','quote_no':'BRA-98685-00','order_date':'2006-06-08','actual_delivery_date':'','actual_ship_date':'','planned_delivery_date':'2006-06-19','planned_ship_date':'2006-06-17','shipment_no':'CURTIN'},{'po_number':'CONTRATO K160-41116-600','hp_order_number':'40605266','order_type':'Returns','order_status':'Delivered','quote_no':'','order_date':'2013-04-11','actual_delivery_date':'',
    'actual_ship_date':'2006-06-21','planned_delivery_date':'2006-06-21','planned_ship_date':'','shipment_no':'CURTIN'},{'po_number':'002670401603','hp_order_number':'5549508','order_type':'Returns','order_status':'Shipped to Customer','quote_no':'','order_date':'2013-04-17','actual_delivery_date':'',
    'actual_ship_date':'2013-04-17','planned_delivery_date':'2013-04-17','planned_ship_date':'2013-04-17','shipment_no':'6925450817'},{'po_number':'0012796','hp_order_number':'26Z049598001','order_type':'Trade Order','order_status':'Delivered','quote_no':'0110065623','order_date':'2013-02-22','actual_delivery_date':'2013-03-25',
    'actual_ship_date':'2013-03-13','planned_delivery_date':'2013-03-20','planned_ship_date':'2013-03-13','shipment_no':'8202369451'},
    {'po_number':'00/000424','hp_order_number':'750012654040','order_type':'Trade Order','order_status':'Shipped to Customer','quote_no':'0110065624','order_date':'2013-04-03','actual_delivery_date':'2013-04-12',
    'actual_ship_date':'2013-04-12','planned_delivery_date':'2013-04-12','planned_ship_date':'2013-04-11','shipment_no':'PNHT20828941 '},
    {'po_number':'0004012250','hp_order_number':'890012650091','order_type':'Trade Order','order_status':'Submitted','quote_no':'0110065625','order_date':'2013-04-03','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'0004012250','hp_order_number':'33IV26232001','order_type':'Resale Order','order_status':'Shipped from Factory','quote_no':'0110065626','order_date':'2012-01-06','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'0311094171','hp_order_number':'E51043190709','order_type':'Trade Order','order_status':'Cancelled','quote_no':'0110065627','order_date':'2012-01-06','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'H5IF85745001','hp_order_number':'H5IF85745001','order_type':'Resale Order','order_status':'ProductionDone','quote_no':'0110065628','order_date':'2012-11-06','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'2012-11-27','shipment_no':'IJ0100394836'},
    {'po_number':'N81777239','hp_order_number':'PDE777239001','order_type':'Internal Order','order_status':'Admin / Acked','quote_no':'0110065628','order_date':'2012-01-06','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'5700007805','hp_order_number':'32420557','order_type':'Invoice only Order','order_status':'Delivered','quote_no':'0110065630','order_date':'2012-09-06','actual_delivery_date':'2012-09-20',
    'actual_ship_date':'2012-09-20','planned_delivery_date':'','planned_ship_date':'2012-09-19','shipment_no':''},
    {'po_number':'SCEO688360','hp_order_number':'81V299377001','order_type':'Trade Order','order_status':'Shipped to Customer','quote_no':'01100656240','order_date':'2012-10-21','actual_delivery_date':'2012-10-22',
    'actual_ship_date':'2012-10-22','planned_delivery_date':'2012-10-21','planned_ship_date':'2012-10-21','shipment_no':'ELB2V77136'},
    {'po_number':'TCPCR-47642','hp_order_number':'61055646','order_type':'Credit Memo Request','order_status':'Admin / Processing' ,'quote_no':'01100656240','order_date':'','actual_delivery_date':'2012-10-22',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'TSCRP-312010','hp_order_number':'52388775','order_type':'Credit Order','order_status':'Admin / Processing' ,'quote_no':'01100656248','order_date':'2010-08-02','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'45298119','hp_order_number':'37345093','order_type':'Trade Order','order_status':'Delivered' ,'quote_no':'01100656248','order_date':'2010-08-02','actual_delivery_date':'2013-03-12',
    'actual_ship_date':'2013-03-11','planned_delivery_date':'2013-03-12','planned_ship_date':'2013-03-11','shipment_no':'6924956305 '},
    {'po_number':'45298119','hp_order_number':'37345094','order_type':'Trade Order','order_status':'Delivered' ,'quote_no':'01100656248','order_date':'2010-08-02','actual_delivery_date':'2013-03-12',
    'actual_ship_date':'2013-03-11','planned_delivery_date':'2013-03-12','planned_ship_date':'2013-03-11','shipment_no':'6924956305 '},
    {'po_number':'45298110','hp_order_number':'37345095','order_type':'Trade Order','order_status':'Delivered' ,'quote_no':'01100656248','order_date':'2010-08-02','actual_delivery_date':'2013-03-12',
    'actual_ship_date':'2013-03-11','planned_delivery_date':'2013-03-12','planned_ship_date':'2013-03-11','shipment_no':'6924956305 '},
    {'po_number':'45298111','hp_order_number':'37345093','order_type':'Trade Order','order_status':'Delivered' ,'quote_no':'01100656248','order_date':'2010-08-02','actual_delivery_date':'2013-03-12',
    'actual_ship_date':'2013-03-11','planned_delivery_date':'2013-03-12','planned_ship_date':'2013-03-11','shipment_no':'6924956305 '},
    {'po_number':'0012797','hp_order_number':'26Z049598002','order_type':'Trade Order','order_status':'Delivered','quote_no':'0110065623','order_date':'2013-02-22','actual_delivery_date':'2013-03-25',
    'actual_ship_date':'2013-03-13','planned_delivery_date':'2013-03-20','planned_ship_date':'2013-03-13','shipment_no':'8202369451'},
    {'po_number':'00/000425','hp_order_number':'750012654041','order_type':'Trade Order','order_status':'Shipped to Customer','quote_no':'0110065624','order_date':'2013-04-03','actual_delivery_date':'2013-04-12',
    'actual_ship_date':'2013-04-12','planned_delivery_date':'2013-04-12','planned_ship_date':'2013-04-11','shipment_no':'PNHT20828941 '},
    {'po_number':'0004012256','hp_order_number':'890012650092','order_type':'Trade Order','order_status':'Submitted','quote_no':'0110065625','order_date':'2013-04-03','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'0004012250','hp_order_number':'33IV26232003','order_type':'Trade Order','order_status':'Shipped from Factory','quote_no':'0110065626','order_date':'2012-01-06','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''},
    {'po_number':'0311094177','hp_order_number':'E51043190704','order_type':'Trade Order','order_status':'Cancelled','quote_no':'0110065627','order_date':'2012-01-06','actual_delivery_date':'',
    'actual_ship_date':'','planned_delivery_date':'','planned_ship_date':'','shipment_no':''}];
    
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

    $scope.columnIds = ['po_number','hp_order_number','order_type','order_status','quote_no','order_date','planned_ship_date','actual_ship_date',
    	'planned_delivery_date','actual_delivery_date','shipment_no'];

    $scope.columnNames = {"PO number":"po_number", "HP&nbsp;Order&nbsp;Number":"hp_order_number", "Order&nbsp;Type":"order_type", 
    	"Order&nbsp;Status":"order_status", "Quote&nbsp;#":"quote_no", "Order&nbsp;Date":"order_date","Planned&nbsp;Ship&nbsp;Date":"planned_ship_date",
    	"Actual&nbsp;Ship&nbsp;Date":"actual_ship_date", "Planned&nbsp;Delivery&nbsp;Date":"planned_delivery_date", 
    	"Actual&nbsp;Delivery&nbsp;Date":"actual_delivery_date", "Shipment&nbsp;No&nbsp;#":"shipment_no"};

    $scope.search = {'po_number':'','hp_order_number':'','order_type':'','order_status':'','quote_no':'','order_date':'','planned_ship_date':'','actual_ship_date':'',
    	'planned_delivery_date':'','actual_delivery_date':'','shipment_no':''};
    
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
    var orderProgHeader = {'Quote_Creation_date':'2013-02-21 08:00:53 PM','PO_Date':'2013-02-21 08:00:53 PM',
    'HP_Receive_date':'2013-02-21 08:24:44 PM','Payment_Receive_date':'2013-02-21 08:25:32 PM','Order_Load_Date':'2013-02-21 08:28:44 PM',
    'Clean_Order_date':'2013-02-21 08:28:55 PM','Order_Close_Date':'2013-02-21 08:30:00 PM'};

    $scope.mouseover = function(data){ 
    	$scope.orderHeader = orderProgHeader;
    	$scope.statusShow = true;
    };
    $scope.mouseleave = function(){
	$scope.statusShow = false;
    };
}
orderListCtrl.$inject = ['$scope', '$filter','$http'];

function itemStatusCtrl($scope){

}

