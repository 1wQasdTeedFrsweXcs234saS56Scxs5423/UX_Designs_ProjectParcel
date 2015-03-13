
function orderListCtrl($scope, $filter,$http) {
    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 10;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    $scope.items = [
    {'po_number':'TestGIS111','contract_number':'2030017503','contract_status':'In Progress','quote_no':'TestQ1234',
    'contract_start_date':'2013-01-10','contract_end_date':'2016-01-09'},
    {'po_number':'TestGIS112','contract_number':'2030017503','contract_status':'Open','quote_no':'TestQ1234',
    'contract_start_date':'2013-01-11','contract_end_date':'2016-01-09'},
    {'po_number':'TestGIS113','contract_number':'2030017503','contract_status':'In Progress','quote_no':'TestQ1234',
    'contract_start_date':'2013-01-12','contract_end_date':'2016-01-09'},
    {'po_number':'TestGIS112','contract_number':'2030017503','contract_status':'Closed','quote_no':'TestQ1234',
    'contract_start_date':'2013-01-08','contract_end_date':'2016-01-08'}];
    
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

    $scope.columnIds = ['po_number','contract_number','contract_status','quote_no','contract_start_date','contract_end_date'];

    $scope.columnNames = {"PO number":"po_number", "Contract&nbsp;Number":"contract_number", "Contract&nbsp;Status":"contract_status", 
    	"Quote&nbsp;#":"quote_no", "Contact&nbsp;Start&nbsp;Date":"contact_start_date","Contact&nbsp;Start&nbsp;Date":"contract_end_date"};

    $scope.search = {'po_number':'','contract_no':'','contract_status':'','quote_no':'','contract_start_date':'','contract_end_date':''};
    
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
	var contractProgHeader = {'Contract_Open_date':'2013-01-10 08:00:53 PM','Contract_Progress_Date':'2013-01-11 08:00:53 PM',
    'Contract_Close_Date':'2013-04-10 08:24:44 PM'};

    $scope.mouseover = function(data){ 
    	$scope.contractHeader = contractProgHeader;
    	$scope.statusShow = true;
    };
    $scope.mouseleave = function(){
	$scope.statusShow = false;
    };
}
orderListCtrl.$inject = ['$scope', '$filter','$http'];

function itemStatusCtrl($scope){
    $scope.contractProgHeader = {'Quote_Creation_date':'2013-02-21','PO_Date':'2013-02-21',
	    'HP_Receive_date':'2013-02-21','Payment_Receive_date':'2013-02-21','Order_Load_Date':'2013-02-21',
	    'Clean_Order_date':'2013-02-21','Order_Close_Date':'2013-02-21'};

}

