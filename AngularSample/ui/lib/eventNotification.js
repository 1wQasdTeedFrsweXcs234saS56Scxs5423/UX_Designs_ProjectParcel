var DbPool    = require('../lib/DbPool');
var UserSysItem  = require('../lib/UserSysItemCode');
var config       = require('../config/config.js');
var Resp         = require('../lib/RespUtils.js');
var _            = require('underscore');
var LogJs        = require('../lib/logJs');
var SqlUtils  = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2");
var queryUtils = require("../lib/queryUtils");
var osconfig    = require('/etc/opt/oss/backend/UI.cfg');
var tstore    = require('../lib/tstore');
var async    = require('async');
var ts = new tstore.TStore( osconfig.UITstoreConnection );
var bunyan    = require('bunyan');
var log          = new bunyan({
    name: 'eventNotificationWebService',
});

function arrayExists(a) {
  if (a != null && a != undefined) {
    return true;
  }
  return false;
}

module.exports.GetActiveOrders = function(req, res) {

          DbPool.OSSDB(function(db) {
              
            var sqlString ="select h.order_no as orderNo, h.customer_name as customerName, \
                h.purchase_order_no as customerPoNo, \
                to_char(h.last_update) as lastUpdate,h.legacy_order_no as legacyOrder \
                from backlog_hdr h,watch w  \
                where h.legacy_order_no = w.legacy_order_no and w.weblogin =:1 "
            
            db.execute(sqlString, [req.user_id], function(err, activeOrders) {

                var msg = 'No Existing Notification Orders found.';

                if (err) {log.error(err);}

                if (_.isEmpty(activeOrders) )  {
                  res.json({
                      status:"E",
                      message:msg,
                      data:""
                  });

                } else {
                log.info('activeOrders' + activeOrders);
                res.json({
                    status:"S",
                    message:'',
                    data:activeOrders
                });
            }
            }); 

        });
    }
    module.exports.GetDetailactiveOrders= function(req, res) {

          DbPool.OSSDB(function(db) {

            var visitedOrders = [];
            var newOrder=[];

            var sqlString ="select s.sales_org, \
             s.order_no, s.shipment_no, s.delivery_status, \
                s.show_extern, s.customer_order, s.customer_name, s.customer_po_no, \
                s.status, s.legacy_order_no, to_char(s.last_update) as  last_update, \
                h.work_note_attribs, h.nearest_action_date, h.cust_informed, \
                h.so_no, h.legacy_order_no, \
                w.options \
               from backlog_hdr h, backlog_ship s, watch w \
               where s.legacy_order_no = w.legacy_order_no \
                and s.legacy_order_no = h.legacy_order_no \
                and w.weblogin = :1 \
                order by s.customer_po_no  asc, s.legacy_order_no asc  ";

            db.execute(sqlString, [req.user_id], function(err, detailactiveOrders) {
              var msg='';
                if (err) {log.error(err);}

                if (detailactiveOrders.length == 0 || detailactiveOrders == null) {
                    msg = 'No Existing Notification Orders found.';
                    //msg = exports.getResponseMsg(msg,req);
                    res.json({
                      status:"E",
                      message:msg,
                      data:""
                  });
                    
                } else {

                    log.info('detailactiveOrders' + detailactiveOrders);

                    for (var i=0; i<=detailactiveOrders.length-1; i++) {
                      if(visitedOrders.indexOf(detailactiveOrders[i].order_no ) == -1 ) {
                          schedLines = [];

                          schedLines=exports.addInternalScheduleLine(schedLines,detailactiveOrders,i);
                          newOrder=exports.addNewOrder(newOrder,detailactiveOrders,i);
                      } else {
                          schedLines=exports.addInternalScheduleLine(schedLines,detailactiveOrders,i);
                      }
                      visitedOrders.push(detailactiveOrders[i]["order_no"]);
                  };

                Resp.sendResponse(res, log, 'Sending back orders details.','', newOrder);
                }
            });
            
        });
    }

