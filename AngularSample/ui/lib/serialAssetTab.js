/*----------------------------------------------------------------------------
|
|   Library for route handler /ossui/v1/serialassetinfo
|
|   This file contains modules used by serailAssetInfo webservice.
|
|   written by Alok Upendra Kamat
|   December 2013
|
\---------------------------------------------------------------------------*/

var tclListParser = require('./tcllist');

module.exports.constructSerialAssetInfo = function (dTechInfo, service) {
    var delvNo = "";
    var delvType = "";
    var delvIndex = -1;
    var prevDelv = "";
    var serialAssetInfo = {};
    serialAssetInfo.columns = {};
    serialAssetInfo.delivery = [];

    for (var i = 0; i < dTechInfo.length; i++) {

        /* Allows to display the factory delivery no. for consolidated deliveries
           not being customer shipped yet for internal view. */
        if (dTechInfo[i].shipment_no == null) dTechInfo[i].shipment_no = "";

        if (dTechInfo[i].shipment_no.match(/pseudo/) || dTechInfo[i].shipment_no == "") {
            if (service == "int") {
                delvNo = dTechInfo[i].fact_delv_no;
                delvType = "Factory Delivery";
            } else {
                delvNo = "";
                delvType = "Shipment";
            }
        } else {
            delvNo = dTechInfo[i].shipment_no;
            delvType = "Shipment";
        }

        delvIndex++;
        serialAssetInfo.delivery[delvIndex] = {};

        // Checking if different shipment.
        if (delvNo != prevDelv) {
            serialAssetInfo.delivery[delvIndex].shipment_id = delvNo;
            var prevItem = "";
        } else {
            serialAssetInfo.delivery[delvIndex].shipment_id = "";
        }

        // Parsing and extracting "System Info" data.
        var esn = "";
        var imei = "";
        var iccid = "";
        var secondMAC = "";
        var thirdMAC = "";
        var fourthMAC = "";
        var coOCode = "";
        var coOName = "";
        var iccidActivationKey = "";
        var serialAssetMac = "";
        var systemInfo = "";

        if (dTechInfo[i].system_info) {
            /* The data stored in DB (detail_techinfo.system_info) is TCL friendly.
               Converting it to a format that we can use. */
            systemInfo = tclListParser.Tcl2Array(dTechInfo[i].system_info);

            for (var j = 0; j < systemInfo.length; j = j+2) {
                var key = systemInfo[j];
                var value = systemInfo[j+1];

                switch (key) {
                    case 'ESN':
                        esn = value;
                        break;

                    case 'IMEI':
                        imei = value;
                        break;

                    case 'ICCID1':
                        iccid = value;
                        break;

                    case 'ICCActivationKey':
                        iccidActivationKey = value;
                        break;

                    case 'ScndMACAddr':
                    case '2ndMACAddr':
                        secondMAC = "2nd MAC: " + value;
                        break;

                    case '3rdMACAddr':
                        thirdMAC = "3rd MAC: " + value;
                        break;

                    case '4thMACAddr':
                        fourthMAC = "4th MAC: " + value;
                        break;

                    case 'CoOCode':
                        coOCode = value;
                        break;

                    case 'CoOName':
                        coOName = value;
                        break;

                    default:
                        break;
                }
            }
        }

        // Masking dummy serial numbers.
        if (dTechInfo[i].serial_number == null) dTechInfo[i].serial_number = "";
        if (dTechInfo[i].serial_number.match(/^XX/))
            dTechInfo[i].serial_number = "";

        // Show CoOCode & CoOName only if both have data.
        if (coOCode == "" && coOName != "") {
            coOName = "";
        } else if (coOCode != "" && coOName == "") {
            coOCode = "";
        }

        // Checking if previous item and current item is same or not.
        if (prevItem == dTechInfo[i].item_subitem) {
            serialAssetInfo.delivery[delvIndex].item = "";
            serialAssetInfo.delivery[delvIndex].prod = "";
            serialAssetInfo.delivery[delvIndex].desc = "";
            serialAssetInfo.delivery[delvIndex].coo_excl = "";
            serialAssetInfo.delivery[delvIndex].serial_number = dTechInfo[i].serial_number;
            serialAssetInfo.delivery[delvIndex].asset_tag = dTechInfo[i].asset_tag;
            serialAssetInfo.delivery[delvIndex].first_mac = dTechInfo[i].primary_mac_addr;
            serialAssetInfo.delivery[delvIndex].second_mac = secondMAC;
            serialAssetInfo.delivery[delvIndex].third_mac = thirdMAC;
            serialAssetInfo.delivery[delvIndex].fourth_mac = fourthMAC;
            serialAssetInfo.delivery[delvIndex].esn = esn;
            serialAssetInfo.delivery[delvIndex].imei = imei;
            serialAssetInfo.delivery[delvIndex].iccid = iccid;
            serialAssetInfo.delivery[delvIndex].iccid_act_key = iccidActivationKey;
            serialAssetInfo.delivery[delvIndex].coo_code = coOCode;
            serialAssetInfo.delivery[delvIndex].coo_name = coOName;
            serialAssetInfo.delivery[delvIndex].box_no = dTechInfo[i].box_no;
            serialAssetInfo.delivery[delvIndex].status = dTechInfo[i].status;

        } else {
            serialAssetInfo.delivery[delvIndex].item = dTechInfo[i].item_subitem;
            serialAssetInfo.delivery[delvIndex].prod = dTechInfo[i].material_no;
            serialAssetInfo.delivery[delvIndex].desc = dTechInfo[i].product_descr;
            serialAssetInfo.delivery[delvIndex].coo_excl = dTechInfo[i].coo_exclusion_flag;
            serialAssetInfo.delivery[delvIndex].serial_number = dTechInfo[i].serial_number;
            serialAssetInfo.delivery[delvIndex].asset_tag = dTechInfo[i].asset_tag;
            serialAssetInfo.delivery[delvIndex].first_mac = dTechInfo[i].primary_mac_addr;
            serialAssetInfo.delivery[delvIndex].second_mac = secondMAC;
            serialAssetInfo.delivery[delvIndex].third_mac = thirdMAC;
            serialAssetInfo.delivery[delvIndex].fourth_mac = fourthMAC;
            serialAssetInfo.delivery[delvIndex].esn = esn;
            serialAssetInfo.delivery[delvIndex].imei = imei;
            serialAssetInfo.delivery[delvIndex].iccid = iccid;
            serialAssetInfo.delivery[delvIndex].iccid_act_key = iccidActivationKey;
            serialAssetInfo.delivery[delvIndex].coo_code = coOCode;
            serialAssetInfo.delivery[delvIndex].coo_name = coOName;
            serialAssetInfo.delivery[delvIndex].box_no = dTechInfo[i].box_no;
            serialAssetInfo.delivery[delvIndex].status = dTechInfo[i].status;
        }

        prevItem = dTechInfo[i].item_subitem;
        prevDelv = delvNo;
    }

    // Setting which columns needs to be displayed.
    serialAssetInfo.columns.shipment_id = "N";
    serialAssetInfo.columns.item = "N";
    serialAssetInfo.columns.prod = "N";
    serialAssetInfo.columns.desc = "N";
    serialAssetInfo.columns.coo_excl = "N";
    serialAssetInfo.columns.serial_number = "N";
    serialAssetInfo.columns.asset_tag = "N";
    serialAssetInfo.columns.first_mac = "N";
    serialAssetInfo.columns.second_mac = "N";
    serialAssetInfo.columns.third_mac = "N";
    serialAssetInfo.columns.fourth_mac = "N";
    serialAssetInfo.columns.esn = "N";
    serialAssetInfo.columns.imei = "N";
    serialAssetInfo.columns.iccid = "N";
    serialAssetInfo.columns.iccid_act_key = "N";
    serialAssetInfo.columns.coo_code = "N";
    serialAssetInfo.columns.coo_name = "N";
    serialAssetInfo.columns.box_no = "N";

    for (var i = 0; i < serialAssetInfo.delivery.length; i++) {
        var currRec = serialAssetInfo.delivery[i];

        if (currRec.serial_number != "" && currRec.serial_number !== null) {
            serialAssetInfo.columns.serial_number = "Y";
        } else {

            // Suppressing dummy serial numbers which doesn't have any data.
            if ((currRec.asset_tag == "" || currRec.asset_tag === null) &&
                (currRec.first_mac == "" || currRec.first_mac === null) &&
                (currRec.second_mac == "" || currRec.second_mac === null) &&
                (currRec.third_mac == "" || currRec.third_mac === null) &&
                (currRec.fourth_mac == "" || currRec.fourth_mac === null) &&
                (currRec.esn == "" || currRec.esn === null) &&
                (currRec.imei == "" || currRec.imei === null) &&
                (currRec.iccid == "" || currRec.iccid === null) &&
                (currRec.iccid_act_key == "" || currRec.iccid_act_key === null) &&
                (currRec.coo_code == "" || currRec.coo_code === null) &&
                (currRec.coo_name == "" || currRec.coo_name === null) &&
                (currRec.box_no == "" || currRec.box_no === null)) {
                    serialAssetInfo.delivery.splice(i, 1);
                    i--;
                    continue;
            }
        }

        if (currRec.shipment_id != "" && currRec.shipment_id !== null)
            serialAssetInfo.columns.shipment_id = "Y";

        if (currRec.item != "" && currRec.item !== null)
            serialAssetInfo.columns.item = "Y";

        if (currRec.prod != "" && currRec.prod !== null)
            serialAssetInfo.columns.prod = "Y";

        if (currRec.desc != "" && currRec.desc !== null)
            serialAssetInfo.columns.desc = "Y";

        if (currRec.coo_excl != "" && currRec.coo_excl !== null)
            serialAssetInfo.columns.coo_excl = "Y";

        if (currRec.asset_tag != "" && currRec.asset_tag !== null)
            serialAssetInfo.columns.asset_tag = "Y";

        if (currRec.first_mac != "" && currRec.first_mac !== null)
            serialAssetInfo.columns.first_mac = "Y";

        if (currRec.second_mac != "" && currRec.second_mac !== null)
            serialAssetInfo.columns.second_mac = "Y";

        if (currRec.third_mac != "" && currRec.third_mac !== null)
            serialAssetInfo.columns.third_mac = "Y";

        if (currRec.fourth_mac != "" && currRec.fourth_mac !== null)
            serialAssetInfo.columns.fourth_mac = "Y";

        if (currRec.esn != "" && currRec.esn !== null)
            serialAssetInfo.columns.esn = "Y";

        if (currRec.imei != "" && currRec.imei !== null)
            serialAssetInfo.columns.imei = "Y";

        if (currRec.iccid != "" && currRec.iccid !== null)
            serialAssetInfo.columns.iccid = "Y";

        if (currRec.iccid_act_key != "" && currRec.iccid_act_key !== null)
            serialAssetInfo.columns.iccid_act_key = "Y";

        if (currRec.coo_code != "" && currRec.coo_code !== null)
            serialAssetInfo.columns.coo_code = "Y";

        if (currRec.coo_name != "" && currRec.coo_name !== null)
            serialAssetInfo.columns.coo_name = "Y";

        if (currRec.box_no != "" && currRec.box_no !== null)
            serialAssetInfo.columns.box_no = "Y";
    }

    return serialAssetInfo;
}
