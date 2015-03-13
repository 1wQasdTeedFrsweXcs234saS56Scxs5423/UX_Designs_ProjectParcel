/*----------------------------------------------------------------------------
|
|   Library for route handler /ossui/v1/shipmenttab
|
|   This file contains modules used by shipmentTabInfo webservice.
|
|   written by Ashwini Upadhya
|   November 2013
|
\---------------------------------------------------------------------------*/

var DbPool = require('../lib/DbPool');
var Resp = require('../lib/RespUtils.js');
var SqlUtils = require('../lib/SqlUtils');
var SqlUtils2 = require('../lib/SqlUtils2');
var exec = require('child_process').execFile;
var ExecScript = require('child_process');
var Bunyan = require('bunyan');
var FileSys = require('fs');
var shipment = require('../lib/shipmentTab.js');
var tclParser = require('../lib/tcllist.js')
var PortalSec = require("../lib/PortalSecurity")

DTADirPath = "/var/opt/oss/backend/data/";
DirPath = "/var/opt/oss/frontend/data/";
var filter = new SqlUtils.AndWhere();
var filter1 = new SqlUtils.AndWhere();

module.exports.shipmentInfo = function(req, db, cust, cb) {
    Cache = {};

    var sqlString = "select distinct d.sourcesystem, h.legacy_order_no, \
                            d.hpdeliveryno, d.shipmentno, d.region, \
                            d.ref_shipment_no, d.alt_shipment_no,\
                            d.shipmentdate, d.deliverydate,\
                            d.iso_country, cs.country_name, d.delvtozipcode, d.delvtocity,\
                            d.depotcountry, cd.country_name as depot_to_addr_3, \
                            d.hpdepotcode as depot_to_addr_1, \
                            d.depotcity as depot_to_addr_2,\
                            d.plant_code, d.truckid, ca.carriername,\
                            d.weight, d.unitofmeasure,\
                            d.quantity, h.dod_flag, h.rfid_flag, \
                                (select count(b.boxnumber) \
                                    from box b \
                                where (b.hpdeliveryno = r.hpdeliveryno \
                                        or b.alt_shipment_no = r.hpdeliveryno)\
                                   and r.hporderno = :1) as box_count,\
                            bd.ship_conditions \
                        from delivery d \
                        left outer join country cs  on d.iso_country = cs.iso_code \
                        left outer join country cd  on d.depotcountry = cd.iso_code \
                        left outer join carrier ca  on d.carrier_id = ca.carrier_id \
                        inner join ordersecdelrel r on d.hpdeliveryno = r.hpdeliveryno \
                        inner join backlog_delv bd  on r.hporderno = bd.legacy_order_no  \
                        inner join backlog_hdr h    on bd.legacy_order_no=h.legacy_order_no ";

    var sqlCS = sqlString + "   and d.shipmentno = bd.shipment_no \
                                and bd.eshp_actual is not null \
                                where bd.legacy_order_no = :1";

    var sqlFS = sqlString + "   and d.shipmentno = bd.fact_delv_no \
                                where bd.legacy_order_no = :1 \
                                and bd.eshp_actual is null \
                                and bd.pgi_actual is not null";
    //Retreiving shipment tab header info
    db.execute(sqlCS, [req.query.order_no], function(err, headerCS) {

        if (err) cb(err, null);

        var shipInfoCS = [];
        var shipmentNos = [];
        var shipCarriers = [];

        headerCS.forEach(function(row, i) {
            shipInfoCS.push(row.hpdeliveryno);
            shipmentNos.push(row.shipmentno);
            var str = row.shipmentno + ":" + row.carriername
            shipCarriers.push(str);
        });
        //Seperate the array shipmentNos with commas so that it can be used in IN clause in the queries further
        shipmentNos = "'" + shipmentNos.join("','") + "'";

        db.execute(sqlFS, [req.query.order_no], function(err, headerFS) {
            if (err) cb(err, null);

            if (headerFS != "" && headerFS != undefined && headerFS.length != 0) {

                headerFS.forEach(function(row, i) {
                    if (shipInfoCS.indexOf(row.hpdeliveryno) > -1) {
                        //return true
                    } else {
                        headerCS.push(row);
                    }
                });
            }
            if (headerCS == "" || headerCS == undefined || headerCS.length == 0) {
                return cb(headerCS, null);
            }
            headerCS.forEach(function(row, i) {
                headerCS[i].weight = Math.floor(headerCS[i].weight * 1000) / 1000;
            });

            exports.getShipMethod(shipmentNos, req.query.order_no, db, function(err, delvGroup) {

                var sourceSystem = exports.getSystemId(headerCS[0].sourcesystem);
                exports.loadDTAFileTable(DirPath, sourceSystem);

                exports.getPodAndPackList(req.query.order_no, shipCarriers, function(err, carrierInfo) {

                    headerCS.forEach(function(row, i) {
                        if (carrierInfo != null) {
                            console.log(carrierInfo[row.shipmentno]);
                            if (carrierInfo[row.shipmentno] != undefined) {
                                headerCS[i].carrierwebpage = carrierInfo[row.shipmentno].URL;
                                headerCS[i].hasPodImage = carrierInfo[row.shipmentno].hasPodImage;
                                headerCS[i].hasPackList = carrierInfo[row.shipmentno].hasPackList;
                                headerCS[i].PackListURL = carrierInfo[row.shipmentno].packpodURL;

                                if (headerCS[i].hasPackList == 1) {
                                    headerCS[i].contRep = carrierInfo[row.shipmentno].contRep;
                                    headerCS[i].getixosdoc = carrierInfo[row.shipmentno].getixosdoc;
                                    headerCS[i].compId = carrierInfo[row.shipmentno].compId;
                                    headerCS[i].contenttype = carrierInfo[row.shipmentno].contenttype;
                                }
                            }
                            if (headerCS[i].carrierwebpage == undefined) {
                                headerCS[i].carrierwebpage = null
                            }
                        }

                        headerCS[i].ship_method = Cache.RouteDescription[sourceSystem][delvGroup[row.shipmentno]];
                        headerCS[i].ship_conditions = Cache.ShipConditionDescr[sourceSystem][headerCS[i].ship_conditions];

                        if (headerCS[i].ship_method == undefined) {
                            headerCS[i].ship_method = null;
                        }
                        if (headerCS[i].ship_conditions == undefined) {
                            headerCS[i].ship_conditions = null;
                        }
                        exports.getDepotAddress(row, i, sourceSystem, headerCS);
                    });
                    exports.getDeliveryComment(shipmentNos, req.query.order_no, db, function(err, delvstatus) {

                        if (delvstatus != null) {
                            headerCS.forEach(function(row, i) {
                                delvstatus.forEach(function(subrow, i) {
                                    headerCS[i].delivery_comment = subrow.delivery_status;
                                });
                            });
                        } else {
                            for (var i in headerCS) {
                                if (!("delivery_comment" in headerCS)) {
                                    headerCS[i].delivery_comment = null;
                                }
                            }
                        }
                        if (headerCS[0].dod_flag == "Y" || headerCS[0].rfid_flag == "Y" && shipInfoCS.length != null) {
                            exports.getWawfNumber(shipmentNos, req.query.order_no, db, function(err, result) {
                                if (err) cb(err, null);
                                if (result != "" && result.length != 0) {
                                    headerCS.forEach(function(row, i) {
                                        result.forEach(function(subrow, i) {
                                            if (row.shipmentno == subrow.shipment_no) {
                                                console.log("wawf# found");
                                                headerCS[i].wawfNumber = subrow.wawf_number;
                                            }
                                        });
                                    });
                                }

                                return cb(null, headerCS);
                            });
                        } else {
                            for (var i in headerCS) {
                                if (!("wawfNumber" in headerCS)) {
                                    headerCS[i].wawfNumber = null
                                }
                            }

                            return cb(null, headerCS);
                        }
                    });
                });
            });
        });
    });
}