module.exports.GetHpOrderNos=function(req, res) {

        //----------------------------------------------------------------------
        //   prepare ORACLE based filter
        //----------------------------------------------------------------------
        
        order_no=req.query.hpOrderNo.replace("/\*/","/\%/");
        console.log("order"+order_no);
        
        var filter = new SqlUtils.AndWhere();
        
        filter.addLike       (order_no,  "backlog_hdr.order_no"         );

        log.info('filter binds' + filter.binds);
        log.info('where clause' + filter.where);

        //----------------------------------------------------------------------
        //   prepare TSTORE based filter
        //----------------------------------------------------------------------
        var tsfilter = new SqlUtils.AndWhereDirect();


        tsfilter.addIStartsWith (order_no,  "order_no");
        console.log('TS where clause' + tsfilter.where);

        var ts1 = new Date();
        var tdiff = Date.now() - ts1.getTime()
        console.log('DB 0 runtime : ' + tdiff + ' msec' );

        exports.OSSTSQuery( tsfilter.where , function(tsErr, tsOrders) {
             console.log(tsErr);
              if (tsErr) {
                 
                return res.json({
                    status: 'E',
                    message: tsErr,
                    data: ''
                });
            }

          console.log('tsErr = '    +  tsErr    );
          console.log('tsOrders = ' +  tsOrders );

          if (tsOrders == '') {
              var where = filter.where  // just plain basic ORACLE
          } else {
              var where = '(' + filter.where + ') and ( backlog_hdr.legacy_order_no in ('+tsOrders+') )'
          }

          console.log('where = ' +  where );

          DbPool.OSSDB(function(db) {

            db.execute("select * \
                          from (select backlog_hdr.purchase_order_no as purchOrderNo, \
                                       backlog_hdr.order_no as orderNo,  backlog_hdr.legacy_order_no as legacyOrder, \
                                       backlog_hdr.customer_name as custName, \
                                       watch.weblogin, watch.options, watch.format, watch.users, watch.timing, \
                                       to_char(backlog_hdr.purch_order_date) as purchOrderDate \
                                      from backlog_hdr \
                                      left outer join watch on (backlog_hdr.legacy_order_no = watch.legacy_order_no and watch.weblogin = '" + req.user_id + "' ) \
                                 where ("
                                 + where +
                                 ") order by backlog_hdr.order_no )", filter.binds, function(err, summary) {

                if (err) {
                    return Resp.sendError(res, log, err);
                } else {
                    var msg = '';
                    if (summary == null || summary.length == 0) {
                        
                        msg = exports.getResponseMsg(msg,req);
                        res.json({
                            status:"E",
                            message:msg,
                            data:""
                        });
                    } else {
                        summary.forEach(function(row, i) {

                            if (row.timing != null) {
                                row.watchOrderFlag = 'true'
                            } else {
                                row.watchOrderFlag = 'false'
                            }
                        });

                        log.info('summary' + summary);
                        res.json({
                            status:"S",
                            message:msg,
                            data:summary
                        });
                      }
                    }
                });
            });
        });
    }
    
    
    module.exports.saveWatch=function(req,res) {
    
        var result = JSON.parse(JSON.stringify(req.body));
        var d=new Date();
                
        var rowValue= {
                
            "legacy_order_no":result.os,
            "weblogin":req.user_id,
            "options":result.options,
            "format":result.format,
            "users":result.users,
            "timing":result.timing,
            "creation_date":d
        }
            
        console.log(rowValue);
        DbPool.OSSDB(function(db) {
                      
            var table ='watch';
            var row = {
                "legacy_order_no" :result.os,
                "weblogin" : req.user_id
            };
            queryUtils.deleteTable(db,table,row,function(err,result){
                console.log(result);
            });
            
            queryUtils.insertTable(db,table,rowValue,function(err,result){
              console.log(result);
            });
               
        });
    }
    
    module.exports.deleteWatch=function(req,res){
    
        DbPool.OSSDB(function(db) {
                  
            var table ='watch';
            var row = {
                "legacy_order_no" :req.query.os,
                "weblogin" : req.user_id
            };
            queryUtils.deleteTable(db,table,row,function(err,result){
                console.log(result);
            });
        });
    }
    
    module.exports.saveProfile=function(req,res) {
    
        var result = JSON.parse(JSON.stringify(req.body));
        var d=new Date();
                
        var rowValue= {
                
            "profile":result.profile,
            "weblogin":req.user_id,
            "options":result.options,
            "format":result.format,
            "users":result.users,
            "timing":result.timing,
            "creation_date":d
        }
            
        console.log(rowValue);
        DbPool.OSSDB(function(db) {
                      
            var table ='iwatch';
            var row = {
                "profile" :result.profile,
                "weblogin" : req.user_id
            };
            queryUtils.deleteTable(db,table,row,function(err,result){
                console.log(result);
            });
            
            queryUtils.insertTable(db,table,rowValue,function(err,result){
              console.log(result);
            });
               
        });
    }
    
    module.exports.deleteProfile=function(req,res){
        
        DbPool.OSSDB(function(db) {
                  
            var table ='iwatch';
            var row = {
                "profile" :req.query.profile,
                "weblogin" : req.user_id
            };
            queryUtils.deleteTable(db,table,row,function(err,result){
                console.log(result);
            });
        });
    }
    
    
    module.exports.GetUserSettingsForOrder=function(req,res) {

        DbPool.OSSDB(function(db) {
            
            var sqlString="select weblogin,timing,options, users, format  from watch where legacy_order_no=:1 and weblogin=:2";
            
            var bindValues = [req.query.legacy_order_no, req.user_id];
            console.log(bindValues);
            
            module.exports.GetSettings(sqlString,bindValues,db,res);
        });
    }
    module.exports.GetUserSettingsForProfile=function(req,res) {

         DbPool.OSSDB(function(db) {
            
            var sqlString="select options,format, users, timing from iwatch w where w.profile = :1 and w.weblogin = :2 ";
            
            var bindValues = [req.query.profile, req.user_id];
            console.log(bindValues);
            
            module.exports.GetSettings(sqlString,bindValues,db,res);
        
         });
    }
    module.exports.GetSettings=function(sqlString,bindValues,db,res){
       
        db.execute(sqlString, bindValues, function(err, results) {
            console.log(results);
            
            var optionSettings = {
                  Ack : false,
                  orderChn :true,
                  sddChn :false,
                  statSubmit : false,
                  statAdmin  : false,
                  statAcked : false,
                  statProd  : false,
                  statPDone : false,
                  statRegis : false,
                  statDelv : false,
                  statShip : false,
                  statShipF : false,
                  statInv : false,
                  statCanc : false,
                  holdEntry : false,
                  holdFulfil : false,
                  holdShip : false,
                  holdBill : false,
                  holdFallout : false
            };

            var formatSettings = {
                  
                formatHead : true,
                formatItem  : false,
                formatPrice : false,
                formatShip : false,
                formatSplit : false

            };
            
            var defaultSettings = [{
                
                timing:"immediate",
                optionSettings:optionSettings,
                formatSettings:formatSettings,
            
            }];
           

            var msg = '';
            if (err) {
                return Resp.sendError(res, log, err);
            } else {
                if (results == null || results.length == 0) {
                    msg = 'No Existing Orders found.';
                    res.json({
                        status:"E",
                        message:msg,
                        data: defaultSettings
                    });
                } else {
                    results.forEach(function(row, i) {

                        row.optionSettings = optionSettings;
                        row.formatSettings = formatSettings;
                        row.watchOrder = 'Y';
                        var options = [], format = [];

                        if (arrayExists(row.options)) {
                          options = row.options.split(' ');
                        }

                        if (arrayExists(row.format)) {
                          format = row.format.split(' ');
                        }

                        options.forEach(function(o, i) {
                            
                           if (optionSettings.hasOwnProperty(o)) {
                               
                            row.optionSettings[o] = true;
                           } else {
                            row.optionSettings[o] = false;
                           }
                           
                        });

                        format.forEach(function(o, i) {
                          if (formatSettings.hasOwnProperty(o)) {
                            row.formatSettings[o] = true;
                          } else {
                            row.formatSettings[o] = false;
                          }
                        });

                    });

                    console.log('results' + results);

                    res.json({
                        status:"S",
                        message:'',
                        data:results
                    });
                }
          }
     });
}
module.exports.GetActiveProfiles=function(req, res) {

           var dir = "/profiles";
           var lCurDir =0;
           if(req.query.curdir !=null || req.query.curdir !=undefined) {
              dir = req.query.curdir;
              lCurDir =  req.query.curdir.length + 1;
           }

           /*if {$curdir == null} {
              regsub {/profiles} $UserInfo(profileDir) {} curdir
          }*/

          DbPool.OSSDB(function(db) {
            var msg='';
            var sqlString = "Select o.iobject_id, o.iobject_name,o.iobject_description,w.options \
                            from iwatch w, iobject o  \
                            where weblogin = :1  \
                            and w.profile = o.iobject_id  \
                            order by iobject_name "

            db.execute(sqlString, [req.user_id], function(err, activeProfiles) {
                 if (err) return Resp.sendError(res, log, err);

                if (activeProfiles.length == 0 ||  activeProfiles == null) {
                    msg = 'No Existing Profiles Found.';

                    res.json( {
                          'status'  : 'E',
                          'message' : msg,
                          'data'    :""
                      });
                } else {
                    activeProfiles.forEach(function(row,i) {
                    watchProfileFlag = 'false';
                    var relpath = row.iobject_name.substring(lCurDir);
                    activeProfiles[i]["relpath"] = relpath;
                    
                    if(row.options !=null || "undefined") {
                            
                        watchProfileFlag = 'true';
                        activeProfiles[i]["watchProfileFlag"]=watchProfileFlag;
                        
                    } else {
                        activeProfiles[i]["watchProfileFlag"]=watchProfileFlag;
                    }

                    });
                log.info('activeProfiles' + activeProfiles);
                res.json( {
                          'status'  : 'S',
                          'message' : '',
                          'data'    : activeProfiles
                      });
                }
            });
        });
    }

  module.exports.GetSharedProfiles = function(req, res) {

           var dir = "/profiles";

           if(req.query.curdir !=null || req.query.curdir !=undefined) {
              dir = req.query.curdir;
              lCurDir =  req.query.curdir.length + 1;
           }

          /* if {$curdir == null} {
              regsub {/profiles} $UserInfo(profileDir) {} curdir
          }*/

          DbPool.OSSDB(function(db) {

            var sqlString = "select iobject_id, iobject_type, iobject_name, \
                               iobject_description, creator_aaid, creator_id, \
                               acl_id, mtime \
                               from iobject \
                               where iobject_name like :1 \
                               order by iobject_name"

            db.execute(sqlString, [curdir], function(err, sharedProfiles) {

               msg = 'No Existing Orders found.';
                if (err) {log.error(err);}

                if (sharedProfiles.length == 0 ||  sharedProfiles == null ) {
                     res.json( {
                          'status'  : 'E',
                          'message' : msg,
                          'data'    :""
                      });
                } else {
                    
                   row.watchProfileFlag = 'N';
                   
                   sharedProfiles.forEach(function(row,i) {
                       
                    var relpath = row.iobject_name.substring(lCurDir);
                    sharedProfiles[i]["relpath"] = relpath;
                   
                   //set parts = [split relpath /];

                    //if {[llength parts] > 1} {
                      //  continue
                    //}
                    if (iobject_type == "dir") {
                       
                        row.watchProfileFlag = 'Y';

                      } else if(iobject_type == "profile") {

                          exports.getwatchProfiles(iobject_id,req.user_id,db,function(err,watchProfiles) {
                             watchProfiles.forEach(function(row, i) {

                            if (row.options != null) {
                                row.watchProfileFlag = 'Y'
                            } else {
                                row.watchProfileFlag = 'N'
                            }
                        });

                      log.info('sharedProfiles' + sharedProfiles);
                       res.json( {
                                'status'  : 'S',
                                'message' : '',
                                'data'    :sharedProfiles
                        });
                    });
                  }
                });
              }
            });
          });
     }
     
