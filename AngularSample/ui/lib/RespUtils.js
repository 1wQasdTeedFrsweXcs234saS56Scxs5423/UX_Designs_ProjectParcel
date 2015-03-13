/*----------------------------------------------------------------------------
|
|   Helper functions for JSON response.
|
|
|
|   written by Alok Upendra Kamat
|   July 2013
|
\---------------------------------------------------------------------------*/

/**
 * This function returns the supplied error as a JSON object
 * @param res       Response object
 * @param log       Log handle
 * @param errMsg    Error object/message
 * @return -        JSON object
 */
module.exports.sendError = function(res, log, errMsg) {
    log.error(errMsg);

    if (errMsg.stack != undefined)
        return res.json({
            status: 'E',
            message: errMsg.stack,
            data: ''
        }, 500);
    else
        return res.json({
            status: 'E',
            message: errMsg,
            data: ''
        }, 500);
}

/**
 * This function returns the supplied data as a JSON object
 * @param res       Response object
 * @param log       Log Handle
 * @param logMsg    Log Message
 * @param resMsg    Response Message
 * @param data      Data to be sent in the JSON object
 * @return -        JSON object
 */
module.exports.sendResponse = function(res, log, logMsg, resMsg, data) {
    log.info(logMsg);
    return res.json({
        status: 'S',
        message: resMsg,
        data: data
    });
}


/**
 * This function returns the supplied data as a JSON object
 * @param res        Response object
 * @param log        Log Handle
 * @param logMsg     Log Message
 * @param resMsg     Response Message
 * @param maxNum     Maximum No of records sent
 * @param totalCount Total No of records found
 * @param data       Data to be sent in the JSON object
 * @return -         JSON object
 */
module.exports.sendOrderResponse = function(res, log, logMsg, resMsg, maxNum, data) {

    res.setHeader('Cache-Control', 'public, max-age=180')  // cache for 3 minutes
    return res.json({
        'status': 'S',
        'message': resMsg,
        'pageSize': maxNum,
        'data': data,
    });
}


module.exports.sendPriceResponse = function(res, log, logMsg, resMsg, totallistExtPrice,totalDiscValue,totalNetPrice,totalDiscPersentage,data) {

    return res.json({
        'status': 'S',
        'message': resMsg,
        'totallistExtPrice': totallistExtPrice,
        'totalDiscValue': totalDiscValue,
        'totalNetPrice': totalNetPrice,
        'totalDiscPersentage':totalDiscPersentage,
        'data': data,
    });
}

module.exports.sendItemResponse = function(res, log, logMsg, resMsg, pageId, maxNum, totalCount, indentation_flag,haveBundleID,haveConfigID,haveConfigUID,data) {

    return res.json({
        'status': 'S',
        'message': resMsg,
        'pageNo': pageId,
        'pageSize': maxNum,
        'recordCount': totalCount,
        'indentation_flag':indentation_flag,
        'haveBundleID':haveBundleID,
        'haveConfigID':haveConfigID,
        'haveConfigUID':haveConfigUID,
        'data': data,
    });
}

module.exports.ErrRespForInsert = function(res, err,query) {

    return res.json({
        'status': 'E',
        'Error': err,
        'query': query
    });
}

module.exports.RespForInsert = function(res,result) {

    return res.json({
        'status': 'S',
        'data': result,
    });
}

