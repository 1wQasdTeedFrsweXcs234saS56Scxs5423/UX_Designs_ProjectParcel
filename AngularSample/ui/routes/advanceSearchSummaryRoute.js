
/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/advanceSearchSummary
|
|
|   This webservice will return the Order Summary for the advance search
|   criteria entered by user.
|
|   written by Deepu Krishnamurthy
|   November 2013
|
---------------------------------------------------------------------------*/

var augment   = require("../lib/augment.js")
var SqlUtils  = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2")
var PortalSec = require("../lib/PortalSecurity")
var DbPool    = require('../lib/DbPool');
var config    = require('../config/config.js');
var Resp      = require('../lib/RespUtils.js');
var tstore    = require('../lib/tstore');
var osconfig    = require('/etc/opt/oss/backend/UI.cfg');

var ts = new tstore.TStore( osconfig.UITstoreConnection )
var additonalTable = '';
var additionalwhereClause = '';

var bunyan    = require('bunyan');

var log = new bunyan({
    name: 'AdvanceSearchSummaryWebService',
});

function createAdvanceQueryStatements (id, value, filter, res){
   
    var val = value.replace(/\*/g,"%");
    console.log('value is  ' + val);
     switch (id) {
        case 'hporderno':
            filter.addLike  (val, "h.order_no");
            break;
        case 'custPoNo':
            filter.addLike  (val, "h.purchase_order_no");
            break;    
        case 'custName':
            filter.addLike  (val, "h.customer_name");
            break;   
        case 'custId':
            filter.addLike  (val, "h.customer_no");
            break;     
        case 'so_no':
        //Do we need to trim leading zero (we can also use so_no in backlog_hdr)
            filter.addLike  (val, "lso.so_no");
            additonalTable = ", l_so_no lso";
            additionalwhereClause = "and (h.legacy_order_no = lso.legacy_order_no) "
            break; 
        case 'sales_coord':
        //(we can also use sales_coord in backlog_hdr)
            filter.addLike  (val, "lcsr.sales_coord");
            additonalTable = ", l_csr lcsr";
            additionalwhereClause = "and (h.legacy_order_no = lcsr.legacy_order_no) "
            break; 
        case 'orderStatus' :
            switch (val) {
                case 'all' :
                    break;
                case 'open' :
                    filter.addEq ('OPEN', "h.order_status");
                    break;
                case 'closed' :
                    filter.addEq ('CLOSED', "h.order_status");
                    break;
                case 'qtcuid' :
                    filter.addEq ('29', "h.version");
                    break;
            }
            
        break;
          
        default:
            //filter.addLike  (value,  "backlog_hdr.order_no");
            break;
                
     }
    console.info('filter binds' + filter.binds);
    console.info('where clause' + filter.where);
}
/*
function createAdvanceNumberQuery(id, value, filter, res){
    
    switch (id) {
        
        case 'webOrderNo' :
            numberQuery(value, "h.web_order_no", filter, res);
            break;
        
        case 'assetTag' :
             if (filter.where != ''){
                filter.where += ' and'
             }
            filter.where += '  (h.legacy_order_no in \
                                 (select distinct delv.legacy_order_no \
                                    from backlog_delv delv, detail_techinfo dtech \
                                   where delv.delivery_group = dtech.delivery_group ' ;
            numberQuery(value, "dtech.asset_tag", filter, res);
            filter.where += ' and ((dtech.serial_number is not null  \
                                           and dtech.serial_number not like \'XX%\')  \
                                          or dtech.serial_number is null)))' ;
            break;
        
        case 'b2bid' :
            numberQuery(value, "h.b2bis_id", filter, res);
            break;
            
        case 'eop_id' : 
            numberQuery(value, "h.eop_id", filter, res);
            break;
        
        case 'famNo' :
            numberQuery(value, "h.cust_family_no", filter, res);
            break;
        
        case 'csn' :
            numberQuery(value, "d.shipment_no", filter, res);
            break;
        
        case 'custNo' :
            numberQuery(value, "h.customer_no", filter, res);
            break;
        
        case 'eclaimNo' :
            numberQuery(value, "h.claim_no", filter, res);
            break;
        
        case 'fsn' :
            numberQuery(value, "d.fact_delv_no", filter, res);
            break;
        // need to check 
        case 'ivn' :
            break;
        
        case 'macAddr' :
             if (filter.where != ''){
                filter.where += ' and'
             }
            filter.where += '  (h.legacy_order_no in       \
                                     (select distinct delv.legacy_order_no \
                                        from backlog_delv delv, detail_techinfo dtech \
                                       where delv.delivery_group = dtech.delivery_group ';
            numberQuery(value, "dtech.primary_mac_addr", filter, res);
            filter.where += ' and ((dtech.serial_number is not null  \
                                               and dtech.serial_number not like \'XX%\')  \
                                              or dtech.serial_number is null))) ';
            break;
            
        case 'ncrfNo' :
             if (filter.where != ''){
                filter.where += ' and'
             }
            filter.where += ' h.legacy_order_no in  \
                                  (select distinct legacy_order_no from backlog_ids \
                                    where ([mcase2 sold_to_l1 = $value])
                                       or ([mcase2 sold_to_l2 = $value])
                                       or ([mcase2 sold_to_l3 = $value])
                                       or ([mcase2 sold_to_l4 = $value])
                                       or ([mcase2 ship_to_l1 = $value])
                                       or ([mcase2 ship_to_l2 = $value])
                                       or ([mcase2 ship_to_l3 = $value])
                                       or ([mcase2 ship_to_l4 = $value])
                                       or ([mcase2 inv_to_l1  = $value])
                                       or ([mcase2 inv_to_l2  = $value])
                                       or ([mcase2 inv_to_l3  = $value])
                                       or ([mcase2 inv_to_l4  = $value])
                                   )"
            
            break;
        
        case 'purchAgree' :
            numberQuery(value, "h.purch_agree", filter, res);
            break;
        
        case 'quoteNo' :
            numberQuery(value, "h.quote_no", filter, res);
            break;
        
        case 'salNo' :
            numberQuery(value, "h.sal_number", filter, res);
            break;
        
        case 'serialNo' :
            if (filter.where != ''){
                filter.where += ' and'
             }
            filter.where += ' (h.legacy_order_no in   \
                                 (select distinct delv.legacy_order_no \
                                    from backlog_delv delv, detail_techinfo dtech \
                                   where delv.delivery_group = dtech.delivery_group' ;
            numberQuery(value, "dtech.serial_number", filter, res); 
            filter.where += ' and dtech.serial_number not like \'XX%\')) ';
            break;
            
        case 'imei' :
            if (filter.where != ''){
                filter.where += ' and'
            }
            filter.where += ' (h.legacy_order_no in   \
                                     (select distinct delv.legacy_order_no  \
                                        from backlog_delv delv, detail_techinfo dtech \
                                       where delv.delivery_group = dtech.delivery_group ';
            numberQuery(value, "dtech.imei", filter, res);
            filter.where += ' and ((dtech.serial_number is not null  \
                                               and dtech.serial_number not like \'XX%\')  \
                                              or dtech.serial_number is null))) ';
            
        case 'gvtContractNo' :
            numberQuery(value, "h.gvt_contract_number", filter, res);
            break;
        // need to check     
        
        case 'wawfNo' :
            if (filter.where != ''){
                filter.where += ' and'
            }
             filter.where += ' h.legacy_order_no in (  \
                select s.legacy_order_no   \
                  from backlog_ship s      \
                 where [mcase $value s.wawf_number])' ;
            break;
       
        case 'accountName' :
            numberQuery(value, "h.account_name", filter, res);
            break;
        
        case 'legOrdType' :
            numberQuery(value, "h.legacy_order_type", filter, res);
            break;
        //need to check    
        case 'mci' :
            break;
        // need to check
        case 'opportunityId' :
            append whereClause " $and ([mcase2 h.opportunity_id = $value]) " ;
        
        // need to check    
        case 'rebateRequestId' :
            append whereClause " $and ([mcase2 h.rebate_request_id = $value]) ";    
    }
    console.info('filter binds' + filter.binds);
    console.info('where clause' + filter.where);
}
*/
function numberQuery (value, field, filter, res) {
    
    if (filter.where != '' ) {
               filter.where += ' and (';
    } else {
        filter.where += '(';
    }
     
    for (var i = 0; i <= value.length-1; i++) {
        var val = value[i].replace(/\*/g,"");
        val = val.replace(/\?/g,"");
        val = val.replace(/\%/g,"");
       
        filter.orLikeToUpper(val , field);
    }
    filter.where += ') ';
    console.info('filter binds' + filter.binds);
    console.info('where clause' + filter.where);
}
 

