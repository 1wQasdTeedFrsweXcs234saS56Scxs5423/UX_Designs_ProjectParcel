/*----------------------------------------------------------------------------
|
|   hpUserAuthentication
|
|
|   A module which exposes multiple function to authenticate HP users
|
|     * using the users current NT/WIN password via LDAP bind (ActiveDir)
|
|     * checking/validating an existing Siteminder session SM_SESSION  
|
|
|
|   written by Jochen Loewer
|   March 2012
|
\---------------------------------------------------------------------------*/

var request    = require('request');
var ldap       = require('ldapjs');
var AuthConfig = require("/etc/opt/oss/backend/UIauth.cfg");

exports.ValidateExternalSiteminderSession = function (smsession, callback) {

    var checkExternalAuthenticateURL = AuthCheckExtURL + '?sm='+smsession;
    request({
        url: checkExternalAuthenticateURL,
        headers: { cookie: 'SMSESSION=' + smsession },
        timeout: 4000,
        followRedirect: false,
        rejectUnauthorized: false,
        jar: false
    }, function (err, res) {
    if (err) return callback(err, null);

    if (res && res.statusCode == 200) {
      var pat = /^AUTHENTICATED: (.*)/;
      var match = pat.exec(res.body);

      if (match != null ) {
          var userId = match[1];
          //console.log('userId = --'+userId+'--');
          callback(null, userId);
      }
    } else {
      callback(null, null);
    }
  });
}

/*----------------------------------------------------------------------------
|   ValidateSiteminderSession 
|
\---------------------------------------------------------------------------*/
exports.ValidateSiteminderSession = function( smsession, callback ) 
{
    var checkAuthenticateURL = AuthCheckIntURL + '?sm='+smsession;

    if (AuthConfig.SMValidationURL) {
        checkAuthenticateURL = AuthConfig.SMValidationURL + '?sm='+smsession
    }

    request( { url: checkAuthenticateURL, 
               headers: { Cookie: 'SMSESSION='+smsession },
               timeout: 4000,
               followRedirect: false,
               rejectUnauthorized: false,
               jar: false
             } ,

        function (err, res) {

            if (err) return callback(err, null);

            if (res && res.statusCode == 200) {
                var pat = /^AUTHENTICATED: (.*)/;
                var match = pat.exec(res.body);
      
                if (match != null ) {
                    var userId = match[1];
                    //console.log('userId = --'+userId+'--');
                    callback(null, userId);
                }
            } else {
                //console.log('no valid session, statusCode='+res.statusCode);
                //console.log(err);
                //console.log(res);

                callback(null, null);
            }  
        }
    );
     
}


/*----------------------------------------------------------------------------
|   AuthenticateHPUser
|
\---------------------------------------------------------------------------*/
exports.AuthenticateHPUser = function ( userid, password, callback ) 
{
    var lookupHandle = ldap.createClient( { url: 'ldap://ldap.hp.com'  } );
    var pwValHandle  = ldap.createClient( { url: 'ldaps://ldap.hp.com',
                                            tlsOptions: { rejectUnauthorized: false } } );

    var dn = null;
    
    lookupHandle.search('ou=People,o=hp.com', { 

        filter: '(mail='+userid+')',
        attributes: [ 'dn', 'cn', 'givenName' ],
        scope: 'sub'
          
    }, function(err, resp) {
      
          resp.on('searchEntry', function(entry) {
              console.log(' --> found: '  + entry.dn);
              dn =  entry.dn;
          });
       
          resp.on('searchReference', function(referral) {
              //console.log('referral: ' + referral.uris.join());
          });
                         
          resp.on('error', function(err) {
              //console.error('error: ' + err.message);
              callback(err, null);
          });
            
          resp.on('end', function(result) {
              //console.log('status: ' + result.status);
              //console.log('dn = ' + dn + ' password="' + password+ '"');
              
              if (dn == null) {
                  callback('notFoundError: user not found', null );
              } else {                                              

                  pwValHandle.bind(dn, password, function(berr, bResult) {
                      //console.log('pwValHandle.bind berr=');
                      //console.log(berr);
                      //console.log(util.inspect(berr,true,7,false));
                      //console.log(util.inspect(bResult,true,3,false));
                      if (berr == null) {
                          console.log('user authenticated  dn='+dn);
                          pwValHandle.unbind( function(r) {
                          });
                          callback(null, dn);
 
                      } else {
                          console.log('user credential invalid for dn='+dn);
                          //console.log(berr.message);
                          //console.log(berr.code);
                          //console.log(berr.name);
                          //console.log(berr.dn);
                          pwValHandle.unbind( function(r) {
                          });
                          callback(berr, dn);                   
                      }
                  });
              }                  
              //lookupHandle.unbind( function() {                   
              //    console.log('UNBOUND lookupHandle');
              //});     
          });              
    });
}