module.exports.trackInfo = function(req, db, cust, cb) {

    var sqlString = "select t.hpdeliveryno, t.id, d.shipmentno, \
                            t.trackingno, c.carriername, \
                            h.carrierdeliveryno, h.recipientname, \
                            h.masterbillno, h.housebillno, \
                            h.departlocation, h.arrivallocation, \
                                (select count(e.statuscode) \
                        from delv_event e \
                        inner join statuscode sc      on sc.statuscode = e.statuscode \
                        left outer join reasoncode rc on rc.reasoncode = e.reasoncode \
                        where e.id = t.id \
                        and e.is_latest = 'Y') as status_count"
    if (cust == "in") {
        sqlString = sqlString + ",h.transportflightno "
    }
    sqlString = sqlString + " from delivery d, delv_tracking t inner join delv_header h on t.id = h.id \
                                inner join carrier c on t.carrier_id = c.carrier_id \
                                where t.hpdeliveryno = :1 \
                                and t.hpdeliveryno = d.hpdeliveryno \
                                order by t.shipmentdate, t.trackingno";

    //Retreiving tracking information for a given hpdeliveryno
    db.execute(sqlString, [req.query.hpdelvno], function(err, tracks) {
        if (err) return cb(err, null);

        ExecScript.execFile("/opt/oss/pkg/frontend/scripts/OSfGetTrackAndTraceUrl.tcl", [req.query.legacy_order_no, req.query.shipment_no], function(err, trackAndTraceUrls) {
            if (err) return cb(err, null);

            var trackAndTraceUrlsJSON = JSON.parse(trackAndTraceUrls);

            for (var tracker in tracks) {

                if (trackAndTraceUrlsJSON[tracks[tracker].trackingno] == undefined) {
                    tracks[tracker].carrier_website = null;
                    tracks[tracker].tat_url = null;

                } else {

                    tracks[tracker].carrier_website = trackAndTraceUrlsJSON[tracks[tracker]['trackingno']].carrier_url;

                    if (trackAndTraceUrlsJSON[tracks[tracker]['trackingno']]['tat_url'].match(/^bridge=/i) ||
                        trackAndTraceUrlsJSON[tracks[tracker]['trackingno']]['tat_url'].match(/^fetchSTS=/i)) {

                        tracks[tracker].tat_url = TATIntPreURL + trackAndTraceUrlsJSON[tracks[tracker]['trackingno']].tat_url;

                    } else {
                        tracks[tracker].tat_url = trackAndTraceUrlsJSON[tracks[tracker]['trackingno']].tat_url;
                    }
                }
            }
            console.log('tracks ' + JSON.stringify(tracks));
            return cb(null, tracks);
        });
    });
}

