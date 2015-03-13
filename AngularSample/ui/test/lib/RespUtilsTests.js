var should  = require('should');
var assert  = require('assert');
var Resp    = require('../../lib/RespUtils.js');
var bunyan  = require('bunyan');

describe('ResponseUtilsTest', function() {


  var res  = new Object();
  var log;
  beforeEach(function(done) {

      var has={};
      res.json=function(has){
          return has
      };

      res.setHeader=function(x,y,z) {
      };

      var log = new bunyan({
        name: 'ItemDetailWebService',
      });
      done();
  });

  it('send Item details Response', function(done) {

        var newItems={};
        var msg = "No Item details found for order#: "
        var rs= Resp.sendItemResponse(res, log, 'Sending back Item Details.', msg, 1, 1000, 0,0, newItems);
        rs.should.have.property('status')
        done();


  })
  it('send Order details Response', function(done) {
     var msg = "No order found for order#: "
     var rs= Resp.sendOrderResponse(res, log,"Sending Order Details.", msg, 1, 1000,0, {})
     rs.should.have.property('status')

     done()

  })
})
