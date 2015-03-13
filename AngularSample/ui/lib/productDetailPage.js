var UserSysItem  = require('../lib/UserSysItemCode');
var _            = require('underscore');
var fs=require("fs");
var exec = require('child_process').execFile;
var TclParser = require('../lib/tcllist');

module.exports.ProductDetails=function(os,item,db,cb) {

    var sqlString="select item_source, system, legacy_order_no, \
                     item_subitem, customer_item_no, cust_product_no, \
                     so_no, so_item_no, higher_level, i.material_no, \
                     so_line_item_qty, open_qty, shipped_qty, \
                     product_descr, material_type, item_category, \
                     bundle_id, hl_bundle_id, model_id, config_id, \
                     upc_no, supp_prod, prod_hierarchy, ipt, route, sales_force, product_line, \
                     customer_req_date, warranty_code, clean_date, \
                     delivery_block, credit_status, supplier, plant_code, ship_from,  \
                     lsp_name, big_deal_id, \
                     stati,latest_arr_date, mfg_part_number, \
                     epeat_designation,sap_delv_no, fact_delv_no, cust_delv_no, \
                     shipment_no, fact_bol_no, cust_bol_no, \
                     sched_line_no, sched_line_qty, status, earl_arr_date, ead_stt, latest_arr_date, lad_stt,  \
                     first_tba_flag, first_tba_sent, first_ack_nontba, fiack_nontba_sent, \
                     lack_tba_flag, last_ack_date, last_ack_sent, last_ack_reason, l_ack_reason_text, \
                     supplier_sdd, bt_actual, pd_actual, pgi_actual, ercv_actual, eshp_actual \
                     from backlog_item i  \
                left outer join epeat_data ep \
                    on (i.material_no = ep.material_no) \
            where i.legacy_order_no = :1   \
                and i.item_subitem = :2   \
            order by i.item_sln";

   db.execute(sqlString,[os,item],function(err,result){
        var uniqStati=[];
        var uniqDataSources=[];
        var uniqStatiJoin='';
        var uniqDataSourcesJoin='';
        console.log(err);
        if(err)cb(err,null);

        if(result[0].stati!=null) {
            uniqStati = _.union(uniqStati, result[0].stati.split(" "));
            uniqDataSources = _.union(uniqDataSources, result[0].system);
            uniqStatiJoin = uniqStati.join("','");
            uniqDataSourcesJoin=uniqDataSources.join("','");
        }
        console.log(" === ");
        console.log(uniqDataSources);
        var itemResult={};
        var scheduleLines=[];
        result.forEach(function(row,i){
            itemResult ={
                "item_subitem":row.item_subitem,
                "item_source":row.item_source,
                "legacy_order_no":row.legacy_order_no,
                "source":row.source,
                "customer_item_no":row.customer_item_no,
                "cust_product_no":row.cust_product_no,
                "so_no":row.so_no,
                "sapsystem":row.system,
                "so_item_no":row.so_item_no,
                "higher_level":row.higher_level,
                "so_line_item_qty":row.so_line_item_qty,
                "open_qty":row.open_qty,
                "shipped_qty":row.shipped_qty,
                "product_descr":row.product_descr,
                "material_type":row.material_type,
                "item_category":row.item_category,
                "bundle_id":row.bundle_id,
                "hl_bundle_id":row.hl_bundle_id,
                "model_id":row.model_id,
                "config_id":row.config_id,
                "upc_no":row.upc_no,
                "material_no":row.material_no,
                "supp_prod":row.supp_prod,
                "prod_hierarchy":row.prod_hierarchy,
                "ipt":row.ipt,
                "route":row.route,
                "sales_force":row.sales_force,
                "product_line":row.product_line,
                "customer_req_date":row.customer_req_date,
                "warranty_code":row.warrant_code,
                "clean_date":row.clean_date,
                "delivery_block":row.delivery_block,
                "credit_status":row.credit_status,
                "supplier":row.supplier,
                "plant_code":row.plant_code,
                "ship_from":row.ship_from,
                "lsp_name":row.lsp_name,
                "big_deal_id":row.big_deal_id,
                "latest_arr_date":row.latest_arr_date,
                "mfg_part_number":row.mfg_part_number,
                "epeat_designation":row.epeat_designation
            };
            var scheduleLine=exports.scheduleLines(row);
            scheduleLines.push(scheduleLine);
        });

        itemResult["scheduleLines"]=scheduleLines;

        UserSysItem.getItemHoldCode(uniqStati, uniqDataSources,"product", db, function(err, HoldCodes) {
            if(err)cb(err,null);
            var itemHoldCodes=[];
            for (var x = 0; x < uniqStati.length; x++) {
                var key = uniqStati[x] + "|" + result[0].system;
                if (HoldCodes[0][key] != null) {
                    var str=uniqStati[x]+":"+HoldCodes[0][key]
                    itemHoldCodes.push(str);
                }
            }

            itemResult["HoldCodes"]=itemHoldCodes;
            exports.getProductLineFields(result[0].product_line,db,function(err,productLines) {
                itemResult["ProductLines"]=productLines;

                exports.productLineHeirarchy(result[0].material_no,itemResult,db,function(err,Heirarchy) {

                    itemResult["ProductHeirarchy"]=Heirarchy;
                    exports.getWWClassInfo(result[0].material_no,function(err,wwClassInfo) {
                        itemResult["wwClassInfo"]=wwClassInfo
                        result=[];
                        result.push(itemResult);
                        cb(null,result);
                    });
                });
            });
        });
   });
}