function createAdvanceStatusQuery (value, filter, res) {
    switch (value) {
        case 'all' :
            break;
        case 'submitted':
            filter.addEq ('Submitted', "d.status");
        case 'admin' :
            filter.addIn ("'Acked', 'Processing'" , "d.status");
        case 'c_admin' :
            filter.addIn ('Processing', "h.order_overall_status");   
        case 'processing' :
            filter.addIn ('Processing', "h.order_overall_status"); 
        case 'acked' :
            filter.addIn ('Acked', "d.status");
        case 'prod' :
            filter.addIn ('Production', "d.status");
        case 'c_prod' :
            filter.addEq ('Production', "h.order_overall_status");
        case 'prod_done' :
            filter.addEq ('ProductionDone', "d.status");
        case 'fact_ship' :
            filter.addEq ('FactShipped', "d.status");
        case 'ech' : 
            filter.addEq ('Registered', "d.status");
        case 'cust_ship' :
            filter.addEq ('Shipped', "d.status");
        case 'c_cons' :
            filter.addIn ("'FactShipped','Registered','Consolidation'" , "h.order_overall_status");
        case 'c_shipped' :
            filter.addEq ('Shipped', "h.order_overall_status");
        case 'delv' :
            filter.addEq ('Delivered', "d.status");
        case 'c_delved' :
            filter.addEq ('Delivered', "h.order_overall_status");
        case 'invo' :
        case 'open' :
            filter.addEq ('OPEN', "h.order_status");
        case 'closed' :
            filter.addEq ('CLOSED', "h.order_status");
        case 'cancelled' :
            filter.addEq ('CANCELED', "h.order_overall_status");
        case 'notfship' :
            filter.addIn ("'FactShipped','Registered','Shipped', 'Delivered'" , "d.status");
        case 'notcship' :
            filter.addIn ("'Shipped', 'Delivered'" , "d.status");
        case 'notdelv' : 
            filter.addInEquality ('Delivered' , "d.status");
        case 'notinvo' :
        case 'f_invoiced':
            filter.addEq ('FI', "h.invoice_status");
        case 'p_invoiced' :
            filter.addEq ('PI', "h.invoice_status");
        case 'n_invoiced' :
            filter.addEq ('NI', "h.invoice_status");
        case 'f_shipped' :
            filter.addEq ('FS', "h.ship_status");
        case 'p_shipped' :
            filter.addEq ('PS', "h.ship_status");
        case 'n_shipped' :
            filter.addEq ('NS', "h.ship_status");
        
  }
  console.info('filter binds' + filter.binds);
  console.info('where clause' + filter.where);
}

