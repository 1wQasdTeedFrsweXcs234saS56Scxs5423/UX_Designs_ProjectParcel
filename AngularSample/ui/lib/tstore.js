/*----------------------------------------------------------------------------
|
|   TSTORE client implementation
|
|
|   written by Jochen Loewer
|   June 2013    
|
\--------------------------------------------------------------------------*/


var net = require('net');
var   t = require('./tcllist');


/*----------------------------------------------------------------------------
|  TSExecQuery  -   connect to a random query server (out of list of
|                   query servers), waits until the marker is received 
|                   (ie. query server is ready to exec the query)
|                   or it gets an timeout in doing so --> retry on calling
|                   level
|
\--------------------------------------------------------------------------*/
function TSExecQuery (connInfo, partition, sql, cb) 
{
    var recv = new Buffer(0);

    var state = "awaitingMarker"

    if (connInfo.ports) {
      var port = connInfo.ports[ Math.floor(Math.random()* connInfo.ports.length) ]
    } else {
      var port = connInfo.port;
    }        
    
    console.log('TSTORE trying port '+port)

    var client = net.connect(
       { host: connInfo.host,
         port: port
       },

       function() { //'connect' listener
         //console.log('client connected')
       }
    );
    client.setTimeout(250);
    client.setNoDelay();

    client.on('data', function(data) {

        recv = Buffer.concat( [recv, data] );
        //console.log( 'on data:' )  
        //console.log( recv.length )  
        if (state == "awaitingMarker") {
          if (recv.length >= 4) {
            var marker = recv.readUInt32BE(0)
            //console.log( marker )
            if (marker == 7654321) {    
              console.log('TSTORE server on port '+client.remotePort+' accepting request')

              var sqlBuffer = new Buffer(sql);

              var request = new Buffer(4+4+4+sqlBuffer.length)
              
              request.writeInt32BE( partition+0, 0)
              request.writeInt32BE(        -1, 4)
              request.writeInt32BE(sql.length, 8)
              sqlBuffer.copy(request, 12)
              
              client.write(request)
              
              state = "awaitingResponse"      
              recv = new Buffer(0)
              client.setTimeout(1500);
            }        
          }
        } else {
        }  
    });

    client.on('error', function(err) {
        console.log('tstore error')
        console.log(err)
        client.end()
    });
      
    client.on('close', function(err) {
        console.log('tstore close')
        console.log(err)
        //client.end()
    });

    client.on('timeout', function(data) {
        console.log('tstore timeout --> end() ')
        console.log(state)        
        if (state == "awaitingMarker") {
         console.log('tstore timeout during awaitingMarker --> destroy/end() ')
         client.destroy()
         cb('QueryServerBusy', null);
        }
    });

    client.on('end', function() {
        console.log('client disconnected')
        //console.log(recv.length );
        //console.log('raw begin:');
        //console.log(recv.toString() )
        //console.log(':raw end');
       
        var errToken = recv.readUInt32BE(0)
        //console.log('errToken = '+errToken)
        if (errToken > 0) {
          console.log('TSTORE error:');
          console.log(recv.slice(4,errToken+4).toString() )
          console.log(recv.slice(errToken+4).toString() )
          cb( recv.slice(4,errToken+4).toString() );
        } else {
          var resultStr = recv.slice(4).toString()
          if (partition < 1000) {
              return cb(null,resultStr);
          }
          var r = t.Tcl2Array(resultStr);   
          var nrOfRows = r[0];
          //console.log(r);   
           
          var rs = [];
          for (var i=0; i<nrOfRows; i++) {
             rs.push( t.Tcl2Array( r[2+i] ) );
          } 
          //console.log('--------------');    
          //console.log(nrOfRows);
          //console.log('--------------');
          //console.log(rs);
          
          cb(null, rs);
        } 
        
    });
}


/*----------------------------------------------------------------------------
|  TSQuery  -   tries to execute a TS query -- parameter tries defines
|               how many times re-try will happen
|
\--------------------------------------------------------------------------*/
function TSQuery (connInfo, tries,  partition, sql, cb) 
{
    TSExecQuery(connInfo,  partition, sql, function(err, rs) {
    
        if (err == 'QueryServerBusy' && tries > 0) {
           return TSQuery (connInfo, tries-1,  partition, sql, cb);
        }
        cb(err, rs);    
    });
}


module.exports.TStore = function( connectionInfo )
{
  this.connInfo = connectionInfo
  
  this.all = function (partition, sql, cb) {
  
      TSQuery(this.connInfo, 20, partition, sql, cb) ;
  }
}

