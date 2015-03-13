var productDetails=require('../lib/productDetailPage');
var DbPool    = require('../lib/DbPool');

module.exports.init = function(app) {

    app.get('/ossui/v1/in/productDetails', app.role(AuthGroupSandyUser), function(req,res) {
    	DbPool.OSSDB(function(db) {
        	productDetails.ProductDetails(req.query.os,req.query.item,db,function(err,result) {
        		//(err,result);
        		res.json({
        			status:"S",
        			data:result
        		});
        	});
    	});
    });
    app.get('/ossui/v1/ex/productDetails', app.role(AuthGroupExternal), function(req,res) {
        DbPool.OSSDB(function(db) {
            productDetails.ExternalProductDetails(req.query.os,req.query.item,db,function(err,result) {
                //(err,result);
                res.json({
                    status:"S",
                    data:result
                });
            });
        });
    });
}

