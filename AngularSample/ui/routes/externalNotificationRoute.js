/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/ordersummary
|
|
|   This webservice will show the notification setup for the
|   particular user logged in.
|
|   written by  Deepu Krishnamurthy
|   September 2013
|
\---------------------------------------------------------------------------*/

var augment   = require("../lib/augment.js")
var SqlUtils  = require('../lib/SqlUtils');
var SqlUtils2 = require("../lib/SqlUtils2");
var queryUtils = require("../lib/queryUtils");
var PortalSec = require("../lib/PortalSecurity")
var DbPool    = require('../lib/DbPool');
var config    = require('../config/config.js');
var Resp      = require('../lib/RespUtils.js');
var FileSys   = require('fs');
var osconfig  = require('/etc/opt/oss/backend/UI.cfg');
var crypto = require('crypto');
var check = require('validator').check;
var mailer = require('nodemailer');

internalAllowedSaveDirPath = "/etc/opt/oss/frontend/";

var bunyan    = require('bunyan');

var log = new bunyan({
    name: 'ExternalNotification',
});

function convert (param) {
    if (param == true){
        return 'Y';
    } else if (param == false){
        return 'N';
    } else {
        return param;
    }
}

function saveNotification (req,res) {
    var result = JSON.parse(JSON.stringify(req.body));

    var enabled  = convert(result.enabled);
    var purch_order_pat = result.purch_order_pat;
    var ship_to_attn_pat =  result.ship_to_attn_pat;
    var on_ack = convert(result.on_ack);
    var on_sdd_chg = convert(result.on_sdd_chg);
    var on_order_chg = convert(result.on_order_chg);
    var on_status_chg = convert(result.on_status_chg);
    var on_status_admin = convert(result.on_status_admin);
    var on_status_prod = convert(result.on_status_prod);
    var on_status_cons = convert(result.on_status_cons);
    var on_status_ship = convert(result.on_status_ship);
    var on_status_delv = convert(result.on_status_delv);
    var on_status_inv = convert(result.on_status_inv);
    var on_status_canc = convert(result.on_status_canc);
    var send_daily = convert(result.send_daily);
    var timing =  result.timing;
    var transport_method =  result.transport_method;
    var transport_format =  result.transport_format;
    var msgformat =  result.MESSAGE_FORMAT;
    var host =  result.host;
    var transport_user =  result.transport_user;
    var transport_passwd =  result.transport_passwd;
    var path =  result.path;
    var header_line = convert(result.header_line);
    var e_mail_addr =  result.e_mail_addr;
    console.log('message format '+msgformat);
    var d = new Date();

    var rowValue = {
            "aaid" :"adhoc",
            "user_id" : "deepu.krishnamurthy@hp.com",
            "enabled" :enabled,
            "purch_order_pat": purch_order_pat,
            "ship_to_attn_pat":ship_to_attn_pat,
            "on_ack":on_ack,
            "on_sdd_chg":on_sdd_chg,
            "on_order_chg":on_order_chg,
            "on_status_chg":on_status_chg,
            "on_status_admin":on_status_admin,
            "on_status_prod":on_status_prod,
            "on_status_cons":on_status_cons,
            "on_status_ship":on_status_ship,
            "on_status_delv":on_status_delv,
            "on_status_inv":on_status_inv ,
            "on_status_canc":on_status_canc,
            "timimg":timing,
            "transport_method":transport_method,
            "transport_format":transport_format,
            "header_line":header_line,
            "host":host,
            "transport_user":transport_user,
            "transport_passwd":transport_passwd,
            "message_format":msgformat,
            "send_daily":send_daily,
            "path": path,
            "e_mail_addr":e_mail_addr,
            "last_update": d
    }

    DbPool.OSSDB(function(db) {

        var table ='esn_profile';
        var row = {
            "aaid" :"adhoc",
            "user_id" : "deepu.krishnamurthy@hp.com"
        };
        queryUtils.deleteTable(db,table,row,function(err,result){
            console.log(result);
        });

        queryUtils.insertTable(db,table,rowValue,function(err,result){
            console.log(result);
         });

    });
}