module.exports.GetMyPersonalProfiles = function(req, res) {

    var mydir = "/profiles/personal/"+req.user_id;
    var lMyDir = mydir.length + 1;
    DbPool.OSSDB(function(db) {
        
        var sqlString="select o.iobject_id , o.iobject_type, o.iobject_name, i.timing, \
                           o.iobject_description, o.creator_aaid, o.creator_id, \
                           o.acl_id, o.mtime \
                           from iobject o left outer join iwatch i  on (o.iobject_id = i.profile) \
                           where iobject_name like '"+mydir+"%' \
                           order by iobject_name"
                           
        /*var sqlString = "select iobject_id, iobject_type, iobject_name, \
                           iobject_description, creator_aaid, creator_id, \
                           acl_id, mtime \
                           from iobject \
                           where iobject_name like '"+mydir+"%' \
                           order by iobject_name"*/

        db.execute(sqlString, [], function(err, myProfiles) {

            var msg = '';
            if (err) {log.error(err);}

            if (myProfiles.length == 0) {
                msg = 'No Existing profiles found.';
                res.json( {
                      'status'  : 'E',
                      'message' : msg,
                      'data'    : ''
                });

            } else {
                console.log(myProfiles);
                myProfiles.forEach(function(row,i) {
                   
                    var relpath = row.iobject_name.substring(lMyDir);
                    myProfiles[i]["relpath"] = relpath;
                    
                    if (row.iobject_type == "profile") {
                        console.log(row.options);
                        
                        if(row.timing == null || row.timing =="undefined") {
                            
                            watchProfileFlag = 'false';
                            console.log(watchProfileFlag);
                            myProfiles[i]["watchProfileFlag"]=watchProfileFlag;
                        
                        } else {
                            watchProfileFlag = 'true';
                            myProfiles[i]["watchProfileFlag"]=watchProfileFlag;
                        }
                    } 
                });
                res.json( {
                  'status'  : 'S',
                  'message' : '',
                  'data'    : myProfiles
                });
            }
        });
    });
}