module.exports.boxDetail = function(req, db, cb) {

    var sqlString = "select x.shipment_no1, \
                            x.hpdeliveryno,\
                            x.box_level,\
                            x.b1 as BoxNo,\
                            x.parent_box_no,\
                            x.weight,\
                            x.width,\
                            x.len,\
                            x.height,\
                            x.headerbox_qty,\
                            x.epc,\
                            x.trackingno,\
                            x.fact_delv_no1, \
                            x.fact_delv_no2, \
                            x.item_subitem, \
                            x.material_no, \
                            x.product_descr, \
                            x.itembox_qty \
                    from ( \
                    select * \
                    from \
                    ( \
                    SELECT  b.box_no as b1,\
                            b.box_level,\
                            (select dy.hpdeliveryno from delivery dy where dy.shipmentno = case when d.shipment_no is not null then d.shipment_no else d.fact_delv_no end) as hpdeliveryno, \
                            b.parent_box_no, \
                            b.qty as headerbox_qty, \
                            trim(TO_CHAR(NVL(b.weight, 0), '999999999999999999999990.99')) AS weight, \
                            b.width,\
                            b.length as Len,\
                            b.height,\
                            b.epc,\
                            b.trackingno,\
                            d.shipment_no as shipment_no1, \
                            d.fact_delv_no as fact_delv_no1 \
                    FROM    backlog_boxdetails b,\
                            backlog_delv d \
                    where   b.delivery_group  = d.delivery_group \
                        and d.legacy_order_no = b.legacy_order_no \
                        and d.legacy_order_no = :1 \
                        and (d.shipment_no = :2 OR d.fact_delv_no = :2) \
                    ) A left outer join \
                    ( \
                    select  b.box_no as b2, \
                            i.fact_delv_no as fact_delv_no2,\
                            i.shipment_no, \
                            i.item_subitem, \
                            i.material_no, \
                            i.product_descr, \
                            i.legacy_order_no, \
                            sum(b.qty) as itembox_qty \
                    from    backlog_itembox b, \
                            backlog_item i \
                    where   b.legacy_order_no = i.legacy_order_no \
                        and b.item_sln = i.item_sln \
                        and b.legacy_order_no = :1 \
                        and i.shipment_no = :2 \
                    GROUP BY b.box_no, i.fact_delv_no, i.shipment_no, i.item_subitem, i.material_no, i.product_descr, i.legacy_order_no \
                    ) B \
                    on A.b1 = B.b2 \
                    connect by prior b.b2 = a.parent_box_no \
                    ) x \
                    order by 1,2,3,4,5 ";

    db.execute(sqlString, [req.query.order_no, req.query.ship_no], function(err, boxHeader) {

        if (err) {
            return cb(err, null);
            console.log(err);
        }

        if (boxHeader == "" || boxHeader == undefined || boxHeader.length == 0) {
            return cb(boxHeader, null);
        }

        boxHeader = boxHeader.sort(exports.mycomparator);

        var hasBoxDetails = 1;
        var boxnumbers = [];
        var levels = [];

        for (var i in boxHeader) {
            levels.push(boxHeader[i].box_level);

            if (boxHeader[i].parent_box_no != null) {
                boxHeader[i].hasParentBoxes = 1
            } else {
                boxHeader[i].hasParentBoxes = 0
            }
            if (boxHeader[i].box_level > 0) {
                boxHeader[i].hasChildBoxes = 1;
            } else {
                boxHeader[i].hasChildBoxes = 0;
            }

            if (boxHeader[i].epc != null) {
                boxHeader[i].hasEPC = 1;
            } else {
                boxHeader[i].hasEPC = 0;
            }
            if (boxHeader[i].trackingno != null) {
                boxHeader[i].hasTracking = 1;
            } else {
                boxHeader[i].hasTracking = 0;
            }
        }

        levels.sort(function(a, b) {
            return b - a
        })
        var maxLevel = levels[0];

        for (var i in boxHeader) boxnumbers.push(boxHeader[i].box_no);

        var sqlString = "select distinct boxnumber,boxweight, \
                                         sc_recv, sc_ship, \
                                         rc_recv, rc_ship \
                        from box \
                        where hporderno =:1 \
                        and (hpdeliveryno = :2 \
                        or alt_shipment_no = :2) \
                        order by boxnumber ";

        db.execute(sqlString, [req.query.order_no, boxHeader[0].hpdeliveryno], function(err, box) {
            if (err) return cb(err, null);
            var hasScRecv = 0;
            var hasScShip = 0;
            if (box.length == 0) {
                hasScRecv = 0;
                hasScShip = 0;
            } else {
                for (var i in box) {
                    if (box[i].sc_recv != null) {
                        for (var i in boxHeader) {
                            boxHeader[i].hasScRecv = 1;
                            if (box[i].sc_recv == "AP") var sc_recv = "AP - box not handed over/delivered"
                            if (box[i].sc_recv == "D1") var sc_recv = "D1 - box (received) with defects"
                            boxHeader[i].sc_recv = sc_recv;
                            if (box[i].rc_recv != null) boxHeader[i].rc_recv = box[i].rc_recv;
                        }
                    } else {
                        for (var i in boxHeader) {
                            boxHeader[i].sc_recv = null;
                        }
                    }

                    if (box[i].sc_ship != null) {
                        for (var i in boxHeader) {
                            boxHeader[i].hasScShip = 1;
                            if (box[i].sc_ship == "AP") var sc_ship = "AP - box not delivered"
                            if (box[i].sc_ship == "D1") var sc_ship = "D1 - box with defects"
                            boxHeader[i].sc_ship = sc_ship;
                            if (box[i].rc_ship != null) boxHeader[i].rc_ship = box[i].rc_ship;
                        }
                    } else {
                        for (var i in boxHeader) {
                            boxHeader[i].sc_ship = null;
                        }
                    }
                }
            }
            var hasBoxItems = 0;

            if (req.query.ship_no == boxHeader[0].shipment_no1 || req.query.ship_no == boxHeader[0].fact_delv_no2 && boxHeader[0].shipment_no1 == "") {

                hasBoxItems = 1;
                for (var i in boxHeader) {
                    boxHeader[i].hasBoxItems = 1;
                }
                if (hasBoxDetails == 0) {
                    for (var i in box) {
                        if (box[i].weight != null) {
                            boxHeader[i].weight = box[i].weight;
                        }
                    }
                }
            }

            var boxDetails = {
                HighestLevel: maxLevel,
                header: boxHeader
            };
            return cb(null, boxDetails);
        });
    });
}


