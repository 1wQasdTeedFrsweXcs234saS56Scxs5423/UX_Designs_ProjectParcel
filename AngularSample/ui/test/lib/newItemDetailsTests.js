var mockDB=require("../TestDB");
var should  = require('should');
var assert  = require('assert');
var itemDetails     = require('../../lib/newItemDetails');

var bunyan = require('bunyan');

describe('addExternalScheduleLine', function() {
  var consolidatedStati;

  var sapSys="'SAP-R01',";
  var log ="";
  var item={};

  before(function(done) {

    item={"status":"cancelled","sched_line_qty":10,"shipped_at":"",
              "sched_delv_date":"","shipped_at":"","invoice_no":"123455",
              "invo_actual":"","sched_ship_date":"","pod_at":"","shipment_no":"H123444"};

    var sapSys="'SAP-R01'";
    done();
  });

  it('should have internal schedule line ', function(done) {
      var schedLines=[];
      schedLines=itemDetails.addExternalScheduleLine(schedLines, item);
      schedLines[0].should.have.property('status');
      schedLines[0]['status'].should.equal("cancelled");
      done();
  });
});

describe("makeHoldCodes",function() {
    var item = {};
    var HoldCodes = [
      { 'REGE|SAP-R01': 'Shipping/Merge:REGE - Registered with ERROR' }
    ]
    before(function(done) {
        done();
    });
    it('should have REGE ', function(done) {
        HoldCodes = [
            { 'REGE|SAP-R01': 'Shipping/Merge:REGE - Registered with ERROR' }
        ];
        item = {
            "stati": "REGH Cstd REGE",
            "system":"SAP-R01"
        };
        var itemHoldCodes=[];
        itemHoldCodes=itemDetails.makeHoldCodes(item, HoldCodes);
        itemHoldCodes[0].should.equal('Shipping/Merge:REGE - Registered with ERROR');
        done();
    });
    it('should have  itemHoldCodes length 0" ', function(done) {
        HoldCodes = [];
        item = {
            "stati": "REGH Cstd REGE",
            "system":"SAP-R01"
        };
        var itemHoldCodes=[];
        itemHoldCodes=itemDetails.makeHoldCodes(item, HoldCodes);
        itemHoldCodes.length.should.equal(0);
        done();
    });
    it('should have  itemHoldCodes length 0" ', function(done) {
        HoldCodes = [];
        item = {
            "stati": "",
            "system":"SAP-R01"
        };
        var itemHoldCodes=[];
        itemHoldCodes=itemDetails.makeHoldCodes(item, HoldCodes);
        itemHoldCodes.length.should.equal(0);
        done();
    });
});
describe("makeInfoCodes",function() {
    var item = {};
    var HoldCodes = [
      { 'REGE:SAP-R01': 'Shipping/Merge:REGE - Registered with ERROR' }
    ]
    before(function(done) {
        done();
    });
    it('should have REGE ', function(done) {
        HoldCodes = [
            { 'REGE:SAP-R01': 'Shipping/Merge:REGE - Registered with ERROR' }
        ];
        item = {
            "stati": "REGH Cstd REGE",
            "system":"SAP-R01"
        };
        var itemHoldCodes=[];
        itemHoldCodes=itemDetails.makeInfoCodes(item, HoldCodes);
        itemHoldCodes[0].should.equal('Shipping/Merge:REGE - Registered with ERROR');
        done();
    });
    it('should have  itemHoldCodes length 0" ', function(done) {
        HoldCodes = [];
        item = {
            "stati": "REGH Cstd REGE",
            "system":"SAP-R01"
        };
        var itemHoldCodes=[];
        itemHoldCodes=itemDetails.makeInfoCodes(item, HoldCodes);
        itemHoldCodes.length.should.equal(0);
        done();
    });
    it('should have  itemHoldCodes length 0" ', function(done) {
        HoldCodes = [];
        item = {
            "stati": "",
            "system":"SAP-R01"
        };
        var itemHoldCodes=[];
        itemHoldCodes=itemDetails.makeInfoCodes(item, HoldCodes);
        itemHoldCodes.length.should.equal(0);
        done();
    });
});

