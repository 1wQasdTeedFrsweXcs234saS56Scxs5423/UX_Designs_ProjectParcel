var Resp         = require('../lib/RespUtils.js');
var _            = require('underscore');
var bunyan       = require('bunyan');
var DbPool    = require('../lib/DbPool');
var log          = new bunyan({
    name: 'OrderLifeCycleWebService',
})

module.exports.orderLifeCycle=function(os,action,cb) {
    DbPool.OSSDB( function(db) {

        if(action == "details") {
            
            exports.details(db,os,function(err,result){

                if(err){
                    cb(err,null)
                }else{
                    cb(null,result)
                }

            });

        }else if(action=="timelines") {

            exports.timelines(db,os,function(err,result){

                if(err){

                    cb(err,null)

                }else{

                    cb(null,result)

                }

            });

        }

    });

}



module.exports.timelines=function(db,os,cb) {

    var sqlString="select delivery_group, shipment_group, status,   \
                  heart_val_date, plo_start_date, mat_avail_date, goal_ship_date, \
                  planned_pgi_date, first_ack_nontba, last_ack_date, \
                  orig_sched_delv_dt, sched_delv_date, sdd_comment, \
                  earl_arr_date, ead_stt, latest_arr_date, lad_stt, \
                  active_event,actual_goal_crit, actual_goal_value, \
                  actual_lad_crit,  actual_lad_value, actual_fack_crit, actual_fack_value, \
                  actual_lack_crit, actual_lack_value, bt_actual, \
                  bt_goal_opt, bt_goal_latest, bt_goal_crit, bt_goal_value, \
                  bt_lad_opt,  bt_lad_latest, bt_lad_crit, bt_lad_value, \
                  bt_fack_opt, bt_fack_latest, bt_fack_crit, bt_fack_value, \
                  bt_lack_opt, bt_lack_latest, bt_lack_crit, bt_lack_value, \
                  pd_actual,pd_goal_opt, pd_goal_latest, pd_goal_crit, pd_goal_value, \
                  pd_lad_opt,  pd_lad_latest, pd_lad_crit, pd_lad_value, \
                  pd_fack_opt, pd_fack_latest, pd_fack_crit, pd_fack_value, \
                  pd_lack_opt, pd_lack_latest, pd_lack_crit, pd_lack_value, \
                  dg_actual,dg_goal_opt, dg_goal_latest, dg_goal_crit, dg_goal_value, \
                  dg_lad_opt,  dg_lad_latest, dg_lad_crit, dg_lad_value, \
                  dg_fack_opt, dg_fack_latest, dg_fack_crit, dg_fack_value, \
                  dg_lack_opt, dg_lack_latest, dg_lack_crit, dg_lack_value, \
                  pgi_actual,pgi_goal_opt, pgi_goal_latest, pgi_goal_crit, pgi_goal_value, \
                  pgi_lad_opt,  pgi_lad_latest,  pgi_lad_crit,  pgi_lad_value, \
                  pgi_fack_opt, pgi_fack_latest, pgi_fack_crit, pgi_fack_value, \
                  pgi_lack_opt, pgi_lack_latest, pgi_lack_crit, pgi_lack_value, \
                  ercv_actual,ercv_goal_opt, ercv_goal_latest, ercv_goal_crit, ercv_goal_value, \
                  ercv_lad_opt,  ercv_lad_latest,  ercv_lad_crit,  ercv_lad_value, \
                  ercv_fack_opt, ercv_fack_latest, ercv_fack_crit, ercv_fack_value, \
                  ercv_lack_opt, ercv_lack_latest, ercv_lack_crit, ercv_lack_value, \
                  eshp_actual, eshp_goal_opt, eshp_goal_latest, eshp_goal_crit, eshp_goal_value, \
                  eshp_lad_opt,  eshp_lad_latest,  eshp_lad_crit,  eshp_lad_value, \
                  eshp_fack_opt, eshp_fack_latest, eshp_fack_crit, eshp_fack_value, \
                  eshp_lack_opt, eshp_lack_latest, eshp_lack_crit, eshp_lack_value, \
                  pod_actual, pod_goal_opt, pod_goal_latest, pod_goal_crit, pod_goal_value, \
                  pod_lad_opt,  pod_lad_latest,  pod_lad_crit,  pod_lad_value, \
                  pod_fack_opt, pod_fack_latest, pod_fack_crit, pod_fack_value, \
                  pod_lack_opt, pod_lack_latest, pod_lack_crit, pod_lack_value, \
                  invo_actual,stt, sat, ftt \
                from backlog_delv \
                  where legacy_order_no = :1 \
                 order by delivery_group";

    db.execute(sqlString,[os],function(err,result){

        if(err)cb(err,null)

        db.execute("select alarm_datetime \
                    from alarms \
                    where object = :1",[os],function(err,alaram) {
           
            if(err)cb(err,null)
            result[0]["criticaAlaram"]=alaram;
            cb(null,result);
        });
    });
}



