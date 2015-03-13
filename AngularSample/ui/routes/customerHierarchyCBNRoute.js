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
var execScript   = require('child_process');

var bunyan    = require('bunyan');

var log          = new bunyan({
    name: 'customerlWebService',
});

module.exports.init = function(app) {

    app.get('/ossui/v1/in/customerHierarchyCBN', app.role(AuthGroupSandyUser),function(req, res) {


            var      mode = req.query.mode;
            var        id = req.query.entryID;
            var child;
            console.log("mode:"+mode);
            console.log("id:"+id);
            var hdr = [];

            if(mode=="lookupByCBN"){
                console.log("Inside cbn")
                execScript.execFile("/opt/oss/pkg/frontend/scripts/OSfGetSiteIdsFromHStore.tcl", [id], function(error, cbnInfo) {
                    console.log("cbnInfo:"+cbnInfo);
                    getCBN(cbnInfo,function(err, cbn2SiteId) {
                        console.log("Here inside")
                        //console.log(cbn2SiteId);
                        //console.log("cbn2SiteId.length:"+cbn2SiteId.length);
                        if (cbn2SiteId==null) {
                            var msg = "No details found for CBN: " + req.query.id;
                            res.json({
                                'status': 'N',
                                'message': msg,
                                'data': '',
                            });
                        } else {
                            hdr.push(cbn2SiteId);
                            console.log(cbn2SiteId);
                            res.json( {
                                    'status'  : 'S',
                                    'message' : msg,
                                    'header':   hdr,
                            });
                        }
                    });
                });
            }

    });//app



    /**
     * This function returns country name for the given WCC code
     * @param wcc       WCC
     * @return -        Country name
     */

    function getCBN(cbnInfo,cb) {
        var sqlString="";
        console.log("Here")
        cbnInfo= cbnInfo.substring(0,cbnInfo.length-1);
        var cbnInfoArr = cbnInfo.split(" ");
        var siteIDInvoice1 = "";
        var siteIDInvoice2 = "";
        var siteIDShipTo1  = "";
        var siteIDShipTo2  = "";
        var siteIDSoldTo1  = "";
        var siteIDSoldTo2  = "";
        var incluase       = "";
        for(var i=0; i<cbnInfoArr.length;i++){
            var invIndex1=cbnInfoArr[i].indexOf('CI');

            var invIndex2=cbnInfoArr[i].indexOf('WI');

            var soldIndex1=cbnInfoArr[i].indexOf('CS');

            var soldIndex2=cbnInfoArr[i].indexOf('WS');

            var shipIndex1=cbnInfoArr[i].indexOf('CH');
            //console.log("soldIndex1:"+soldIndex1);
            var shipIndex2=cbnInfoArr[i].indexOf('WH');
            //console.log("soldIndex1:"+soldIndex1);
            if(invIndex1>=0){
                siteIDInvoice1=cbnInfoArr[i].substring(2);
            }else if(invIndex2>=0){
                siteIDInvoice2=cbnInfoArr[i].substring(2);
            }else if(soldIndex1>=0){
                siteIDSoldTo1=cbnInfoArr[i].substring(2);
            }else if(soldIndex2>=0){
                siteIDSoldTo2=cbnInfoArr[i].substring(2);
            }else if(shipIndex1>=0){
                siteIDShipTo1=cbnInfoArr[i].substring(2);
            }else if(shipIndex2>=0){
                siteIDShipTo2=cbnInfoArr[i].substring(2);
            }
        }
        console.log("siteIDShipTo1:"+siteIDShipTo1);
        console.log("siteIDShipTo2:"+siteIDShipTo2);
        incluase = "('"+siteIDInvoice1+"','"+siteIDInvoice2+"','"+siteIDSoldTo1+"','"+siteIDSoldTo2+"','"+siteIDShipTo1+"','"+siteIDShipTo2+"')";
        console.log("incluase:"+incluase);
        var tempShipTo    = {};
        var shipTo        = [];
        var tempSoldTo    = {};
        var soldTo        = [];
        var tempInvTo    = {};
        var invTo        = [];
        var siteIDJSON   = {};
        DbPool.OSSDB(function(db) {
            sqlString = "select id_level0,id_level1,id_level2,id_level3,\
                                id_level4,id_level5,name,system         \
                           from ncrf_entry                              \
                          where id_level0 in "+incluase;
            console.log("sqlString:"+sqlString)
            db.execute(sqlString, [], function(err, cbn2SiteIDs) {
                if (err) return cb(err, null);
                //console.log(cbn2SiteIDs);
                cbn2SiteIDs.forEach(function(row, i) {
                    tempShipTo = {};
                    tempSoldTo = {};
                    tempInvTo  = {};
                    id = row.id_level0;
                    if(id == siteIDShipTo1){
                        tempShipTo["id"] = id;
                        tempShipTo["L4"] = row.id_level4;
                        tempShipTo["L3"] = row.id_level3;
                        tempShipTo["L2"] = row.id_level2;
                        tempShipTo["name"] = row.name;
                        tempShipTo["system"] = row.system;
                        shipTo.push(tempShipTo);
                    }
                    if(id == siteIDShipTo2){
                        tempShipTo["id"] = id;
                        tempShipTo["L4"] = row.id_level4;
                        tempShipTo["L3"] = row.id_level3;
                        tempShipTo["L2"] = row.id_level2;
                        tempShipTo["name"] = row.name;
                        tempShipTo["system"] = row.system;
                        shipTo.push(tempShipTo);
                    }
                    if(id == siteIDSoldTo1){
                        tempSoldTo["id"] = id;
                        tempSoldTo["L4"] = row.id_level4;
                        tempSoldTo["L3"] = row.id_level3;
                        tempSoldTo["L2"] = row.id_level2;
                        tempSoldTo["name"] = row.name;
                        tempSoldTo["system"] = row.system;
                        soldTo.push(tempSoldTo);
                    }
                    if(id == siteIDSoldTo2){
                        tempSoldTo["id"] = id;
                        tempSoldTo["L4"] = row.id_level4;
                        tempSoldTo["L3"] = row.id_level3;
                        tempSoldTo["L2"] = row.id_level2;
                        tempSoldTo["name"] = row.name;
                        tempSoldTo["system"] = row.system;
                        soldTo.push(tempSoldTo);
                    }
                    if(id == siteIDInvoice1){
                        tempInvTo["id"] = id;
                        tempInvTo["L4"] = row.id_level4;
                        tempInvTo["L3"] = row.id_level3;
                        tempInvTo["L2"] = row.id_level2;
                        tempInvTo["name"] = row.name;
                        tempInvTo["system"] = row.system;
                        invTo.push(tempInvTo);
                    }
                    if(id == siteIDInvoice2){
                        tempInvTo["id"] = id;
                        tempInvTo["L4"] = row.id_level4;
                        tempInvTo["L3"] = row.id_level3;
                        tempInvTo["L2"] = row.id_level2;
                        tempInvTo["name"] = row.name;
                        tempInvTo["system"] = row.system;
                        invTo.push(tempInvTo);
                    }
                });
                // console.log("shipTo");
                 console.log(shipTo);
                // console.log("soldTo");
                // console.log(soldTo);
                // console.log("invTo");
                // console.log(invTo);
                //var siteIDJSON =[];
                siteIDJSON["sold_To"]=[];
                siteIDJSON["sold_To"] = soldTo;
                siteIDJSON["ship_To"] = shipTo;
                siteIDJSON["invoice_To"] = invTo;
                cb(null, siteIDJSON);
                console.log(siteIDJSON)

            });
        });
    }
}


