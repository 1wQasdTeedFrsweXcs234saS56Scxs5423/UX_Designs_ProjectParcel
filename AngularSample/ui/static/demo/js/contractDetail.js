function contractHeaderCtrl($scope,$http){
    var contractNo = localStorage.getItem("contractNo");
    if ( contractNo == undefined ) {
    	contractNo = "2030017503";
    }
    $scope.contractHeader = contractInfo[contractNo]['contractHeader'];
    
}
contractHeaderCtrl.$inject = ['$scope','$http'];

function lineItemListCtrl($scope, $filter,$http) {
    var contractNo = localStorage.getItem("contractNo");
    if ( contractNo == undefined ) {
    	contractNo = "2030017503";
    }
    $scope.items = contractInfo[contractNo]['lineItems'];

    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 8;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
        
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

    $scope.columnIds = ['item_subitem','ItemStatus','Product','product_descr','open_qty','ListUnitPrice','NetLinePrice'];

    $scope.columnNames = {'Item':'item_subitem','Item Status':'ItemStatus','Product':'Product','Description':'product_descr','Order Qty':'open_qty',
    	'List Unit Price':'ListUnitPrice','Net Line Price':'NetLinePrice'};

    $scope.search = {'item_subitem':'','ItemStatus':'','Product':'','product_descr':'','open_qty':'','ListUnitPrice':'','NetLinePrice':''};
    
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
	
	$scope.productHeaderData = contractInfo[contractNo][Product];
	
	/*$scope.productHeaderData =  {'378737-001':{'item_subitem':'104','Product':'378737-001','product_descr':'HP DL380 G4 X3.4GHz 2MB US Rack Srvr','deal_id':'88046140','RequestedDate':'25-Nov-05'},
    		'378750-B21':{'item_subitem':'105','Product':'378750-B21','product_descr':'Intel X3.4GHz 2MB 370/380 G4 Processor','deal_id':'88046140','RequestedDate':'25-Nov-05'},
    		'355892-001':{'item_subitem':'106','Product':'355892-001','product_descr':'HP DL380 G4 US NEMA Hot Plug RPS','deal_id':'88046140','RequestedDate':'25-Nov-05'} }; 
    */
	$scope.mouseover = function(data){
    	//$scope.productHeader = [];
		console.log(contractInfo[contractNo][data]['productdetails']);
    	$scope.productHeader = contractInfo[contractNo][data]['productdetails'];
    	$scope.hide = false;
    	$scope.show = true;
    };
    
    $scope.mouseleave = function(){
		$scope.hide = true;
    };
}
lineItemListCtrl.$inject = ['$scope', '$filter','$http'];




