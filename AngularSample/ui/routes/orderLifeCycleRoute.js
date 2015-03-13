var orderLifeCycle=require('../lib/orderLifeCycle');

module.exports.init = function(app) {

   app.get('/ossui/v1/in/orderlifecycle', app.role(AuthGroupSandyUser), function(req,res) {
        orderLifeCycle.orderLifeCycle(req.query.order_no,req.query.action,function(err,result) {
            res.json({
                status:"S",
                data:result
            });
        });
    });
}

