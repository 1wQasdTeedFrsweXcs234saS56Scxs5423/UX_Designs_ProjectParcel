var bunyan = require('bunyan');
var config       = require('../config/config.js');

module.exports.Log = function() {
    var log = new bunyan({
    name: 'ItemDetailWebService',
    streams: [
        {
            level: 'info',
            path: config.constants['LOG_FILE']
        },
        {
            level: 'error',
            path: config.constants['LOG_FILE']
        }
    ]
    });
    return log;
}
