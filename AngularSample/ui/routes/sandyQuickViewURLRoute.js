/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/in/SandyQuickURL
|
|
|   This webservice will return the Sandy Qucik URL link
|   written by Sravan
|   Sept 2013
|
---------------------------------------------------------------------------*/
module.exports.init = function(app) {
    /*----------------------------------------------------------------------------
    |   Internal Sandy Quick URL access
    \---------------------------------------------------------------------------*/
    app.get('/ossui/v1/in/SandyQuickURL', function(req, res) {
        var sandyURL = SandyQuickViewURL;
        console.log(" Sandy Quick Access URL ="+sandyURL)
        res.json( {
                  'status'  : 'S',
                  'message' : '',
                  'data'    : sandyURL,
                } );
    });
}
