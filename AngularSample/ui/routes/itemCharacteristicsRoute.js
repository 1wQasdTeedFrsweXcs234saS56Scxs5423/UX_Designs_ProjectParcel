var itemChars=require("../lib/itemCharacteristics.js");
var bunyan    = require('bunyan');

var log          = new bunyan({
    name: 'ItemCharacteristicsWebService',
});

module.exports.init = function(app) {
    app.get('/ossui/v1/in/itemchars', app.role(AuthGroupSandyUser), function(req,res) {
    	itemChars.getProductChars(req,function(err,result){
            var status="S"
            var msg="";
    		if(err) {
    			status="E";
                msg=err;
    		}
    		res.json({
    			status:"S",
    			msg:"",
    			data:result
    		});
    	});
	});
}