/*----------------------------------------------------------------------------
|   OSSTSQuery  -   run tstore SQL where clause against the two partitions
|                   of the  main OSS TSTORE
|
|                   partition 1 : external/customer non-recent orders
|                   partition 2 : external/customer recent orders
|
\---------------------------------------------------------------------------*/
module.exports.OSSTSQuery=function (where, cb)
{
  if (where == '') return cb(null, '');

  ts.all(1, "select order_no from orders where "+where, function(err, legacyList1) {
    if (err) return cb(err);
    ts.all(2, "select order_no from orders where "+where, function(err, legacyList2) {
      if (err) return cb(err);

      var orders1 = legacyList1.replace(/','/g,'~').replace(/'/g,'').split('~')
      var orders2 = legacyList2.replace(/','/g,'~').replace(/'/g,'').split('~')

      if (orders1.length == 1  && orders1[0] == '') {
        orders1 = [];
      }

      if (orders2.length == 1  && orders2[0] == '') {
        orders2 = [];
      }

      if (orders1.length ==0) {
        var orders = orders2.sort()
      } else
      if (orders2.length ==0) {
        var orders = orders1.sort()
      } else {
        var orders = orders1.concat(orders2).sort()
      }

      if (orders.length == 0) {
          return cb('NonExistingOrder', "");  // dummy expression
      }
      if (orders.length > 500) {
         orders = orders.slice(0,500);
      }
      cb(null, ("'"+ orders.join("','") + "'"))
    })
  })
}

/*------------------------------------------------------------------------------
|  addInternalScheduleLine  - get the schedule line from summary for internal
|
|  @param schedLines   variable
|  @param summary      variable
|  @param i            variable
|
\-------------------------------------------------------------------------------*/
module.exports.addInternalScheduleLine=function(schedLines,detailactiveOrders,i)  {
    schedLines.push({
        delivery_status: detailactiveOrders[i].delivery_status,

    });
    return schedLines;
}
/*----------------------------------------------------------------------
|  addNewOrder  - get the unique order details from summary
|
|  @param schedLines   variable
|  @param summary      variable
|  @param i            variable
|
|\---------------------------------------------------------------------*/
module.exports.addNewOrder=function(newOrder,detailactiveOrders,i) {
    newOrder.push({
        sales_org: detailactiveOrders[i].sales_org,
        order_no: detailactiveOrders[i].order_no,
        customer_po_no: detailactiveOrders[i].customer_po_no,
        customer_order: detailactiveOrders[i].customer_order,
        status: detailactiveOrders[i].status,
        customer_name: detailactiveOrders[i].customer_name,
        last_update: detailactiveOrders[i].last_update,
        nearest_action_date: detailactiveOrders[i].nearest_action_date,
        cust_informed: detailactiveOrders[i].cust_informed,
        comment_text: detailactiveOrders[i].work_note_attribs,
        legacyOrder: detailactiveOrders[i].legacy_order_no,
        sched_Line: schedLines,
    });
    return newOrder;
}

  /*function getHpOrderNo(legacyOrderNo,db, cb) {

          var hpOrderNo = "";
          var sqlString = "select order_no from backlog_hdr where legacy_order_no = :1"
          db.execute(sqlString, [legacyOrderNo], function(err, hpOrderNo) {
              if (err) return cb(err, null);
                cb(null, hpOrderNo);
            });
    }*/

  module.exports.getwatchProfiles= function(profile,userId,db, cb) {
    console.log("profile="+profile);
    console.log("userId="+userId);

          var sqlString = "select w.options, w.format, w.users, w.timing \
                           from iwatch w \
                           where w.profile  = :1 \
                           and w.weblogin = :2 "
          db.execute(sqlString, [profile,userId], function(err, watchProfiles) {
              if (err) return cb(err, null);
              var watchProfileFlag='false';
              watchProfiles.forEach(function(row,i) {
                  if (row.options != null || row.options != "undefined") {
                    console.log(row.options);
                    watchProfileFlag='true';
                    //watchProfiles[0]['watchProfileFlag']=true;
                    //myProfiles[i]["watchProfileFlag"]=watchProfileFlag;
                } else {
                    watchProfileFlag='false';
                     //watchProfiles[0]['watchProfileFlag']=false;
                     //myProfiles[i]["watchProfileFlag"]=watchProfileFlag;
                }
              });
            cb(null, watchProfileFlag);
            });
    }



  module.exports.getResponseMsg=function(msg ,req) {

    if (req.query.hpOrderNo) {
        msg += 'No Orders found for search criteria Order#:  ' +req.query.hpOrderNo;
    }
     if (req.query.os) {
        msg += ' your event notification was successfully saved for ' +req.query.os;
    }

    return msg;
  }

