module.exports.insertTable=function(db,table,json,cb){

        var columns="(";
        var bindNos="(";
        var col=0;
        var arrValues=[];

        Object.keys(json).forEach(function(key) {
            col=col+1;
            columns=columns+key+",";
            bindNos=bindNos+":"+col+",";
            arrValues.push(json[key]);
        });

        columns = columns.substring(0, columns.length-1);
        columns = columns+")";
        bindNos  = bindNos.substring(0, bindNos.length-1);
        bindNos=bindNos+")";

        var insertBindQuery="insert into "+table+" "+columns+" values "+bindNos;
        console.log(insertBindQuery)
        db.execute(insertBindQuery,arrValues,function(err,result){
            if(err) {
                console.log(err);
                var Error={};
                Error["Error"]=err.toString();
                Error["query"]=insertBindQuery;
                Error["parameters"]=arrValues;
                cb(Error,null)
            }else {
                result[0]["query"]=insertBindQuery;
                result[0]["parameters"]=arrValues;
                cb(null,result)
            }
        });
}

module.exports.deleteTable=function(db,table,row,cb) {

    var where="";
    var and="";

    Object.keys(row).forEach(function(key) {
        if (row[key] != "") {

            if (row[key] == "NULL" || row[key] == null ) {
                where= where+" "+and + " "+key+" is null";
                and=" AND"
            } else {
                row[key]=row[key].replace(/'/g,"''");
                where=where + "  "+and+ " "+ key+" = "+"'"+row[key]+"'"
                and=" AND"
            }
        } else {
            where=where+"  "+and+ " "+ key+" = "+"'"+row[key]+"'"
            and=" AND"
        }

    });
    var whereClause="";
    if(where!="") {
        whereClause=" where "+where;

    }

    var sqlStr ="delete from "+table+whereClause;
    console.log(sqlStr);
    db.execute(sqlStr,[],function(err,result) {
        if(err) {
            cb(null,err);
        }
        result[0]["query"]=sqlStr;
        cb(null,result);
    });
}

module.exports.columnDataType=function(db,table,cb) {

    var sqlStr ="select column_id,column_name,data_type, data_length \
                    from all_tab_columns            \
                   where owner = 'OSSDBA' and table_name =:1";

    var columnDateType={};
    columns=columns+key+",";
    db.execute(sqlStr,[table],function(err,result) {

        if(err)cb(null,err);
        result.forEach(function(row,i) {
            columnDateType[row.column_name]=row.data_type;
        });
        cb(null,columnDateType);
    });
}