module.exports.details=function(db,os,cb) {

    var sqlString ="select  h.oss_load_date h_oss_load_date, \
                        h.quote_creation_date h_quote_creation_date, \
                        h.web_order_creation_dt h_web_order_creation_dt, \
                        h.purch_order_date h_purch_order_date, \
                        h.hp_receive_date h_hp_receive_date, \
                        h.fraud_approved_date h_fraud_approved_date, \
                        h.payment_receive_date h_payment_receive_date, \
                        h.credit_approval_date h_credit_approval_date, \
                        h.order_load_date  h_order_load_date, \
                        h.clean_order_date h_clean_order_date, \
                        h.clean_hdr_date h_clean_hdr_date, \
                        h.compl_landed_date  h_compl_landed_date, h.order_close_date h_order_close_date, \
                        d.delivery_group d_delivery_group, d.shipment_no d_shipment_no, \
                        d.fact_delv_no  d_fact_delv_no,  d.cust_bol_no  d_cust_bol_no, \
                        d.bt_actual d_bt_actual, d.pd_actual d_pd_actual, \
                        d.dg_actual d_dg_actual, d.pgi_actual d_pgi_actual, \
                        d.ercv_actual d_ercv_actual, d.eshp_actual d_eshp_actual, \
                        d.pod_actual d_pod_actual, d.invo_actual d_invo_actual, \
                        d.stt d_stt, d.sat d_sat, d.ftt d_ftt, d.route d_route,  \
                        i.item_sln i_item_sln, i.item_subitem i_item_subitem,   \
                        i.material_no i_material_no,i.product_descr i_product_descr, \
                        i.sched_line_qty i_sched_line_qty, i.status i_status,  \
                        i.last_ack_date i_last_ack_date, i.eta i_eta, \
                        i.lead_time i_lead_time \
                       from backlog_hdr h, backlog_delv d, backlog_item i \
                        where h.legacy_order_no = :1 \
                        and h.legacy_order_no = d.legacy_order_no \
                      and d.legacy_order_no = i.legacy_order_no \
                       and d.delivery_group  = i.delivery_group \
                      order by d.delivery_group,i.item_subitem";
    db.execute(sqlString,[os],function(err,result){
        var olcDetails={};
        olcDetails["delivery_groups"] = [];
        olcDetails["header"]={};
        var visitedDeliveryGroups=[];
        var items=[];
        var j=0;
        var length=result.length;
        result.forEach(function(row,i){
            var delvRow=[];
            var delivery_group={};
            var item={};
            Object.keys(row).forEach(function(key) {
                if(key.match(/^h_/)) {

                    var keyString = key.substring(2,key.length);
                    olcDetails["header"][keyString]=row[key];

                }else if(key.match(/^d_/)) {

                    if(visitedDeliveryGroups.indexOf(row.d_delivery_group)==-1){
                        var keyString = key.substring(2,key.length);
                        delivery_group[keyString]=row[key];
                    }

                }else {
                    var keyString = key.substring(2,key.length);
                    item[keyString]=row[key];
                }

            });

            items.push(item);

            if(visitedDeliveryGroups.indexOf(row.d_delivery_group)==-1){
                j=j+1;
                olcDetails["delivery_groups"].push(delivery_group);
            }
            if(i<length-1) {
                if(result[i]["d_delivery_group"]!=result[i+1]["d_delivery_group"]) {
                    olcDetails["delivery_groups"][j-1]["items"]=[];
                    olcDetails["delivery_groups"][j-1]["items"]=items;
                    items=[];
                }
            }else{
                olcDetails["delivery_groups"][j-1]["items"]=items;
            }
            visitedDeliveryGroups.push(row.d_delivery_group);
        });

        cb(null,olcDetails);

    });

}

