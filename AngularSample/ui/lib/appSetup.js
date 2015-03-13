/*----------------------------------------------------------------------------
|
|   expressjs app setup (app.use ( ...) )
|
|
|
|   written by Jochen Loewer
|   April 2013
|
\---------------------------------------------------------------------------*/


var  AuthConfig = require("/etc/opt/oss/backend/UIauth.cfg");

var  authorizationSetup = require("./authorizationSetup");
var  crypto = require('crypto');
var  lruCache = require('lru-cache');
var  UserAuth = require('./hpUserAuthentication');

var AuthCache = lruCache( { max: 1500, maxAge: 1000 * 60 * 15 } );
var SMCache   = lruCache( { max: 1500, maxAge: 1000 * 60 * 15 } );



var unauthorized = function (res) {

    res.set({ 'Content-Type'    : 'text/plain'   ,
              'WWW-Authenticate' : 'Basic realm="OSS" '
    });
    res.send(401, 'not authorized');
}


var checkValidUser=function(res) {

  return res.json({
    Status:'E',
    Data:'Unauthorized',
    code:'401'
  });
}
var fs = require('fs');


function sha1(str)
{
    var shasum = crypto.createHash('sha1');
    shasum.update(str);
    return shasum.digest('hex');
}


/*----------------------------------------------------------------------------|
|   authCheck
|
\---------------------------------------------------------------------------*/
var authCheck = function (req, res, next) {

    var authorization = req.headers.authorization;

    if (req.headers.cookie) {
      var matchArray = /osuiImpersonate=([^;]*)/.exec(req.headers.cookie) ;
      if (matchArray && matchArray[1] ) {
        req.osuiImpersonate = decodeURIComponent(matchArray[1]);
        //console.log('req.osuiImpersonate = "'+req.osuiImpersonate+"'");
      }
      var matchArray = /osuiAAID=([^;]*)/.exec(req.headers.cookie) ;
      if (matchArray && matchArray[1] ) {
        req.osuiAAID = decodeURIComponent(matchArray[1]);
        //console.log('req.osuiAAID = "'+req.osuiImpersonate+"'");
      }
      var matchArray = /portalImpersonate=([^;]*)/.exec(req.headers.cookie) ;
      if (matchArray && matchArray[1] ) {
        req.portalImpersonate = decodeURIComponent(matchArray[1]);
        console.log('req.portalImpersonate = "'+req.portalImpersonate+"'");
      }
    }
    if (req.user) return next();

    var now = (new Date()).toISOString();

    var log = now +' '+req.method + ' ' + req.url;

    if (req.headers['x-appkey'] ) {

        if (AuthConfig.appkeys[ req.headers['x-appkey'] ]) {

            var appInfo = AuthConfig.appkeys[ req.headers['x-appkey'] ]

            req.user_id     = appInfo.user
            req.usersGroups = appInfo.groups
            log += ' x-appkey login : user_id='+req.user_id+' groups='+req.usersGroups
            console.log(log)
            return next();
        }
    }

    //-- check and validate incoming Siteminder Session (SMSESSION)
    var smsession = '';
    if (req.headers.cookie) {
      var matchArray = /SMSESSION=([^;]*)/.exec(req.headers.cookie) ;
      if (matchArray && matchArray[1] && matchArray[1] != 'LOGGEDOFF' ) {
        smsession = matchArray[1];
      }
    }
    // console.log('SMSession value: [%s]',smsession);

    if (smsession != '' ) {
      var cached = SMCache.get('SM:'+smsession);
      if (cached != null) {
        //console.log('Siteminder session, out of cache ...');
        //console.log(cached);
        req.user_id     = cached.user
        req.usersGroups = cached.groups
        console.log('   siteminder from cache: user_id='+req.user_id)
        log += ' user_id='+req.user_id
        console.log(log)
        return next();
      }

      UserAuth.ValidateExternalSiteminderSession(smsession, function(err, user_id) {
        if (err || !user_id) {
          console.log("External validation failed");

          UserAuth.ValidateSiteminderSession(smsession, function(err, user_id) {
            if (err) {
              log += ' ValidateSiteminderSession err='+err
              console.log(log)
              return unauthorized(res);
            }
            if (!user_id) {
              log += ' ValidateSiteminderSession NOT AUTHORIZED (no session)'
              console.log(log)
              return unauthorized(res);
            }
            console.log('   siteminder valid: user '+user_id);
            req.user_id = user_id;
            UserAuth.GetGroupMembership(user_id, function( err, usersGroups ) {
              req.usersGroups = usersGroups;
              SMCache.set('SM:'+smsession, { user: req.user_id, groups: req.usersGroups } );
              log += ' SM user_id='+req.user_id +' usersGroups='+usersGroups
              console.log(log)
              process.nextTick( next )
            })
          });
        } else {
          if (req.portalImpersonate) {
            req.user_id = req.portalImpersonate;
          } else {
            req.user_id = user_id;
          }
          req.usersGroups = [ PseudoGroupForExternalAccess ];

          SMCache.set('extSM:'+smsession, { user: req.user_id, groups: req.usersGroups } );
          log += ' SM user_id='+req.user_id +' usersGroups='+req.usersGroups
          console.log(log)

          process.nextTick(next);
        }
      });

      return;
    }



    //if (!authorization) return unauthorized(res);
    if (!authorization) return next();

    var parts = authorization.split(' ')
      , scheme = parts[0]
      , credentials = new Buffer(parts[1], 'base64').toString().split(':')
      , user = credentials[0]
      , pass = credentials[1];



    if (scheme != 'Basic' || user == '' ) {
        log += ' no basic auth header / no user'
        console.log(log)
        return unauthorized(res);
    }

    var passEncrypted = sha1(pass);

    var cached = AuthCache.get(user+'--'+passEncrypted);
    //console.log('cached:');
    //console.log(cached);

    if (cached) {
        req.user_id = user;
        req.usersGroups = cached;
        AuthCache.set(user+'--'+passEncrypted, cached);
        log += '  basicAuth: user='+user
        console.log(log)
        return next();
    }

    UserAuth.AuthenticateHPUser(user, pass, function(err, dn) {
         if (err == null && dn != null) {
            console.log('== user '+user+' dn='+dn+' is OK');
            req.user_id = user;
            UserAuth.GetGroupMembership(user, function( err, usersGroups ) {
                 //console.log('users groups are: ' +  usersGroups);
                 req.usersGroups = usersGroups;
                 AuthCache.set(user+'--'+passEncrypted, usersGroups);
                 log += '  basicAuth(fresh): user='+user + ' usersGroups='+usersGroups
                 console.log(log)
                 process.nextTick( next );
            })
            return;
         } else {
            //console.log('ldap/ed validation FAILED for user '+user+' dn='+dn+' err='+err);
            AuthCache.set(user+'--'+passEncrypted, null);
            log += '  !! ldap/ed validation FAILED for user '+user+' dn='+dn+' err='+err
            console.log(log)
            return unauthorized(res)
        }
    });
}



