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
var fs       = require('fs');
var DbPool   = require('../lib/DbPool'  );
var async    = require('async');
var config = require('../config/config.js')

/**
 * This function returns delivery block codes
 * @param sapSys                  data source
 * @param db                      delvBlock
 * @return -                      delivery block code
 */
module.exports.getNCRFDataLookUpById = function(custHierarchy,hideLevel,cb) {

    var filepath = "/home/ossevent/host/data/ncrf/ncrf_level_names.dta"
    var flag = "false"


    var l5 = {};
    var l4 = {};
    var l3 = {};
    var l2 = {};
    var l1 = {};
    var l0 = {};

    var level4Str = ""
    var level4Str = ""
    var level3Str = ""
    var level2Str = ""
    var level1Str = ""

    var lineLevel5 = ""
    var lineLevel4 = ""
    var lineLevel3 = ""
    var lineLevel2 = ""
    var lineLevel1 = ""

    var visitedLevel0 = [];
    var visitedLevel1 = [];
    var visitedLevel2 = [];
    var visitedLevel3 = [];
    var visitedLevel4 = [];
    var visitedLevel5 = [];

    custHierarchy.forEach(function(custHie, i) {

    if(flag != "true"){

        fs.readFileSync(filepath).toString().split('\n').forEach(function(line, i) {

            flag = "true"
            if(custHie.id_level5 != null){
                level4Str = custHie.id_level5+"|"+5;
                if(line.indexOf(level5Str)==0){
                    lineLevel5 = line;
                }
            }
            if(custHie.id_level4 != null){
                level4Str = custHie.id_level4+"|"+4;
                if(line.indexOf(level4Str)==0){
                    lineLevel4 = line;
                }
            }
            if(custHie.id_level3 != null){
                level3Str = custHie.id_level3+"|"+3;
                if(line.indexOf(level3Str)==0){
                    lineLevel3 = line;
                }
            }
            if(custHie.id_level2 != null){
                level2Str = custHie.id_level2+"|"+2;
                if(line.indexOf(level2Str)==0){
                    lineLevel2 = line;
                }
            }
            if(custHie.id_level1 != null){
                level2Str = custHie.id_level1+"|"+1;
                if(line.indexOf(level1Str)==0){
                    lineLevel1 = line;
                }
            }
        });
    }

    var id5 = custHie.id_level5
    if (!l5.hasOwnProperty(id5)) {
        l4 = {};
        l3 = {};
        l2 = {};
        l1 = {};
        l0 = {};
        if(lineLevel5.length == 0){
            l5[id5] = {
                id : 'empty',
                level: 5,
                children : l4
            };
        } else {
            var ncrfDetails= lineLevel5.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l5[id5] = {
                    id         : id5,
                    level      : 5,
                    name       : ncrfDetails[2],
                    countryName: countryName,
                    typeCode   : typeCode,
                    children   : l4
                };
            });
        }
    }

    var id4 = custHie.id_level4;
    if (!l4.hasOwnProperty(id4)) {
        l3 = {};
        l2 = {};
        l1 = {};
        l0 = {};
        if((lineLevel4.length == 0) || (id4 == "_emtpy_OSS")){
            l4[id4] = {
                id : 'empty',
                level: 4,
                children : l3
            };
        } else {
            var ncrfDetails= lineLevel4.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l4[id4] = {
                    id         : id4,
                    level      : 4,
                    name       : ncrfDetails[2],
                    countryName: countryName,
                    typeCode   : typeCode,
                    children   : l3
                };
            });
        }

    }

    var id3 = custHie.id_level3;
    if (!l3.hasOwnProperty(id3)) {
        l2 = {};
        l1 = {};
        l0 = {};
        if((lineLevel3.length == 0) || (id3 == "_emtpy_OSS")){
            l3[id3] = {
                id : 'empty',
                level: 3,
                children : l2
            };
        } else {
            var ncrfDetails= lineLevel3.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l3[id3] = {
                    id         : id3,
                    level      : 3,
                    name       : ncrfDetails[2],
                    countryName: countryName,
                    typeCode   : typeCode,
                    children   : l2
                };
            });
        }
    }

    var id2 = custHie.id_level2;
    if (!l2.hasOwnProperty(id2)) {
        l1 = {};
        l0 = {};
        if((lineLevel2.length == 0) || (id2 == "_emtpy_OSS")){
            l2[id2] = {
                id : 'empty',
                level: 2,
                children : l1
            };
        } else {
            //console.log("lineLevel2:"+lineLevel2)
            var ncrfDetails= lineLevel2.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l2[id2] = {
                    id         : id2,
                    level      : 2,
                    name       : ncrfDetails[2],
                    countryName: countryName,
                    typeCode   : typeCode,
                    children   : l1
                };
            });
        }
    }

    var id1 = custHie.id_level1;

    if (!l1.hasOwnProperty(id1)) {
        l0 = {};
        if((lineLevel1.length == 0) || (id1 == "_emtpy_OSS")){
            //id1 = "empty"
            l1[id1] = {
                id : 'empty',
                level: 1,
                children : l0
            };
        } else {
            var ncrfDetails= lineLevel1.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l1[id1] = {
                    id         : id1,
                    level      : 1,
                    name       : ncrfDetails[2],
                    countryName: countryName,
                    typeCode   : typeCode,
                    children   : l0
                };
            });
        }

    }

    if(hideLevel != "true") {
        var id0 = custHie.id_level0;

        if((id0 == "_emtpy_OSS") || (id0 == null) || (id0 == " ")){
                id0 = "empty"
                l0[id0] = {
                    id : 'empty',
                    level: 1,
                    children : {}
                };
            } else {
                if(custHie.system != "_CBN_") {
                    l0[id0] = {
                        id         : id0,
                        level      : 0,
                        name       : custHie.name,
                        system     : custHie.system,
                        salesOrg   : custHie.sales_org,
                        children   : {}
                    };
                } else {
                    l0[id0] = {
                        id         : id0,
                        level      : 0,
                        name       : custHie.name,
                        system     : "CBN",
                        companyCode: custHie.company_code,
                        children   : {}
                    };
                }
            }
        }
    });
    //cb(null,l5);
    exports.restructureObject(l5,function(err, newL5){
        cb(null,newL5);
    });
}
/**
 * This function returns delivery block codes
 * @param sapSys                  data source
 * @param db                      delvBlock
 * @return -                      delivery block code
 */
