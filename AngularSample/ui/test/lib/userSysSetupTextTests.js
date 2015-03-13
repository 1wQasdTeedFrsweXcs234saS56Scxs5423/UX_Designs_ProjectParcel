var mockDB=require("../TestDB");
var should  = require('should');
var assert  = require('assert');
var UserSys      = require('../../lib/userSysSetupText');
var config = require('../../config/config.js');

var bunyan = require('bunyan');

describe('UserSyssetuptest', function() {
  var consolidatedStati;

  var sapSys="'SAP-R01',";
  var log ="";

  before(function(done) {

    consolidatedStati="2COB 6CUT 6Q0 BKPL NoMP REL h:2INV h:3PAE h:OPN h:REL OIS:OIS-POM";

    var sapSys="'SAP-R01'";

    log  = new bunyan({
            name: 'UserSyssetuplog',

        });

    mockDB.testdbConn(function(db) {
      var sqlStr= "Insert into usersys_status_setup (SAPSYSTEM,STYPE,USERSYS_STATUS,USERSYS_STATUS_TEXT,BLOCK_CATEGORY,EXTERNAL_TEXT,INTERNAL_TEXT,CREDIT_TEXT,BLOCK_TEXT,EXTERNAL_BLOCK_TEXT,MAT_STATUS_TEXT,RECORD_STATE,CANCELATION_REASON) values ('OIS','usr-hdr','OIS-POM','OIS Purchase Order Copy missing','info',null,'OIS Purchase Order Copy missing',null,null,null,null,'active',null)";
      db.execute(sqlStr,[],function(err,rows) {
          console.log(rows);
          db.close();
             done();
        });
     });

  });

  it('should have a valid created by property', function(done) {
    //setTimeout(done, 10000);
      console.log("ggg");
      mockDB.testdbConn(function(db) {

          UserSys.getHoldCode(consolidatedStati,sapSys,db,log, function(err, holdCode) {

            holdCode[0].should.have.property('info');


             db.close();

              done();
          });

     });
  });

  after(function(done) {
    mockDB.testdbConn(function(db) {
      var sqlStr= "Delete from usersys_status_setup";
      db.execute(sqlStr,[],function(err,rows) {
          console.log(rows);
          db.close();
             done();
        });
     });


  })
});
