/*----------------------------------------------------------------------------
|
|   route handler for   /ossui/v1/Invoice
|   This webservice will return invoice for the given invoice
|   number. The service will return the below details:
|       1.  APJ invoices
|       2.  Other invoices
|   written by Cyril Thomas and Fouzia Nishath
|   April 2013
|
\---------------------------------------------------------------------------*/

var fs     = require('fs');
var exec   = require('child_process').execFile;
var path   = require('path');
var bunyan = require('bunyan');

var log = new bunyan({
    name: 'InvoiceWebservice',
});

log.info('registering /ossui/v1/invoice ...');
module.exports.init = function(app) {
    app.get('/ossui/v1/in/invoice?(\\w+)', function(req, res) {
        log.info('Params:' + JSON.stringify(req.query));
        var child;

        child = exec('/opt/oss/pkg/frontend/scripts/OSfInvoiceFetchWrapper.tcl', [req.query['order_no'], req.query['invoice_no'], req.query['full_invoice_no'], req.query['data_source']], function(error, stdout, stderr) {
            if (error !== null) {
                log.error('exec error: ' + error);
            } else {
                log.info(
                    'stdout:' + stdout)
                var filename = stdout.trim();

                log.info('filename: ' + filename);
                log.info('stderr: ' + stderr);

                fs.readFile(filename, {
                    'encoding': 'binary'
                }, function(err, data) {
                    if (err) throw err;

                    var mime_type = 'application/pdf';
                    var filesend = true;
                    log.info("fisrt check:" + path.extname(filename))
                    if (path.extname(filename) == '.html') {
                        mime_type = 'text/html';
                        filesend = false;
                    }
                    log.info("second check:" + data.trim().length)
                    if (data.trim().length == 0) {
                        data = '<br><br>Sorry. No invoice documents found in the optical archives!<br>'
                        mime_type = 'text/html';
                        filesend = false;
                    }
                    log.info('filesend:' + filesend)
                    if (!filesend) {
                        fs.unlink(filename, function(err) {
                            if (err) throw err;
                            log.info('file deleted ' + filename);
                        });
                    }

                    var http_headers = {
                        'Content-Length': data.length,
                        'Content-Type': mime_type,
                    };

                    if (filesend) {
                        /*  sendfile automatically detects the mime type based on the file extension
                         *  and transfers the data binary (rather than a attachment which prompts for download)
                         *  you probably need to have the pdf plugin in your browser to render it within browser
                         */
                        res.sendfile(filename, function(err) {
                            fs.unlink(filename, function(err) {
                                if (err) throw err;
                                log.info('file deleted ' + filename);
                            });

                            if (err) {
                                log.info('transfer failed ' + filename);
                                throw err;
                            }
                            log.info('transfer successful ' + filename);

                        });
                    } else {
                        log.info('headers: ' + JSON.stringify(http_headers));
                        res.send(data, http_headers, 200);
                    }
                });
            }
        });

    });

    app.get('/ossui/v1/ex/invoice?(\\w+)', function(req, res) {
        log.info('Params:' + JSON.stringify(req.query));
        var child;

        child = exec('/opt/oss/pkg/frontend/scripts/OSfInvoiceFetchWrapper.tcl', [req.query['order_no'], req.query['invoice_no'], req.query['full_invoice_no'], req.query['data_source']], function(error, stdout, stderr) {
            if (error !== null) {
                log.error('exec error: ' + error);
            } else {
                log.info(
                    'stdout:' + stdout)
                var filename = stdout.trim();

                log.info('filename: ' + filename);
                log.info('stderr: ' + stderr);

                fs.readFile(filename, {
                    'encoding': 'binary'
                }, function(err, data) {
                    if (err) throw err;
                    var mime_type = 'application/pdf';
                    var filesend = true;
                    log.info("fisrt check:" + path.extname(filename))
                    if (path.extname(filename) == '.html') {
                        mime_type = 'text/html';
                        filesend = false;
                    }
                    log.info("second check:" + data.trim().length)
                    if (data.trim().length == 0) {
                        data = '<br><br>Sorry. No invoice documents found in the optical archives!<br>'
                        mime_type = 'text/html';
                        filesend = false;
                    }
                    log.info('filesend:' + filesend)
                    if (!filesend) {
                        fs.unlink(filename, function(err) {
                            if (err) throw err;
                            log.info('file deleted ' + filename);
                        });
                    }

                    var http_headers = {
                        'Content-Length': data.length,
                        'Content-Type': mime_type,
                    };

                    if (filesend) {
                        /*  sendfile automatically detects the mime type based on the file extension
                         *  and transfers the data binary (rather than a attachment which prompts for download)
                         *   you probably need to have the pdf plugin in your browser to render it within browser
                         */
                        res.sendfile(filename, function(err) {
                            fs.unlink(filename, function(err) {
                                if (err) throw err;
                                log.info('file deleted ' + filename);
                            });

                            if (err) {
                                log.info('transfer failed ' + filename);
                                throw err;
                            }
                            log.info('transfer successful ' + filename);

                        });
                    } else {
                        log.info('headers: ' + JSON.stringify(http_headers));
                        res.send(data, http_headers, 200);
                    }
                });
            }
        });

    });

}
