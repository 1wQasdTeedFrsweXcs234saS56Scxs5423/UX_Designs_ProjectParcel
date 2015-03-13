/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/advanceSearchFields
|
|
|   This webservice will return the Advance Search Field Values.
|
|   written by  Deepu Krishnamurthy & Alok Upendra Kamat.
|   October 2013
|
---------------------------------------------------------------------------*/

var augment   = require("../lib/augment.js")
var SqlUtils  = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2")
var DbPool    = require('../lib/DbPool');
var config    = require('../config/config.js');
var Resp      = require('../lib/RespUtils.js');
var FileSys   = require('fs');
var _         = require('underscore');
var tclListParser = require('../lib/tcllist');
var advanceSearchConfig = require('../config/advanceSearchFieldConfig.js');
var bunyan    = require('bunyan');

DTADirPath = "/var/opt/oss/frontend/data/";
logistic = [];
region = [];

var SapHosts = ["SAP-AP","SAP-R00","SAP-FAP","SAP-R01","SAP-CLP","SAP-D7C","SAP-CPO"];
var SAPSystem = ["SAP-AP","SAP-CLP","SAP-CPO","SAP-D7C","SAP-FAP","SAP-R00","SAP-R01"];
var visitedCountries = [];
var uniqCountries = [];

var log = new bunyan({
    name: 'AdvanceSearchFieldsWebService',
});

/*----------------------------------------------------------------------------
|  getProductLineCodes  - returns the line and line_name from pl_dim table.
|
|  @param db           connection object
|  @param res          response object
|  @return cb          call back function
|
\---------------------------------------------------------------------------*/
function getProductLineCodes (db,res,cb) {

    db.execute("select distinct line, line_name \
                  from pl_dim \
                 order by line \
            ",[],function(err, productLines) {
        if (err) {
            return Resp.sendError(res, log, err);
        }
        cb(err, productLines);
    });

}

/*----------------------------------------------------------------------------
|  loadLogisticDTAFileData  - Loads DTA file data required for Logistic into
|                             a global array.
|
|  @param DTADirPath          DTA file directory path
|  @param sourceSystem        Source System
|  @return -                  None
|
\---------------------------------------------------------------------------*/
function loadLogisticDTAFileData (DTADirPath, sourceSystem) {

    var DTAFilePath = DTADirPath + sourceSystem + '/z1bbpsp.dta';

    if (FileSys.existsSync(DTAFilePath)) {

        var fileData = FileSys.readFileSync(DTAFilePath).toString().split("\n");

        for(eachRowIndex in fileData) {
            if(!(eachRowIndex.toString().match(/[a-z]+/))) {

                if (isNaN(eachRowIndex)) return;
                var rowData =  tclListParser.Tcl2Array(fileData[eachRowIndex]);

                if (rowData[1] != undefined){
                    logistic.push({
                                      plant    : rowData[0],
                                      lsp_code : rowData[1],
                                      lsp_name : rowData[2]
                    });
                }
            }
        }
    }
}

/*----------------------------------------------------------------------------
|  loadRegionDTAFileData  -   Loads DTA file data required for Region/State
|                             into a global array.
|
|  @param DTADirPath          DTA file directory path
|  @param sourceSystem        Source System
|  @return -                  None
|
\---------------------------------------------------------------------------*/
function loadRegionDTAFileData (DTADirPath, sourceSystem) {

    var DTAFilePath = DTADirPath + sourceSystem + '/t005u.dta';

    if (FileSys.existsSync(DTAFilePath)) {

        var fileData = FileSys.readFileSync(DTAFilePath).toString().split("\n");

        for(eachRowIndex in fileData) {
            if(!(eachRowIndex.toString().match(/[a-z]+/))) {

                if (isNaN(eachRowIndex)) return;
                var rowData =  tclListParser.Tcl2Array(fileData[eachRowIndex]);
                uniqCountries = _.union(uniqCountries, rowData[0]);

                if (rowData[1] != undefined){
                    var str=rowData[0]+":"+rowData[1]+":"+rowData[2];
                    if(visitedCountries.indexOf(rowData[0]) == -1) {

                        region.push({
                            country    : rowData[0],
                            region : rowData[1],
                            desc : rowData[2]
                        });
                    }
                }
            }
        }
        visitedCountries = _.union(visitedCountries,uniqCountries);
    }
}

/*----------------------------------------------------------------------------
|  getCountries  -     returns the iso_code, hp_code and country_name from
|                      country table.
|  @param db           connection object
|  @param res          response object
|  @return cb          call back function
|
\---------------------------------------------------------------------------*/
function getCountries (db,res,cb) {

    db.execute("select  iso_code, hp_code, country_name \
                  from  country                         \
                 where  hp_code is not null             \
                   and  in_backlog_ship = 'Y'           \
              order by  country_name                    \
    " ,[] ,function(err, countries) {

        if (err) return Resp.sendError(res, log, err);

        cb(err, countries);
    });
}

/*----------------------------------------------------------------------------
|  getRegionCountries  - returns the iso_code and country_name from
|                        country table.
|  @param db           connection object
|  @param res          response object
|  @return cb          call back function
|
\---------------------------------------------------------------------------*/
function getRegionCountries (db,res,cb) {

    db.execute("select  iso_code, hp_code, country_name \
                  from  country                         \
                 where  in_backlog_ship = 'Y'           \
                   and  hp_region in ('NA','LAR','APJ') \
              order by  country_name                    \
            ",[],function(err, country) {
        if (err) {
            return Resp.sendError(res, log, err);
        }
        cb(err, country);
    });
}