function CheckEmailReports (req , db, emailAddr, cb) {
    // var aaid = req.aaid;
    // var user = req.user_id;
    var aaid = 'b2b';
    var user = 'cabuatemulex_pur@yahoo.com';

    db.execute(" select report_no, name, email \
                   from report   \
                  where user_id = :1   \
                    and aaid = :2   \
                    and email = :3 \
                    and email_mode is not null \
                    and email_mode in ('email', 'link') \
                    ", [user, aaid, emailAddr ], function(err, reportList) {
        if (err) {
            return Resp.sendError(res, log, err);
        }
        console.log("inside CheckEmailReports");
        console.log("CheckEmailReports " + reportList[0].report_no + reportList[0].name);
        cb(err,reportList);
    });
}


function RemoveEmailFromReports (req ,db,emailAddr, res) {
    // var aaid = req.aaid;
    // var user = req.user_id;
    var aaid = 'b2b';
    var user = 'cabuatemulex_pur@yahoo.com';
    CheckEmailReports(req, db, emailAddr, function(err,reportList){
        var changed = 0;
        if (reportList.length != 0) {
            for (var i = 0; i <= reportList.length-1; i++) {

                db.execute(" select  email \
                   from report   \
                  where user_id = :1   \
                    and aaid = :2   \
                    and report_no = :3 \
                    ", [user, aaid, reportList[i].report_no ], function(err, email) {
                    if (err) {
                        return Resp.sendError(res, log, err);
                    }

                    if(email.length != 0) {
                        for (var j=0; j<=email.length-1; j++) {
                            if((email[j].email).indexOf(emailAddr) > -1) {
                                console.log('RemoveEmailFromReports ' + email[j].email);
                                email[j].email  = (email[j].email).replace(emailAddr,"");
                                changed = 1;
                                console.log("replace with null" + email[j].email);
                            }
                        }
                    }
                    if (changed) {
                        console.log("email, updating report " + reportList[i].report_no + " " + reportList[i].name);
                        /* db.execute(" update report  \
                                    set email = :1    \
                                  where report_no = :2   \
                                ", [email, reportList[i].report_no], function(err, result) {
                                if (err) {
                                    return Resp.sendError(res, log, err);
                                }
                        });*/
                    }
                });
            }
        }

    });

}

function DelEmailAddress ( req, res, emailAddr, delConfirmed, db ) {

    if ( ! delConfirmed ) {
        // first check whether report results are sent to the selected email address
        CheckEmailReports(req, db, emailAddr, function(err,reportList){
            if (reportList.length == 0) {
                delConfirmed = 1;
            } else {
                var msg = '<b>Warning:</b> the email address is still assigned to the following reports:' + reportList.name + ' has been deleted.';
                //msg + = 'Deleting the email address will also remove the address from the reports above.<br> ' + 'Do you want to delete ' + emailAddr +' anyway?';
                Resp.sendResponse(res, log, msg, msg,'');
            }
        });
    }
    //delConfirmed = 1;
    if ( delConfirmed ) {
        //PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {
            /*if (err) {
                  return Resp.sendError(res, log, err);
            }*/
            // var aaid = req.aaid;
            // var user = req.user_id;
            RemoveEmailFromReports (req ,db, emailAddr, res);

            var table ='email_addresses';
            var row = {
                "aaid" :"adhoc",
                "user_id" : "deepu.krishnamurthy@hp.com",
                "email" : emailAddr
            };
            /*queryUtils.deleteTable(db,table,row,function(err,result){
                console.log(result);
            });*/
            var msg = 'our request has been accepted. The address ' + emailAddr + ' has been deleted.';
            Resp.sendResponse(res, log, msg, msg, '');

        //});
    }

}


function GenerateEmailActivateKey (aaid , user, emailAddr, cb) {

    var seconds = new Date().getTime() / 1000;
    seconds = Math.round(seconds);

    var key = aaid + "\0" + user + "\0" + emailAddr + "\0" + seconds ;
    var hash = crypto.createHash('md5').update(key).digest("hex");
    console.log("GenerateEmailActivateKey key " +hash);
    cb(hash);
}

