/*----------------------------------------------------------------------------
|
|   Route handler for /ossui/v1/dmt
|
|   Webservice for Data Maintenance (DMT - Data Maintain Tools).
|
|   written by sravan
|   Sept 2013
|
\---------------------------------------------------------------------------*/

var queryUtils=require("./queryUtils.js");

module.exports.UpdateDmtConfig=function(stdout,dmtConfig) {
   var userGroups = stdout.replace(/\n|\r/g, "").split(" ");

    for(var title in dmtConfig) {
        if (dmtConfig[title].user_locked == "Y") {
            if (userGroups.indexOf(dmtConfig[title].allowed_insert_grp) >= 0) dmtConfig[title].insert_button = "Y"
            if (userGroups.indexOf(dmtConfig[title].allowed_update_grp) >= 0) dmtConfig[title].update_button = "Y"
            if (userGroups.indexOf(dmtConfig[title].allowed_delete_grp) >= 0) dmtConfig[title].delete_button = "Y"
        }
    }

}

module.exports.GetExprFromFilter =function ( dmtcfg, table, field, op,value )  {

    var colname="";
    Object.keys(dmtcfg[table]["column_labels"]).forEach(function (key) {
        if(dmtcfg[table]["column_labels"][key] == field) {
            colname=key;
        }
    });

    switch (op) {
        case  "=":
            return colname + "='"+value+"'";

        case "<>":
           return colname + "<>'"+value+"'";

        case "<":
           return colname + "<"+value;

        case ">":
            return colname + ">"+value;

        case "like":
            return colname + " like '"+value+"'";
            break;
        case "not like":
            return colname + " like '"+value+"'";

        case "is NULL":
            return colname + " is NULL";

        case "is not NULL":
            return colname + " is not NULL ";

    }
}

module.exports.GenerateWhereClauseFromFilter=function(dmtConfig,param) {

    var dmtConfigKey=""
    Object.keys(dmtConfig).forEach(function (key) {
        if(dmtConfig[key]["table_name"] == param.table) {
            dmtConfigKey=key;

        }
    });
    var whereClause=""
    var whereRestriction=""
    var f1="field1";

    console.log(param[f1]);

    if (param.field1 == undefined || param[f1] == "" ) {

    } else {

        whereClause=whereClause+exports.GetExprFromFilter(dmtConfig,dmtConfigKey,param[f1],param.op1,param.value1)
    }
    if (param.field2 != undefined && param.field2 != "" ) {
        whereClause=whereClause+" "+param.sel2;
        whereClause=whereClause+" "+exports.GetExprFromFilter(dmtConfig,dmtConfigKey,param.field2, param.op2,param.value2)
    }
    if (param.field3 != undefined && param.field3 != "" ) {
        whereClause=whereClause+" "+param.sel3;
        whereClause=whereClause+" "+exports.GetExprFromFilter(dmtConfig,dmtConfigKey,param.field3, param.op3,param.value3)
    }
    if(param.field3 != undefined && param.field4 != "" ) {
        whereClause=whereClause+" "+param.sel4;
        whereClause=whereClause+" "+exports.GetExprFromFilter(dmtConfig,dmtConfigKey,param.field4, param.op4,param.value4)
    }

    if  (whereRestriction == "" ) {
        if( whereClause == "") {
            return ""
        } else {

            whereClause="where "+whereClause
            return whereClause
        }
    } else {
        if(whereClause == "") {

            return "where "+whereRestriction
        } else {
            return "where ( "+whereRestriction+" ) AND ( "+whereClause+" )"
        }
    }

}

module.exports.SelectQuery=function(db,table,whereclause,userId,cb) {

    sqlString = "select * from "+table +" "+whereclause;

    db.execute(sqlString, [], function(err, result) {

        result.forEach(function(row,i){
            Object.keys(row).forEach(function (key) {
                var newkey="new_"+key
                result[i][newkey]=row[key]
            });

        });
        cb(null,result)
   });
}

// THis logic

