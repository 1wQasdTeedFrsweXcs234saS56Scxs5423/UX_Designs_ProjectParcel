/*----------------------------------------------------------------------------
|
|   Portal Security Module
|
|   Use already replicated data from the various customer/partner portals
|   (like B2B portal, GPP portal) to build up basic underlying data
|   security filter clause, which need to be applied to ALL external
|   facing data services
|
|
|
|   written by Jochen Loewer
|   July 2013
|
\---------------------------------------------------------------------------*/

var SqlUtilsDirect = require("./SqlUtils.js")
var SqlUtils       = require("./SqlUtils2.js")
var augment        = require("./augment.js")


function SimpleListToArray ( str )
{
  if (str) {
      return str.replace(/^ */,'').replace(/ *$/,'').split(/ +/)
  }
  return []
}

function NRCFLevel ( prefix )
{
   if (prefix == "N" ) return 4;
   if (prefix == "L4") return 4;
   if (prefix == "L3") return 3;
   if (prefix == "L2") return 2;
   if (prefix == "L1") return 1;
   return 2
}


/*----------------------------------------------------------------------------
|   CheckUser
|
\---------------------------------------------------------------------------*/
function CheckUser( req, db, b, cb )
{
    var aaid    = 'b2b'     // default:  enterprise customer portal
    var user_id = 'unknown'

    if (req.aaid)    aaid = req.aaid;
    if (req.user_id) user_id = req.user_id;
    if (req.osuiImpersonate) {
        console.log('overriding ' + user_id + ' with osuiImpersonate='+req.osuiImpersonate);
        user_id = req.osuiImpersonate
    }
    if (req.portalImpersonate) {
        console.log('overriding ' + user_id + ' with portalImpersonate='+req.portalImpersonate);
        user_id = req.portalImpersonate
    }

    console.log('==== CheckUser aaid='+aaid+' user_id='+user_id);

    db.execute("                                         \
                                                         \
      select user_id, firstname, lastname, userpassword, \
             geo, accountid, roleids, roleids2, language \
        from esn_user                                    \
       where aaid    = :1                                \
         and user_id = :2                                \
    ",
    [ aaid, user_id], function(err, esnUser) {

      console.log(err)
      console.log(esnUser)

      if(esnUser.length == 0) {
          return cb('user not found');
      }

      if (esnUser[0].roleids2 == null) {
        var roleIds = SimpleListToArray( esnUser[0].roleids )
      } else {

        var roleIds = SimpleListToArray( esnUser[0].roleids )
                      .concat( esnUser[0].roleids2 )
      }
      console.log(roleIds);

      console.log('b = ');
      console.log(b);


      var bRole = new SqlUtils.Bind();
      var filter = new SqlUtils.And(bRole);

      filter.addEq    (aaid,   "aaid"     )
      filter.addEqList(roleIds,"role_id"  )
      filter.addEq    (esnUser[0].accountid, "accountid")

      var onlyCBNs = []
      var onlyPAs  = []
      var CBNPAs   = []

      db.execute("                                  \
                                                    \
        select role_id, with_prices, sla_reporting, \
               cbn, purch_agree                     \
          from esn_role                             \
         where " + filter.where

      , filter.bind.binds, function(err, esnRole) {

        console.log(err)
        console.log(esnRole)

        if (esnRole) {
          for(var i=0; i < esnRole.length; i++) {
            console.log(esnRole[i])
            var cbn = esnRole[i].cbn.trim();
            var pa  = esnRole[i].purch_agree.trim();
            var withPrice = esnRole[i].with_prices;
            if (pa  == '') pa = '*'
            if (cbn == '') cbn = '*'

            if (pa == '*') {
              onlyCBNs = onlyCBNs.concat( SimpleListToArray(cbn).sort() )
            } else
            if (cbn == '*') {
              onlyPAs.push( SimpleListToArray(pa).sort() )
            } else {
              CBNPAs.push( { cbn: SimpleListToArray(cbn).sort(), pa: SimpleListToArray(pa).sort() } );
            }

          }
        }

        //-- some test code
        //CBNPAs.push( { cbn: [ '8901234455', '89012344449'] , pa: [ 'DHL12', 'DHL44']  } );
        //CBNPAs.push( { cbn: [ '1801234455', '19012344449'] , pa: [ 'DHL12', 'DHL44']  } );

        console.log(onlyCBNs);
        console.log(onlyPAs);
        console.log(CBNPAs);


        //-- some test code
        //onlyCBNs.push( '83123300'        ); // normal CBN
        //onlyCBNs.push( 'SG00-123456789'  ); // salesOrg + CRS --> sold_to
        //onlyCBNs.push( 'S-SG00-123456789'); // salesOrg + CRS --> on ship to
        //onlyCBNs.push( 'C-001234567'     ); // CRS no --> sold to
        //onlyCBNs.push( 'CM-001234567'    ); // community id
        //onlyCBNs.push( 'F-1112322344'    ); // fulfillment site id
        //onlyCBNs.push( 'E-123456789-hugo@intel.com'    ); // One Time Customer handling (ISCS)

        //onlyPAs.push( 'SHE012');
        //onlyPAs.push( 'SHE013');
        //onlyPAs.push( 'SHE014');

        var ncrfFilter   = new SqlUtils.Or(b)
        var ncrfFilterTS = new SqlUtilsDirect.OrWhereDirect()
        var TSpossible = true

        for(var i=0; i < onlyCBNs.length; i++) {
          console.log(i);
          var dash = onlyCBNs[i].split("-");
          console.log(dash);

          if ("N L4 L3 L2 L1".has(dash[0]) ) {
            //--- NCRF / AMID level id -----------------------
            console.log('N L4 L3 L2 L1: ' + dash[1]);

            ncrfFilter.orEq  (  dash[1], "ids.sold_to_l" + NRCFLevel(dash[0]) )

            if (NRCFLevel(dash[0]) == 4) {
              ncrfFilterTS.addEq(  dash[1], "sold_to_l4" )
            } else
            if (NRCFLevel(dash[0]) == 2) {
              ncrfFilterTS.addEq(  dash[1], "sold_to_l2" )
            } else {
              TSpossible = false
            }

          } else

          if ("CM".has(dash[0]) ) {
            //--- community id -----------------------
            ncrfFilter.orEq(  dash[1], "s.community_id" );
            TSpossible = false
          } else

          if ("C".has(dash[0]) ) {
            //--- on sold_to:  CRSCRS -----------------------
            ncrfFilter.orEq   ( dash[1], "ids.sold_to"   )
            ncrfFilterTS.addEq( dash[1], "sold_to_party" )
          } else

          if ( dash[0].length == 4 ) {
            //--- on sold_to:  salesOrg + CRS -----------------------
            var and = new SqlUtils.And(b)
            and.addEq( dash[0], "ids.sales_org" )
            and.addEq( dash[1], "ids.sold_to"   )
            ncrfFilter.addSQL( and.where )

            var and = new SqlUtils.AndWhereDirect()
            and.addEq( dash[0], "sales_org"     )
            and.addEq( dash[1], "sold_to_party" )
            ncrfFilterTS.addSQL( and.where )

          } else

          if ( "S".has(dash[0]) && dash[1].length == 4 ) {
            //--- on ship_to:  salesOrg + CRS -----------------------
            var and = new SqlUtils.And(b)
            and.addEq( dash[1], "s.sales_org" )
            and.addEq( dash[2], "s.ship_to"   )
            ncrfFilter.addSQL( and.where )

            var and = new SqlUtilsDirect.AndWhereDirect()
            and.addEq( dash[1], "sales_org"  )
            and.addEq( dash[2], "ship_to_id" )
            ncrfFilterTS.addSQL( and.where )

          } else {
            //--- standard CBN -----------------------
            // TODO  ids.end_customer_sold_to ??
            ncrfFilter.orEq  ( onlyCBNs[i], "ids.customer_base_no" )
            ncrfFilterTS.addEq( onlyCBNs[i], "customer_no"          )

          }
        }

        ncrfFilter.orIn  (onlyPAs, "ids.purch_agree" )
        ncrfFilterTS.orIn(onlyPAs, "purch_agree"     )

        for(var i=0; i < CBNPAs.length; i++) {

          console.log(i)
          console.log(CBNPAs[i])

          var bothAnd = new SqlUtils.And(b)
          var cbnOr   = new SqlUtils.Or(b)
          var paOr    = new SqlUtils.Or(b)

          cbnOr.orIn (CBNPAs[i].cbn, "ids.customer_base_no" )
          paOr.orIn  (CBNPAs[i].pa,  "ids.purch_agree" )

          bothAnd.addSQL( cbnOr.where )
          bothAnd.addSQL(  paOr.where )

          ncrfFilter.addSQL ( bothAnd.where )


          var bothAnd = new SqlUtilsDirect.AndWhereDirect()
          var cbnOr   = new SqlUtilsDirect.OrWhereDirect()
          var paOr    = new SqlUtilsDirect.OrWhereDirect()

          cbnOr.orIn (CBNPAs[i].cbn, "customer_no" )
          paOr.orIn  (CBNPAs[i].pa,  "purch_agree" )

          bothAnd.addSQL( cbnOr.where )
          bothAnd.addSQL(  paOr.where )

          ncrfFilterTS.addSQL ( bothAnd.where )
        }
        console.log( ncrfFilter.bind.binds )
        console.log( ncrfFilter.where )

        console.log( ncrfFilterTS.where )
        console.log( TSpossible )

        cb(null, ncrfFilter, ncrfFilterTS, TSpossible,withPrice)

      })

    })
}

module.exports.CheckUser = CheckUser

