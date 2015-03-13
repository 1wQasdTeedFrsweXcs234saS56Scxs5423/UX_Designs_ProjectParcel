function viewReportsController($scope,$filter,$http) {
    $scope.customers = [
	{name:'', id:''},
	{name:'Facebook', id:'FB'},
	{name:'MSFT', id:'MSFT'}
    ];
    $scope.items = [
	{'id':'fb_open_items','name':'FB Open Orders','xl_fl_nm':'FB_Open_Orders.xlsx', 'csv_fl_nm':'FB_Open_Orders.csv','frequency':'Every one day','last_run_time':'22:30 UTC'},
	{'id':'fb_shipped_items','name':'FB Shipped Orders','xl_fl_nm':'FB_Shipped_Orders.xlsx', 'csv_fl_nm':'FB_Shipped_Orders.csv','frequency':'Every one day','last_run_time':'22:30 UTC'},
	{'id':'fb_delivered_items','name':'FB Delivered Orders','xl_fl_nm':'FB_Delivered_Orders.xlsx', 'csv_fl_nm':'FB_Delivered_Orders.csv','frequency':'Every one day','last_run_time':'22:30 UTC'},
	{'id':'fb_cancelled_items','name':'FB Cancelled Orders','xl_fl_nm':'FB_Cancelled_Orders.xlsx', 'csv_fl_nm':'FB_Cancelled_Orders.csv','frequency':'Every one day','last_run_time':'22:30 UTC'},
	{'id':'ms_open_items','name':'MSFT Open Orders','xl_fl_nm':'MSN_Open_Orders.xlsx', 'csv_fl_nm':'MSN_Open_Orders.csv','frequency':'Every one day','last_run_time':'22:30 UTC'},
	{'id':'ms_delivered_items','name':'MSFT Delivered Orders','xl_fl_nm':'MSN_Delivered_Orders.xlsx', 'csv_fl_nm':'MSN_Delivered_Orders.csv','frequency':'Every one day','last_run_time':'22:30 UTC'}
    ];
    $scope.customer = $scope.customers[0]; 
}
viewReportsController.$inject = ['$scope','$filter','$http'];


/*,{'id':'ms_emea_backlog','name':'MSFT EMEA Backlog','xl_fl_nm':'MSN_EMEA_Backlog.xlsx', 'csv_fl_nm':'MSN_EMEA_Backlog.csv','frequency':'Every one day',
'last_run_time':'22:30 UTC'}*/
	