module.exports.UpdateTable=function(db, param,constraints,userId,cb) {

   // set loginname  $cgiconnection(loginname)
   // set loginname  $cgiconnection(loginname)

    var result = JSON.parse(param.json);
    var table = param.table;
    var noRows   =result.length;
    var colNames=[];
    var count=0

    result.forEach(function(row,i) {
        var found=0;
        var setClause="";
        count=count+1;
        var objKey="";
        var obj="";
        Object.keys(row).forEach(function (key) {

            var newkey="new_"+key
            if(key.match("new_")) {

                return true
            }
            if(count ==1) {
                colNames.push(key);
            }

            if(row[key]!=row[newkey]) {

                if (found) {
                    setClause=setClause+", "
                }
                var new_content=row[newkey].replace(/'/g,"''");
                new_content= new_content.trim();
                setClause =setClause+key+" = "+"'"+new_content+"'"
                found=1

            }
            obj=obj+"{"+key.toUpperCase()+" "+row[newkey]+"} ";

        });

        if(found == 1) {

            constraints.forEach(function(r,i) {
                objKey="{"+r.column_name +"   "+row[r.column_name.toLowerCase()]+'}';
            });

            var whereClause=exports.ConstructUpdateWhereClause(table,row,colNames);

            if ( whereClause != "" ) {
                exports.CountSelectedRows(db,table, whereClause,function(err,result) {
                    if(result[0]["count"]==1) {
                        var userId="sravan@hp.com"
                        //exports.audit(db, userId, "update", table,objKey,obj,function(err,result) {
                            var updateSql="update "+table + " set "+setClause +"  where "+whereClause;
                            console.log(updateSql);
                            db.execute(updateSql,[],function(err,result) {
                                if(err){
                                    console.log(null);
                                    cb(err,null)
                                }else{
                                    result[0]["query"]=updateSql;
                                    cb(null,result)
                                }
                            });
                        //});
                    }
                });
            }
        }
    });
}

module.exports.ConstructUpdateWhereClause=function (table,row,colNames) {
    var where="";
    var and="";
    colNames.forEach(function(colName) {

        if (row[colName] != "") {

            if (row[colName] == "NULL" || row[colName] == null ) {
                where= where+" "+and + " "+colName+" is null";
                and=" AND"
            } else {
                row[colName]=row[colName].replace(/'/g,"''");
                where=where + "  "+and+ " "+ colName+" = "+"'"+row[colName]+"'"
                and=" AND"
            }
        }else {
            where=where + "  "+and+ " "+ colName+" = "+"'"+row[colName]+"'"
            and=" AND"
        }

    });
    return where
}

module.exports.CountSelectedRows=function (db,table, whereClause,cb) {
    var count=0;
    var sqlStr= "select count(*) as count from  "+ table+" where "+whereClause
    db.execute(sqlStr,[],function(err,result) {
        if(err) cb(err,null)
        cb(null,result);
    });
}

module.exports.getAuditKeys=function(db,table,cb){

    var sql= "select cols.column_name   from all_constraints cons, all_cons_columns cols  \
                   where cols.table_name = :1 \
                    and cons.constraint_type = 'P'  \
                   and cons.constraint_name = cols.constraint_name \
                    and cons.owner = cols.owner \
                   order by cols.position";
    db.execute(sql,[table],function(err,result){
        if(err) cb(null,err)
        cb(null,result)

    });

}


module.exports.insertRows=function(db,table,constraints,param,userId,cb) {


    var result=JSON.parse(param.json);
    var table=param.table;
    var userId="";
    var objKey="";
    var obj="";

    result.forEach(function(row,i) {
        Object.keys(row).forEach(function (key) {

            obj=obj+"{"+key.toUpperCase()+" "+row[key]+"} ";

        });
        constraints.forEach(function(r,i) {
            objKey="{"+r.column_name +"   "+row[r.column_name.toLowerCase()]+'}';
        });

        exports.audit(db,userId,"insert", table,objKey,obj,function(err,result) {
            if(err){
                cb(err,null);
            }else {
                queryUtils.insertTable(db,table,row,function(err,result){
                    console.log(result);
                });
            }
        });
    });

}

//module.export.DeleteRows=function()

module.exports.audit=function(db, userId, operation, objType,objKey,obj,cb ) {

    //set timestamp [clock format [clock seconds] -format "%Y-%m-%d %H:%M:%S"]
    var rowJson={};
    rowJson={"area":'webwisq',
           "user_id":"sravan@hp.com",
           "operation":operation,
           "object_type": objType,
           "object_key":objKey,
           "object":utl_raw.cast_to_raw("+obj+")
        }

    var sqlStr = "select audit_id.nextval as nextval, to_date(to_char(sysdate, 'DD-MON-YY HH12:MI:SS AM'),'DD-MON-YY HH12:MI:SS AM') sdate from dual";
    db.execute(sqlStr,[],function(err,result) {
        rowJson["audit_id"]=result[0].nextval;
        rowJson["timestamp"]=result[0].sdate;
        console.log(rowJson);
        queryUtils.insertTable(db,"audit_trail",rowJson,function(err,result){
            if(err)cb(err,null);
            cb(null,result);
        });
    });
}


module.exports.deleteRows=function(db,table,constraints,param,userId,cb) {

    var result=JSON.parse(param.json);
    var table=param.table;
    var userId="";
    var objKey="";
    var obj="";

    result.forEach(function(row,i) {
        Object.keys(row).forEach(function (key) {

            obj=obj+"{"+key.toUpperCase()+" "+row[key]+"} ";

        });
        constraints.forEach(function(r,i) {
            objKey="{"+r.column_name +"   "+row[r.column_name.toLowerCase()]+'}';
        });
        queryUtils.deleteTable(db,table,row,function(err,result) {
            if(err) cb(err,null)
            cb(null,result);
        });
    });
}

