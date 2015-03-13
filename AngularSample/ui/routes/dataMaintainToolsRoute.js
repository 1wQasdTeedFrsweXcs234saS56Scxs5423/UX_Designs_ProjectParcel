/*----------------------------------------------------------------------------
|   Route handler for /ossui/v1/dmt
|
|   Webservice for Data Maintenance (DMT - Data Maintain Tools).
|
|   written by Alok Upendra Kamat& Sravan
|   August 2013
|----------------------------------------------------------------------------*/

var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js');
var ExecScript = require('child_process');
var Bunyan = require('bunyan');
var dataMaintain=require('../lib/dataMaintain');
var dmtConfig = require('../config/dmtConfig.js');

var log = new Bunyan({
    name: 'dataMaintainToolsWebService',
});

module.exports.init = function(app) {

    console.log('registering /ossui/v1/dmt ...');

    app.post('/ossui/v1/dmt',  function(req, res) {

        var cmd = "grep " + req.user_id + " /var/opt/oss/frontend/passwd | cut -d '{' -f 6 | cut -d '}' -f 1";

        ExecScript.exec(cmd, function (err, stdout, stderr) {

            if (err) return Resp.sendError(res, log, err);

            dataMaintain.UpdateDmtConfig(stdout,dmtConfig);
            var table=req.query.table;
            var userId=req.user_id;
            DbPool.OSSDB( function(db) {
                if(req.query.action=="select") {
                    var whereClause=dataMaintain.GenerateWhereClauseFromFilter(dmtConfig,req.query);
                    var sqlString = "select * from "+table +" "+whereClause;
                    console.log("sqlString  = "+sqlString);
                    dataMaintain.SelectQuery(db,table,whereClause,userId,function(err,result) {
                        var logMsg="dataMaintain Webserivce select query";
                        Resp.sendResponse(res, log, logMsg, sqlString, result)
                    });
                }else if(req.query.action=="update") {
                    dataMaintain.getAuditKeys(db,table,function(err,constraints) {
                        dataMaintain.UpdateTable(db,req.query,constraints,userId,function(err,result) {
                            if(err){
                                Resp.ErrRespForInsert(res,err["Error"],err["query"]);
                            }else {
                               Resp.RespForInsert(res,result);
                            }
                        });
                    });
                }else if(req.query.action=="insert") {
                    dataMaintain.getAuditKeys(db,table,function(err,constraints) {
                        dataMaintain.insertRows(db,req.query,constraints,req.query,userId,function(err,result) {
                            if(err){
                                Resp.ErrRespForInsert(res,err["Error"],err["query"]);
                            }else {
                               Resp.RespForInsert(res,result);
                            }
                        });
                    });
                }else if(req.query.action=="delete") {
                    dataMaintain.getAuditKeys(db,table,function(err,constraints) {
                        dataMaintain.deleteRows(db,req.query,constraints,req.query,userId,function(err,result) {
                            if(err){
                                Resp.ErrRespForInsert(res,err["Error"],err["query"]);
                            }else {
                                Resp.RespForInsert(res,result);
                            }
                        });
                    });
                } else {
                    res.json(dmtConfig);
                }
            });
        });
    });
}
