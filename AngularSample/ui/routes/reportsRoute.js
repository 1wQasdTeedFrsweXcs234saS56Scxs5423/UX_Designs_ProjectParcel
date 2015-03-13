/*----------------------------------------------------------------------------
|
|   Route handler for below:
|
|       /ossui/v1/reports/search:    GET webservice to search users based on
|                                    aaid & userid.
|       /ossui/v1/reports/myreports: POST webservice to retrieve reports for
|                                    given aaid & userid.
|       /ossui/v1/reports/getreport: GET webservice to download report file.
|                                    Currently available for XLS & CSV
|                                    file format.
|
|   written by Cyril Thomas George & Alok Upendra Kamat
|   May 2013
|
\----------------------------------------------------------------------------*/

/* Note: This route handler should be deployed on the node where OSS reporting
         package is running. Better to make it as a part of reporting package
         rather than frontend. If the frontend & reporting package is not on
         the same node, then this route handler won't function correctly.    */

var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js')
var FileSys = require('fs');
var ExecScript = require('child_process');
var ZipLib = require('zlib');
var Bunyan = require('bunyan');

var log = new Bunyan({
    name: 'reportsWebService',
});

module.exports.init = function(app) {

    // Internal Report Webservices.
    log.info('registering /ossui/v1/in/reports/search ...');

    app.get('/ossui/v1/in/reports/search?(\\w+)', app.role(AuthGroupSandyUser), function(req, res) {

        DbPool.OSSDB(function(db) {
            var user = req.query['user'] + '%';

            if (req.query['aaid'] != undefined) {
                aaid = req.query['aaid'];

            } else {
                aaid = '%%';
            }

            log.info('user: ' + user + ' aaid: ' + aaid);

            db.execute("select user_id, aaid, accountid, creation_datetime, \
                               geo, firstname, lastname                     \
                          from esn_user                                     \
                         where user_id like :1                              \
                           and aaid like :2                                 \
                       ", [user, aaid], function(err, results) {

                if (err) return Resp.sendError(res, log, err);

                if (results == '')
                    return Resp.sendResponse(res, log, 'No reports found !!!', 'No reports found !!!', '');

                Resp.sendResponse(res, log, 'Sending back report list ...', '', results);
            });
        });
    });

    log.info('registering /ossui/v1/in/reports/myreports ...');

    app.post('/ossui/v1/in/reports/myreports', app.role(AuthGroupSandyUser), function(req, res) {

        DbPool.OSSDB(function(db) {
            db.execute("select *                    \
                          from report               \
                         where user_id = :1         \
                           and aaid = :2            \
                       ", [req.body.user, req.body.aaid], function(err, results) {

                if (err) return Resp.sendError(res, log, err);

                if (results == '')
                    return Resp.sendResponse(res, log, 'No reports found !!!', 'No reports found !!!', '');

                var reportNos = [];

                results.forEach(function(report, cb) {
                    reportNos.push(report.report_no);
                });
                
                console.log(reportNos);

                // Retrieving run details of reports
                db.execute("select *                                \
                              from report_results                   \
                             where report_no in (" + reportNos + ") \
                          order by run_no                           \
                        ", [], function(err, runDetails) {

                    if (err) return Resp.sendError(res, log, err);

                    if (runDetails == '')
                        return Resp.sendResponse(res, log, "No run details found. Sending back report results.", '', results);

                console.log(runDetails);

                    results.forEach(function(report, cb) {

                        for (var i = 0; i < runDetails.length; i++) {

                            if (report.report_no == runDetails[i].report_no) {

                                if (report.files == undefined) report.files = {};

                                if (  runDetails[i].type == "xls" 
                                   || runDetails[i].type == "csv" 
                                   || runDetails[i].type == "dhtmlie"
                                ) {
                                    populateReportFileDetails(report, runDetails[i])
                                }    
                            }
                        }
                    });
console.log(results);

                    Resp.sendResponse(res, log, 'Sending back report results.', '', results);
                });
            });
        });
    });

    log.info('registering /ossui/v1/in/reports/getreport ...');

    app.get('/ossui/v1/in/reports/getreport', app.role(AuthGroupSandyUser), function(req, res) {

        var path = req.query['path'];

console.log(path);
        ExecScript.execFile("/opt/oss/pkg/reporting/scripts/OSrGetReport.tcl", [ path ], function(err, tmpPath) {
console.log(err);
console.log('"'+tmpPath+'"');

            if (err) return Resp.sendError(res, log, err); 

            FileSys.exists(tmpPath, function(exists) {

              if (exists) {
                log.info("Report available... Processing file...");

                res.download(tmpPath, '', function(err) {
                    FileSys.unlink(tmpPath);
                    if (err) {
                        log.info('Could not retrieve requested report file (' + err + ').');
                        res.redirect('/int/index.html#/viewReports?err=2');
                    }
                });

              } else {
                log.info('Requested report file is not present on the server.');
                res.redirect('/int/index.html#/viewReports?err=1');
              }
            });
        });
        
    });

    // External Report Webservices.
    log.info('registering /ossui/v1/ex/reports/search ...');

    app.get('/ossui/v1/ex/reports/search?(\\w+)', app.role(AuthGroupExternal), function(req, res) {

        DbPool.OSSDB(function(db) {
            var user = req.query['user'] + '%';

            if (req.query['aaid'] != undefined) {
                aaid = req.query['aaid'];

            } else {
                aaid = '%%';
            }

            log.info('user: ' + user + ' aaid: ' + aaid);

            db.execute("select user_id, aaid, accountid, creation_datetime, \
                               geo, firstname, lastname                     \
                          from esn_user                                     \
                         where user_id like :1                              \
                           and aaid like :2                                 \
                       ", [user, aaid], function(err, results) {

                if (err) return Resp.sendError(res, log, err);

                if (results == '')
                    return Resp.sendResponse(res, log, 'No reports found !!!', 'No reports found !!!', '');

                Resp.sendResponse(res, log, 'Sending back report list ...', '', results);
            });
        });
    });

    log.info('registering /ossui/v1/ex/reports/myreports ...');

    app.post('/ossui/v1/ex/reports/myreports', app.role(AuthGroupExternal), function(req, res) {

        DbPool.OSSDB(function(db) {
            db.execute("select *                    \
                          from report               \
                         where user_id = :1         \
                           and aaid = :2            \
                       ", [req.body.user, req.body.aaid], function(err, results) {

                if (err) return Resp.sendError(res, log, err);

                if (results == '')
                    return Resp.sendResponse(res, log, 'No reports found !!!', 'No reports found !!!', '');

                var reportNos = [];

                results.forEach(function(report, cb) {
                    reportNos.push(report.report_no);
                });

                // Retrieving run details of reports
                db.execute("select *                                \
                              from report_results                   \
                             where report_no in (" + reportNos + ") \
                          order by run_no                           \
                        ", [], function(err, runDetails) {

                    if (err) return Resp.sendError(res, log, err);

                    if (runDetails == '')
                        return Resp.sendResponse(res, log, "No run details found. Sending back report results.", '', results);

                    results.forEach(function(report, cb) {

                        for (var i = 0; i < runDetails.length; i++) {

                            if (report.report_no == runDetails[i].report_no) {

                                if (report.files == undefined) report.files = {};

                                if (runDetails[i].type == "xls" || runDetails[i].type == "csv")
                                    populateReportFileDetails(report, runDetails[i])
                            }
                        }
                    });

                    Resp.sendResponse(res, log, 'Sending back report results.', '', results);
                });
            });
        });
    });

    log.info('registering /ossui/v1/ex/reports/getreport ...');

    app.get('/ossui/v1/ex/reports/getreport', app.role(AuthGroupExternal), function(req, res) {

        var path = req.query['path'];
        
        ExecScript.execFile("/opt/oss/pkg/reporting/scripts/OSrGetReport.tcl", [ path ], function(err, tmpPath) {

            if (err) return Resp.sendError(res, log, err); 

            FileSys.exists(tmpPath, function(exists) {

              if (exists) {
                log.info("Report available... Processing file...");

                res.download(tmpPath, '', function(err) {
                    FileSys.unlink(tmpPath);
                    if (err) {
                        log.info('Could not retrieve requested report file (' + err + ').');
                        res.redirect('/ext/index.html#/viewReports?err=2');
                    }
                });

              } else {
                log.info('Requested report file is not present on the server.');
                res.redirect('/ext/index.html#/viewReports?err=1');
              }
            });
        });
    });
}

/**
 * Populates report file details in the report JSON structure.
 * @param report        Report details
 * @param runDetails    Report run details
 * @return -            None
 */
function populateReportFileDetails (report, runDetails) {

    if (report.files[runDetails.type] == undefined) report.files[runDetails.type] = [];

    report.files[runDetails.type].push({
        'run_no': runDetails.run_no,
        'comment_text': runDetails.comment_text,
        'started_at': runDetails.started_at,
        'ended_at': runDetails.written_at,
        'format': runDetails.type,
        'path': runDetails.path 
    });
}