describe("Get Product Chars",function() {

    var sqlstr = "";

    before(function(done) {
        mockDB.testdbConn(function(db) {
            sqlstr = "INSERT ALL   \
                        INTO BACKLOG_ITEM_CHARAC \
                        (LEGACY_ORDER_NO, ITEM_SUBITEM, SO_ITEM_NO, ID, VALUE, LINE) \
                        Values ('US004000000031', '10', '10', 'CIT_PRODUCT_02', '10185854C', 3)  \
                        INTO BACKLOG_ITEM_CHARAC \
                        (LEGACY_ORDER_NO, ITEM_SUBITEM, SO_ITEM_NO, ID, VALUE, LINE) \
                        Values ('US004000000031', '10', '10', 'CIT_FEATURE_02', '1013172', 2) \
                        INTO BACKLOG_ITEM_CHARAC  \
                        (LEGACY_ORDER_NO, ITEM_SUBITEM, SO_ITEM_NO, ID, VALUE, LINE) \
                        Values ('US004000000031', '20', '20', 'BILLINGTYPE_99999', '123456789',2) \
                        SELECT 1 FROM dual";
            db.execute(sqlstr,[],function(err,rows) {
            db.close();
            done();
            });
        });
    });

    it('should  Item Charactaeristics have 10 and length should be 2" ', function(done) {
        mockDB.testdbConn(function(db) {
            itemDetails.getProductChars('US004000000031',db, function(err,itemCharacs) {
                itemCharacs.should.have.property('10');
                itemCharacs['10'][0].should.have.property('charac_id');
                itemCharacs['10'].length.should.equal(2)
                db.close();
                done();
            });
        });
    });

    it('should  Item Charactaeristics have 20 and length should be 1" ', function(done) {
        mockDB.testdbConn(function(db) {
            itemDetails.getProductChars('US004000000031',db, function(err,itemCharacs) {
                itemCharacs.should.have.property('20');
                itemCharacs['20'][0].should.have.property('charac_id');
                itemCharacs['20'].length.should.equal(1)
                db.close();
                done();
            });
        });
    });

    after(function(done) {
        mockDB.testdbConn(function(db) {
            var sqlStr= "Delete from BACKLOG_ITEM_CHARAC";
            db.execute(sqlStr,[],function(err,rows) {
                db.close();
                done();
            });
        });
    });
});

