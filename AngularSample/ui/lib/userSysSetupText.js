/*----------------------------------------------------------------------------
|
|   This function will return the header status codes for the given HP
|   leagacy order number or Hp order no. The service will return the below details:
|       1.  Header status codes
|
|   written by Fouzia Nishath
|   April 2013
|
\---------------------------------------------------------------------------*/
var bunyan = require('bunyan');
var config = require('../config/config.js')
var DbPool   = require('../lib/DbPool'  );

/**
 * This function returns header status codes
 * @param consolidatedStati       consolidatedStati
 * @param sapSys                  data source
 * @param db                      db connection object
 * @return -                      header status codes
 */
module.exports.getHoldCode = function(consolidatedStati, sapSys, db,log, cb) {

    var dataSource        = '';
    var stati             = {};
    var inClause          = '';
    var infoCodes         = {};
    var hideCodes         = {};
    var otherCodes        = {};
    var bBuildCode        = {};
    var externalCodes     = {};
    var headerStatusCodes = [];
    var status,
        OIS_status,
        ISCS_staus       = "";
    var sapSysArr        = {};
    var sepeartor        = "','";
    var hdrstr = "'user-hdr','usr-hdr','system'"

    if (consolidatedStati.length > 1) {
        stati = consolidatedStati.split(" ");
    } else {
        stati = consolidatedStati;
    }

    dataSource = sapSys;
    for (var x = 0; x < stati.length; x++) {

        if ((stati[x].match(/h:(.*?)/g)) == 'h:') {
            status = stati[x].substring(2);
            inClause += "'" + status + "',";
        }

        if ((stati[x].match(/OIS:(.*?)/g)) == 'OIS:') {
            OIS_status = stati[x].substring(4);
            inClause += "'" + OIS_status + "',";
            dataSource += "'OIS',";
        }

        if ((stati[x].match(/OISSYS:(.*?)/g)) == 'OISSYS:') {
            OIS_status = stati[x].substring(7);
            inClause += "'" + OIS_status + "',";
            dataSource += "'OIS',";
        }

        if ((stati[x].match(/ISC:(.*?)/g)) == 'ISC:') {
            ISCS_staus = stati[x].substring(4);
            inClause += "'" + ISCS_staus + "',";
            dataSource += "'ISCS',";
        }
    }
    dataSource = dataSource.substring(0, dataSource.length - 1);
    log.info("dataSource:"+dataSource)
    sqlString1 = "select sapsystem,usersys_status,block_category,              \
                         usersys_status_text,internal_text,external_block_text \
                    from usersys_status_setup                                  \
                   where sapsystem in " + "(" + dataSource + ")" + " and usersys_status in ("

    inClause = inClause.substring(0, inClause.length - 1);

    sqlString1 += inClause + ') and stype in ('+hdrstr+")" ;

    log.info("sqlString header status code:"+sqlString1)

    if(inClause.length !=0) {
        db.execute(sqlString1, [], function(err, HeaderStatusCodesResult) {
            console.log(sqlString1)
            if (err) return cb(err, null);
            var visitedStatuses=[];
            var visitedStatusTexts={};
            HeaderStatusCodesResult.forEach(function(headerStatusCode, i) {
                var blockCategory = headerStatusCode.block_category.split("/");

                var cat = config.CatNames[blockCategory[0]];
                var subcat = config.SubCatNames[blockCategory[1]];
                if (cat != "Hide") {

                    var text = ""
                    if (headerStatusCode.internal_text != null) {

                        if (subcat != null) {
                            text += headerStatusCode.internal_text + " (" + cat + "-" + subcat + ")";
                        } else {
                            text += headerStatusCode.internal_text + " (" + cat + ")";
                        }

                    } else {

                        if (subcat != null) {
                            text += headerStatusCode.usersys_status_text + " (" + cat + "-" + subcat + ")";
                        } else {
                            text += headerStatusCode.usersys_status_text + " (" + cat + ")";
                        }
                    }

                    if(cat != "Informational"){
                        if (text != null) {
                            otherCodes[headerStatusCode.usersys_status] = text;
                            infoCodes[headerStatusCode.usersys_status] = text;
                        }
                    } else {
                        if (text != null) {
                            infoCodes[headerStatusCode.usersys_status] = text;
                        }
                    }

                } else {
                    var text = ""
                    if (headerStatusCode.internal_text != null) {
                        text += headerStatusCode.internal_text
                    } else {
                        text += headerStatusCode.usersys_status_text
                    }
                    if (text != null) {
                        hideCodes[headerStatusCode.usersys_status] = text;
                    }

                }
                if (headerStatusCode.usersys_status == "#MR") {

                    var text = ""
                    if (headerStatusCode.internal_text != null) {
                        text += headerStatusCode.internal_text
                    } else {
                        text += headerStatusCode.usersys_status_text
                    }
                    if (text != null) {
                        otherCodes[headerStatusCode.usersys_status] = text;
                    }
                }

                if(headerStatusCode.external_block_text != null){

                    if(headerStatusCode.sapsystem == "SAP-R00"){
                        if(headerStatusCode.block_category != "hide" && headerStatusCode.block_category != "info"){
                            externalCodes["Exception"] = headerStatusCode.external_block_text;
                        }

                    }else{

                        externalCodes["Exception"] = headerStatusCode.external_block_text;
                    }
                }

            });

            if(HeaderStatusCodesResult.length != 0) {
                headerStatusCodes.push({
                    info: infoCodes,
                    hide: hideCodes,
                    otherCodes:otherCodes,
                    externalCodes: externalCodes
                });
            }
            cb(null, headerStatusCodes);
        });
    } else {
        cb(null, headerStatusCodes);
    }
}
/**
 * This function returns delivery block codes
 * @param sapSys                  data source
 * @param db                      delvBlock
 * @return -                      delivery block code
 */
