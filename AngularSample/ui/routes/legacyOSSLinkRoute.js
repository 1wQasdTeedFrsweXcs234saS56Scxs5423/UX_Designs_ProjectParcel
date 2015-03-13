/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/in/legacyOSSLink
|
|
|   This webservice will return the legacy OSS link.
|
|   written by Deepu Krishnamurthy
|   August 2013
|
---------------------------------------------------------------------------*/
var DbPool    = require('../lib/DbPool');
var Resp      = require('../lib/RespUtils.js');
var bunyan    = require('bunyan');

var log = new bunyan({
    name: 'LegacyLinkWebService',
});

/*----------------------------------------------------------------------------
|   d2h    - returns the hexadecimal value for the given decimal.
|
|  @param d        decimal value
|
|  @return      hexadecimal value
|
\---------------------------------------------------------------------------*/
function d2h(d) {
    return d.toString(16);
}


/*----------------------------------------------------------------------------
|  stringToHex    - returns the decimal value for the given string.
|
|  @param tmp       string value
|
|  @return str      decimal value
|
\---------------------------------------------------------------------------*/
function stringToHex (tmp) {
    var str = '';
    var i = 0;
    var tmp_len = tmp.length;
    var c;

    for (; i < tmp_len; i += 1) {
        c = tmp.charCodeAt(i);
        str += d2h(c) ;
    }
    return str;
}

module.exports.init = function(app) {
    /*----------------------------------------------------------------------------
    |   Internal legacyOSSLink Webservice.
    \---------------------------------------------------------------------------*/
    app.get('/ossui/v1/in/legacyOSSLink', app.role(AuthGroupSandyUser), function(req, res) {
     var sandyURL = LegacyIntURL;
     log.info('url is ' + LegacyIntURL);
     res.json( {
                  'status'  : 'S',
                  'message' : '',
                  'data'    : sandyURL,
                } );
    });

    /*----------------------------------------------------------------------------
    |   External legacyOSSLink Webservice.
    \---------------------------------------------------------------------------*/
    app.get('/ossui/v1/ex/legacyOSSLink', app.role(AuthGroupExternal), function(req, res) {
     var osViewerURL = LegacyExtURL;

        DbPool.OSSDB(function(db) {
            var aaid    = 'b2b'     // default:  enterprise customer portal
            var user_id = 'unknown'
            var session_value = '';

            if (req.aaid)    aaid = req.aaid;
            if (req.user_id) user_id = req.user_id;
            if (req.osuiImpersonate) {
                log.info('overriding ' + user_id + ' with osuiImpersonate='+req.osuiImpersonate);
                user_id = req.osuiImpersonate
            }
            if (req.portalImpersonate) {
                log.info('overriding ' + user_id + ' with portalImpersonate='+req.portalImpersonate);
                user_id = req.portalImpersonate
            }
             db.execute("                                       \
             select user_id, firstname, lastname, userpassword, \
                    geo, accountid, roleids, roleids2, language \
               from esn_user                                    \
              where aaid    = :1                                \
                and user_id = :2                                \
            ",
            [ aaid, user_id], function(err, esnUser) {
            if (err) {
                return Resp.sendError(res, log, err);
            } else {
                var x= '01'
                var session_val = stringToHex(aaid);
                var user = stringToHex(user_id);
                var pwd = stringToHex(esnUser[0].userpassword);
                session_value = session_val+x+user+x+pwd;

                var osViewerlink = osViewerURL+'?session='+session_value;
                log.info('url is ' + osViewerlink);
                res.json( {
                      'status'  : 'S',
                      'message' : '',
                      'data'    : osViewerlink,
                    } );
            }
            });
        });
     });
}