function unique(a) {
  var arr = [];
  for (var i=0; i<a.length; i++) {
    if ( arr.indexOf(a[i]) == -1) {
        arr.push(a[i]);
    }
  }
}


function getAllChildren (lookupHandle, grp, callback) 
{
    //console.log('getAllChildren ' + grp + ' ...');
    
    var members = [];
    lookupHandle.search('ou=Groups,o=hp.com', 
    {
        filter: '(&(cn='+grp+'))',
        attributes: [ 'cn', 'member' ] ,
        scope: 'sub'

    }, function(err, resp) {
        if (err!==null) {
               console.log("search err:" + err);
        }
        resp.on('searchEntry', function(entry) {
            // console.log( entry.object);
            if (entry.object.member) {
              if (typeof(entry.object.member) == 'string') {                            
                  if (entry.object.member.match(/^cn=.*ou=Groups,o=hp.com/)) {
                      var childgrp = entry.object.member.replace(/^cn=/, '').replace(/,ou=Groups,o=hp.com$/, '');
                      members.push(childgrp);
                  } 
              } else {
                  //console.log( entry.object.member);
                  entry.object.member.forEach( function (member, i) {
                    if (member.match(/^cn=.*ou=Groups,o=hp.com/)) {
                        var childgrp = member.replace(/^cn=/, '').replace(/,ou=Groups,o=hp.com$/, '');
                        members.push(childgrp);
                    } 
                  })
              }
            }
        });

        resp.on('error', function(err) {
                // console.log('error: ' + err);
                callback(err, null);
        });

        resp.on('end', function(result) {
            //console.log(members);
            members.push(grp)
            unique(members);
            
            callback(null, members);
        });

    });    
}

 
function resolveNestedGroups (lookupHandle, members, allMembers, callback)
{
    if (members.length == 0) {
        unique(allMembers);
        return callback(null, allMembers );
    }
    var grp = members.shift();
   
    getAllChildren(lookupHandle, grp, function(err, children) {
        if (err) return callback(err, null);
        //console.log(children);
        allMembers = allMembers.concat(children);
        //console.log(allMembers);
        return resolveNestedGroups(lookupHandle, members, allMembers, callback);
    });
}



/*----------------------------------------------------------------------------
|   GetGroupMembership
|
\---------------------------------------------------------------------------*/
exports.GetGroupMembership = function ( userid, callback ) 
{
    var lookupHandle = ldap.createClient( { url: 'ldap://ldap.hp.com' } );
    var members = [];
    
        // (|(cn=Q2C*)(cn=LDAP*))
	lookupHandle.search('ou=Groups,o=hp.com', {
                filter: '(&(member=uid='+userid+',ou=People,o=hp.com)(|(cn=Q2C*)(cn=JOLO*)))',
                attributes: [ 'cn' ] ,
                scope: 'sub'

        }, function(err, resp) {
            if (err!==null) {
                   console.log("search err:" + err);
            }
            resp.on('searchEntry', function(entry) {
                members.push(entry.object.cn);
            });

            resp.on('error', function(err) {
                    // console.log('error: ' + err);
                    callback(err, null);
            });

            resp.on('end', function(result) {
                    resolveNestedGroups(lookupHandle, members, [], callback);
            });
        });
}

