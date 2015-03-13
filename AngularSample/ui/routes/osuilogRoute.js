var fs = require('fs');

module.exports.init = function(app) {
    app.get('/ossui/v1/in/osuilog', app.role(AuthGroupSandyUser), function(req,res) {
         fs.readFile('/var/opt/oss/backend/dispatcher/OSfInternalUIServer.log', function (err,data) {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }
            res.writeHead(200);
            res.end(data);
        });
    });
}