describe("get order comments",function() {
    var sqlstr=""
    before(function(done) {
        mockDB.testdbConn(function(db) {
            sqlstr="Insert into ORDER_COMMENTS \
                    (LEGACY_ORDER_NO, ITEM_NO, NAME, LINE, VISIBILITY, COMMENT_TEXT) \
                    Values ('140101T50WN161', '2', 'line-laug1', 2, 'E','test-laug1')"
            db.execute(sqlstr,[],function(err,rows) {
                db.close();
                done();
            });
        });
    });
    it('getOrderComments  ', function(done) {
        mockDB.testdbConn(function(db) {
            itemDetails.getOrderComments('140101T50WN161',db, function(err,UDFText) {
                UDFText.should.have.property('2');
                db.close();
                done();
            });
        });
    });
    after(function(done) {
        mockDB.testdbConn(function(db) {
            var sqlStr= "Delete from ORDER_COMMENTS";
            db.execute(sqlStr,[],function(err,rows) {
                db.close();
                done();
            });
        });
    });

});
/*
describe("Get Item Details",function() {
    this.timeout(150000);
    before(function(done) {
        mockDB.testdbConn(function(db) {
               var sqlstr = "INSERT  \
                    INTO  BACKLOG_ITEM (DELIVERY_GROUP, LEGACY_ORDER_NO, ITEM_SOURCE, SYSTEM, SO_NO,    \
                    ITEM_SLN, SO_ITEM_NO, ITEM_SUBITEM, HIGHER_LEVEL, SO_LINE_ITEM_QTY, SCHED_LINE_QTY, SCHED_LINE_NO,    \
                   MATERIAL_NO, PRODUCT_DESCR, MATERIAL_TYPE, SUPP_PROD, PROD_HIERARCHY, NET_VALUE, NET_PRICE, DLR_NET_PRICE,   \
                    BUNDLE_PRICE, BUNDLE_DLR_PRICE, CURRENCY, STATUS, EXT_SDD_COMMENT,     BUSINESS_UNIT, SUPPLIER, FIRST_TBA_FLAG,  \
                     FIRST_TBA_SENT, LACK_TBA_FLAG, LAST_ACK_SENT, LAST_CHANGE_ORDER, ASAP, CURRENT_FCT, LAST_RC, LAST_HEART_RC,   \
                     FIRST_PO_RC, LAST_SAP_RC, FIRST_PO_RC_USER, LAST_SAP_RC_USER, LAST_ROOT_MATERIAL, ROOT_MATERIAL_PL, LAST_PI_PO,  \
                     OTD_VIOLATION_FPO, KPL_STATUS, KPL_RC, BT_GOAL_CRIT, BT_GOAL_VALUE, BT_LAD_CRIT, BT_LAD_VALUE,  \
                    BT_FACK_CRIT, BT_FACK_VALUE, BT_LACK_CRIT, BT_LACK_VALUE, PD_GOAL_CRIT,  \
                    PD_GOAL_VALUE, PD_LAD_CRIT, PD_LAD_VALUE, PD_FACK_CRIT, PD_FACK_VALUE,   \
                    PD_LACK_CRIT, PD_LACK_VALUE, LAST_UPDATE, PLANT_CODE, OPEN_QTY,     \
                    SHIPPED_QTY, IS_VALID, SALES_ORG, CLEAN_DATE, RESELLER_ORDER,        \
                     CAREPACK_ITEM, AUTOREG_FLAG, TAX_AMOUNT, ACK_DATE_HIS, NUM_OF_ACKS,  \
                    NUM_OF_HIDDEN_ACKS, NUM_OF_SDDS, NUM_OF_SSDS, HIDDEN_ACK_DATE_HIS, PAYMENT_TERMS,  \
                    SHOW_PRICES, CUSTOMER_FACING_ITEM, ITEM_CATEGORY, MANUAL_ACK_USED, TELCO_FLAG,      \
                    SC_COMMIT_SOURCE, SC_COMMIT_HIS, SC_COMMIT_SENT, NUM_OF_SC_COMMIT, ISLOGISTICALSKU,  \
                    B2B_FLAG, SUPPLIER_MFGSO, PLANT_CODE_MFGSO, SYSTEM_MFGSO, SO_ITEM_NO_MFGSO,  \
                    SO_NO_MFGSO, ORDER_NO_MFGSO)   values             \
                    ('US004000000031-10-1', 'US004000000031', 'HPSB', 'SAP-PW1', '4000000031',  \
                '10,1', '10', '10', '0', 1, 1, '1', '1012400C', 'Dummy W ACA: Governance Archive Offering', 'Z3TC',  \
                'N', '0', 0, 0, 0, 0, 0, 'USD', 'Processing', 'date will follow',  \
                'OTHER', '3OSW', 'Y', TO_DATE('12/02/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), 'Y',  \
                TO_DATE('12/02/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('11/29/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'),  \
                'N', -1, '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', -1, '?', -1,  \
                '?', -1, '?', -1, '?', -1, '?', -1, '?', -1,   \
                '?', -1, TO_DATE('01/08/2014 15:54:24', 'MM/DD/YYYY HH24:MI:SS'), '3OSW', 1, 0, 'Y', 'US00', \
                 TO_DATE('11/29/2013 07:18:00', 'MM/DD/YYYY HH24:MI:SS'), 'N', 'N', 'N', 0, '1389196456 {} 2013-12-02 Default', 0, \
                0, 0, 0, '1389196456 {} 2013-12-02 Default', 'NT30', 'N', 'N', 'Z3TC', 'N', 'N',  \
                'SAP-PW1-SO', '{1389196456 {} 2013-12-02 {} {} SAP-PW1-SO}', TO_DATE('12/02/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), 0, 'N', \
                'N:OM-fulf', '3OSW', '3OSW', 'SAP-PW1', '10', '4000000031', '4000000031')";
        var sqlstr1= "INSERT INTO BACKLOG_SHIP \
               (SHIPMENT_GROUP, LEGACY_ORDER_NO, ORDER_NO, REF_DOCU_NO, SOURCE,  \
                SALES_ORG, SHIP_TO, SHIP_STATUS, SHOW_EXTERN, CUSTOMER_ORDER,  \
                CUSTOMER_NO, CUSTOMER_NO_KEY, CUSTOMER_NO_TYPE, INVOICE_TO_PARTY, CUSTOMER_NAME,  \
                CUSTOMER_PO_NO, PURCH_AGREE, SHIP_TO_WCC, PURCH_AGENT, HP_RECEIVE_DATE,  \
                TBA_FLAG, SDD_COMMENT, STATUS, STATUS_SEQ, STATUS_REF_TIME,  \
                PROCESSING_AT, HAS_DLV_DATE_HIST, S_DELV_DT_1_SENT, S_SDD_COMMENT_1, ORIGIN,  \
                LAST_CHECK, LAST_UPDATE, IS_VALID, RESELLER_ORDER, CONTRACT_SLA_DATE,  \
                SHIP_TO_REGION, SHIP_ZONE, SHIP_TO_CITY) \
             Values ('US004000000031-10-1', 'US004000000031', '4000000031', '4000000031', 'HPSB',  \
                'US00', '0700000025', 'NS', 'N', 'N', '0700000025', 'US00-0700000025', 'VI', '0700000025', 'Rackspace Us, Inc.',  \
                'test', '0100000480', '100', 'TX7821807', TO_DATE('11/29/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'),  \
                '?', 'date will follow', 'Processing', '0', TO_DATE('11/29/2013 07:18:50', 'MM/DD/YYYY HH24:MI:SS'),  \
                TO_DATE('11/29/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), 'N', TO_DATE('01/08/2014 00:00:00', 'MM/DD/YYYY HH24:MI:SS'),  \
                'date will follow', 'US', TO_DATE('01/08/2014 15:54:24', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('01/08/2014 15:54:24', 'MM/DD/YYYY HH24:MI:SS'),  \
                'Y', 'N', TO_DATE('12/13/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), 'TX', '782182117', 'WINDCREST BEXAR')"


        var sqlstr2= "INSERT INTO BACKLOG_DELV  \
           (LEGACY_ORDER_NO, ORDER_NO, SOURCE, SALES_ORG, DELIVERY_GROUP,  \
            SHIPMENT_GROUP, SHIP_TO, SO_NO, MERGING_GROUP, ASAP,  \
            SUPPLIER, PRODUCT_LINES, BUSINESS_UNIT, NET_VALUE, NET_PRICE,  \
            DLR_NET_PRICE, CURRENCY, STATUS, SHIP_STATUS, DELIVERY_STATUS,  \
            STATUS_REF_TIME, QUICKSHIP_CLASS, QS_CLASS_PRIO, GOAL_FCT, CURRENT_FCT,  \
            IPT, LAST_PROBLEM, CUM_HOLD_TIME, SHIP_TO_ADDR_1, SHIP_TO_ADDR_2,    \
            SHIP_TO_ADDR_3, SHIP_TO_ADDR_4, SHIP_TO_WCC, SHIP_ZONE, ORDER_LOAD_DATE,   \
            HP_RECEIVE_DATE, NR_PUSH_OUTS, NR_PULL_INS, LAST_CO_REASON, LAST_REACK_REASON,   \
            FIRST_TBA_FLAG, FIRST_TBA_SENT, LACK_TBA_FLAG, LAST_ACK_SENT, TBA_FLAG,    \
            SDD_COMMENT, LAST_RC, LAST_HEART_RC, FIRST_PO_RC, LAST_SAP_RC,     \
            FIRST_PO_RC_USER, LAST_SAP_RC_USER, LAST_ROOT_MATERIAL, ROOT_MATERIAL_PL, LAST_PI_PO,   \
            OTD_VIOLATION_FPO, KPL_STATUS, KPL_RC, ACTIVE_EVENT, ACTUAL_GOAL_CRIT,    \
            ACTUAL_GOAL_VALUE, ACTUAL_LAD_CRIT, ACTUAL_LAD_VALUE, ACTUAL_FACK_CRIT, ACTUAL_FACK_VALUE,    \
            ACTUAL_LACK_CRIT, ACTUAL_LACK_VALUE, BT_GOAL_OPT, BT_GOAL_LATEST, BT_GOAL_CRIT,    \
            BT_GOAL_VALUE, BT_LAD_CRIT, BT_LAD_VALUE, BT_FACK_CRIT, BT_FACK_VALUE,    \
            BT_LACK_CRIT, BT_LACK_VALUE, PD_GOAL_OPT, PD_GOAL_LATEST, PD_GOAL_CRIT,     \
            PD_GOAL_VALUE, PD_LAD_CRIT, PD_LAD_VALUE, PD_FACK_CRIT, PD_FACK_VALUE,       \
            PD_LACK_CRIT, PD_LACK_VALUE, DG_GOAL_OPT, DG_GOAL_LATEST, DG_GOAL_CRIT,     \
            DG_GOAL_VALUE, DG_LAD_CRIT, DG_LAD_VALUE, DG_FACK_CRIT, DG_FACK_VALUE,      \
            DG_LACK_CRIT, DG_LACK_VALUE, PGI_GOAL_OPT, PGI_GOAL_LATEST, PGI_GOAL_CRIT,    \
            PGI_GOAL_VALUE, PGI_LAD_CRIT, PGI_LAD_VALUE, PGI_FACK_CRIT, PGI_FACK_VALUE,    \
            PGI_LACK_CRIT, PGI_LACK_VALUE, ERCV_GOAL_OPT, ERCV_GOAL_LATEST, ERCV_GOAL_CRIT,  \
            ERCV_GOAL_VALUE, ERCV_LAD_CRIT, ERCV_LAD_VALUE, ERCV_FACK_CRIT, ERCV_FACK_VALUE,  \
            ERCV_LACK_CRIT, ERCV_LACK_VALUE, ESHP_GOAL_OPT, ESHP_GOAL_LATEST, ESHP_GOAL_CRIT,  \
            ESHP_GOAL_VALUE, ESHP_LAD_CRIT, ESHP_LAD_VALUE, ESHP_FACK_CRIT, ESHP_FACK_VALUE,    \
            ESHP_LACK_CRIT, ESHP_LACK_VALUE, POD_GOAL_CRIT, POD_GOAL_VALUE, POD_LAD_CRIT,     \
            POD_LAD_VALUE, POD_FACK_CRIT, POD_FACK_VALUE, POD_LACK_CRIT, POD_LACK_VALUE,   \
            LAST_UPDATE, IS_VALID, STT, SAT, FTT,  \
            RESELLER_ORDER, BLOCK_OE_CR, BLOCK_OE_CFG, BLOCK_OE_DOC, BLOCK_OE_INFO,  \
            BLOCK_OE_OTH, BLOCK_FF_CFG, BLOCK_FF_DOC, BLOCK_FF_MAT, BLOCK_FF_CAN, \
            BLOCK_FF_CHG, BLOCK_FF_UNS, BLOCK_FF_OTH, BLOCK_SHIP, BLOCK_BILL, \
            SHIP_CONDITIONS, SHIP_TO_REGION, BLOCK_FF_CONS, BLOCK_OE_PRI, BLOCK_OE_PRO,   \
            BLOCK_SHIP_TRA, BLOCK_BILL_INV, BLOCK_OE_EXP, BLOCK_OE_STAX, BLOCK_OE_ACC,  \
            BLOCK_SHIP_MER, BLOCK_FO_SAP, BLOCK_FO_OIS, SHIP_TO_CITY, BLOCK_CAN,  \
            BLOCK_BILL_PART, BLOCK_FF_ALLI, BLOCK_FF_ALLOC, BLOCK_FF_CRED, BLOCK_FF_ESC1,   \
            BLOCK_FF_ESC2, BLOCK_FF_ESC3, BLOCK_FF_FACT, BLOCK_FF_EXP, BLOCK_FF_NPI,  \
            BLOCK_FF_OBS, BLOCK_FF_PLANT, BLOCK_FF_PROD, BLOCK_FF_SHIPM, BLOCK_FF_TBA,  \
            BLOCK_OE_BITF, BLOCK_OE_CONT, BLOCK_OE_CUST, BLOCK_OE_CINS, BLOCK_OE_CRP,   \
            BLOCK_OE_DATA, BLOCK_OE_DEAL, BLOCK_OE_DPRI, BLOCK_OE_DUPO, BLOCK_OE_EORD,    \
            BLOCK_OE_FULCR, BLOCK_OE_LEAS, BLOCK_OE_LIC, BLOCK_OE_MAN, BLOCK_OE_OIS,   \
            BLOCK_OE_OEE, BLOCK_OE_PAY, BLOCK_OE_RES, BLOCK_OE_SO, BLOCK_OE_SERV,   \
            BLOCK_OE_SHIP, BLOCK_OE_SHTO, BLOCK_OE_SKEL, BLOCK_OE_SUPP, BLOCK_OE_VDPS,   \
            BLOCK_SHIP_FO, BLOCK_SHIP_SCH, BLOCK_ST_AWCF, BLOCK_ST_AWCR, BLOCK_ST_AWRP,   \
            BLOCK_ST_FFW, BLOCK_ST_OEW, BLOCK_ST_SHW, BLOCK_OE_CMOV) \
         Values    \
           ('US004000000031', '4000000031', 'HPSB', 'US00', 'US004000000031-10-1',   \
            'US004000000031-10-1', '0700000025', '4000000031', '?', 'N',  \
            '3OSW', '{}', 'OTHER', 1300, 1300,  1300, 'USD', 'Processing', 'NS', 'not shipped',  \
            TO_DATE('11/29/2013 07:18:50', 'MM/DD/YYYY HH24:MI:SS'), 'NonClassified', 1, 10, 0,    \
            0, '?', 0, 'Rackspace Us, Inc.', '5000 WALZEM RD',   \
            'WINDCREST TX 782182117', 'United States', '100', '782182117', TO_DATE('11/29/2013 07:18:50', 'MM/DD/YYYY HH24:MI:SS'),   \
            TO_DATE('11/29/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), 0, 0, '?', '{}',    \
            'Y', TO_DATE('12/02/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), 'Y', TO_DATE('12/02/2013 00:00:00', 'MM/DD/YYYY HH24:MI:SS'), '?',   \
            'date will follow', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', '?', 'none', '?',  0, '?', 0, '?', 0,   \
            '?', 0, TO_DATE('12/13/2013 06:00:00', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('12/13/2013 11:00:00', 'MM/DD/YYYY HH24:MI:SS'), '?',   \
            0, '?', 0, '?', 0,   \
            '?', 0, TO_DATE('12/13/2013 15:00:00', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('12/13/2013 15:00:00', 'MM/DD/YYYY HH24:MI:SS'), '?',   \
            0, '?', 0, '?', 0,    \
            '?', 0, TO_DATE('12/13/2013 16:00:00', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('12/13/2013 16:00:00', 'MM/DD/YYYY HH24:MI:SS'), '?',   \
            0, '?', 0, '?', 0,    \
            '?', 0, TO_DATE('12/13/2013 19:00:00', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('12/13/2013 19:00:00', 'MM/DD/YYYY HH24:MI:SS'), '?',   \
            0, '?', 0, '?', 0,   \
            '?', 0, TO_DATE('12/13/2013 19:00:00', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('12/13/2013 19:00:00', 'MM/DD/YYYY HH24:MI:SS'), '?',    \
            0, '?', 0, '?', 0,   \
            '?', 0, TO_DATE('12/13/2013 19:00:00', 'MM/DD/YYYY HH24:MI:SS'), TO_DATE('12/13/2013 19:00:00', 'MM/DD/YYYY HH24:MI:SS'), '?',   \
            0, '?', 0, '?', 0, '?', 0, '?', 0, '?',  0, '?', 0, '?', 0, TO_DATE('01/08/2014 15:54:24', 'MM/DD/YYYY HH24:MI:SS'), 'Y', 0, 0, 0,  \
            'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'Z9', 'TX', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N',  \
            'N', 'N', 'N', 'WINDCREST BEXAR', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', \
             'N', 'N', 'N', 'N', 'N',   'N', 'N', 'N', 'N', 'N',  'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N',   \
            'N', 'N', 'N', 'N', 'N',  'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N')";

             console.log("heelp")
            db.execute(sqlstr,[],function(err,rows) {
                if(err) console.log(err);
                console.log(rows);
                db.execute(sqlstr1,[],function(err,rows) {
                    if(err) console.log(err);
                    console.log(rows);
                     db.execute(sqlstr2,[],function(err,rows) {
                        if(err) console.log(err);
                        console.log(sqlstr2);
                    });
                });
                db.close();
                done();
            });
        });
    });

    it("get itemddetails array",function(done) {
        this.timeout(150000);
        mockDB.testdbConn(function(db) {

           itemDetails.getItemDetails('US004000000031',db,'in',function(BundleItems,indentaion_flag,haveBundleID,haveConfigID,haveConfigUID) {

                indentaion_flag.should.equal(0);
            });
            db.close();
            done();
        });
    });

    after(function(done) {
        mockDB.testdbConn(function(db) {
            var sqlStr= "Delete from backlog_item";
            var sqlStr1= "Delete from backlog_ship";
            var sqlStr2= "Delete from backlog_ship";
            db.execute(sqlStr,[],function(err,rows) {
                db.execute(sqlStr1,[],function(err,rows) {

                    db.execute(sqlStr2,[],function(err,rows) {

                    });
                });
                db.close();
                done();
            });
        });
    });
});
*/
