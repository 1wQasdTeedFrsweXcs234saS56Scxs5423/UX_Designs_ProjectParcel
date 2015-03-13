function reportGridCtrl($scope,$http) {
    var reportName = localStorage.getItem("reportName");
    if ( reportName == undefined ) {
    	reportName = "FB Open Orders";
    }
    $scope.reportName = reportName;
}
reportGridCtrl.$inject = ['$scope','$http'];

function lineItemListCtrl($scope,$filter,$http) {

    $scope.fb_open_items = [{'Houston_Synnex':'Synnex','P_O':'1070000102','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2012-12-18','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 AC 1 AC DUAL SL230F NODE(Single)','Rack_QTY':'12','Racks_shipped':'240','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2013-01-04','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'Facebook Operations','ShipToName':'','ShipToAddress1':'ASH 5',
	'ShipToAddress2':'44461 Chilum Place','ShipToAddress3':'Klima, Matthew','ShipToAddress4':'Ashburn, VA 20147',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Synnex','P_O':'1070000104','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2012-12-19','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 AC 1 AC DUAL SL230F NODE(Single)','Rack_QTY':'70','Racks_shipped':'1400','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2013-01-04','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'Facebook Operations','ShipToName':'','ShipToAddress1':'ASH 5',
	'ShipToAddress2':'44461 Chilum Place','ShipToAddress3':'Klima, Matthew','ShipToAddress4':'Ashburn, VA 20147',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Synnex','P_O':'1070000103','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2012-12-19','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 AC 1 AC DUAL SL230F NODE(Single)','Rack_QTY':'93','Racks_shipped':'1860','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2013-01-04','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'Facebook Operations','ShipToName':'Facebook Andale','ShipToAddress1':'ASH 2',
	'ShipToAddress2':'44461 Chilum Place','ShipToAddress3':'Klima, Matthew','ShipToAddress4':'Ashburn, VA 20147',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Synnex','P_O':'1050000143','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2012-12-18','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 DC DUAL NODE SL (Triplet)','Rack_QTY':'2','Racks_shipped':'80','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2013-01-04','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'FRC 1A/B','ShipToName':'Facebook Andale','ShipToAddress1':'c/o (FRC 1A/B)',
	'ShipToAddress2':'284 Social Circle','ShipToAddress3':'Henry, George','ShipToAddress4':'Ashburn, VA 20147',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Synnex','P_O':'1050000144','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2012-12-18','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 DC DUAL NODE SL (Triplet)','Rack_QTY':'20','Racks_shipped':'800','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2013-01-04','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'FRC 1A/B','ShipToName':'Facebook Vitesse','ShipToAddress1':'c/o (FRC 1A/B)',
	'ShipToAddress2':'284 Social Circle','ShipToAddress3':'Henry, George','ShipToAddress4':'Forest City, NC 28043',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Synnex','P_O':'1040000160','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2012-12-21','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 DC DUAL NODE SL (Triplet)','Rack_QTY':'12','Racks_shipped':'240','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2013-01-04','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'FRC 1A/B','ShipToName':'Facebook Vitesse','ShipToAddress1':'c/o Vitesse LLC (PRN 1A/B)',
	'ShipToAddress2':'735 SW Connect Way','ShipToAddress3':'Ken Patchett','ShipToAddress4':'Forest City, NC 28043',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Synnex','P_O':'1040000161','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2012-12-21','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 DC DUAL NODE SL (Triplet)','Rack_QTY':'12','Racks_shipped':'1200','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2013-01-04','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'FRC 1A/B','ShipToName':'Facebook Vitesse','ShipToAddress1':'c/o Vitesse LLC (PRN 1A/B)',
	'ShipToAddress2':'735 SW Connect Way','ShipToAddress3':'Ken Patchett','ShipToAddress4':'Prineville, OR 97754',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Synnex','P_O':'1040000191','HPOrderNo':'','SAP':'','Shp_Pt':'225','C_R_P_B':'R',
	'Hold':'','Purchase_OrderDate':'2013-10-01','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'HP COYOTE TYPE 6 DC DUAL NODE SL (Triplet)','Rack_QTY':'6','Racks_shipped':'40','Server_QTY':'240','Node':'0',
	'Option_Qty':'0','RDD':'2/15/2013','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'c/o Vitesse LLC (WHPRN2)','ShipToName':'FACEBOOK INC ASH3','ShipToAddress1':'Michael Dinsmore',
	'ShipToAddress2':'2744 SW Cesna Drive','ShipToAddress3':'Michael Dinsmore','ShipToAddress4':'Prineville, OR 97754',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
	{'Houston_Synnex':'Houston','P_O':'1070000136','HPOrderNo':'32973632','SAP':'202208726','Shp_Pt':'225','C_R_P_B':'P',
	'Hold':'','Purchase_OrderDate':'2013-10-31','Order_Create_Date':'2013-10-31','SLA_Start_Date':'2013-10-31',
	'FB_Config':'HP 8GB 1Rx4 PC3-12800R-11 Kit','Rack_QTY':'30','Racks_shipped':'0','Server_QTY':'240','Node':'0',
	'Option_Qty':'40','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'2/1 Ship ETA from Supplier','Synnex_Status':'',
	'Facebook_Data_Center':'ASH3','ShipToName':'','ShipToAddress1':'DUPONT FABROS',
	'ShipToAddress2':'44521 HASTINGS DR','ShipToAddress3':'STEPHEN SCHOEPPER','ShipToAddress4':'Ashburn, VA 20147',
	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''}];
  
  $scope.fb_shipped_items = [{'Houston_Synnex':'Synnex','P_O':'PO103609','HPOrderNo':'32220110','SAP':'202133786','Shp_Pt':'X400/JK01','C_R_P_B':'R',
  	'Hold':'','Purchase_OrderDate':'6/28/2012','Order_Create_Date':'8/6/2012','SLA_Start_Date':'8/6/2012',
  	'FB_Config':'Type4 DL180se G6 Q2 12 Server','Rack_QTY':'10','Racks_shipped':'10','Server_QTY':'200','Node':'0',
  	'Option_Qty':'0','RDD':'10/31/2012','SLA_Date':'10/30/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'10/30/2012','Owner':'','Houston_Status':'All lines PGI','Synnex_Status':'1 rack short 10 servers after consuming all buffer inventory. Currently looking into repairing servers.',
  	'Facebook_Data_Center':'PRN2','ShipToName':'FACEBOOK / PRN2','ShipToAddress1':'ATTN: KEN PATCHETT',
  	'ShipToAddress2':'735 SW CONNECT WAY','ShipToAddress3':'KEN PATCHETT','ShipToAddress4':'PRINEVILLE, OR 97754',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'54127027','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'29472','Root_Cause':''},
  	{'Houston_Synnex':'Synnex','P_O':'PO103612','HPOrderNo':'32220273','SAP':'202133881','Shp_Pt':'X400/JK01','C_R_P_B':'R',
  	'Hold':'','Purchase_OrderDate':'6/28/2012','Order_Create_Date':'8/6/2012','SLA_Start_Date':'8/6/2012',
  	'FB_Config':'Type5 DL180se G6 Q2 12 Server','Rack_QTY':'10','Racks_shipped':'10','Server_QTY':'200','Node':'0',
  	'Option_Qty':'','RDD':'10/31/2012','SLA_Date':'10/30/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'10/30/2012','Owner':'','Houston_Status':'All lines PGI','Synnex_Status':'ong power cord to Synnex -  ETA 10/2',
  	'Facebook_Data_Center':'PRN2','ShipToName':'FACEBOOK / PRN2','ShipToAddress1':'ATTN: KEN PATCHETT',
  	'ShipToAddress2':'735 SW CONNECT WAY','ShipToAddress3':'KEN PATCHETT','ShipToAddress4':'PRINEVILLE, OR 97754',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'54127058','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'','ADD':'0','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'Houston','P_O':'1050000060','HPOrderNo':'32574474','SAP':'202167880','Shp_Pt':'X400','C_R_P_B':'P',
  	'Hold':'','Purchase_OrderDate':'10/23/2012','Order_Create_Date':'10/23/2012','SLA_Start_Date':'10/23/2012',
  	'FB_Config':'HP 600GB 6G SAS 15K 3.5in DP ENT HDD','Rack_QTY':'','Racks_shipped':'','Server_QTY':'500','Node':'',
  	'Option_Qty':'500','RDD':'10/24/2012','SLA_Date':'11/1/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'11/1/2012','Owner':'','Houston_Status':'Delivery #  8202225614','Synnex_Status':'',
  	'Facebook_Data_Center':'FRC1','ShipToName':'FACEBOOK FRC1A B C O ANDALE','ShipToAddress1':'Keven McCammon',
  	'ShipToAddress2':'408 Social Circle','ShipToAddress3':'Keven McCammon','ShipToAddress4':'FOREST CITY, NC 28043',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'10/26/2012','3PI_invoice_HP_date':'','Tracking':'8206583','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'AGS','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'Houston','P_O':'1050000060','HPOrderNo':'32574491','SAP':'202167993','Shp_Pt':'X400','C_R_P_B':'P',
  	'Hold':'','Purchase_OrderDate':'10/23/2012','Order_Create_Date':'10/23/2012','SLA_Start_Date':'10/23/2012',
  	'FB_Config':'HP 600GB 6G SAS 15K 3.5in DP ENT HDD','Rack_QTY':'','Racks_shipped':'','Server_QTY':'900','Node':'',
  	'Option_Qty':'900','RDD':'10/24/2012','SLA_Date':'11/1/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'11/1/2012','Owner':'','Houston_Status':'Delivery # 8202225609','Synnex_Status':'',
  	'Facebook_Data_Center':'FRC1','ShipToName':'FACEBOOK FRC1A B C O ANDALE','ShipToAddress1':'Keven McCammon',
  	'ShipToAddress2':'408 Social Circle','ShipToAddress3':'Keven McCammon','ShipToAddress4':'FOREST CITY, NC 28043',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'10/26/2012','3PI_invoice_HP_date':'','Tracking':'8204514','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'AGS','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'Houston','P_O':'1050000060','HPOrderNo':'32574509','SAP':'202168041','Shp_Pt':'X400','C_R_P_B':'P',
  	'Hold':'','Purchase_OrderDate':'10/23/2012','Order_Create_Date':'10/23/2012','SLA_Start_Date':'10/23/2012',
  	'FB_Config':'HP 600GB 6G SAS 15K 3.5in DP ENT HDD','Rack_QTY':'','Racks_shipped':'','Server_QTY':'900','Node':'',
  	'Option_Qty':'900','RDD':'10/24/2012','SLA_Date':'11/1/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'11/1/2012','Owner':'','Houston_Status':'Delivery # 8202225610','Synnex_Status':'',
  	'Facebook_Data_Center':'FRC1','ShipToName':'FACEBOOK FRC1A B C O ANDALE','ShipToAddress1':'Keven McCammon',
  	'ShipToAddress2':'408 Social Circle','ShipToAddress3':'Keven McCammon','ShipToAddress4':'FOREST CITY, NC 28043',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'10/26/2012','3PI_invoice_HP_date':'','Tracking':'8204503','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'AGS','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'Houston','P_O':'1050000060','HPOrderNo':'32574525','SAP':'202168245','Shp_Pt':'X400','C_R_P_B':'P',
  	'Hold':'','Purchase_OrderDate':'10/23/2012','Order_Create_Date':'10/23/2012','SLA_Start_Date':'10/23/2012',
  	'FB_Config':'HP 600GB 6G SAS 15K 3.5in DP ENT HDD','Rack_QTY':'','Racks_shipped':'','Server_QTY':'900','Node':'',
  	'Option_Qty':'900','RDD':'10/24/2012','SLA_Date':'11/1/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'11/1/2012','Owner':'','Houston_Status':'delivery# 8202224996','Synnex_Status':'',
  	'Facebook_Data_Center':'FRC1','ShipToName':'FACEBOOK FRC1A B C O ANDALE','ShipToAddress1':'Keven McCammon',
  	'ShipToAddress2':'408 Social Circle','ShipToAddress3':'Keven McCammon','ShipToAddress4':'FOREST CITY, NC 28043',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'10/26/2012','3PI_invoice_HP_date':'','Tracking':'8204504','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'AGS','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'Houston','P_O':'1050000060','HPOrderNo':'32574539','SAP':'202167881','Shp_Pt':'X400','C_R_P_B':'P',
  	'Hold':'','Purchase_OrderDate':'10/23/2012','Order_Create_Date':'10/23/2012','SLA_Start_Date':'10/23/2012',
  	'FB_Config':'HP 600GB 6G SAS 15K 3.5in DP ENT HDD','Rack_QTY':'','Racks_shipped':'','Server_QTY':'900','Node':'',
  	'Option_Qty':'900','RDD':'10/24/2012','SLA_Date':'11/1/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'11/1/2012','Owner':'','Houston_Status':'Delivery # 8202225611','Synnex_Status':'',
  	'Facebook_Data_Center':'FRC1','ShipToName':'FACEBOOK FRC1A B C O ANDALE','ShipToAddress1':'Keven McCammon',
  	'ShipToAddress2':'408 Social Circle','ShipToAddress3':'Keven McCammon','ShipToAddress4':'FOREST CITY, NC 28043',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'10/26/2012','3PI_invoice_HP_date':'','Tracking':'8204515','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'AGS','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'Houston','P_O':'1050000060','HPOrderNo':'32574554','SAP':'202168388','Shp_Pt':'X400','C_R_P_B':'P',
  	'Hold':'','Purchase_OrderDate':'10/23/2012','Order_Create_Date':'10/23/2012','SLA_Start_Date':'10/23/2012',
  	'FB_Config':'HP 600GB 6G SAS 15K 3.5in DP ENT HDD','Rack_QTY':'','Racks_shipped':'','Server_QTY':'900','Node':'',
  	'Option_Qty':'900','RDD':'10/24/2012','SLA_Date':'11/1/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'11/1/2012','Owner':'','Houston_Status':'delivery # 8202224929','Synnex_Status':'',
  	'Facebook_Data_Center':'FRC1','ShipToName':'FACEBOOK FRC1A B C O ANDALE','ShipToAddress1':'Keven McCammon',
  	'ShipToAddress2':'408 Social Circle','ShipToAddress3':'Keven McCammon','ShipToAddress4':'FOREST CITY, NC 28043',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'10/26/2012','3PI_invoice_HP_date':'','Tracking':'8206580','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'AGS','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'Houston','P_O':'1050000063','HPOrderNo':'32578452','SAP':'202168542','Shp_Pt':'X400','C_R_P_B':'P',
  	'Hold':'','Purchase_OrderDate':'10/24/2012','Order_Create_Date':'10/24/2012','SLA_Start_Date':'10/24/2012',
  	'FB_Config':'HP 600GB 6G SAS 15K 3.5in DP ENT HDD','Rack_QTY':'','Racks_shipped':'','Server_QTY':'210','Node':'',
  	'Option_Qty':'210','RDD':'','SLA_Date':'11/1/2012','Current_System_Commit_date':'','Planned_order_start_date':'',
  	'Sched_Delivery_date':'11/1/2012','Owner':'','Houston_Status':'Delivery # 8202225612','Synnex_Status':'',
  	'Facebook_Data_Center':'FRC1','ShipToName':'FACEBOOK FRC1A B C O ANDALE','ShipToAddress1':'Keven McCammon',
  	'ShipToAddress2':'408 Social Circle','ShipToAddress3':'Keven McCammon','ShipToAddress4':'FOREST CITY, NC 28043',
  	'ShipToCountry':'United States','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'10/26/2012','3PI_invoice_HP_date':'','Tracking':'8206586','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'AGS','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''}];
    
      $scope.fb_delivered_items = $scope.fb_shipped_items;      
      
      $scope.fb_cancelled_items = [{'Houston_Synnex':'','P_O':'1040000148','HPOrderNo':'32821273','SAP':'202194955','Shp_Pt':'XL00/JK01','C_R_P_B':'R',
  	'Hold':'','Purchase_OrderDate':'2012-12-21','Order_Create_Date':'','SLA_Start_Date':'',
  	'FB_Config':'Tier 4 Classic Integration FB DC','Rack_QTY':'4','Racks_shipped':'','Server_QTY':'0','Node':'80',
  	'Option_Qty':'0','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/15/2013','Planned_order_start_date':'',
  	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
  	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
  	'ShipToAddress2':'c/o Vitesse LLC (PRN 2A/B)','ShipToAddress3':'500 SW Connect Way','ShipToAddress4':'Dinsmore, Michael',
  	'ShipToCountry':'Prineville, OR 97754','Total_Order_Value':'United States','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
  	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
  	{'Houston_Synnex':'','P_O':'1050000159','HPOrderNo':'32831018','SAP':'202195772','Shp_Pt':'XL00/JK01','C_R_P_B':'R',
  	'Hold':'','Purchase_OrderDate':'12/27/2012','Order_Create_Date':'','SLA_Start_Date':'',
  	'FB_Config':'Tier 4 Classic Integration FB DC','Rack_QTY':'45','Racks_shipped':'','Server_QTY':'0','Node':'900',
  	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/15/2013','Planned_order_start_date':'',
  	'Sched_Delivery_date':'','Owner':'Multiple','Houston_Status':'','Synnex_Status':'',
  	'Facebook_Data_Center':'','ShipToName':'Power Supplies Shipped Fedex Freight # 2810718470 Delivery ETA 1/10','ShipToAddress1':'',
  	'ShipToAddress2':'FRC 3A/B','ShipToAddress3':'Facebook Andale','ShipToAddress4':'FRC 3A/B',
  	'ShipToCountry':'284 Social Circle','Total_Order_Value':'Tobin, Simon','OE_Delay_Root_Cause_Comments':'Forest City, NC 28043','3PI_name_with_Contact':'',
  	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
  	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''}];
  

      $scope.ms_open_items = [{'Houston_Synnex':'Boydton','P_O':'80021367','HPOrderNo':'32784066','SAP':'202191498','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'DL360EG8-MSF-009325-117GB-STAT-AX','Rack_QTY':'40','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'12/13/2012',
	'Sched_Delivery_date':'2/18/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'Northlake','P_O':'80021937','HPOrderNo':'32916850','SAP':'202205346','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'DL380EG8-MSF-009611-36000GB-MBX-AX','Rack_QTY':'20','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/18/2013',
	'Sched_Delivery_date':'2/12/2013','Owner':'','Houston_Status':'All lines PGI','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
        {'Houston_Synnex':'Boydton','P_O':'80022107','HPOrderNo':'32933056','SAP':'202206400','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-SE326M1R2-MSF-007419-27939GB-APP-AX','Rack_QTY':'35','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/23/2013',
	'Sched_Delivery_date':'2/11/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
        {'Houston_Synnex':'Tukwila','P_O':'80022097','HPOrderNo':'32940111','SAP':'202206076','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'DL560G8-MSF-009338-1800GB-OLTP-AX','Rack_QTY':'9','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/24/2013',
	'Sched_Delivery_date':'2/22/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
        {'Houston_Synnex':'Boydton','P_O':'80022056','HPOrderNo':'32949160','SAP':'202207362','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-DL360EG8-MSF-009472-2790GB-APP-AX','Rack_QTY':'3','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/25/2013',
	'Sched_Delivery_date':'2/12/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
        {'Houston_Synnex':'COL','P_O':'80022233','HPOrderNo':'32950058','SAP':'202207613','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-DL580G7-MSF-009572-229GB-UTL-AX','Rack_QTY':'2','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/25/2013',
	'Sched_Delivery_date':'2/12/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
        {'Houston_Synnex':'Boydton','P_O':'80022131','HPOrderNo':'32950931','SAP':'202208098','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'DL360EG8-MSF-009325-117GB-STAT-AX','Rack_QTY':'30','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/28/2013',
	'Sched_Delivery_date':'2/25/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
        {'Houston_Synnex':'DM1','P_O':'80021949','HPOrderNo':'32959386','SAP':'202207838','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'DL380EG8-MSF-009350-4570GB-SQL-AX','Rack_QTY':'3','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/29/2013',
	'Sched_Delivery_date':'2/13/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
        {'Houston_Synnex':'BLU','P_O':'80022043','HPOrderNo':'32959387','SAP':'202207890','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'SE316M1R2-MSF-006913-1051GB-WEB-AX','Rack_QTY':'30','Racks_shipped':'','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'','Planned_order_start_date':'1/29/2013',
	'Sched_Delivery_date':'2/14/2013','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''}];
  
    $scope.ms_delivered_items = [{'Houston_Synnex':'Tukwila','P_O':'8544491','HPOrderNo':'','SAP':'29192526','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'11/24/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-50A-RACKBL-64-BL490CG6-MSF-003200-18GB-SNHD-REVAAX','Rack_QTY':'1','Racks_shipped':'1','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/3/2011','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'COL','P_O':'80006966','HPOrderNo':'','SAP':'29241050','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/7/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-SE326M1R2-MSF-004138-13080GB-APP-AX','Rack_QTY':'37','Racks_shipped':'37','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'12/30/2010','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'Bay','P_O':'80007122','HPOrderNo':'','SAP':'29289711','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/16/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-DL580G7-MSF-003836-229GB-SNHD-REVAAX','Rack_QTY':'15','Racks_shipped':'15','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/4/2011','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'Northlake','P_O':'80006881','HPOrderNo':'','SAP':'29299832','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/17/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-SE326M1R2-MSF-003911-1674GB-APP-AX','Rack_QTY':'1','Racks_shipped':'1','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/4/2011','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'Tukwila','P_O':'80007034','HPOrderNo':'','SAP':'29299834','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/17/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-DL580G7-MSF-004017-229GB-UTL-AX','Rack_QTY':'2','Racks_shipped':'2','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'12/30/2010','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'BLU','P_O':'80007176','HPOrderNo':'','SAP':'29297949','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/17/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'SE316M1R2-MSF-003342-875GB-APP-REVAAX','Rack_QTY':'8','Racks_shipped':'8','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/3/2011','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'BLU','P_O':'80007176','HPOrderNo':'','SAP':'29297949','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/17/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-SE326M1R2-MSF-003352-2000GB-OLTPAX','Rack_QTY':'9','Racks_shipped':'9','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/3/2011','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'BLU','P_O':'80007176','HPOrderNo':'','SAP':'29297949','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/17/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'SE326M1R2-MSF-003348-18580GB-FILE-REVAAX','Rack_QTY':'5','Racks_shipped':'5','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/3/2011','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''},
	{'Houston_Synnex':'BLU','P_O':'80007176','HPOrderNo':'','SAP':'29297949','Shp_Pt':'','C_R_P_B':'',
	'Hold':'','Purchase_OrderDate':'12/17/2010','Order_Create_Date':'','SLA_Start_Date':'',
	'FB_Config':'EX-SE326M1R2-MSF-003892-22344GB-APP-AX','Rack_QTY':'1','Racks_shipped':'1','Server_QTY':'','Node':'',
	'Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'1/3/2011','Planned_order_start_date':'',
	'Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'',
	'Facebook_Data_Center':'','ShipToName':'','ShipToAddress1':'',
	'ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'',
	'ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'','3PI_name_with_Contact':'',
	'HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'',
	'3PO_Material_received_3PI':'','Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'',
	'Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''}];

    var reportId = localStorage.getItem("reportId");
    if ( reportId == undefined ) {
    	reportId = "fb_open_items";
    }

    $scope.filteredItems = [];
    $scope.groupedItems = [];
    $scope.itemsPerPage = 10;
    $scope.pagedItems = [];
    $scope.currentPage = 0;
    $scope.items = $scope[reportId];
    
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

    $scope.columnIds = ['Houston_Synnex','P_O','HPOrderNo','SAP','Shp_Pt','C_R_P_B','Hold','Purchase_OrderDate','Order_Create_Date',
		'SLA_Start_Date','FB_Config','Rack_QTY','Racks_shipped','Server_QTY','Node','Option_Qty','RDD','SLA_Date','Current_System_Commit_date',
		'Planned_order_start_date','Sched_Delivery_date','Owner','Houston_Status','Synnex_Status','Facebook_Data_Center',
		'ShipToName','ShipToAddress1','ShipToAddress2','ShipToAddress3','ShipToAddress4','ShipToCountry','Total_Order_Value','OE_Delay_Root_Cause_Comments',
		'3PI_name_with_Contact','HP_PO_to_3PI','PO_to_3PI_Date','HP_Material_received_3PI','CFE_Material_received_3PI','3PO_Material_received_3PI',
		'Solution_Shipped','3PI_invoice_HP_date','Tracking','AGS_HUB_to_Facebook_Tracking','Carrier','ADD','Made_RDD_Y_N','OTD_TAT','Root_Cause'];

    $scope.search = {'Houston_Synnex':'','P_O':'','HPOrderNo':'','SAP':'','Shp_Pt':'','C_R_P_B':'','Hold':'','Purchase_OrderDate':'','Order_Create_Date':'',
		'SLA_Start_Date':'','FB_Config':'','Rack_QTY':'','Racks_shipped':'','Server_QTY':'','Node':'','Option_Qty':'','RDD':'','SLA_Date':'','Current_System_Commit_date':'',
		'Planned_order_start_date':'','Sched_Delivery_date':'','Owner':'','Houston_Status':'','Synnex_Status':'','Facebook_Data_Center':'',
		'ShipToName':'','ShipToAddress1':'','ShipToAddress2':'','ShipToAddress3':'','ShipToAddress4':'','ShipToCountry':'','Total_Order_Value':'','OE_Delay_Root_Cause_Comments':'',
		'3PI_name_with_Contact':'','HP_PO_to_3PI':'','PO_to_3PI_Date':'','HP_Material_received_3PI':'','CFE_Material_received_3PI':'','3PO_Material_received_3PI':'',
		'Solution_Shipped':'','3PI_invoice_HP_date':'','Tracking':'','AGS_HUB_to_Facebook_Tracking':'','Carrier':'','ADD':'','Made_RDD_Y_N':'','OTD_TAT':'','Root_Cause':''};


    $scope.columnNames = {'Item':'Houston_Synnex','Item Status':'P_O','Product':'HPOrderNo','Description':'SAP','Order Qty':'Shp_Pt',
    	'Partial Qty':'C_R_P_B','List Unit Price':'Hold','Net Line Price':'Purchase_OrderDate','Planned Ship Date':'Order_Create_Date',
		'Actual Ship Date':'SLA_Start_Date','Planned Delivery Date':'FB_Config','Actual Delivery Date':'Rack_QTY','Shipment#':'Racks_shipped',
    	'Contract#':'Server_QTY','Invoice#':'Node','Requested Date':'Option_Qty','Item':'RDD','Item Status':'SLA_Date','Product':'Current_System_Commit_date','Planned_order_start_date':'Planned_order_start_date',
		'Description':'Sched_Delivery_date','Order Qty':'Owner','Partial Qty':'Houston_Status','List Unit Price':'Synnex_Status',
		'Net Line Price':'Facebook_Data_Center',
		'Planned Ship Date':'ShipToName','Actual Ship Date':'ShipToAddress1',
    	'Planned Delivery Date':'ShipToAddress2','Actual Delivery Date':'ShipToAddress3','Shipment#':'ShipToAddress4',
    	'Contract#':'ShipToCountry','Invoice#':'Total_Order_Value','Requested Date':'OE_Delay_Root_Cause_Comments',
		'Planned Ship Date':'3PI_name_with_Contact','Actual Ship Date':'HP_PO_to_3PI',
    	'Planned Delivery Date':'PO_to_3PI_Date','Actual Delivery Date':'HP_Material_received_3PI','Shipment#':'CFE_Material_received_3PI',
    	'Contract#':'3PO_Material_received_3PI','Invoice#':'Solution_Shipped','Requested Date':'3PI_invoice_HP_date',
		'Item':'Tracking','Item Status':'AGS_HUB_to_Facebook_Tracking','Product':'Carrier','Description':'ADD','Order Qty':'Made_RDD_Y_N',
    	'Partial Qty':'OTD_TAT','List Unit Price':'Root_Cause'};
		
		
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
lineItemListCtrl.$inject = ['$scope','$filter','$http'];