var DbPool       = require('../lib/DbPool');

module.exports.getProductChars=function(req,cb) {
    var sqlString="select *from backlog_item_charac  \
                	 where legacy_order_no = :1   \
                    and item_subitem=:2";
    DbPool.OSSDB( function(db) {
        db.execute(sqlString,[req.query.os,req.query.item],function(err,result) {
        	console.log(req.os+" "+req.item);
            if(err)cb(err,null);
            cb(null,result);
        });
    });
}