module.exports.statusHistory = function(req, db, cb) {

    var sqlString = "select d.shipmentno ,t.trackingno, c.carriername, \
                            e.location, \
                            sc.description as status, rc.description as reason, \
                            e.event_datetime, e.event_timezone, \
                            e.loaded, \
                            h.masterbillno, h.housebillno, \
                            d.transportmode \
                    from delv_tracking t \
                        inner join carrier c            on t.carrier_id = c.carrier_id \
                        inner join delv_event e         on t.id = e.id \
                        left outer join reasoncode rc   on e.reasoncode = rc.reasoncode \
                        inner join statuscode sc        on e.statuscode = sc.statuscode \
                        inner join delv_header h        on t.id = h.id \
                        inner join delivery d           on t.hpdeliveryno = d.hpdeliveryno \
                    where t.hpdeliveryno = :1 \
                    and e.is_latest = 'Y' \
                    and d.shipmentno = :2 \
                    order by e.event_datetime, e.loaded";

    //Retreiving status history for the given hpdeliveryno and shipment number
    db.execute(sqlString, [req.query.hpdelvno, req.query.ship_no], function(err, statusHistory) {
        if (err) return cb(err, null);

        statusHistory.forEach(function(row, i) {

            if (statusHistory[i].transportmode == "Air") {
                statusHistory[i].mbnTitle = "MAWB#";
                statusHistory[i].hbnTitle = "HAWB#";
            };
            if (statusHistory[i].transportmode == "Sea") {
                statusHistory[i].mbnTitle = "BOL#";
                statusHistory[i].hbnTitle = "CTNR#";
            };
            for (var i = 0; i < statusHistory.length; i++) {
                statusHistory[i].statusCount = i;
            }

        });
        return cb(null, statusHistory);
    });
}