function createAdvanceOrderTypeQuery(value, filter, res) {
     switch (value) {
        case 'all' :
            break;
        case 'trade' :
            filter.addLike  ("Trade Order", "h.order_type_descr");
        case 'debit' : 
            filter.addLike  ("Debit", "h.order_type_descr");
        case 'lease' :
            filter.addLike  ("Leasing Order", "h.order_type_descr");
        case 'srq' : 
            filter.addLike  ("SRQ", "h.order_type_descr");
        case 'trade_lease' :
            filter.ORLike ();
        case 'trade_lease_srq' :
        case 'internal' :
            filter.addLike  ("Internal Order", "h.order_type_descr");
        case 'demo' :
            filter.addLike  ("Demo Order", "h.order_type_descr");
        case 'no_charge' :
            filter.addLike  ("No Charge Order", "h.order_type_descr");
        case 'resale' :
            filter.addLike  ("Resal", "h.order_type_descr");
        case 'return' :
            filter.addLike  ("Return", "h.order_type_descr");
        case 'credit' : 
            filter.addLike  ("Credit", "h.order_type_descr");
        case 'statistical' :
            filter.addLike  ("Statistical", "h.order_type_descr");
        case 'contract' :
            filter.addLike  ("Contract Order", "h.order_type_descr");
        case 'carepack' :
            filter.addY ( h.carepack_flag );
     }
}


