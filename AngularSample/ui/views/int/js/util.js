//common function to checking object is empty.
function checkEmpty(addressField){
            var retVal = false;
            var fieldLen = 0;   
            angular.forEach(addressField, function(key, val) {
                    fieldLen++;
                });
                if(fieldLen > 0){
                   retVal = true;
                }
                return retVal;
}
//end
//start convert date dd-mm-yy format     
function dateConversion(dateValue){
        var datArr = dateValue.split("-");
        var conDate = datArr[1]+" "+datArr[0]+", "+datArr[2];
        var date, month;
        dat = new Date(conDate);
        var newDate = dat.getDate().toString();
        var newMonth = (dat.getMonth()+1).toString();
        var newYear = dat.getFullYear().toString().substring(2, 4);
        if(newDate.length > 1){
            date = newDate;
        }
        else{
            date = "0"+newDate;
        }
        if(newMonth.length > 1){
            month = newMonth;
        }
        else{
            month = "0"+newMonth;
        }
        return (date + "-" + month + "-" + newYear);
    }
//end
//start Export HTML table data to Excel
function exportToExcelData(exportTable,tableName){
            var expTable = exportTable;
            var browser = navigator.appName;
            jQuery("#dynamicExportTable").html(expTable);
            jQuery("#dynamicExportTable").hide();
            if (browser == "Microsoft Internet Explorer") {
                  var x= document.getElementById(tableName).rows;
                  var xls = new ActiveXObject("Excel.Application");
                  xls.visible = true;
                  xls.Workbooks.Add;

                  for (i = 0; i < x.length; i++)
                  {
                      var y = x[i].cells;
                      for (j = 0; j < y.length; j++)
                      {
                        xls.Cells( i+1, j+1).Value = y[j].innerText;
                      }
                  }

                  xls.Visible = true;
                  xls.UserControl = true;
                 
                  return xls;
          }else{
                var dt = new Date();
                var day = dt.getDate();
                var month = dt.getMonth() + 1;
                var year = dt.getFullYear();
                var hour = dt.getHours();
                var mins = dt.getMinutes();
                var postfix = day + "." + month + "." + year + "_" + hour + "." + mins;
                var a = document.createElement('a');
                var data_type = 'data:application/vnd.ms-excel';
                a.href = data_type + ', ' + encodeURIComponent(expTable);
                a.download = tableName +"_" + postfix + '.xls';
                a.click();
        }
    }
//end
//date conversion function
function convertDatefromISO(s){
            var day, tz,
            rx=/^(\d{4}\-\d\d\-\d\d([tT ][\d:\.]*)?)([zZ]|([+\-])(\d\d):(\d\d))?$/,
            p= rx.exec(s) || [];
            if(p[1]){
                day= p[1].split(/\D/);
                for(var i= 0, L= day.length; i<L; i++){
                    day[i]= parseInt(day[i], 10) || 0;
                };
                day[1]-= 1;
                day= new Date(Date.UTC.apply(Date, day));
                if(!day.getDate()) return NaN;
                if(p[5]){
                    tz= (parseInt(p[5], 10)*60);
                    if(p[6]) tz+= parseInt(p[6], 10);
                    if(p[4]== '+') tz*= -1;
                    if(tz) day.setUTCMinutes(day.getUTCMinutes()+ tz);
                }
                return day;
            }
            return NaN;
        }
//end

var indexOf = function(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                if(this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle);
}
function merge_options(obj1,obj2){
    var obj3 = {};
    angular.forEach(obj1,function(val,key){
        if (Object.keys(obj2).indexOf(key) > -1) {
            delete obj2[key];
        }
    });
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}