module.exports.itemInfo = function(req, db, cust, cb) {

    var itemFilter = new SqlUtils.AndWhere();
    var delvFilter = new SqlUtils.AndWhere();

    var sqlString = "select delivery_group,item_subitem, \
                            material_no,product_descr, \
                            cust_product_no, so_line_item_qty, \
                            sum(sched_line_qty) as sched_line_qty,logistics_codes"
    if (cust == "in") {
        sqlString = sqlString + ",ship_from,lsp_name ";
    }
    sqlString = sqlString + "   from backlog_item \
                                where legacy_order_no = :1 \
                                and (shipment_no = :2 \
                                or fact_delv_no = :2 ) \
                                group by delivery_group, item_subitem, \
                                material_no, product_descr, \
                                cust_product_no, so_line_item_qty, logistics_codes "
    if (cust == "in") {
        sqlString = sqlString + ",ship_from,lsp_name";
    }
    sqlString = sqlString + " " + "order by item_subitem";
    console.log(sqlString);
    // Retreiving Item Information under shipment tab for a given orderno and shipment no
    db.execute(sqlString, [req.query.order_no, req.query.shipno], function(err, itemHeader) {
        if (err) return cb(err, null);

        itemHeader = itemHeader.sort(exports.mycomparator);

        var itemSubitems = [];
        var deliveryGroup = [];

        for (var i in itemHeader) {
            itemSubitems.push(itemHeader[i].item_subitem);
            deliveryGroup.push(itemHeader[i].delivery_group);
        };

        itemSubitems = "'" + itemSubitems.join("', '") + "'";
        deliveryGroup = "'" + deliveryGroup.join("', '") + "'";

        itemFilter.addIn(itemSubitems, "detail_techinfo.item_subitem");
        delvFilter.addIn(deliveryGroup, "detail_techinfo.delivery_group");

        var sqlString = "select item_subitem,serial_number, \
                                asset_tag, \
                                primary_mac_addr, \
                                box_no \
                        from detail_techinfo \
                        where " + delvFilter.where + " \
                        and " + itemFilter.where + " \
                        order by serial_number";
        var hasTechInfo = 0;
        var hasBoxes = 0;

        db.execute(sqlString, [], function(err, techInfo) {
            if (techInfo.length > 0) {

                var techInfoItemSubitems = [];
                for (var i in techInfo) {
                    techInfoItemSubitems.push(techInfo[i].item_subitem);
                }

                for (var i in itemHeader) {
                    hasTechInfo = 0;
                    if (techInfoItemSubitems.indexOf(itemHeader[i].item_subitem) == -1) {
                        hasTechInfo = 0;
                    } else {
                        hasTechInfo = 1;
                    }
                    itemHeader[i].hasTechInfo = hasTechInfo;
                }
                for (var i in techInfo) {
                    if (techInfo[i].box_no != null) {
                        hasBoxes = 1;
                        techInfo[i].hasBoxes = hasBoxes;
                    }
                }
            }

            var sqlString = "select distinct \
                                    bib.item_subitem, \
                                    bib.box_no, \
                                    bbd.parent_box_no \
                            from \
                            ( \
                              SELECT substr(b.item_sln,1,instr(b.item_sln,',')-1) as item_subitem, b.item_sln, b.legacy_order_no, b.box_no \
                              FROM  backlog_itembox b \
                            ) bib, \
                            ( \
                              SELECT P.legacy_order_no, P.BOX_NO, p.delivery_group, p.parent_box_no \
                              FROM   backlog_boxdetails p \
                            ) bbd, \
                            ( \
                              SELECT i.legacy_order_no, i.delivery_group, i.item_subitem, i.shipment_no \
                              FROM backlog_item i \
                            ) bi \
                            where bib.legacy_order_no = bbd.legacy_order_no \
                            and   bib.legacy_order_no = bi.legacy_order_no \
                            and   bib.box_no = bbd.box_no \
                            AND   bi.delivery_group    = bbd.delivery_group \
                            and   bi.item_subitem = bib.item_subitem \
                            and   bib.legacy_order_no = :1 \
                            AND   bi.shipment_no = :2";

            db.execute(sqlString, [req.query.order_no, req.query.shipno], function(err, itemBoxes) {
                if (err) return cb(err, null);

                //console.log(itemBoxes);
                console.log(itemBoxes.length);

                var itemDetails = {
                    header: itemHeader,
                    techInfo: techInfo,
                    itembox: itemBoxes
                };

                return cb(null, itemDetails);
            });
        });
    });
}