/****************************************************************
#
#
#
******************************************************************
*/
module.exports.getProductLineFields=function(productLine,db,cb) {

    var sqlString="select group_name, group_name_id, \
                     group_name_short, group_code, group_code_id, \
                     category_name, category_id, category_short, \
                     line_name,line  \
                    from pl_dim  \
                  where line = :1"
    db.execute(sqlString,[productLine],function(err,result){
        if(err)cb(err,null);
        var productLines=[];
        if(result.length>0) {
            var line1=result[0].group_name_short+"-"+result[0].group_name;
            var line4=result[0].line+"-"+result[0].line_name;

            productLines.push(line1);
            productLines.push(result[0].category_name);
            productLines.push(result[0].group_code);
            productLines.push(line4)
        }
        cb(null,productLines)
    });
}

module.exports.getISOCode=function(os,item,db,cb) {
   var sqlString="select c.iso_code \
                     from backlog_item i, backlog_delv d, country c \
                  where i.legacy_order_no = :1 \
                     and i.item_subitem = :2 \
                   and d.delivery_group = i.delivery_group \
                     and c.hp_code = d.ship_to_wcc";
   db.execute(sqlString,[os,item],function(err,result){

      if(err)cb(err,null);

      cb(null,result)

   });
}

module.exports.productLineHeirarchy=function(materialNo,itemResult,db,cb) {
   var sqlString="select product_type, group_code, division_code, \
                     type_code, line_code, family_code, product_code, model_code \
                  from ras_hierarchy \
                     where product_no = :1"
    db.execute(sqlString,[materialNo],function(err,result){
        if(err)cb(err,null);
        console.log(materialNo);
        if(result.length > 0) {
            itemResult["product_type"]=result[0].product_type
            sqlString="select product_no, description  \
                  from ras_hierarchy \
                 where product_no in (:1,:2,:3,:4,:5,:6,:7)";

            db.execute(sqlString,[result[0].group_code,result[0].division_code,result[0].type_code,
                   result[0].line_code,result[0].family_code,result[0].product_code,result[0].model_code],function(err,heirarchy) {

                var ProductLinesHeirarchy=[];
                var str="";
                heirarchy.forEach(function(row,i){
                    if (row.product_no== result[0].group_code) {
                        str=result[0].group_code+"-"+row.description;
                        ProductLinesHeirarchy[0]=str;
                    }
                    if (row.product_no == result[0].division_code) {
                        str=result[0].division_code+"-"+row.description;
                        ProductLinesHeirarchy[1]=str;
                    }
                    if (row.product_no == result[0].type_code) {
                        str=result[0].type_code+"-"+row.description;
                        ProductLinesHeirarchy[2]=str;
                    }
                    if (row.product_no == result[0].line_code) {
                        str=result[0].line_code+"-"+row.description;
                        ProductLinesHeirarchy[3]=str;
                    }
                    if (row.product_no == result[0].family_code) {
                        str=result[0].family_code+"-"+row.description;
                        ProductLinesHeirarchy[4]=str;
                    }
                    if (row.product_no == result[0].product_code) {
                        str=result[0].product_code+"-"+row.description;
                        ProductLinesHeirarchy[5]=str;
                    }
                    if (row.product_no== result[0].model_code) {
                        str=result[0].model_code+"-"+row.description;
                        ProductLinesHeirarchy[6]=str;
                    }

                });
                cb(null,ProductLinesHeirarchy);
            });

        } else {

            cb(null,[]);
        }
    });
}

module.exports.loadMaterialStatusSetup=function(db,cb)  {

    var sqlString="select sapsystem, material_status, \
                    material_status_text,  \
                    block_category, internal_text  \
                   from mat_status_setup";

    db.execute(sqlString,[],function(err,result) {
        if(err)cb(err,null);
        var materialStatusSetup={};
        var materialStatusSetupCodes=[];
        result.forEach(function(row,i){
            var text= row.material_status_text
            if (row.internal_text != "") {
                text=row.internal_text;
            }
            var cat="unknown"
            var subcat="";
            var categories=row.block_category.split("/");
            cat=categories[0];
            subcat=categories[1];
            if(text != null){
                materialStatusSetup[row.sapsystem+","+row.material_status+","+"text"] = text;
                materialStatusSetup[row.sapsystem+","+row.material_status+","+"cat"]=cat;
                materialStatusSetup[row.sapsystem+","+row.material_status+","+"subcat"]=subcat;
            }
            materialStatusSetupCodes.push(materialStatusSetup);
        });

        cb(null,materialStatusSetupCodes);
    });
}

