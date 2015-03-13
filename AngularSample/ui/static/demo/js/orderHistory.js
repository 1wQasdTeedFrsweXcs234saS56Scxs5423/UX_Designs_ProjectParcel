function orderHistoryCtrl($scope,$http){
    
	var orderNumber = localStorage.getItem("orderNo");
	$scope.orderNumber=orderNumber;
	
	$scope.orderHistory = historyInfo[orderNumber]['orderHistory'];
	
}
orderHistoryCtrl.$inject = ['$scope','$http'];

function lineItemListCtrl($scope,$http){
    
	var orderNumber = localStorage.getItem("orderNo");
	$scope.orderNumber=orderNumber;
	
	$scope.orderHistory = historyInfo[orderNumber]['orderHistory'];
	
}
lineItemListCtrl.$inject = ['$scope','$http'];