function createAdvanceOriginQuery(value, filter, res) {
   
    filter.where += ' and (';
    for (var i = 0; i <= value.length-1; i++) {
       console.log('value is  ' +value[i]);
        switch (value[i]) {
            case 'all' :
                break;
            case 'ePrime' :
                filter.orEq ('ePrime', "h.originating_system");
                break;
            case 'ecl' :
                filter.orEq ('eClaims', "h.originating_system");
            case 'cca' :
                filter.orEq ('CCA', "h.originating_system");
                break;
            case 'wat' :
                filter.orEq ('Watson', "h.originating_system");
            case 'eop' :
                filter.orEq ('EOP', "h.originating_system");
                break;
            case 'elf' :
                filter.orEq ('ELF', "h.originating_system");
                break;
            case 'mad' :
                filter.orEq ('MAD', "h.purch_order_type");
                break;
            case 'ebay_de' :
            case 'iscs_de' :
            case 'iscs_fr' :
            case 'iscs_gb' :
            case 'iscs_es' :
            case 'iscs_se' :
            case 'iscs_ch' : 
            case 'iscs_aus':
            case 'iscs_ca' :
            case 'iscs_hk' :
            case 'iscs_kr' :
            case 'iscs_my' :
            case 'iscs_sg' :
            case 'iscs_ar' :
            case 'scs_mx' :
            case 'iscs_br' :
                filter.orEqToUpper (value[i], "h.originating_system");
                break;
        }
         
    }
    filter.where += ') ';
   
    console.info('filter binds' + filter.binds);
    console.info('where clause' + filter.where);
}