module.exports = function(app, express, routeSetupCB )
{

    app.configure( function() {

        app.use( express.errorHandler( {
                    showStack: true,
                    dumpExceptions: true
        }));
        app.use( express.methodOverride() );
        app.use( express.compress()       );    // compress HTTP response (gzip/deflate)
        app.use( express.bodyParser()     );
        app.use( authCheck                );
        app.use( app.router               );

        app.set('views', __dirname + '/../views/demo');
        app.set('view engine', 'jade');
        app.set('view options', {layout : false} );


        app.use(function (req, res, next) {
            var TwoDays = 2 * 24 * 3600;
            res.setHeader('Cache-Control', 'public, max-age='+TwoDays)
            next()
        });
        app.use( express.static(__dirname + '/../views') )
    });

    /*-------------------------------------------------------------------------
    |   role check  middleware function
    |
    \------------------------------------------------------------------------*/
    app.role = function(role) {
        return function(req, res, next) {
           //console.log(' authorization check: role = ', role);
           //console.log(req.usersGroups);
           if (req.usersGroups && req.usersGroups.indexOf(role) >= 0) {
               next();
           } else {
               console.log('ROLE: user='+req.user_id+' has not group '+role)
               if (req.usersGroups) {
                  console.log('      but only '+req.usersGroups);
                  return checkValidUser(res);
               }
               return unauthorized(res);
           }
        }
    }

    //-- enable CORS (cross origin resource sharing)
    app.all('/*', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });


    //authorizationSetup.preRouteAuthorizationSetup(app);

    routeSetupCB(app);

    //authorizationSetup.postRouteAuthorizationSetup(app);

}