function AddNewEmailaddress(req, res, emailAddr, db) {
    //PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {
        /*if (err) {
              return Resp.sendError(res, log, err);
        }*/
        // var aaid = req.aaid;
        // var user = req.user_id;
        var aaid = 'adhoc';
        var user = 'deepu.krishnamurthy@hp.com';
        console.log("AddNewEmailaddress user "  + user);

        db.execute("select count(*) as count \
                       from email_addresses   \
                      where user_id = :1   \
                        and aaid = :2   \
                        and email = :3 \
                        and active = 'Y' \
                    ", [user, aaid, emailAddr ], function(err, results) {
            if (err) {
                return Resp.sendError(res, log, err);
            }
            var count = results[0].count;
            console.log("AddNewEmailaddress count "  + results[0].count);
            if (count) {
                err = "The email address " + emailAddr + " was already assigned to this user";
                return Resp.sendError(res, log, err);
            } else {
                GenerateEmailActivateKey(aaid , user, emailAddr , function(md5key) {

                    console.log("AddNewEmailaddress md5 "+ md5key);
                    var table = "email_addresses";
                    var row = {
                        "aaid" : aaid,
                        "user_id" : user,
                        "email" : emailAddr,
                        "key" : md5key ,
                        "active" : 'N',
                        "time_stamp" : '' // current time stamp
                    };
                    queryUtils.insertTable(db,table,row,function(err,result){
                        console.log(result);
                    });
                    // send confirmation email
                    var msg = 'Your request has been accepted. A confirmation email to ' + emailAddr + ' has been sent.';
                    Resp.sendResponse(res, log, msg, msg, '');

                });
            }

            });
    //});
}

function getMultipleEmail(aaid, user_id, db, res,cb) {

    db.execute("                      \
            select email              \
              from email_addresses e  \
             where e.user_id  = :1    \
               and e.aaid = :2        \
               and e.active = 'Y'     \
             order by email           \
        ",
        [ user_id,aaid ], function(err, email) {
            if (err) {
                return Resp.sendError(res, log, err);
            } else {
                cb(err,email);
            }
    });
 }

function getEmailAddrOfUser(aaid, user_id, db, res,cb) {
    var emailAddr = [];

    db.execute("                    \
            select mail             \
              from esn_user u       \
             where u.user_id  = :1  \
               and u.aaid = :2      \
        ",
        [ user_id,aaid ], function(err, esnUser) {
            if (err) {
                return Resp.sendError(res, log, err);
            } else {
                for (var i = 0; i < esnUser.length; i++) {
                    emailAddr[i] = esnUser[0].mail;
                }
            }
            var emailList = emailAddr.concat();

            getMultipleEmail(aaid,user_id,db,res,function(err, email) {
                for (var i = 0; i < email.length; i++) {
                    emailList.push(email[i]["email"]);
                }

                cb(err,emailAddr,emailList);
            });

        });
}