function createAdvanceGroupQuery(value, filter, res) {
   
    switch (value) {
        case 'all' :
            break;
        case 'otd_tba' :
            addY (d.lack_tba_flag);
            break
        case 'otd_noa' :
            if (filter.where == ''){
                filter.where += ' (';
            } else {
                filter.where += ' and (';
            }
            
            filter.orLike('%Trade' , "h.order_type_descr");
            filter.orLike('%Leasing' , "h.order_type_descr");
            filter.where += ') ';
            filter.where += ' and d.last_ack_date is null  \
                                 and (d.lack_tba_flag != \'Y\' or d.lack_tba_flag is null) \
                                 and exists (select d2.status from backlog_delv d2\
                                              where d.legacy_order_no = d2.legacy_order_no \
                                                and d2.status in (\'Acked\',\'FactShipped\',\'Processing\',\'Production\'))';
            break;
       case 'otd_re_ack' :
            filter.addGreaterThan ('0', 'd.nr_reacks')   
           
            filter.where +=  ' and exists (select d2.status from backlog_delv d2 \
                                               where d.legacy_order_no = d2.legacy_order_no \
                                                 and d2.status in (\'Acked\',\'Processing\',\'Production\'))' ;
            break;
        case 'otd_akn' :
            filter.addDateLtEqSysyDate ('d.last_ack_date');
            filter.where += ' and ( d.lack_tba_flag <> \'Y\' or d.lack_tba_flag  is null) \
                                 and exists (select d2.status from backlog_delv d2 \
                                               where d.legacy_order_no = d2.legacy_order_no  \
                                                 and d2.status not in (\'FactShipped\',\'Registered\',\'Shipped\',\'Delivered\'))';
            break; 
       case 'cust_sh_not_inv' :
            filter.addIn ("'Shipped','Delivered'" , "d.status");  
            filter.where += ' and ( d.invoice_no = \'\' or d.invoice_no = \' \' \
                              or d.invoice_no is null or d.invo_actual is null)';
            break;
        case 'open_backlog' :
            filter.addnotIn  ("'Shipped','Delivered','CANCELED'" ,'d.status');
            
            filter.where += ' and (   h.order_type_descr like \'%Trade%\' \
                                       or h.order_type_descr like \'%Leasing%\')' ; 
            break;
        case 'late_backlog' :
            if (filter.where != '' ) {
               filter.where += ' and';
           }
            filter.where += ' ( h.ship_status <> \'FS\' or h.ship_status is null) \
                                 and exists (select d2.legacy_order_no                  \
                                        from backlog_delv d2                     \
                                       where d2.legacy_order_no = h.legacy_order_no \
                                         and d2.sched_delv_date > d2.latest_arr_date)';
            break;
        
        case 'await_pod' : 
            if (filter.where != '' ) {
               filter.where += ' and';
            }
            filter.where += ' d.sched_delv_date < ( current_date - interval \'3\' day ) ';
            filter.andIsNull ( "d.pod_actual") ;
            filter.where += ' and (   h.order_type_descr like \'%Trade%\' \
                                   or h.order_type_descr like \'%Leasing%\') ';
            filter.addEq ('Shipped', "d.status");
            break;
        
        case 'delivered' :
            filter.addEq ('Delivered', "d.status");
            filter.where += ' and not exists (select d2.status from backlog_delv d2 \
                                                   where d.legacy_order_no = d2.legacy_order_no \
                                                     and d2.status not in (\'Delivered\')) ';
            break;
        
        case 'clean_backlog' :
            filter.addEq ('OPEN', "h.order_status"); 
            filter.where += ' and d.order_load_date < ( current_date - interval \'60\' day ) ' ; 
            break;
        
        case 'reg_on_hold' :
            filter.addEq ('Registered', "d.status"); 
            filter.andIsNotNull('d.shipment_hold') ;
            filter.addInEquality ('00' , "h.dc_code");
            filter.where += ' and not exists (select d2.status from backlog_delv d2   \
                                                   where d.legacy_order_no = d2.legacy_order_no \
                                                     and d2.status not in (\'Registered\')) ' ; 
            
            filter.where += ' and (   h.order_type_descr like \'%Trade%\' \
                                       or h.order_type_descr like \'%Leasing%\') ' ;
            break;
        
        case 'reg_on_ma_hold' :
            filter.addEq ('Registered', "d.status"); 
            filter.addInEquality ('00' , "h.dc_code");
            filter.addLike  ("%MA", "d.shipment_hold");  
            filter.where += ' and not exists (select d2.status from backlog_delv d2  \
                                               where d.legacy_order_no = d2.legacy_order_no \
                                                 and d2.status not in (\'Registered\'))' ;
            filter.where += ' and (   h.order_type_descr like \'%Trade%\' \
                                           or h.order_type_descr like \'%Leasing%\')' ;
            break;
            
        case 'reg_on_cr_hold' :
            filter.addEq ('Registered', "d.status"); 
            filter.addInEquality ('00' , "h.dc_code"); 
            filter.addLike  ("%CR", "d.shipment_hold"); 
            filter.where += ' and not exists (select d2.status from backlog_delv d2 \
                                               where d.legacy_order_no = d2.legacy_order_no \
                                                 and d2.status not in (\'Registered\'))';
            
            filter.where += ' and (   h.order_type_descr like \'%Trade%\' \
                                   or h.order_type_descr like \'%Leasing%\') ';
            break;
                                   
        case 'partial_landed' :
            filter.addInEquality ('00' , "h.dc_code");       
             
            filter.where += ' and (   h.order_type_descr like \'%Trade%\' \
                                   or h.order_type_descr like \'%Leasing%\') ';
            filter.where += ' and  exists (select d2.status from backlog_delv d2 \
                                            where d.legacy_order_no = d2.legacy_order_no \
                                              and d2.status   in (\'Registered\'))'  ;
            break;
        case 'custship_not_bill' :
            filter.where += ' and exists (select h2.legacy_order_no   \
                                            from backlog_hdr h2 inner join backlog_delv d2  \
                                              on h2.legacy_order_no = d2.legacy_order_no    \
                                           where h.purchase_order_no = h2.purchase_order_no \
                                             and h.customer_no = h2.customer_no             \
                                             and d2.status in (\'Shipped\',\'Delivered\')       \
                                             and ( d2.invoice_no = \'\' or d2.invoice_no = \' \' \
                                              or d2.invoice_no is null)                     \
                                        ) ' ;
            break;
        case 'block_invo' :
            filter.where += ' and h.purchase_order_no in   \
                                            (select h2.purchase_order_no \
                                               from backlog_hdr h2       \
                                              where h.purchase_order_no = h2.purchase_order_no  \
                                                    and ( h2.invoice_type = \'3\' or h2.invoice_type = \'3S\')) ' ;
            break;
        case 'block_orders' :
           filter.where += ' and (   d.delivery_block is not null \
                                      or d.shipment_hold  is not null )  \
                                 and  exists (select d2.status from backlog_delv d2 \
                                               where d.legacy_order_no = d2.legacy_order_no  \
                                                 and d2.status   in (\'Production\')) ' ;
            break;
        case 'fix_delivery' :
            filter.addLike  ("%FD", "h.special_codes");
            break;
            
    }
    console.info('filter binds' + filter.binds);
    console.info('where clause' + filter.where);
}
module.exports.init = function(app) {

    /*----------------------------------------------------------------------------
    |   Internal AdvanceSearchSummary Webservice.
    \---------------------------------------------------------------------------*/
 app.get('/ossui/v1/in/advanceSearchSummary', app.role(AuthGroupSandyUser), function(req, res) {
    
    var filter = new SqlUtils.AndWhere();
    var b = new SqlUtils2.Bind( filter.bindNo );
    
    var id = '';
    var fields = {
        "hpOrderNo" : "123",
        "origin"   : [
             "ebay_de",
             "mad",
             "elf"
        ],
        "group"  : "await_pod",
        "searchByDates" : {
            "webOrderNo" :[
                            "abc*" ,
                        ],
            
        }     
    }
    var result = JSON.parse(JSON.stringify(fields));
    
    var org =result.searchByDates.webOrderNo;
    console.log(org);
    console.log('length' +org.length);
   
    
    var result = JSON.parse(JSON.stringify(req.body));
    
    if (result.hpOrderNo != undefined){
        id = 'hporderno';
        createAdvanceQueryStatements(id, result.hpOrderNo, filter, res);
    }
    if (result.custPoNo != undefined){
        id = 'custPoNo';
        createAdvanceQueryStatements(id, result.custPoNo, filter, res);
    }
    if (result.custName != undefined) {
        id = 'custName';
        createAdvanceQueryStatements(id, result.custName, filter, res);
    }
    if (result.custId != undefined) {
        id = 'custId';
        createAdvanceQueryStatements(id, result.custId, filter, res);
    }
    if (result.so_no != undefined){
        id = 'so_no';
        createAdvanceQueryStatements(id, result.so_no, filter, res);
    }
    if (result.csr != undefined) {
        id = 'sales_coord';
        createAdvanceQueryStatements(id, result.csr, filter, res);
    }
    if (result.status != undefined) {
        CreateAdvanceStatusQuery(result.status, filter, res);
    }
    if (result.type != undefined) {
        createAdvanceOrderTypeQuery(result.status, filter, res);
    }
    if (result.origin != undefined) {
        var origin = result.origin;
        createAdvanceOriginQuery(origin,filter, res);
    }
    if (result.group != undefined) {
        createAdvanceGroupQuery(result.group,filter, res);
    }
    if (result.repository != undefined) {
        id = 'orderStatus';
        createAdvanceQueryStatements(id, result.repository, filter, res);
    }
    if(result.searchByDates.web_order_no != undefined) {
        id = 'webOrderNo';
        createAdvanceNumberQuery(id, result.searchByDates.web_order_no, filter, res);
    }
    if(result.searchByDates.asset_tag != undefined) {
        id = 'assetTag';
        createAdvanceNumberQuery(id, result.searchByDates.asset_tag, filter, res);
    }
    if(result.searchByDates.b2bid != undefined) {
        id = 'b2bid';
        createAdvanceNumberQuery(id, result.searchByDates.b2bid, filter, res);
    }
    if(result.searchByDates.eop_id != undefined) {
        id = 'eop_id';
        createAdvanceNumberQuery(id, result.searchByDates.eop_id, filter, res);
    }
    if(result.searchByDates.cust_fam_no != undefined) {
        id = 'famNo';
        createAdvanceNumberQuery(id, result.searchByDates.cust_fam_no, filter, res);
    }
    if(result.searchByDates.csn != undefined) {
        id = 'csn';
        createAdvanceNumberQuery(id, result.searchByDates.csn, filter, res);
    }
    if(result.searchByDates.cust_no != undefined) {
        id = 'custNo';
        createAdvanceNumberQuery(id, result.searchByDates.cust_no, filter, res);
    }
    if(result.searchByDates.eclaim_no != undefined) {
        id = 'eclaimNo';
        createAdvanceNumberQuery(id, result.searchByDates.eclaim_no, filter, res);
    }
    if(result.searchByDates.fsn != undefined) {
        id = 'fsn';
        createAdvanceNumberQuery(id, result.searchByDates.fsn, filter, res);
    }
    if(result.searchByDates.ivn != undefined) {
        id = 'ivn';
        createAdvanceNumberQuery(id, result.searchByDates.ivn, filter, res);
    }
    if(result.searchByDates.mac_addr != undefined) {
        id = 'macAddr';
        createAdvanceNumberQuery(id, result.searchByDates.mac_addr, filter, res);
    }
    if(result.searchByDates.ncrf_no != undefined) {
        id = 'ncrfNo';
        createAdvanceNumberQuery(id, result.searchByDates.ncrf_no, filter, res);
    }
    if(result.searchByDates.purch_agree != undefined) {
        id = 'purchAgree';
        createAdvanceNumberQuery(id, result.searchByDates.purch_agree, filter, res);
    }
    if(result.searchByDates.hp_quote_no != undefined) {
        id = 'quoteNo';
        createAdvanceNumberQuery(id, result.searchByDates.hp_quote_no, filter, res);
    }
    if(result.searchByDates.sal_number != undefined) {
        id = 'salNo';
        createAdvanceNumberQuery(id, result.searchByDates.sal_number, filter, res);
    }
    if(result.searchByDates.serial_no != undefined) {
        id = 'serialNo';
        createAdvanceNumberQuery(id, result.searchByDates.serial_no, filter, res);
    }
    if(result.searchByDates.imei != undefined) {
        id = 'imei';
        createAdvanceNumberQuery(id, result.searchByDates.imei, filter, res);
    }
    if(result.searchByDates.gvt_contract_number != undefined) {
        id = 'gvtContractNo';
        createAdvanceNumberQuery(id, result.searchByDates.gvt_contract_number, filter, res);
    }
    if(result.searchByDates.wawf_number != undefined) {
        id = 'wawfNo';
        createAdvanceNumberQuery(id, result.searchByDates.wawf_number, filter, res);
    }
    if(result.searchByDates.account_name != undefined) {
        id = 'accountName';
        createAdvanceNumberQuery(id, result.searchByDates.account_name, filter, res);
    }
    if(result.searchByDates.leg_ord_type != undefined) {
        id = 'legOrdType';
        createAdvanceNumberQuery(id, result.searchByDates.leg_ord_type, filter, res);
    }
    if(result.searchByDates.mci != undefined) {
        id = 'mci';
        createAdvanceNumberQuery(id, result.searchByDates.mci, filter, res);
    }
    if(result.searchByDates.opportunity_id != undefined) {
        id = 'opportunityId';
        createAdvanceNumberQuery(id, result.searchByDates.opportunity_id, filter, res);
    }
    if(result.searchByDates.rebate_request_id != undefined) {
        id = 'rebateRequestId';
        createAdvanceNumberQuery(id, result.searchByDates.rebate_request_id, filter, res);
    }
   
    
 });
}