module.exports.getNCRFDataLookUpByIdString = function(custHierarchy,mode,hideLevel,cb) {

    var filepath = "/home/ossevent/host/data/ncrf/ncrf_level_names.dta"
    var flag = "false"


    var l5 = {};
    var l4 = {};
    var l3 = {};
    var l2 = {};
    var l1 = {};
    var l0 = {};

    var level4Str = ""
    var level4Str = ""
    var level3Str = ""
    var level2Str = ""
    var level1Str = ""

    var lineLevel5 = ""
    var lineLevel4 = ""
    var lineLevel3 = ""
    var lineLevel2 = ""
    var lineLevel1 = ""

    var visitedLevel0 = [];
    var visitedLevel1 = [];
    var visitedLevel2 = [];
    var visitedLevel3 = [];
    var visitedLevel4 = [];
    var visitedLevel5 = [];

    custHierarchy.forEach(function(custHie, i) {

    if(flag != "true"){

        fs.readFileSync(filepath).toString().split('\n').forEach(function(line, i) {

            flag = "true"
            if(custHie.id_level5 != null){
                level4Str = custHie.id_level5+"|"+5;
                if(line.indexOf(level5Str)==0){
                    lineLevel5 = line;
                }
            }
            if(custHie.id_level4 != null){
                level4Str = custHie.id_level4+"|"+4;
                if(line.indexOf(level4Str)==0){
                    lineLevel4 = line;
                }
            }
            if(custHie.id_level3 != null){
                level3Str = custHie.id_level3+"|"+3;
                if(line.indexOf(level3Str)==0){
                    lineLevel3 = line;
                }
            }
            if(custHie.id_level2 != null){
                level2Str = custHie.id_level2+"|"+2;
                if(line.indexOf(level2Str)==0){
                    lineLevel2 = line;
                }
            }
            if(custHie.id_level1 != null){
                level2Str = custHie.id_level1+"|"+1;
                if(line.indexOf(level1Str)==0){
                    lineLevel1 = line;
                }
            }
        });
        console.log("Line5:"+lineLevel5);
        console.log("Line4:"+lineLevel4);
        console.log("Line3:"+lineLevel3);
        console.log("Line2:"+lineLevel2);
        console.log("Line1:"+lineLevel1);
        //console.log("Line0:"+lineLevel0);
    }

    var id5 = custHie.id_level5
    if (!l5.hasOwnProperty(id5)) {
        l4 = {};
        l3 = {};
        l2 = {};
        l1 = {};
        l0 = {};
        if(lineLevel5.length == 0){
            l5[id5] = {
                id : 'empty',
                str: 'L5 '+"'empty'",
                children : l4
            };
        } else {
            var ncrfDetails= lineLevel5.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l5[id5] = {
                    id         : id5,
                    str        : 'L5 '+"'"+id5+"'"+" '"+ncrfDetails[2]+"' "+"'"+countryName+"' "+'('+typeCode+')',
                    children   : l4
                };
            });
        }
    }

    var id4 = custHie.id_level4;
    if (!l4.hasOwnProperty(id4)) {
        l3 = {};
        l2 = {};
        l1 = {};
        l0 = {};
        if((lineLevel4.length == 0) || (id4 == "_emtpy_OSS") || (id4 == null)){
            l4[id4] = {
                id : 'empty',
                str: 'L4 '+'empty',
                children : l3
            };
        } else {
            var ncrfDetails= lineLevel4.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            if(countryName == null){
                countryName = ncrfDetails[3];
            }
            var str = "";

            getTypeCode(ncrfDetails[6],function(err, typeCode){

                l4[id4] = {
                    id         : id4,
                    str        : 'L4 '+"'"+id4+"'"+" '"+ncrfDetails[2]+"' "+"'"+countryName+"' "+'('+typeCode+')',
                    children   : l3
                };
            });
        }

    }

    var id3 = custHie.id_level3;
    if (!l3.hasOwnProperty(id3)) {
        l2 = {};
        l1 = {};
        l0 = {};
        if((lineLevel3.length == 0) || (id3 == "_emtpy_OSS") || (id3 == null)){
            l3[id3] = {
                id : 'empty',
                str: 'L3 '+"'empty'",
                children : l2
            };
        } else {
            var ncrfDetails= lineLevel3.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            if(countryName == null){
                countryName = ncrfDetails[3];
            }
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l3[id3] = {
                    id         : id3,
                    str        : 'L3 '+"'"+id3+"'"+" '"+ncrfDetails[2]+"' "+"'"+countryName+"' "+'('+typeCode+')',
                    children   : l2
                };
            });
        }
    }

    var id2 = custHie.id_level2;
    if (!l2.hasOwnProperty(id2)) {
        l1 = {};
        l0 = {};
        if((lineLevel2.length == 0) || (id2 == "_emtpy_OSS") || (id2 == null)){
            l2[id2] = {
                id : 'empty',
                str: 'L2 '+"'empty'",
                children : l1
            };
        } else {

            var ncrfDetails= lineLevel2.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            if(countryName == null){
                countryName = ncrfDetails[3];
            }
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l2[id2] = {
                    id         : id2,
                    str        : 'L2 '+"'"+id2+"'"+" '"+ncrfDetails[2]+"' "+"'"+countryName+"' "+'('+typeCode+')',
                    children   : l1
                };
            });
        }
    }

    var id1 = custHie.id_level1;

    if (!l1.hasOwnProperty(id1)) {
        l0 = {};
        if((lineLevel1.length == 0) || (id1 == "_emtpy_OSS") || (id1 == null)){
            //id1 = "empty"
            l1[id1] = {
                id : 'empty',
                str: 'L1 '+"'empty'",
                children : l0
            };
        } else {
            var ncrfDetails= lineLevel1.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                l1[id1] = {
                    id         : id1,
                    str        : 'L1 '+"'"+id1+"'"+" '"+ncrfDetails[2]+"' "+"'"+countryName+"' "+'('+typeCode+')',
                    children   : l0
                };
            });
        }

    }

    if(hideLevel != "true") {
        var id0 = custHie.id_level0;

        if((id0 == "_emtpy_OSS") || (id0 == null) || (id0 == " ")){
                id0 = "empty"
                l0[id0] = {
                    id : 'empty',
                    str: 'L0 '+"'empty'",
                    children : {}
                };
            } else {
                if(custHie.system != "_CBN_") {
                    l0[id0] = {
                        id         : id0,
                        str        : "L0 '"+id0+"' '"+custHie.name+"' '"+custHie.company_code+"' '"+custHie.system+"' '"+custHie.sales_org+"'",
                        children   : {}
                    };
                } else {
                    l0[id0] = {
                        id         : id0,
                        str        : "L0 '"+id0+"' '"+custHie.name+"' '"+custHie.company_code+"' CBN '",
                        show_id_flag:true,
                        children   : {}
                    };
                }
            }
        }
    });
    //cb(null,l5);
    exports.restructureObject(l5,function(err, newL5){
        cb(null,newL5);
    });
}
function getTypeCode(typeCode,cb) {
    var filepath = "/home/ossevent/host/data/ncrf/ncrf_map.dta"
    var typeCodestr = "AccountClass|"+typeCode+"|"
    fs.readFileSync(filepath).toString().split('\n').forEach(function(line, i) {
        var index=line.indexOf(typeCodestr);
        var value= "";
        if(index==0){
            value= line.substring(typeCodestr.length,line.length-1)
            value = value.toLowerCase();
            cb(null, value);
        }

    });
}

