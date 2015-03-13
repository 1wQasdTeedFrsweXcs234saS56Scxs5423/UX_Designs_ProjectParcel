var config=require('../config/config.js')

module.exports.getItemHoldCode=function (stati,datasource,page,db,cb) {

    var HoldCodes = {};
    var itemHoldCode=[];
    var status='';
    var data_source='';

    var where ="where ";
    if(page=="item") {
        var where =where+ " stype='user-item'";
    } else {
       var where =where+ " stype!='user-hdr' ";
    }

    sqlString1 ="select sapsystem,usersys_status,block_category,\
                        usersys_status_text,internal_text       \
                   from usersys_status_setup "+where+"               \
                    and sapsystem  in ('"+datasource+"')";
 
    sqlString1+=" and usersys_status in ('"+stati+"')";;
    console.log(sqlString1); 

    db.execute(sqlString1,[],function(err, HoldCodesResult) {

        if (err) return cb(err, null);

        HoldCodesResult.forEach(function(holdCode, i) {

            var block_category=holdCode.block_category.split("/");
            var cat= config.CatNames[block_category[0]];
            var subcat = config.SubCatNames[block_category[1]];
            var text='';
            var infoText='';

            if(page=="item") {
                if(cat!="Hide" && block_category !="info") {
                    infoText=null;
                    if( subcat !="") {
                        if (holdCode.internal_text != null) {
                            text += cat +"/"+subcat+":"+holdCode.usersys_status+" - "+holdCode.internal_text;
                        }else{
                            text += cat +"/"+subcat+":"+holdCode.usersys_status+" - "+holdCode.usersys_status_text;
                        }
                    }else {
                        if (holdCode.internal_text != null) {
                            text += cat+":"+holdCode.usersys_status+" - "+holdCode.internal_text;
                        }else{
                            text += cat+":"+holdCode.usersys_status+" - "+holdCode.internal_text;
                        }
                    }
                } else if(block_category =="info") {
                    text=null;
                    if (holdCode.internal_text != null) {
                        infoText += holdCode.internal_text;
                    }
                    if(infoText=="") {
                        infoText=null;
                    }
                    if(infoText!=null) {
                        HoldCodes[holdCode.usersys_status+":"+holdCode.sapsystem] = infoText;
                    }
                }
            }else {

                if(subcat==undefined) {
                    subcat="";
                }
                if (holdCode.internal_text != null) {
                    text += holdCode.internal_text+"("+cat+"/ "+subcat+")";
                }else{
                    text += holdCode.usersys_status_text+"("+cat+"/ "+subcat+")";
                }
            }
            if(text=="") {
                text=null;
            }
            if (text!=null) {
                HoldCodes[holdCode.usersys_status+"|"+holdCode.sapsystem] = text;
            }

        });

        itemHoldCode.push(HoldCodes);
        console.log(itemHoldCode);
        cb(err, itemHoldCode);
    });
}

module.exports.getItemExceptions=function (stati,datasource,page,db,cb) {

    var ExceptionCodes = {};
    var itemExceptionCodes=[];
 
    /*select sapsystem, material_status, external_text 
          from mat_status_setup
         where external_text is not null

      select sapsystem, delivery_block, external_text  
          from delv_block_setup
         where external_text is not null
    */
    sqlString1 ="select sapsystem, stype, usersys_status, \
                  external_block_text, block_category \
                from usersys_status_setup  \
                    where external_block_text is not null \
                and sapsystem  in ('"+datasource+"')";

    sqlString1+=" and usersys_status in ('"+stati+"')";
   
    console.log(sqlString1);
    db.execute(sqlString1,[],function(err, ExceptionResult) {

        if (err) return cb(err, null);

        ExceptionResult.forEach(function(row, i) {
            if(row.sapsystem=="SAP-R00") {
                if(row.block_catergory!="info" && row.block_catergory!="hide") {
                    if(row.external_block_text!=null) {
                        ExceptionCodes[row.usersys_status+"|"+row.sapsystem]=row.external_block_text;
                    }
                } 
            }else {
                if(row.external_block_text!=null) {
                    ExceptionCodes[row.usersys_status+"|"+row.sapsystem] =row.external_block_text;
                }
            }
        });
        itemExceptionCodes.push(ExceptionCodes);
        cb(null,itemExceptionCodes);
    });
}