module.exports.dodInfo = function(req, db, cb) {

    var sqlString = "select distinct i.item_sln, d.hpdeliveryno, \
                                     i.shipment_no, i.fact_delv_no,\
                                     i.item_subitem, i.cust_product_no, \
                                     i.material_no, i.product_descr, \
                                     t.serial_number, t.dod_uid, \
                                     b.epc1, b.epc2, b.box_no,h.dod_flag, h.rfid_flag \
                    from delivery d, backlog_item i \
                    left outer join backlog_itembox b   on i.legacy_order_no = b.legacy_order_no \
                        and i.item_sln = b.item_sln \
                    left outer join v_dod_techinfo t    on i.delivery_group = t.delivery_group \
                        and i.item_subitem = t.item_subitem \
                        and (t.box_no = b.box_no or t.box_no is null) \
                    inner join backlog_hdr h            on i.legacy_order_no=h.legacy_order_no \
                    where i.legacy_order_no = :1 \
                    and i.shipment_no = :2 \
                    and d.shipmentno=i.shipment_no \
                    order by i.item_sln, t.serial_number";
    //Retreives dod info only if dod flag and rfid flag is 'Y'//
    //This tab is available only for Internal view.
    db.execute(sqlString, [req.query.order_no, req.query.shipno], function(err, dodDetails) {
        if (dodDetails[0].dod_flag == 'Y' || dodDetails[0].rfid_flag == 'Y') {
            var shipNos = [];
            for (var i in dodDetails) {
                shipNos.push(dodDetails[i].shipment_no)
            };

            var hasDoDFields = 0;
            var hasSerial = 0;
            var hasUID = 0;
            var hasEPC1 = 0;
            var hasEPC2 = 0;
            var hasBox = 0;

            if (dodDetails[0].hpdeliveryno != null) {
                dodDetails.forEach(function(row, i) {
                    if (dodDetails[i].cust_product_no != null || dodDetails[i].dod_uid != null || dodDetails[i].epc1 != null || dodDetails[i].epc2 != null) {
                        hasDoDFields = 1;
                        dodDetails[i].hasDoDFields = hasDoDFields;
                    }
                });

                if (hasDoDFields == 1) {
                    dodDetails.forEach(function(row, i) {
                        if (dodDetails[i].serial_number != null) {
                            hasSerial = 1;
                            dodDetails[i].hasSerial = hasSerial;
                        }

                        if (dodDetails[i].dod_uid != null) {
                            hasUID = 1;
                            dodDetails[i].hasUID = hasUID;
                        };

                        if (dodDetails[i].epc1 != null) {
                            hasEPC1 = 1;
                            dodDetails[i].hasEPC1 = hasEPC1;
                        };

                        if (dodDetails[i].epc2 != null) {
                            hasEPC2 = 1;
                            dodDetails[i].hasEPC2 = hasEPC2;
                        };

                        if (dodDetails[i].box_no != null) {
                            hasBox = 1;
                            dodDetails[i].hasBox = hasBox;
                        };

                    });
                    if (err) return cb(err, null)
                    return cb(null, dodDetails);
                } else {
                    return cb(dodDetails, null);
                }
            }
        } else {
            return cb(dodDetails, null);
        }
    });
}

