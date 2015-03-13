process.env.NODE_ENV = 'test';
var should = require('should');
var assert = require('assert');
var request = require('supertest');
var express = require('express');
var DbPool       = require('../../lib/DbPool'  );
var UserSysItem  = require('../../lib/UserSysItemCode');
var config       = require('../../config/config.js');
var Resp         = require('../../lib/RespUtils.js');
var _            = require('underscore');
var bunyan       = require('bunyan');
var item         = require('../../routes/itemDetailsRoute.js');

require('/etc/opt/oss/backend/dbConnection')();
app = express();
 require('../../lib/appSetup')(app, express, function() {
    require('../../lib/routeLoader')(app);

});
app.get('/', function(req,res) {

    res.redirect('/index.html');
});

app.listen(3000);
console.log("hi")
describe('ItemDetailService Routing', function() {
  var url;
  url = 'http://localhost:3000';

 console.log("hello")


  it('ItemDetailService', function() {

        console.log("chello")
        request(url)
        .get('/ossui/v1/in/itemdetail?oid=80V600685001', app.role('Q2C_OSS_SANDY_USER_NON_PROD'))

        .expect('Content-Type', /json/)
        .expect(200) //Status code
        .end(function(req,res) {
         console.log(" rwqq"+req.query.oid)
        // Should.js fluent syntax applied

      done();
    });

  });



});
