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


    var l5 = [];
    var l4 = [];
    var l3 = [];
    var l2 = [];
    var l1 = [];
    var l0 = [];

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

    // var id5 = custHie.id_level5
    // if (!l5.hasOwnProperty(id5)) {
    //     l4 = {};
    //     l3 = {};
    //     l2 = {};
    //     l1 = {};
    //     l0 = {};
    //     if(lineLevel5.length == 0){
    //         l5[id5] = {
    //             id : 'empty',
    //             level: 5,
    //             children : l4
    //         };
    //     } else {
    //         var ncrfDetails= lineLevel5.split("|");
    //         var countryName = config.countryName[ncrfDetails[3]];
    //         getTypeCode(ncrfDetails[6],function(err, typeCode){
    //             l5[id5] = {
    //                 id         : id5,
    //                 level      : 5,
    //                 name       : ncrfDetails[2],
    //                 countryName: countryName,
    //                 typeCode   : typeCode,
    //                 children   : l4
    //             };
    //         });
    //     }
    // }

    // var id4 = custHie.id_level4;
    // if (!l4.hasOwnProperty(id4)) {
    //     l3 = {};
    //     l2 = {};
    //     l1 = {};
    //     l0 = {};
    //     if((lineLevel4.length == 0) || (id4 == "_emtpy_OSS")){
    //         l4[id4] = {
    //             id : 'empty',
    //             level: 4,
    //             children : l3
    //         };
    //     } else {
    //         var ncrfDetails= lineLevel4.split("|");
    //         var countryName = config.countryName[ncrfDetails[3]];
    //         getTypeCode(ncrfDetails[6],function(err, typeCode){
    //             l4[id4] = {
    //                 id         : id4,
    //                 level      : 4,
    //                 name       : ncrfDetails[2],
    //                 countryName: countryName,
    //                 typeCode   : typeCode,
    //                 children   : l3
    //             };
    //         });
    //     }

    // }

    // var id3 = custHie.id_level3;
    // if (!l3.hasOwnProperty(id3)) {
    //     l2 = {};
    //     l1 = {};
    //     l0 = {};
    //     if((lineLevel3.length == 0) || (id3 == "_emtpy_OSS")){
    //         l3[id3] = {
    //             id : 'empty',
    //             level: 3,
    //             children : l2
    //         };
    //     } else {
    //         var ncrfDetails= lineLevel3.split("|");
    //         var countryName = config.countryName[ncrfDetails[3]];
    //         getTypeCode(ncrfDetails[6],function(err, typeCode){
    //             l3[id3] = {
    //                 id         : id3,
    //                 level      : 3,
    //                 name       : ncrfDetails[2],
    //                 countryName: countryName,
    //                 typeCode   : typeCode,
    //                 children   : l2
    //             };
    //         });
    //     }
    // }

    // var id2 = custHie.id_level2;
    // if (!l2.hasOwnProperty(id2)) {
    //     l1 = {};
    //     l0 = {};
    //     if((lineLevel2.length == 0) || (id2 == "_emtpy_OSS")){
    //         l2[id2] = {
    //             id : 'empty',
    //             level: 2,
    //             children : l1
    //         };
    //     } else {
    //         console.log("lineLevel2:"+lineLevel2)
    //         var ncrfDetails= lineLevel2.split("|");
    //         var countryName = config.countryName[ncrfDetails[3]];
    //         getTypeCode(ncrfDetails[6],function(err, typeCode){
    //             l2[id2] = {
    //                 id         : id2,
    //                 level      : 2,
    //                 name       : ncrfDetails[2],
    //                 countryName: countryName,
    //                 typeCode   : typeCode,
    //                 children   : l1
    //             };
    //         });
    //     }
    // }

    // var id1 = custHie.id_level1;

    // if (!l1.hasOwnProperty(id1)) {
    //     l0 = {};
    //     if((lineLevel1.length == 0) || (id1 == "_emtpy_OSS")){
    //         //id1 = "empty"
    //         l1[id1] = {
    //             id : 'empty',
    //             level: 1,
    //             children : l0
    //         };
    //     } else {
    //         var ncrfDetails= lineLevel1.split("|");
    //         var countryName = config.countryName[ncrfDetails[3]];
    //         getTypeCode(ncrfDetails[6],function(err, typeCode){
    //             l1[id1] = {
    //                 id         : id1,
    //                 level      : 1,
    //                 name       : ncrfDetails[2],
    //                 countryName: countryName,
    //                 typeCode   : typeCode,
    //                 children   : l0
    //             };
    //         });
    //     }

    // }

    // if(hideLevel != "true") {
    //     var id0 = custHie.id_level0;

    //     if((id0 == "_emtpy_OSS") || (id0 == null) || (id0 == " ")){
    //             id0 = "empty"
    //             l0[id0] = {
    //                 id : 'empty',
    //                 level: 1,
    //                 children : {}
    //             };
    //         } else {
    //             if(custHie.system != "_CBN_") {
    //                 l0[id0] = {
    //                     id         : id0,
    //                     level      : 0,
    //                     name       : custHie.name,
    //                     system     : custHie.system,
    //                     salesOrg   : custHie.sales_org,
    //                     children   : {}
    //                 };
    //             } else {
    //                 l0[id0] = {
    //                     id         : id0,
    //                     level      : 0,
    //                     name       : custHie.name,
    //                     system     : "CBN",
    //                     companyCode: custHie.company_code,
    //                     children   : {}
    //                 };
    //             }
    //         }
    //     }
    // });
    var id5 = custHie.id_level5
    //console.log("hi:"+custHie.id_level5)
    if (visitedLevel5.indexOf(custHie.id_level5) == -1) {
        var tempL5 = {};

        if(lineLevel5.length == 0){

            tempL5['id'] = 'empty';
            tempL5['level'] = 5;
            l5.push(tempL5);
            l5[0]['children']= l4;
        } else {
            var ncrfDetails= lineLevel5.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                tempL5['id'] = id5;
                tempL5['level'] = 5;
                tempL5['name'] = 5;
                l5.push(tempL5);
                l5[0]['children'] = l4;
            });
        }
    }

    var id4 = custHie.id_level4;
    if (visitedLevel4.indexOf(custHie.id_level4) == -1) {

        var tempL4= {};

        if((lineLevel4.length == 0) || (id4 == "_emtpy_OSS")){
            tempL4['id']='empty';
            tempL4['level']=4;
            l4.push(tempL4);
            l4[0]['children']=l3;
        } else {
            var ncrfDetails= lineLevel4.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                tempL4['id']=id4;
                tempL4['level']=4;
                tempL4['name']=ncrfDetails[2];
                tempL4['countryName']=countryName;
                tempL4['typeCode']=typeCode;
                l4.push(tempL4);
                l4[0]['children']=l3;
            });
        }
    }


    var id3 = custHie.id_level3;
    if (visitedLevel3.indexOf(custHie.id_level3) == -1) {
        var tempL3 = {};
        if((lineLevel3.length == 0) || (id3 == "_emtpy_OSS")){

            tempL3['id']='empty';
            tempL3['level']=3;
            l3.push(tempL3);
            l3[0]['children']=l2;
        } else {
            var ncrfDetails= lineLevel3.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){

                tempL3['id']=id3;
                tempL3['level']=3;
                tempL3['name']=ncrfDetails[2];
                tempL3['countryName']=countryName;
                tempL3['typeCode']=typeCode;
                l3.push(tempL3);
                l3[0]['children']=l2;
            });
        }
    }

    var id2 = custHie.id_level2;
    if (visitedLevel2.indexOf(custHie.id_level2) == -1) {
        var tempL2 = {};
        if((lineLevel2.length == 0) || (id2 == "_emtpy_OSS")){
            tempL2['id']='empty';
            tempL2['level']=2;
            l2.push(tempL2);
            l2[0]['children']=l1;
        } else {
            console.log("lineLevel2:"+lineLevel2)
            var ncrfDetails= lineLevel2.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                tempL2['id']=id2;
                tempL2['level']=2;
                tempL2['name']=ncrfDetails[2];
                tempL2['countryName']=countryName;
                tempL2['typeCode']=typeCode;
                l2.push(tempL2);
                l2[0]['children']=l1;
            });
        }
    }

    var id1 = custHie.id_level1;

    if (visitedLevel1.indexOf(custHie.id_level1) == -1) {

        var tempL1 = {};
        if((lineLevel1.length == 0) || (id1 == "_emtpy_OSS")){
            tempL1['id']='empty';
            tempL1['level']=1;
            l1.push(tempL1);
            l1[0]['children']=l0;
        } else {
            var ncrfDetails= lineLevel1.split("|");
            var countryName = config.countryName[ncrfDetails[3]];
            getTypeCode(ncrfDetails[6],function(err, typeCode){
                tempL1['id']=id1;
                tempL1['level']=1;
                tempL1['name']=ncrfDetails[2];
                tempL1['countryName']=countryName;
                tempL1['typeCode']=typeCode;
                l1.push(tempL1);
                l1[0]['children']=l0;
            });
        }

    }

    var tempL0 = {};
    var dummyL = []
    if(hideLevel != "true") {
        var id0 = custHie.id_level0;

        if((id0 == "_emtpy_OSS") || (id0 == null) || (id0 == " ")){

            tempL0['id']='empty';
            tempL0['level']=0;
            l0.push(tempL0);
            l0[0]['children']=[];
        } else {
                if(custHie.system != "_CBN_") {

                    tempL0['id']=id0;
                    tempL0['level']=0;
                    tempL0['name']=custHie.name;
                    tempL0['system']=custHie.system;
                    tempL0['salesOrg']=custHie.sales_org;
                    l0.push(tempL0);
                    l0[0]['children'] = [];
                } else {

                    tempL0['id']=id0;
                    tempL0['level']=0;
                    tempL0['name']=custHie.name;
                    tempL0['system']="CBN";
                    tempL0['companyCode']=custHie.company_code;
                    l0.push(tempL0);
                    l0[0]['children'] = [];
                }
            }
        }
        if((custHie.id_level5 == "undifined")){
            visitedLevel5.push('empty');
        } else{
            visitedLevel5.push(custHie.id_level5);
        }
        visitedLevel4.push(custHie.id_level4);
        visitedLevel3.push(custHie.id_level3);
        visitedLevel2.push(custHie.id_level2);
        visitedLevel1.push(custHie.id_level1);

    });
    console.log("Hi")
    console.log(JSON.stringify(l5));
    cb(null,l5);
}

function getTypeCode(typeCode,cb) {
    var filepath = "/home/ossevent/host/data/ncrf/ncrf_map.dta"
    var typeCodestr = "AccountClass|"+typeCode+"|"
    fs.readFileSync(filepath).toString().split('\n').forEach(function(line, i) {
        var index=line.indexOf(typeCodestr);
        if(index==0){
            var value= line.substring(typeCodestr.length,line.length-1)
            if(value == null){
                value="No type code"
            }
            cb(null, value);
        }
    });
}