module.exports.getWawfNumber = function(shipmentNos, order_no, db, cb) {

    filter.addIn(shipmentNos, "backlog_ship.shipment_no");

    var sqlString = "select shipment_no, wawf_number \
                     from backlog_ship \
                     where legacy_order_no = :1 \
                     and " + filter.where + " \
                     and wawf_number is not null";

    db.execute(sqlString, [order_no], function(err, result) {
        if (result != "" && result.length != 0) {
            if (err) {
                return cb(err, null);
            } else {
                return cb(err, result);
            }
        }
    });
}

module.exports.getSystemId = function(sourceSystem) {

    switch (sourceSystem) {
        case 'US-SAP':
            return 'SAP-R00';
            break;

        case 'EUFUSION':
        case 'SAP-R01-ET':
        case 'SAP-R01-ESG':
        case 'SAP-R01-PSG':
            return 'SAP-R01';
            break;

        case 'CPDE-SAP':
            return 'SAPCPO';
            break;

        default:
            return sourceSystem;
    }
}

module.exports.loadDTAFileTable = function(DirPath, sourceSystem) {

    var DTAFilePath1 = DirPath + sourceSystem + '/tvrot.dta';
    var DTAFilePath2 = DirPath + sourceSystem + '/tvsbt.dta';
    var DTAFilePath3 = DTADirPath + sourceSystem + '/tvst_adrc.dta';

    Cache.RouteDescription = {};
    Cache.ShipConditionDescr = {};
    Cache.ShippointAddress = {};
    Cache.ShipConditionDescr[sourceSystem] = {};
    Cache.RouteDescription[sourceSystem] = {};
    Cache.ShippointAddress[sourceSystem] = {};

    var fileArray = [];
    fileArray[0] = DTAFilePath1;
    fileArray[1] = DTAFilePath2;
    fileArray[2] = DTAFilePath3;

    fileArray.forEach(function(file) {
        if (FileSys.existsSync(file)) {
            var fileData = FileSys.readFileSync(file).toString().split("\n");
            for (eachRowIndex in fileData) {

                if (isNaN(eachRowIndex)) return;
                var string = tclParser.Tcl2Array(fileData[eachRowIndex]);
                if (file.match(/tvsbt/g)) {
                    Cache.ShipConditionDescr[sourceSystem][string[0]] = string[1];
                } else if (file.match(/tvrot/g)) {
                    Cache.RouteDescription[sourceSystem][string[0]] = string[1];
                } else if (file.match(/tvst_adrc.dta/g)) {
                    if (eachRowIndex == 0) {
                        var columnName = string;
                    } else {
                        Cache.ShippointAddress[sourceSystem][string[0]] = {};
                        for (i = 1; i < string.length; i++) {
                            Cache.ShippointAddress[sourceSystem][string[0]][columnName[i]] = string[i].replace(/\|\|/g, " ");
                        }
                    }
                }
            }
        }
    });
}

