/*------------------------------------------------------------------------------
|
|   Route handler for /ossui/v1/exportexcelget  &
|                     /ossui/v1/exportexcelpost
|
|   This webservice will create excel file (.xlsx) using the data passed in
|   the request.
|
|
|   written by Alok Upendra Kamat
|   Aug 2013
|
\-----------------------------------------------------------------------------*/

var Bunyan = require('bunyan');
var Excel = require('excel-export');

var log = new Bunyan({
    name: 'exportExcelWebService'
});

module.exports.init = function(app) {

    log.info('registering /ossui/v1/exportexcelget ...');
    log.info('registering /ossui/v1/exportexcelpost ...');

    app.get('/ossui/v1/exportexcelget?(\\w+)', app.role(AuthGroupSandyUser), function(req, res) {

        /* Note: This route handler takes two parameters:
         1) cols - column_name_1\tcolumn_type_1\ncolumn_name_2\tcolumn_type_2\n
                   ... column_name_n\tcolumn_type_n
         2) rows - row_1_value_1\trow_1_value_2\t ... row_1_value_n\n
                   row_2_value_1\trow_2_value_2\t ... row_2_value_n\n
                   row_n_value_1\trow_n_value_2\t ... row_n_value_n\n
         The delimiters used are '\t' & '\n' as shown above.                  */

        if (req.query.cols == undefined || req.query.rows == undefined) {
            return res.json({
                        status: 'E',
                        message: 'Service did not receive column or row data.',
                        data: ''
                    }, 500);
        }

        log.info(req.query.cols);
        log.info(req.query.rows);

        var conf = {};
        conf.cols = [];
        conf.rows = [];

        var cols = req.query.cols.split("\\n");
        var rows = req.query.rows.split("\\n");

        for (colIdx in cols) {
            var colDetails = cols[colIdx].split("\\t");
            conf.cols.push({caption:colDetails[0], type:colDetails[1]});

            if (colIdx == cols.length - 1) break;
        }

        log.info(conf.cols);

        for (rowIdx in rows) {
            var rowField = [];
            var rowDetails = rows[rowIdx].split("\\t");

            for (rowDtlIdx in rowDetails) {
                rowField.push(rowDetails[rowDtlIdx]);

                if (rowDtlIdx == rowDetails.length - 1) break;
            }

            conf.rows.push(rowField);

            if (rowIdx == rows.length - 1) break;
        }

        log.info(conf.rows);

        var today = new Date();
        var result = Excel.execute(conf);

        log.info("Creating xlsx file and sending to browser.");

        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" +
            "Export_" + today.toString().replace(/\s+|\+|:/g, "_") + ".xlsx");
        res.end(result, 'binary');
    });

    app.post('/ossui/v1/exportexcelpost', app.role(AuthGroupSandyUser), function(req, res) {

        /* Note: This route handler takes json object as input in below format:
            {
                "cols": [
                    {
                        "caption": "Column1",
                        "type": "string"
                    },
                    {
                        "caption": "Column2",
                        "type": "date"
                    }
                ],
                "rows": [
                    [
                        "Row1ValueForColumn1",
                        "Row1ValueForColumn2"
                    ],
                    [
                        "Row2ValueForColumn1",
                        "Row2ValueForColumn2"
                    ],
                    [
                        "Row3ValueForColumn1",
                        "Row3ValueForColumn2"
                    ]
                ]
            } */

        var conf = JSON.parse(JSON.stringify(req.body));

        if (conf.cols == undefined || conf.rows == undefined) {
            return res.json({
                        status: 'E',
                        message: 'Service did not receive column or row data.',
                        data: ''
                    }, 500);
        }

        log.info(conf);

        var today = new Date();
        var result = Excel.execute(conf);

        log.info("Creating xlsx file and sending to browser.");

        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" +
            "Export_" + today.toString().replace(/\s+|\+|:/g, "_") + ".xlsx");
        res.end(result, 'binary');
    });
}
