var xml2js = require('xml2js');

var fs=require("fs");
var exec = require('child_process').execFile;

var path = require('path');
var DbPool       = require('../lib/DbPool'  );
var Resp         = require('../lib/RespUtils.js');
var _            = require('underscore');
var bunyan       = require('bunyan');
var SqlUtils2    = require("../lib/SqlUtils2");
var PortalSec = require("../lib/PortalSecurity");

var log          = new bunyan({
    name: 'OrderHistorylWebService',
});

module.exports.init = function(app) {
   app.get('/ossui/v1/in/orderhistory', app.role(AuthGroupSandyUser), function(req,res) {
        DbPool.OSSDB( function(db) {

            var data_source=req.query.data_source;

            var spaceExists = new RegExp("/\s/");
            var data_clause='';
            if (data_source.indexOf(' ')>=0) {
                var data_sources=data_source.split(/\s+/);
                for(var x=0;x<data_sources.length;x++) {
                    data_source=data_sources[x];
                    data_clause+="'"+data_source+"'"+',';
                }
                data_clause=data_clause.substring(0,data_clause.length-1);
            } else {
                data_clause+="'"+data_source+"'";
            }

            var sqlString= "select msgstore_id, msg_source, msg_class \
                            from msg_index \
                            where is_valid = 'Y' \
                            and msg_type = 'ORDERS05' \
                            and msg_class in ('ORDRSP' ,'ZSW_ORDERS05') \
                            and msg_source in ("+data_clause+") \
                            and msg_ref2 = :1  \
                            order by load_time";

            log.info(sqlString);

            db.execute(sqlString,[req.query.order_no],function(err,dbresult) {
                if(dbresult==null || dbresult.length == 0) {
                    res.json({
                        status:'E',
                        data:"No Order history available"
                    });
                } else {

                    var child;
                    var system =dbresult[0].msg_source;
                    child = exec('/opt/oss/pkg/frontend/OSfGetOrderHistoryWrapper.tcl',[dbresult[0].msgstore_id, dbresult[0].msg_source], { maxBuffer: 5000*1024 }, function(error, stdout, stderr) {
                        if (error !== null) {
                            log.error(error);
                            return Resp.sendError(res, log, error);
                        } else {
                           //log.info('stdout:' + stdout)
                            var xml = stdout.trim();
                            var parseString = require('xml2js').parseString;
                            parseString(xml, function (err, result) {
                                if(err) {
                                    return Resp.sendError(res, log, err);
                                }
                                var historyData =[];
                                var r="";
                                if(dbresult[0].msg_class=='ZSW_ORDERS05') {
                                    r=result['ZSW_ORDERS05']['history'];
                                }else{
                                    r=result['ORDERS05']['history'];
                                }

                                if(r==null) {
                                    res.json({
                                        status:'E',
                                        data:"No Order history"
                                    });
                                } else {
                                    log.info("history tag available");
                                    var change = r[0]['change'];

                                    statusDescription(db,system,function (err, descriptions)  {

                                        for(var i=0;i<change.length;i++) {
                                            var changeDate=change[i]['$']['datetime'];
                                            // Converting date format to YYYY-MM-DD HH:MM:SS
                                            changeDate = changeDate.substr(0, 4) + "-" + changeDate.substr(4,2)+"-"+changeDate.substr(6,2)+" "+changeDate.substr(8,2)+":"+changeDate.substr(10,2)+":"+changeDate.substr(12,2);
                                            var obj=change[i]['obj'];
                                            var userstatus=[];
                                            var statusDescription=[];
                                            for( var j=0;j<obj.length;j++) {

                                                if(obj[j]['$']['id']=='HDR') {
                                                    userstatus=obj[j]['userstatus'];
                                                }
                                                var statusDescription=[];
                                                var statusCodes=[];

                                                if(userstatus != undefined) {
                                                    descriptions.forEach(function(row, i) {
                                                        for(var k=0;k<userstatus.length;k++) {
                                                            if(row.usersys_status == userstatus[k]) {
                                                                statusDescription.push(row.usersys_status_text);
                                                                statusCodes.push(userstatus[k]);
                                                            }
                                                        }
                                                    });
                                                }

                                            }
                                            if(changeDate != "" && userstatus != undefined) {
                                                historyData.push({
                                                    date:changeDate,
                                                    statusCode:statusCodes,
                                                    description: statusDescription
                                                });
                                            }
                                        }
                                        res.json({
                                        status:'S',
                                        data:historyData
                                        });
                                    });

                                }
                            });
                        }
                    }); //child
                }
            });
        });
    }); // app

    // Need to discuss how to get status code description
    function statusDescription(db,system,cb ) {
        var sqlString = "select sapsystem,usersys_status,usersys_status_text,internal_text \
                            from usersys_status_setup  where sapsystem=:1 and stype='user-hdr'";


        db.execute(sqlString,[system],function(err,descriptions) {

            if (err) return cb(err, null);
            cb(err,descriptions);

        });
    }
};