function getNotificationSetup(req,res,db,cb) {

    //var aaid = req.aaid;
    //var aaid = 'b2b';
    var aaid = 'adhoc';
   // var user = req.user_id;
    //var user = 'sea_pur1@hotmail.com';
    var user = 'deepu.krishnamurthy@hp.com';
    //PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {
        /*if (err) {
              return Resp.sendError(res, log, err);
        }*/
        console.log("getNotificationSetup" + 'aaid' +aaid + 'user' + user);
        var FileSys = require('fs');

        getEmailAddrOfUser(aaid , user, db, res,function(err, emailAddr,emailList) {
            if (err) {
                return Resp.sendError(res, log, err);
            } else {

            var nSetup = {
                "enabled"          : "N",
                "purch_order_pat"  : "*",
                "ship_to_attn_pat" : "*",
                "on_ack"           : "N",
                "on_sdd_chg"       : "Y",
                "on_order_chg"     : "N",
                "on_status_chg"    : "Y",
                "on_status_admin"  : "N",
                "on_status_prod"   : "N",
                "on_status_cons"   : "N",
                "on_status_ship"   : "N",
                "on_status_delv"   : "N",
                "on_status_inv"    : "N",
                "on_status_canc"   : "N",
                "send_daily"       : "N",
                "timing"           : "immediate",
                "transport_method" : "email",
                "transport_format" : "weblink",
                "msgformat"        : "text",
                "host"             : "",
                "transport_user"   : "",
                "transport_passwd" : "",
                "path"             : "",
                "header_line"      : "N",
                "last_update"      : "1990-01-01 11:11:11.00000",
                "e_mail_addr"      : "",
                "e_mail_list"      : "",
                "internal"         : "",
                "RunningOnInternalWebServer" : "",
                "SaveSetupButton"  : 0,
                "internalVisible"  : 0,
            }
            nSetup['e_mail_addr'] = emailAddr;
            nSetup['e_mail_list'] = emailList;

            var saveInternal = osconfig.Internal['SAVE_INTERNAL'];
            var SaveSetupButton = 0;
            console.log("save internal        " + saveInternal);
            /*
             get the value from proc IsInternal from osCode.tcl
              */
            var internal = 1;
            nSetup['internal'] = internal;
            nSetup['RunningOnInternalWebServer'] = 1;

            if (internal && nSetup['RunningOnInternalWebServer']) {
                nSetup['internalVisible'] = 1;
            }

            internalSave = [];
            var internalAllowedSavePath = internalAllowedSaveDirPath + 'InternalAllowedSave.cfg';
            console.log('Internal allowed path' +    internalAllowedSavePath);
            if (FileSys.existsSync(internalAllowedSavePath)) {
                console.log('file exists');
                var fileData = FileSys.readFileSync(internalAllowedSavePath).toString().trim().split("\n");

                 for(eachRowIndex in fileData) {
                    if(!(eachRowIndex.toString().match(/[a-z]+/))) {
                        if (!(fileData[eachRowIndex].toString().match( /^#/)) || !(fileData[eachRowIndex].toString().match(/\s*$/g))){
                            var data = fileData[eachRowIndex].toString().trim().replace(/\s+/g, " ").split(" ");
                            console.log("data =="+data);
                            var dataList = data.toString().split(",");
                            internalSave.push({
                                      webUserId    : dataList[0],
                                      AAID         : dataList[1],
                                      portalUserId : dataList[2]
                            });
                        }
                    }
                }
            }

            db.execute("select enabled, purch_order_pat, ship_to_attn_pat, \
                           on_sdd_chg, on_order_chg,on_status_chg, on_ack,\
                           on_status_admin, on_status_prod, \
                            CASE                               \
                                WHEN on_status_cons is null  THEN 'N' \
                                ELSE  on_status_cons \
                            END  as on_status_cons ,\
                           on_status_ship, on_status_delv,on_status_inv,\
                           on_status_canc, header_line, message_format,\
                           send_daily, timimg, transport_method, transport_format,\
                           host, transport_user, transport_passwd, path, e_mail_addr,\
                           last_update \
                      from esn_profile \
                     where user_id  = :1    \
                       and aaid = :2        \
                ",
                [ user,aaid ], function(err, Setup) {
                    if (err) {
                        return Resp.sendError(res, log, err);
                    } else {
                        if (Setup != ''){
                            console.log("getNotificationSetup from db " + 'purch_order_pat' + Setup[0].purch_order_pat + 'message_format ' + Setup[0].message_format);
                            nSetup['enabled'] = Setup[0].enabled;
                            nSetup['purch_order_pat'] = Setup[0].purch_order_pat;
                            nSetup['ship_to_attn_pat'] =  Setup[0].ship_to_attn_pat;
                            nSetup['on_ack'] =          Setup[0].on_ack;
                            nSetup['on_sdd_chg'] =      Setup[0].on_sdd_chg;
                            nSetup['on_order_chg'] =   Setup[0].on_order_chg;
                            nSetup['on_status_chg'] =   Setup[0].on_status_chg;
                            nSetup['on_status_admin'] = Setup[0].on_status_admin;
                            nSetup['on_status_prod'] =  Setup[0].on_status_prod;
                            nSetup['on_status_cons'] =  Setup[0].on_status_cons;
                            nSetup['on_status_ship'] =  Setup[0].on_status_ship;
                            nSetup['on_status_delv'] =  Setup[0].on_status_delv;
                            nSetup['on_status_inv']   = Setup[0].on_status_inv;
                            nSetup['on_status_canc']  = Setup[0].on_status_canc;
                            nSetup['send_daily']  =     Setup[0].send_daily;
                            nSetup['timing']       =    Setup[0].timimg;
                            nSetup['transport_method'] = Setup[0].transport_method;
                            nSetup['transport_format'] = Setup[0].transport_format;
                            nSetup['msgformat'] = Setup[0].message_format;
                            nSetup['host'] =             Setup[0].host;
                            nSetup['transport_user']  = Setup[0].transport_user;
                            nSetup['transport_passwd'] = Setup[0].transport_passwd;
                            nSetup['path']     =        Setup[0].path;
                            nSetup['e_mail_addr'] =     Setup[0].e_mail_addr;
                            nSetup['header_line'] =      Setup[0].header_line;
                            nSetup['last_update'] =     Setup[0].last_update;
                            nSetup['internal_Save'] = internalSave;

                            if (internalSave != '') {
                                for (var i=0; i<=internalSave.length-1; i++) {
                                    console.log("webuserid" + internalSave[i].webUserId);
                                    console.log("user" + user);
                                     if (internalSave[i].webUserId == user) {
                                        if (internalSave[i].AAID == "*" || internalSave[i].AAID == aaid) {
                                            if (internalSave[i].portalUserId == "*" || internalSave[i].portalUserId == user) {
                                                 saveInternal = 1;
                                             }
                                        }
                                    }
                                }
                            }

                            if (nSetup['RunningOnInternalWebServer']) {
                                if ( saveInternal ) {
                                    SaveSetupButton = 1;
                                } else {
                                    SaveSetupButton = 0;
                                }
                            }
                            nSetup['SaveSetupButton'] = SaveSetupButton;
                            cb(err,nSetup);
                        } else {
                            nSetup['internal_Save'] = internalSave;
                            nSetup['SaveSetupButton'] = SaveSetupButton;
                            cb(err,nSetup);
                        }
                    }
            });
           }
        });
    //});
}



module.exports.init = function(app) {
    //------------------------------------------------------------------------
    //  Display notification
    //------------------------------------------------------------------------
    app.get('/ossui/v1/ex/externalNotification', app.role(AuthGroupSandyUser), function(req, res) {
         DbPool.OSSDB(function(db) {
            getNotificationSetup( req, res, db, function(err, nSetup) {
                return res.json({
                    status: 'S',
                    data: nSetup
                });
            });
        });
    });

    //------------------------------------------------------------------------
    //  save notification
    //------------------------------------------------------------------------
    app.post('/ossui/v1/ex/saveNotification', app.role(AuthGroupSandyUser), function(req, res) {
        //PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {
        /*if (err) {
              return Resp.sendError(res, log, err);
        }*/
        //var aaid = req.aaid;
        //var aaid = 'b2b';
        var aaid = 'adhoc';
       // var user = req.user_id;
        //var user = 'sea_pur1@hotmail.com';
        var user = 'neha.jaiswal@hp.com';

        //var result = JSON.parse(req.query.json);
        //var noRows = result.length;

        saveNotification (req ,res);
        var msg = 'Settings have been saved !';
        Resp.sendResponse(res, log, msg, msg, '');
        //});
    });

    //------------------------------------------------------------------------
    //   Add new email address
    //------------------------------------------------------------------------
    app.get('/ossui/v1/ex/addNewEmail', app.role(AuthGroupSandyUser), function(req, res) {
        var emailAddr = req.query.emailaddr;
        //var emailAddr = "deepu.krishnamurthy@hp.com";

        try {
            check(emailAddr, 'The email address ' + emailAddr + ' is not valid.').isEmail();
        } catch (e) {
            console.log(e.message);
            return Resp.sendError(res, log, e.message);
        }

        DbPool.OSSDB(function(db) {
            AddNewEmailaddress(req ,res, emailAddr, db);
        });

    });

    //------------------------------------------------------------------------
    //   Delete email address
    //------------------------------------------------------------------------
    app.get('/ossui/v1/ex/deleteEmail', app.role(AuthGroupSandyUser), function(req, res) {
        var delConfirmed = 0 ;
        var emailAddr = req.query.emailaddr;
        delConfirmed = req.query.confdel;
        //var emailAddr = "cabuatemulex_pur@yahoo.com";

       /* if { [info exists cgivar(confdel)] } {
            delConfirmed  $cgivar(confdel)
        }*/
        DbPool.OSSDB(function(db) {
            DelEmailAddress (req, res, emailAddr, delConfirmed, db);
        });
    });

    //------------------------------------------------------------------------
    //   Disable notification
    //------------------------------------------------------------------------
    app.post('/ossui/v1/ex/disableNotification', app.role(AuthGroupSandyUser), function(req, res) {
        //PortalSec.CheckUser(req, db, b, function(err, userSettings, userSettingsTS, tsPossible,withPrice) {
        /*if (err) {
              return Resp.sendError(res, log, err);
        }*/
        //var aaid = req.aaid;
        //var aaid = 'b2b';
        var aaid = 'adhoc';
       // var user = req.user_id;
        //var user = 'sea_pur1@hotmail.com';
        var user = 'neha.jaiswal@hp.com';

        //var result = JSON.parse(req.query.json);
        //var noRows = result.length;
        console.log("Disable");
        saveNotification (req ,res);
        var msg = 'Notification has been disabled!';
        Resp.sendResponse(res, log, msg, msg, '');
        //});
    });
}


