/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/orderdetail
|   This webservice will return the order details for the given HP
|   leagacy order number or Hp order no. The service will return the below details:
|       1.  Order Header Details
|   written by Jochen Loewer and Fouzia Nishath
|   April 2013
|
|---------------------------------------------------------------------------*/

var      DbPool  = require('../lib/DbPool'  );
var       async  = require('async');
var          fs  = require('fs');
var       LogJs  = require('../lib/logJs');
var ncrfDetails  = require('../lib/getNCRFDetails');
var exec         = require('child_process').execFile;

var bunyan    = require('bunyan');

var log          = new bunyan({
    name: 'customerlWebService',
});

module.exports.init = function(app) {

    app.get('/ossui/v1/in/customerHierarchy', app.role('Q2C_OSS_SANDY_USER_NON_PROD'),function(req, res) {

            var hideLevel = req.query.hideLevel;
            var      mode = req.query.mode;
            var        id = req.query.entryID;
            var   options = req.query.levelOptions;

            console.log("mode:"+mode);
            console.log("id:"+id);
            console.log("hideLevel:"+hideLevel);
            console.log("options:"+options);

            log.info("mode:"+mode);
            if(mode=="lookupByCBN"){
                console.log("Inside cbn")
                child = exec('/opt/oss/pkg/frontend/scripts/OSfGetSiteIdsFromHStore.tcl', [id], function(error, stdout, stderr) {
                    var out=stdout.trim();
                    console.log("OUT put :"+out)
                });
            }
            if(mode != "lookupBySiteId"){
                getCustomerLevel(id,mode,hideLevel,options,function(err, custHierarchy) {
                    console.log("Get customer for level 2");
                    if (err) {
                        log.error(err);
                        return cb(err, null)
                    }
                    if (custHierarchy.length == 0) {
                        var msg = "No details found for Level ID: " + req.query.levelID;
                        res.json({
                            'status': 'N',
                            'message': msg,
                            'data': '',
                        });

                    } else {
                        console.log("In here")
                        ncrfDetails.getNCRFDataLookUpByIdString(custHierarchy,mode,hideLevel,function(err, level){
                            if (level.length == 0) {
                                    var msg = "No details found for Level ID: " + req.query.id;
                                    res.json({
                                        'status': 'N',
                                        'message': msg,
                                        'data': '',
                                    });
                            } else {
                                res.json( {
                                    'status'  : 'S',
                                    'message' : msg,
                                    'header':   level,
                                });
                            }
                        });
                    }
                });
            }else{
                console.log("inside lookupBySiteId")
                ncrfDetails.getSiteIDS(id,function(err, siteID){
                        if (siteID.length == 0) {
                                var msg = "No details found for CBN#: " + req.query.id;
                                res.json({
                                    'status': 'N',
                                    'message': msg,
                                    'data': '',
                                });
                        } else {
                            res.json( {
                                'status'  : 'S',
                                'message' : msg,
                                'header':   siteID,
                            });
                        }
                    });

            }
    });//app



    /**
     * This function returns country name for the given WCC code
     * @param wcc       WCC
     * @return -        Country name
     */

    function getCustomerLevel(entryId,mode,hideLevel,options,cb) {
        var sqlString="";
        var systemClause= ""
        DbPool.OSSDB(function(db) {
            if(mode=="lookupByid"){
                if(hideLevel == "false"){
                    if((options != null) || (options != "undefined") || (options != "")){
                        if(options == "cbns"){
                            systemClause = "and system ='_CBN_'";
                        }else if(options == "crs"){
                            systemClause= "and system ='CRS'";
                        }else if(options == "crsAndCbns"){
                            systemClause= "and system in ('CRS','_CBN_')";
                        }else if(options=="others"){
                            systemClause = "and system not in ('CRS','_CBN_')";
                        }
                        sqlString = "select company_code, system, sales_org, name,  \
                                        id_level0,id_level1,id_level2,id_level3,\
                                        id_level4, id_level5                    \
                                   from ncrf_entry                              \
                                  where (id_level4 = :1 or id_level3 = :1       \
                                     or id_level2 = :1 or id_level0 = :1)       \
                                        "+systemClause+"                        \
                               order by id_level5, id_level4, id_level3,        \
                                        id_level2,id_level1,id_level0 desc"
                    }else{
                        sqlString = "select company_code, system, sales_org, name,  \
                                            id_level0,id_level1,id_level2,id_level3,\
                                            id_level4, id_level5                    \
                                       from ncrf_entry                              \
                                      where (id_level4 = :1 or id_level3 = :1       \
                                         or id_level2 = :1 or id_level0 = :1)       \
                                   order by id_level5, id_level4, id_level3,        \
                                            id_level2,id_level1,id_level0 desc"
                    }
                } else{
                    sqlString = "select company_code, system, sales_org, name,  \
                                        id_level1,id_level2,id_level3,          \
                                        id_level4, id_level5                    \
                                   from ncrf_entry                              \
                                  where (id_level4 = :1 or id_level3 = :1       \
                                     or  id_level2 = :1 )                       \
                               order by id_level5, id_level4, id_level3,        \
                                        id_level2,id_level1 desc"
                }
            }else if(mode="lookupByName"){
                entryId = entryId.toUpperCase();
                if(hideLevel == "false"){
                    sqlString = "select company_code, system, sales_org, name,  \
                                        id_level0,id_level1,id_level2,id_level3,\
                                        id_level4, id_level5                    \
                                   from ncrf_entry                              \
                                  where name like :1                            \
                               order by id_level5, id_level4, id_level3,        \
                                        id_level2,id_level1,id_level0 desc"
                } else{
                    sqlString = "select company_code, system, sales_org, name,  \
                                        id_level1,id_level2,id_level3,          \
                                        id_level4, id_level5                    \
                                   from ncrf_entry                              \
                                  where name like :1                            \
                               order by id_level5, id_level4, id_level3,        \
                                        id_level2,id_level1 desc"
                }
            }
            console.log("sqlString:"+sqlString)
            db.execute(sqlString, [entryId], function(err, custHierarchy) {
                if (err) return cb(err, null);
                cb(null, custHierarchy);
            });
        });
    }
}