/*------------------------------------------------------------------------------
|  getSystemId-               Returns source system id for the given source system.
|
|  @param sourceSystem        Source System
|  @return -                  Source System Id
 \-----------------------------------------------------------------------------*/
function getSystemId (sourceSystem) {

    switch (sourceSystem) {
        case 'SAP-CLP':
            return 'SAP-CLP';
            break;

        case 'SAP-D7C':
        case 'SAP_D7C':
            return 'SAP-D7C';
            break;

        case 'SAP-CPO':
            return 'SAPCPO';
            break;

        default:
            return sourceSystem;
    }
}

module.exports.init = function(app) {

    /*----------------------------------------------------------------------------
    |   Internal Webservice.
    |---------------------------------------------------------------------------*/
    app.get('/ossui/v1/in/advanceSearchFields', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {
            var logMsg = "advance searchField Webserivce";
            var sqlString = "select Drop down list and values" ;

            var advSrchConfInt = {};
            advSrchConfInt.fields = advanceSearchConfig.IntAdvSrch;

            // Get Product lines for search by codes
            getProductLineCodes(db, res,function(err, productLines) {

                advSrchConfInt.fields['SearchByCodes']['ProductLines'] = {};

                productLines.forEach(function(row,i) {
                    advSrchConfInt.fields['SearchByCodes']['ProductLines'][row.line] = row.line + " - " + row.line_name;
                });

                // Get Logistic service provider ID for search by codes
                SapHosts.forEach(function(system,i) {

                    if (system == 'SAP-R01' || system == 'SAP-R01E' || system == 'SAP-R01C'){

                        var sourceSystem = getSystemId(system);
                        loadLogisticDTAFileData(DTADirPath, sourceSystem);
                        advSrchConfInt.fields['SearchByCodes']['LogisticServiceProviderID'] = {};

                        for (i = 1; i < logistic.length; i++) {
                            if(logistic[i].lsp_code != ''){
                                advSrchConfInt.fields['SearchByCodes']['LogisticServiceProviderID'][logistic[i].lsp_code] = logistic[i].lsp_code + "-" + logistic[i].lsp_name;
                            }
                        }
                    }
                });

                // Get Ship to country for Search by location
                getCountries(db, res,function(err, countries) {
                    advSrchConfInt.fields['SearchByLocationType']['ShipToCountry'] = {};

                    countries.forEach(function(row,i) {
                        advSrchConfInt.fields['SearchByLocationType']['ShipToCountry'][row.hp_code] = row.country_name;
                    });

                    // Get Ship to Region/State for Search by location
                    SAPSystem.forEach(function(system,i) {
                        var logMsg="advance search Webserivce select query";
                        var sqlString = "select * from pl_dim" ;
                        var sourceSystem = getSystemId(system);

                        loadRegionDTAFileData(DTADirPath, sourceSystem);
                    });

                    getRegionCountries(db, res,function(err, country) {

                        advSrchConfInt.fields['SearchByLocationType']['ShipToRegionState'] = {};

                        country.forEach(function(row,i) {
                            var state = {};

                            for (i = 1; i < region.length; i++)
                                if(region[i].country == row.iso_code)
                                    state[region[i].region] = region[i].desc;

                             advSrchConfInt.fields['SearchByLocationType']['ShipToRegionState'][row.country_name] = { country: row.country_name,
                                                               state  : state };
                        });

                        Resp.sendResponse(res, log, logMsg, sqlString, advSrchConfInt);
                    });
                });
            });
        });
    });

    /*----------------------------------------------------------------------------
    |   External Webservice.
    |---------------------------------------------------------------------------*/
    app.get('/ossui/v1/ex/advanceSearchFields', app.role(AuthGroupSandyUser), function(req, res) {
        DbPool.OSSDB(function(db) {
            var advSrchConfExt = {};
            advSrchConfExt.fields = advanceSearchConfig.ExtAdvSrch;

           // Get Product lines
                getProductLineCodes(db, res,function(err, productLines) {
                advSrchConfExt.fields['ProductLines'] = {};

                productLines.forEach(function(row,i) {
                    advSrchConfExt.fields['ProductLines'][row.line] = row.line + " - " + row.line_name;
                });

                // Get Ship to country
                getCountries(db, res,function(err, countries) {
                    advSrchConfExt.fields['ShipToCountry'] = {};

                    countries.forEach(function(row,i) {
                       advSrchConfExt.fields['ShipToCountry'][row.hp_code] = row.country_name;
                    });

                    // Get Ship to Region/State
                    SAPSystem.forEach(function(system,i) {
                        var sourceSystem = getSystemId(system);
                        loadRegionDTAFileData(DTADirPath, sourceSystem);
                    });

                    getRegionCountries(db, res,function(err, country) {
                        advSrchConfExt.fields['ShipToRegionState']= {};

                        country.forEach(function(row,i) {
                            var state = {};

                            for (i = 1; i < region.length; i++)
                                if(region[i].country == row.iso_code)
                                    state[region[i].region] = region[i].desc;

                           advSrchConfExt.fields['ShipToRegionState'][row.iso_code] = { country: row.country_name,
                                                               state  : state };
                        });

                        Resp.sendResponse(res, log, "Sending Back Configuration For External Advanced Search",
                                          "", advSrchConfExt);
                    });
                });
            });
        });
    });
}