module.exports.getProductLineHierarchy=function() {
    var sqlString="select line, line_name, \
                  group_name_short, category_name \
                from pl_dim";
    db.execute(sqlString,[],function(err,result){

    });
}

module.exports.scheduleLines=function(row) {
    var scheduleLine={
        'sap_delv_no':row.sap_delv_no,
        'fact_delv_no':row.fact_delv_no,
        'cust_delv_no':row.cust_delv_no,
        'shipment_no':row.shipment_no,
        'fact_bol_no':row.fact_bol_no,
        'cust_bol_no':row.cust_bol_no,
        'sched_line_no':row.sched_line_no,
        'sched_line_qty':row.sched_line_qty,
        'status':row.status,
        'earl_arr_date':row.earl_arr_date,
        'ead_stt':row.ead_stt,
        'latest_arr_date':row.latest_arr_date,
        'lad_stt':row.lad_stt,
        'first_tba_flag':row.first_tba_flag,
        'first_tba_sent':row.first_tba_sent,
        'first_ack_nontba':row.first_ack_nontba,
        'fiack_nontba_sent':row.fiack_nontba_sent,
        'lack_tba_flag':row.lack_tba_flag,
        'last_ack_date':row.last_ack_date,
        'last_ack_sent':row.last_ack_sent,
        'last_ack_reason':row.last_ack_reason,
        'l_ack_reason_text':row.l_ack_reason_text,
        'supplier_sdd':row.supplier_sdd,
        'bt_actual':row.bt_actual,
        'pd_actual':row.pd_actual,
        'pgi_actual':row.pgi_actual,
        'ercv_actual':row.ercv_actual,
        'eshp_actual':row.eshp_actual
    }
    return scheduleLine;
}

module.exports.getWWClassInfo=function(material_no,cb) {
    var scriptOutput=[];
    var child;
    child=exec('/opt/oss/pkg/frontend/wwClassWrapper.tcl',[material_no], function(error, stdout, stderr) {

        if (error !== null) {
            wwClassInfo=[];
        } else {
            scriptOutput=stdout.split("\n");
            wwClassInfo=[];
            scriptOutput.forEach(function(row) {
                var countryInfo={};
                var strs=TclParser.Tcl2Array(row);
                console.log(strs);
                countryInfo["country_code"]=strs[0];
                countryInfo["country"]=strs[1];
                countryInfo["export_code"]=strs[6];
                countryInfo["US_export_code"]=strs[7];
                countryInfo["Harmonized_important_code"]=strs[4];
                countryInfo["description"]=strs[5];
                wwClassInfo.push(countryInfo);
            });

        }
        cb(null,wwClassInfo);
    });
}
module.exports.ExternalProductDetails=function(os,item,db,cb) {
    var sqlString="select distinct i.item_subitem, \
               i.so_line_item_qty, i.material_no, i.product_descr, i.cust_product_no, \
               i.bundle_id, i.model_id, i.config_id, i.config_uid, i.customer_req_date, \
               i.plant_code, i.ship_from, \
               i.customer_req_date, i.big_deal_id, i.mfg_part_number, ep.epeat_designation \
        from backlog_item i  \
            left outer join epeat_data ep  \
            on  (i.material_no = ep.material_no) \
        where i.legacy_order_no = :1 \
            and i.item_subitem = :2";
    db.execute(sqlString,[os,item],function(err,result){
        var itemResult={};
        var scheduleLines=[];
        result.forEach(function(row,i){
            itemResult={
                "item_subitem":row.item_subitem,
                "material_no":row.material_no,
                "cust_product_no":row.cust_product_no,
                "product_descr":row.product_descr,
                "bundle_id":row.bundle_id,
                "model_id":row.model_id,
                "config_id":row.config_id,
                "customer_req_date":row.customer_req_date,
                "plant_code":row.plant_code,
                "ship_from":row.ship_from,
                "big_deal_id":row.big_deal_id,
                "mfg_part_number":row.mfg_part_number,
                "epeat_designation":row.epeat_designation
            }
        });
        exports.getWWClassInfo(result[0].material_no,function(err,wwClassInfo) {
            itemResult["wwClassInfo"]=wwClassInfo
            result=[];
            result.push(itemResult);
            cb(null,result);
        });
    });
}