module.exports.getDepotAddress = function(row, i, sourceSystem, headerCS) {

    if (Cache.ShippointAddress && Cache.ShippointAddress[sourceSystem] && Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1]) {

        var depotToAddr3 = row.depot_to_addr_3;

        headerCS[i].depot_to_addr_2 = Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].name1;
        headerCS[i].depot_to_addr_3 = Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].name2;
        headerCS[i].depot_to_addr_4 = Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].name3;
        headerCS[i].depot_to_addr_5 = Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].street;

        (Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].zip_code != '') ? headerCS[i].depot_to_addr_6 = Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].zip_code + " " + Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].city : headerCS[i].depot_to_addr_6 = Cache.ShippointAddress[sourceSystem][row.depot_to_addr_1].city;

        headerCS[i].depot_to_addr_7 = depotToAddr3;
    }
}

module.exports.getShipMethod = function(shipmentNos, order_no, db, cb) {

    filter1.addIn(shipmentNos, "backlog_item.shipment_no");

    var sqlString = "select delivery_group, shipment_no, count(item_sln),\
                            system, route \
                    from backlog_item \
                    where legacy_order_no = :1 \
                    and " + filter1.where + " \
                    group by delivery_group, shipment_no, system, route";

    db.execute(sqlString, [order_no], function(err, delvGrp) {
        if (err) return cb(err, null)

        var delvGroup = {};
        delvGrp.forEach(function(row, i) {
            delvGroup[row.shipment_no] = row.route;
        });

        return cb(null, delvGroup);
    });
}

module.exports.getPodAndPackList = function(osNo, shipCarriers, cb) {

    ExecScript.execFile("/opt/oss/pkg/frontend/scripts/OSfGetPodPackCarrierInfo.tcl", [osNo, shipCarriers], function(err, podPackUrl, stderr) {
        if (err) return cb(err, null)
        console.log("error =" + err + '\n' + stderr);

        var podPackUrls = podPackUrl.toString().split("\n");
        var carrierInfo = {};

        podPackUrls.forEach(function(row) {
            var carriers = [];
            carriers = row.split("||");

            if (carriers[0] != '') {
                carrierInfo[carriers[0]] = {};
                carrierInfo[carriers[0]].carrierName = carriers[1]
                carrierInfo[carriers[0]].URL = carriers[2]
                carrierInfo[carriers[0]].hasPodImage = carriers[3]

                if (carriers[4] != null && carriers[4] != "") {
                    carrierInfo[carriers[0]].packpodURL = LegacyIntURL;
                    carrierInfo[carriers[0]].hasPackList = 1

                    var packlist = carriers[4].split(" ");
                    carrierInfo[carriers[0]].contRep = packlist[0]
                    carrierInfo[carriers[0]].getixosdoc = packlist[1]
                    if (packlist[2] == '{}') {
                        packlist[2] = ""
                    }
                    carrierInfo[carriers[0]].compId = packlist[2]
                    carrierInfo[carriers[0]].contenttype = packlist[3]
                } else {
                    carrierInfo[carriers[0]].hasPackList = 0
                }
            }
        });

        return cb(null, carrierInfo);
    });
}

module.exports.getDeliveryComment = function(shipmentNos, order_no, db, cb) {

    filter.addIn(shipmentNos, "backlog_ship.shipment_no");

    var sqlString = "select delivery_status from backlog_ship \
                     where legacy_order_no = :1 \
                     and " + filter.where + " \
                     and delivery_status is not null ";

    db.execute(sqlString, [order_no], function(err, delvstatus) {

        if (delvstatus != "" && delvstatus.length != 0) {
            if (err) return cb(err, null);
            return cb(null, delvstatus);
        } else {
            return cb(delvstatus, null);
        }
    });
}

module.exports.mycomparator = function(a, b) {
    return parseInt(a.item_subitem) - parseInt(b.item_subitem);
}
