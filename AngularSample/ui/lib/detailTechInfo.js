/*----------------------------------------------------------------------------
|
|   Library for route handler /ossui/v1/dtechinfo
|
|   This file contains modules used by detailTechInfo webservice.
|
|   written by Alok Upendra Kamat
|   September 2013
|
\---------------------------------------------------------------------------*/

var tclListParser = require('./tcllist');

module.exports.constructSerialAssetInfo = function (dTechInfo, service) {
    var delvNo = "";
    var delvType = "";
    var delvIndex = -1;
    var prevDelv = "";
    var serialAssetInfo = {};
    serialAssetInfo.delivery = [];

    for (var i = 0; i < dTechInfo.length; i++) {

        /* Allows to display the factory delivery no. for consolidated deliveries
           not being customer shipped yet for internal view. */
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

        // Checking if different shipment.
        if (delvNo != prevDelv) {
            delvIndex++;
            serialAssetInfo.delivery[delvIndex] = {};
            serialAssetInfo.delivery[delvIndex].delvNo = delvNo;
            serialAssetInfo.delivery[delvIndex].delvType = delvType;

            // Checking which column needs to be added.
            var hasBoxNo = 0;
            var hasCoOExclusion = 0;
            var hasCoOCodeAndName = 0;

            for (var j = 0; j < dTechInfo.length; j++) {

                if (dTechInfo[j].coo_exclusion_flag
                    && (delvNo == dTechInfo[j].fact_delv_no || delvNo == dTechInfo[j].shipment_no))
                    hasCoOExclusion = 1;

                if (dTechInfo[j].box_no
                    && service == "int"     // Excluding "Box No." column for external view.
                    && (delvNo == dTechInfo[j].fact_delv_no || delvNo == dTechInfo[j].shipment_no))
                    hasBoxNo = 1;

                if (dTechInfo[j].system_info
                    && (delvNo == dTechInfo[j].fact_delv_no || delvNo == dTechInfo[j].shipment_no))
                    if (dTechInfo[j].system_info.match(/CoOCode/) && dTechInfo[j].system_info.match(/CoOName/))
                        hasCoOCodeAndName = 1;
            }

            // Initializing Items.
            serialAssetInfo.delivery[delvIndex].items = [];
            var itemIndex = -1;
            var prevItem = "";
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

        // Constructing "Serial No." column data.
        serialAssetMac = dTechInfo[i].serial_number + " (";

        if (dTechInfo[i].asset_tag) serialAssetMac += dTechInfo[i].asset_tag + " ";

        if (dTechInfo[i].primary_mac_addr) serialAssetMac += dTechInfo[i].primary_mac_addr + " ";

        if (secondMAC != "") serialAssetMac += secondMAC + " ";

        if (thirdMAC != "") serialAssetMac += thirdMAC + " ";

        if (fourthMAC != "") serialAssetMac += fourthMAC + " ";

        serialAssetMac.substr(-1) == "("
            ? serialAssetMac = serialAssetMac.substr(0, serialAssetMac.length - 1)
            : serialAssetMac = serialAssetMac.trim() + ") ";

        if (esn) {
            esn = " WirelessESN: " + esn;
            if (imei) esn = " WWAN IMEI: " + imei + " ICCID: " + iccid + " ActivateKey: " + iccidActivationKey;
            serialAssetMac += esn;
        }

        // Adding Item Data.
        // Checking if previous item and current item is same or not.
        if (prevItem == dTechInfo[i].item_subitem) {

            // Masking dummy serial numbers.
            if (serialAssetMac.match(/^XX/))
                serialAssetInfo.delivery[delvIndex].items[itemIndex].serial.push("");
            else
                serialAssetInfo.delivery[delvIndex].items[itemIndex].serial.push(serialAssetMac.trim());

            if (hasBoxNo)
                serialAssetInfo.delivery[delvIndex].items[itemIndex].box.push(dTechInfo[i].box_no);

            if (hasCoOCodeAndName) {
                if (coOCode && coOName) {
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_code.push(coOCode);
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_name.push(coOName);
                } else {
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_code.push("");
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_name.push("");
                }
            }

        } else {
            itemIndex++;
            serialAssetInfo.delivery[delvIndex].items[itemIndex] = {};
            serialAssetInfo.delivery[delvIndex].items[itemIndex].item = dTechInfo[i].item_subitem;
            serialAssetInfo.delivery[delvIndex].items[itemIndex].prod = dTechInfo[i].material_no;
            serialAssetInfo.delivery[delvIndex].items[itemIndex].desc = dTechInfo[i].product_descr;

            if (hasCoOExclusion)
                serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_excl = dTechInfo[i].coo_exclusion_flag;

            serialAssetInfo.delivery[delvIndex].items[itemIndex].serial = [];
            // Masking dummy serial numbers.
            if (serialAssetMac.match(/^XX/))
                serialAssetInfo.delivery[delvIndex].items[itemIndex].serial.push("");
            else
                serialAssetInfo.delivery[delvIndex].items[itemIndex].serial.push(serialAssetMac.trim());

            if (hasBoxNo) {
                serialAssetInfo.delivery[delvIndex].items[itemIndex].box = [];
                serialAssetInfo.delivery[delvIndex].items[itemIndex].box.push(dTechInfo[i].box_no);
            }

            if (hasCoOCodeAndName) {
                serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_code = [];
                serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_name = [];

                if (coOCode && coOName) {
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_code.push(coOCode);
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_name.push(coOName);
                } else {
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_code.push("");
                    serialAssetInfo.delivery[delvIndex].items[itemIndex].coo_name.push("");
                }
            }
        }

        prevItem = dTechInfo[i].item_subitem;
        prevDelv = delvNo;
    }

    return serialAssetInfo;
}