module.exports.restructureObject = function(obj,cb) {
    var newL5 = [];
    for (var l5Key in obj) {
        var  newL4 = [];
        var l5 = {};
        for (var l5Attribute in obj[l5Key]) {
            l5[l5Attribute] = obj[l5Key][l5Attribute];

        }
        l5['children'] = newL4;

        for (var l4Key in obj[l5Key]['children']) {
            var l4 = {};
            var newL3 = [];

            for (var l4Attribute in obj[l5Key]['children'][l4Key]) {
                l4[l4Attribute] = obj[l5Key]['children'][l4Key][l4Attribute];
            }
            l4['children'] = newL3;

            for (var l3Key in obj[l5Key]['children'][l4Key]['children']) {

                var l3 = {};
                var newL2 = [];
                for (var l3Attribute in obj[l5Key]['children'][l4Key]['children'][l3Key]) {
                    l3[l3Attribute] = obj[l5Key]['children'][l4Key]['children'][l3Key][l3Attribute];
                }
                l3['children'] = newL2;

                for (var l2Key in obj[l5Key]['children'][l4Key]['children'][l3Key]['children']) {
                    var l2 = {};
                    var newL1 = [];

                    for (var l2Attribute in obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key]) {
                        l2[l2Attribute] = obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key][l2Attribute];
                    }
                    l2['children'] = newL1;

                    for (var l1Key in obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key]['children']) {
                        var l1 = {};
                        var newL0 = [];
                        for (var l1Attribute in obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key]['children'][l1Key]) {
                            l1[l1Attribute] = obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key]['children'][l1Key][l1Attribute];
                        }
                        l1['children'] = newL0;

                        for (var l0Key in obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key]['children'][l1Key]['children']) {
                            var l0 = {};

                            for (var l0Attribute in obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key]['children'][l1Key]['children'][l0Key]) {

                                l0[l0Attribute] = obj[l5Key]['children'][l4Key]['children'][l3Key]['children'][l2Key]['children'][l1Key]['children'][l0Key][l0Attribute];


                            }
                            l0['children'] = [];

                            newL0.push(l0);
                        } //l0

                        newL1.push(l1);
                    } //l1
                    newL2.push(l2);
                } //l2
                newL3.push(l3);
            } //l3
            newL4.push(l4);
        } //l4
        newL5.push(l5);
    } //l5
    cb(null,newL5);
}

module.exports.getSiteIDS = function(cbn,cb) {
    var filepath = "/home/ossevent/host/data/ncrf/crsxref.dat"
    console.log("Reached");
    fs.readFileSync(filepath).toString().split('\n').forEach(function(line, i) {
        var index=line.indexOf(cbn);
        var value= "";
        var siteIDS = {};
        var siteID =[];
        if(index > -1){

            siteIDS['soldto'] = line.substring(19,29);
            siteIDS['shipto'] = line.substring(29,39);
            siteIDS['invto'] = line.substring(39,49);
            siteID.push(siteIDS);
            cb(null, siteID);
        }

    });

}