module.exports.getDeliveryBlock = function(dataSource,delvBlock,log,cb) {

    var sqlString     = "";

    var delvCodes     = {};
    var infoCodes     = {};
    var hideCodes     = {};
    var diliveryCodes  = [];
    dataSource = dataSource.substring(0, dataSource.length - 1);
    log.info("dataSource:"+dataSource)
    DbPool.OSSDB(function(db) {
        sqlString         = "Select block_category,internal_text,      \
                                    external_text,delivery_block_text  \
                               from delv_block_setup                   \
                              where sapsystem in " + "(" + dataSource + ")" ;

        sqlString         +=" and   delivery_block  = :1 "

        log.info("sqlString delivery block code:"+sqlString)

        db.execute(sqlString, [delvBlock], function(err, deliveryBlockResult) {
            if (err) return cb(err, null);

            deliveryBlockResult.forEach(function(row, i) {

                var blockCategory = row.block_category.split("/");

                if ((blockCategory[0] != "hide") && (blockCategory[0] != "info")) {
                    var text = ""
                    if (row.delivery_block_text != null) {
                        text += row.delivery_block_text;
                    } else if(row.internal_text != null) {
                        text += row.internal_text;
                    } else {
                        text += row.external_text;
                    }

                    text= exports.addText(text,row.delivery_block_text,row.internal_text,row.external_text,blockCategory);

                    if (text != null) {
                        delvCodes[delvBlock] = text;
                    }

                }else if(blockCategory[0] == "hide"){

                    var text = ""
                    text= exports.addText(text,row.delivery_block_text,row.internal_text,row.external_text,blockCategory);
                    if (text != null) {
                        hideCodes[delvBlock] = text;
                    }
                }else if(blockCategory[0] == "info"){

                    var text = ""
                    text= exports.addText(text,row.delivery_block_text,row.internal_text,row.external_text,blockCategory);
                    if (text != null) {
                        infoCodes[delvBlock] = text;
                    }
                }
            });
            if (deliveryBlockResult.length != 0) {
                diliveryCodes.push({
                    info: infoCodes,
                    hide: hideCodes,
                    delvCodes: delvCodes
                });
            }

            cb(null, diliveryCodes);
        });
    });

}

/**
 * This function returns billing block codes
 * @param sapSys                  data source
 * @param db                      billingBlock
 * @return -                      billing block code
 */
module.exports.getBillingBlock = function(dataSource,billingBlockCode,log,cb) {

    var sqlString     = "";
    var billCodes     = {};
    var infoCodes     = {};
    var hideCodes     = {};
    var billingCodes  = [];

    dataSource = dataSource.substring(0, dataSource.length - 1);
    log.info("dataSource:"+dataSource)
    DbPool.OSSDB(function(db) {
        sqlString         = "select sapsystem, billing_block, billing_block_text,\
                                    block_category, internal_text,external_text  \
                               from billing_block_setup                          \
                              where sapsystem in " + "(" + dataSource + ")" ;

        sqlString         +=" and   billing_block  = :1 "

        console.log("sqlString billing block code:"+sqlString)

        db.execute(sqlString, [billingBlockCode], function(err, billingBlockResult) {
            if (err) return cb(err, null);

            billingBlockResult.forEach(function(row, i) {

                var blockCategory = row.block_category.split("/");

                if ((blockCategory[0] != "hide") && (blockCategory[0] != "info")) {

                    var text = ""
                    text= exports.addText(text,row.billing_block_text,row.internal_text,row.external_text,blockCategory);

                    if (text != null) {
                        billCodes[billingBlockCode] = text;
                    }

                }else if(blockCategory[0] == "hide"){

                    var text = ""
                    text= exports.addText(text,row.billing_block_text,row.internal_text,row.external_text,blockCategory);
                    if (text != null) {
                        hideCodes[billingBlockCode] = text;
                    }
                }else if(blockCategory[0] == "info"){

                    var text = ""
                    text= exports.addText(text,row.billing_block_text,row.internal_text,row.external_text,blockCategory);
                    if (text != null) {
                        infoCodes[billingBlockCode] = text;
                    }
                }
            });
            if (billingBlockResult.length != 0) {
                billingCodes.push({
                    info: infoCodes,
                    hide: hideCodes,
                    billCodes: billCodes
                });
            }

            cb(null, billingCodes);
        });
    });

}
module.exports.addText=function(text,billing_block_text,internal_text,external_text,blockCategory)  {
    var cat = config.CatNames[blockCategory[0]];
    var subcat = config.SubCatNames[blockCategory[1]];
    var text = "";
    if (billing_block_text != null) {
        if (subcat != null) {
            text += billing_block_text + " (" + cat + "/" + subcat + ")";
        } else {
            text += billing_block_text + " (" + cat + ")";
        }

    } else if(internal_text != null) {
        if (subcat != null) {
            text += internal_text + " (" + cat + "/" + subcat + ")";
        } else {
            text += internal_text + " (" + cat + ")";
        }

    } else {
        if (subcat != null) {
            text += external_text + " (" + cat + "/" + subcat + ")";
        } else {
            text += external_text + " (" + cat + ")";
        }

    }

    return text;
}
