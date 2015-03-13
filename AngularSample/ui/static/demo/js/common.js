function expandOrCollapseCtrl($scope) {

 $scope.collapseAll = true;
 $scope.expandAll = false;
 $scope.expandOrCollapseImg  = [];

 angular.forEach($scope.expandOrCollapsePanelNames, function (panelName) {
   $scope[panelName]=true;
   $scope.expandOrCollapseImg[panelName]  = "./images/row_tb.png";
 });

 $scope.expandOrCollapse = function(panelName, mode) {
   $scope[panelName]=!$scope[panelName];
   if (mode) {
     if (mode=='e') {
        $scope[panelName]=true;
     } else {
        $scope[panelName]=false;
     }
   }
   if ($scope[panelName]) {
     $scope.expandOrCollapseImg[panelName]  = "./images/row_tb.png";
   } else {
     $scope.expandOrCollapseImg[panelName]  = "./images/row_tb_up.png";
   }
 };

 $scope.expandOrCollapseAll = function(mode) {
   $scope.collapseAll = !$scope.collapseAll;
   $scope.expandAll = !$scope.expandAll;
   angular.forEach($scope.expandOrCollapsePanelNames, function (panelName) {
     $scope.expandOrCollapse(panelName, mode);
   });
 };

}

var app=angular.module('ossApp',[]);
app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});


var timeout = 500;
var closetimer = 0;
var ddmenuitem = 0;

function topmenu_open()
{	topmenu_canceltimer();
    topmenu_close();
    ddmenuitem = jQuery(this).find('ul').eq(0).css('visibility', 'visible');}

function topmenu_close()
{	if(ddmenuitem) ddmenuitem.css('visibility', 'hidden');}

function topmenu_timer()
{	closetimer = window.setTimeout(topmenu_close, timeout);}

function topmenu_canceltimer()
{	if(closetimer)
{	window.clearTimeout(closetimer);
    closetimer = null;}}

jQuery(document).ready(function(){
    jQuery('#menu_nv > li').bind('mouseover', topmenu_open);
    jQuery('#menu_nv > li').bind('mouseout',  topmenu_timer);
    jQuery("#item_nav>li").bind("mouseover",topmenu_open);
    jQuery("#item_nav>li").bind("mouseout",topmenu_timer);
    jQuery(".orderNoLink").live("click", function() {
	var orderNo = jQuery(this).attr("id");
	localStorage.setItem("orderNo", orderNo );
	jQuery(location).attr("href", "orderDetail.html?orderNo="+orderNo);
    });
    jQuery(".shipmentNoLink").live("click", function() {
	var shipmentNo = jQuery(this).attr("id");
	localStorage.setItem("shipmentNo", shipmentNo );
	jQuery(location).attr("href", "shipmentInformation.html?shipmentNo="+shipmentNo);
    });
    jQuery(".orderHistory").bind("click", function() {
	var orderNo = jQuery(this).attr("id");
	localStorage.setItem("orderNo", orderNo );
	jQuery(location).attr("href", "orderHistory.html?orderNo="+orderNo);
    });
});

function showTable(id) {
    var bh = $(document).height();
    var bw = $("body").width();
    $("#fullscreen").css({
        height:bh,
        width:bw,
        display:"block"
    });
    var scrolltop=$(document).scrollTop();
    var tops=scrolltop+100;
    $("#"+id).css("top",tops).slideDown();
}
function closeTable(id) {
    $("#fullscreen,#"+id).hide();
}

function setDisplayModel(displayModel) {
	var model = displayModel;
	var dislpaymodel = 'isPanel';
	if(dislpaymodel == model) {
		jQuery('#panelDIV').attr("style", "display:block");
		jQuery('#tableDIV').attr("style", "display:none");
		dislpaymodel = 'isPanel';
	} else {
		jQuery('#tableDIV').attr("style", "display:block");
		jQuery('#panelDIV').attr("style", "display:none");
		dislpaymodel = 'isTable';
	}
}

function switchSrc(model) {
    var srcTabBule = './images/icon_list_blue.png';
    var srcPalBule = './images/icon_panel_blue.png';
    var srcTabGrey = './images/icon_list_grey.png';
    var srcPalGrey = './images/icon_panel_grey.png';
    if(model == 'tabImg') {
	jQuery('#tabImg').attr('src', srcTabBule);
	jQuery('#palImg').attr('src', srcPalGrey);
    } else {
	jQuery('#tabImg').attr('src', srcTabGrey);
	jQuery('#palImg').attr('src', srcPalBule);
    }
}

function changeUrl(url) {
	window.location.href=url;
	window.event.returnValue = false;
}

function exporttoexcel() {
	window.open('data:application/vnd.ms-excel,' + encodeURIComponent(jQuery('#searchResults').html()));
}


angular.module('ctvDemo', []).
  config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when('/summary', {templateUrl: './orderSummary.html',   controller: orderListCtrl}).
      when('/summary/:orderNo', {templateUrl: './orderSummary.html', controller: orderListCtrl}).
      otherwise({redirectTo: '/summary'});
}]);


jQuery("#tableOne th").bind({
        mousemove:function(e){
            var jQueryoff=jQuery(this).position();
            var jQuerywidth=jQuery(this).width();
            var jQueryindex=jQuery(this).index();
            e.stopPropagation();
            jQuery(".throver").show();
            jQuery(".throver").css({
                "width":jQuerywidth+20,
                "left":jQueryoff.left,
                "top":jQueryoff.top
            });
            jQuery(".throver").bind({
                click:function(e){
                    if(jQueryindex==0){
                        jQuery("#th0").siblings().hide();
                        jQuery("#th0").show();
                        jQuery("#th0 ~ ul").hide();
					}
                    else if(jQueryindex==1){
                        jQuery("#th1").siblings().hide();
                        jQuery("#th1").show();
                        jQuery("#th1 ~ ul").hide();
                    }
                    else if(jQueryindex==2){
                        jQuery("#th2").siblings().hide();
                        jQuery("#th2").show();
                        jQuery("#th2 ~ ul").hide();
                    }
                    else if(jQueryindex==3){
                        jQuery("#th3").siblings().hide();
                        jQuery("#th3").show();
                        jQuery("#th3 ~ ul").hide();
                    }
                    else if(jQueryindex==4){
                        jQuery("#th4").siblings().hide();
                        jQuery("#th4").show();
                        jQuery("#th4 ~ ul").hide();
                    }
                    else if(jQueryindex==5){
                        jQuery("#th5").siblings().hide();
                        jQuery("#th5").show();
                        jQuery("#th5 ~ ul").hide();
                    }
                    else if(jQueryindex==6){
                        jQuery("#th6").siblings().hide();
                        jQuery("#th6").show();
                        jQuery("#th6 ~ ul").hide();
                    }
                    else if(jQueryindex==7){
                        jQuery("#th7").siblings().hide();
                        jQuery("#th7").show();
                        jQuery("#th7 ~ ul").hide();
                    }
                    else if(jQueryindex==8){
                        jQuery("#th8").siblings().hide();
                        jQuery("#th8").show();
                        jQuery("#th8 ~ ul").hide();
                    }
                    else if(jQueryindex==9){
                        jQuery("#th9").siblings().hide();
                        jQuery("#th9").show();
                        jQuery("#th9 ~ ul").hide();
                    }
                    else if(jQueryindex==10){
                        jQuery("#th10").siblings().hide();
                        jQuery("#th10").show();
                        jQuery("#th10 ~ ul").hide();
                    }
                    else if(jQueryindex==11){
                        jQuery("#th11").siblings().hide();
                        jQuery("#th11").show();
                        jQuery("#th11 ~ ul").hide();
                    }
                    else if(jQueryindex==12){
                        jQuery("#th12").siblings().hide();
                        jQuery("#th12").show();
                        jQuery("#th12 ~ ul").hide();
                    }
                    else if(jQueryindex==13){
                        jQuery("#th13").siblings().hide();
                        jQuery("#th13").show();
                        jQuery("#th13 ~ ul").hide();
                    }
                    else if(jQueryindex==14){
                        jQuery("#th14").siblings().hide();
                        jQuery("#th14").show();
                        jQuery("#th14 ~ ul").hide();
                    }
                    else if(jQueryindex==15){
                        jQuery("#th15").siblings().hide();
                        jQuery("#th15").show();
                        jQuery("#th15 ~ ul").hide();
                    }
                    else if(jQueryindex==16){
                        jQuery("#th16").siblings().hide();
                        jQuery("#th16").show();
                        jQuery("#th16 ~ ul").hide();
                    }else if(jQueryindex==17){
                        jQuery("#th17").siblings().hide();
                        jQuery("#th17").show();
                        jQuery("#th17 ~ ul").hide();
                    }
                    else if(jQueryindex==18){
                        jQuery("#th18").siblings().hide();
                        jQuery("#th18").show();
                        jQuery("#th18 ~ ul").hide();
                    }
                    else if(jQueryindex==19){
                        jQuery("#th19").siblings().hide();
                        jQuery("#th19").show();
                        jQuery("#th19 ~ ul").hide();
                    }
                    else if(jQueryindex==20){
                        jQuery("#th20").siblings().hide();
                        jQuery("#th20").show();
                        jQuery("#th20 ~ ul").hide();
                    }
                    else if(jQueryindex==21){
                        jQuery("#th21").siblings().hide();
                        jQuery("#th21").show();
                        jQuery("#th21 ~ ul").hide();
                    }
                    else if(jQueryindex==22){
                        jQuery("#th22").siblings().hide();
                        jQuery("#th22").show();
                        jQuery("#th22 ~ ul").hide();
                    }
                    else if(jQueryindex==23){
                        jQuery("#th23").siblings().hide();
                        jQuery("#th23").show();
                        jQuery("#th23 ~ ul").hide();
                    }
                    else if(jQueryindex==24){
                        jQuery("#th24").siblings().hide();
                        jQuery("#th24").show();
                        jQuery("#th24 ~ ul").hide();
                    }
                    else if(jQueryindex==25){
                        jQuery("#th25").siblings().hide();
                        jQuery("#th25").show();
                        jQuery("#th25 ~ ul").hide();
                    }
                    else if(jQueryindex==27){
                        jQuery("#th27").siblings().hide();
                        jQuery("#th27").show();
                        jQuery("#th27 ~ ul").hide();
                    }
                    else if(jQueryindex==28){
                        jQuery("#th28").siblings().hide();
                        jQuery("#th28").show();
                        jQuery("#th28 ~ ul").hide();
                    }
                    else if(jQueryindex==29){
                        jQuery("#th29").siblings().hide();
                        jQuery("#th29").show();
                        jQuery("#th29 ~ ul").hide();
                    }
                    else if(jQueryindex==30){
                        jQuery("#th30").siblings().hide();
                        jQuery("#th30").show();
                        jQuery("#th30 ~ ul").hide();
                    }
                    else if(jQueryindex==31){
                        jQuery("#th31").siblings().hide();
                        jQuery("#th31").show();
                        jQuery("#th31 ~ ul").hide();
                    }
                    else if(jQueryindex==32){
                        jQuery("#th32").siblings().hide();
                        jQuery("#th32").show();
                        jQuery("#th32 ~ ul").hide();
                    }
                    else if(jQueryindex==33){
                        jQuery("#th33").siblings().hide();
                        jQuery("#th33").show();
                        jQuery("#th33 ~ ul").hide();
                    }else if(jQueryindex==34){
                        jQuery("#th34").siblings().hide();
                        jQuery("#th34").show();
                        jQuery("#th34 ~ ul").hide();
                    }
                    else if(jQueryindex==35){
                        jQuery("#th35").siblings().hide();
                        jQuery("#th35").show();
                        jQuery("#th35 ~ ul").hide();
                    }
                    else if(jQueryindex==36){
                        jQuery("#th36").siblings().hide();
                        jQuery("#th36").show();
                        jQuery("#th36 ~ ul").hide();
                    }
                    else if(jQueryindex==37){
                        jQuery("#th37").siblings().hide();
                        jQuery("#th37").show();
                        jQuery("#th37 ~ ul").hide();
                    }
                    else if(jQueryindex==38){
                        jQuery("#th38").siblings().hide();
                        jQuery("#th38").show();
                        jQuery("#th38 ~ ul").hide();
                    }
                    else if(jQueryindex==39){
                        jQuery("#th39").siblings().hide();
                        jQuery("#th39").show();
                        jQuery("#th39 ~ ul").hide();
                    }
                    else if(jQueryindex==40){
                        jQuery("#th40").siblings().hide();
                        jQuery("#th40").show();
                        jQuery("#th40 ~ ul").hide();
                    }
                    else if(jQueryindex==41){
                        jQuery("#th41").siblings().hide();
                        jQuery("#th41").show();
                        jQuery("#th41 ~ ul").hide();
                    }
                    else if(jQueryindex==42){
                        jQuery("#th42").siblings().hide();
                        jQuery("#th42").show();
                        jQuery("#th42 ~ ul").hide();
                    }
                    else if(jQueryindex==43){
                        jQuery("#th43").siblings().hide();
                        jQuery("#th43").show();
                        jQuery("#th43 ~ ul").hide();
                    }
                    else if(jQueryindex==44){
                        jQuery("#th44").siblings().hide();
                        jQuery("#th44").show();
                        jQuery("#th44 ~ ul").hide();
                    }
                    else if(jQueryindex==45){
                        jQuery("#th45").siblings().hide();
                        jQuery("#th45").show();
                        jQuery("#th45 ~ ul").hide();
                    }
                    else if(jQueryindex==46){
                        jQuery("#th46").siblings().hide();
                        jQuery("#th46").show();
                        jQuery("#th46 ~ ul").hide();
                    }
                    else if(jQueryindex==47){
                        jQuery("#th47").siblings().hide();
                        jQuery("#th47").show();
                        jQuery("#th47 ~ ul").hide();
                    }
                    else if(jQueryindex==48){
                        jQuery("#th48").siblings().hide();
                        jQuery("#th48").show();
                        jQuery("#th48 ~ ul").hide();
                    }
                    else if(jQueryindex==49){
                        jQuery("#th49").siblings().hide();
                        jQuery("#th49").show();
                        jQuery("#th49 ~ ul").hide();
                    }else if(jQueryindex==50){
                        jQuery("#th50").siblings().hide();
                        jQuery("#th50").show();
                        jQuery("#th50 ~ ul").hide();
                    }
                    else if(jQueryindex==51){
                        jQuery("#th51").siblings().hide();
                        jQuery("#th51").show();
                        jQuery("#th51 ~ ul").hide();
                    }
                    else if(jQueryindex==52){
                        jQuery("#th52").siblings().hide();
                        jQuery("#th52").show();
                        jQuery("#th52 ~ ul").hide();
                    }
                    else if(jQueryindex==53){
                        jQuery("#th53").siblings().hide();
                        jQuery("#th53").show();
                        jQuery("#th53 ~ ul").hide();
                    }
                    else if(jQueryindex==54){
                        jQuery("#th54").siblings().hide();
                        jQuery("#th54").show();
                        jQuery("#th54 ~ ul").hide();
                    }
                    else if(jQueryindex==55){
                        jQuery("#th55").siblings().hide();
                        jQuery("#th55").show();
                        jQuery("#th55 ~ ul").hide();
                    }
                    else if(jQueryindex==56){
                        jQuery("#th56").siblings().hide();
                        jQuery("#th56").show();
                        jQuery("#th56 ~ ul").hide();
                    }
                    else if(jQueryindex==57){
                        jQuery("#th57").siblings().hide();
                        jQuery("#th57").show();
                        jQuery("#th57 ~ ul").hide();
                    }
                    else if(jQueryindex==58){
                        jQuery("#th58").siblings().hide();
                        jQuery("#th58").show();
                        jQuery("#th58 ~ ul").hide();
                    }
                    else if(jQueryindex==59){
                        jQuery("#th59").siblings().hide();
                        jQuery("#th59").show();
                        jQuery("#th59 ~ ul").hide();
                    }
                    else if(jQueryindex==60){
                        jQuery("#th60").siblings().hide();
                        jQuery("#th60").show();
                        jQuery("#th60 ~ ul").hide();
                    }
                    var jQueryoff=jQuery(this).position();
                    var jQuerywidth=jQuery(this).width();
                    e.stopPropagation();
                    jQuery(".table_info").show();
                    jQuery(".table_info").css({
                        "left":jQueryoff.left,
                        "top":jQueryoff.top+23
                    });
                },
                mouseleave:function(){
                   jQuery(this).hide();
                    jQuery(".table_info").bind({
                        mousemove:function(){
                            jQuery(".throver").show();
                        },
                        mouseleave:function(){
                            jQuery(this).hide();
                            jQuery(".throver").hide();
                        }
                    });
                }
            });
        }
    });

jQuery("#tableTwo th").bind({
        mousemove:function(e){
            var jQueryoff=jQuery(this).position();
            var jQuerywidth=jQuery(this).width();
            var jQueryindex=jQuery(this).index();
            e.stopPropagation();
            jQuery(".throver2").show();
            jQuery(".throver2").css({
                "width":jQuerywidth+20,
                "left":jQueryoff.left,
                "top":jQueryoff.top
            });
            jQuery(".throver2").bind({
                click:function(e){
                    if(jQueryindex==0){
                        jQuery("#th0").siblings().hide();
                        jQuery("#th0").show();
                        jQuery("#th0 ~ ul").hide();
					}
                    else if(jQueryindex==1){
                        jQuery("#th1").siblings().hide();
                        jQuery("#th1").show();
                        jQuery("#th1 ~ ul").hide();
                    }
                    else if(jQueryindex==2){
                        jQuery("#th2").siblings().hide();
                        jQuery("#th2").show();
                        jQuery("#th2 ~ ul").hide();
                    }
                    else if(jQueryindex==3){
                        jQuery("#th3").siblings().hide();
                        jQuery("#th3").show();
                        jQuery("#th3 ~ ul").hide();
                    }
                    else if(jQueryindex==4){
                        jQuery("#th4").siblings().hide();
                        jQuery("#th4").show();
                        jQuery("#th4 ~ ul").hide();
                    }
                    else if(jQueryindex==5){
                        jQuery("#th5").siblings().hide();
                        jQuery("#th5").show();
                        jQuery("#th5 ~ ul").hide();
                    }
                    else if(jQueryindex==6){
                        jQuery("#th6").siblings().hide();
                        jQuery("#th6").show();
                        jQuery("#th6 ~ ul").hide();
                    }
                    else if(jQueryindex==7){
                        jQuery("#th7").siblings().hide();
                        jQuery("#th7").show();
                        jQuery("#th7 ~ ul").hide();
                    }
                    else if(jQueryindex==8){
                        jQuery("#th8").siblings().hide();
                        jQuery("#th8").show();
                        jQuery("#th8 ~ ul").hide();
                    }
                    else if(jQueryindex==9){
                        jQuery("#th9").siblings().hide();
                        jQuery("#th9").show();
                        jQuery("#th9 ~ ul").hide();
                    }
                    else if(jQueryindex==10){
                        jQuery("#th10").siblings().hide();
                        jQuery("#th10").show();
                        jQuery("#th10 ~ ul").hide();
                    }
                    var jQueryoff=jQuery(this).position();
                    var jQuerywidth=jQuery(this).width();
                    e.stopPropagation();
                    jQuery(".table_info2").show();
                    jQuery(".table_info2").css({
                        "left":jQueryoff.left,
                        "top":jQueryoff.top+23
                    });
                },
                mouseleave:function(){
                   jQuery(this).hide();
                    jQuery(".table_info2").bind({
                        mousemove:function(){
                            jQuery(".throver2").show();
                        },
                        mouseleave:function(){
                            jQuery(this).hide();
                            jQuery(".throver2").hide();
                        }
                    });
                }
            });
        }
    });
 
jQuery("#tableThree th").bind({
        mousemove:function(e){
            var jQueryoff=jQuery(this).position();
            var jQuerywidth=jQuery(this).width();
            var jQueryindex=jQuery(this).index();
            e.stopPropagation();
            jQuery(".throver3").show();
            jQuery(".throver3").css({
                "width":jQuerywidth+20,
                "left":jQueryoff.left,
                "top":jQueryoff.top
            });
            jQuery(".throver3").bind({
                click:function(e){
                    if(jQueryindex==0){
                        jQuery("#th0").siblings().hide();
                        jQuery("#th0").show();
                        jQuery("#th0 ~ ul").hide();
					}
                    else if(jQueryindex==1){
                        jQuery("#th1").siblings().hide();
                        jQuery("#th1").show();
                        jQuery("#th1 ~ ul").hide();
                    }
                    else if(jQueryindex==2){
                        jQuery("#th2").siblings().hide();
                        jQuery("#th2").show();
                        jQuery("#th2 ~ ul").hide();
                    }
                    else if(jQueryindex==3){
                        jQuery("#th3").siblings().hide();
                        jQuery("#th3").show();
                        jQuery("#th3 ~ ul").hide();
                    }
                    else if(jQueryindex==4){
                        jQuery("#th4").siblings().hide();
                        jQuery("#th4").show();
                        jQuery("#th4 ~ ul").hide();
                    }
                    else if(jQueryindex==5){
                        jQuery("#th5").siblings().hide();
                        jQuery("#th5").show();
                        jQuery("#th5 ~ ul").hide();
                    }
                    else if(jQueryindex==6){
                        jQuery("#th6").siblings().hide();
                        jQuery("#th6").show();
                        jQuery("#th6 ~ ul").hide();
                    }
                    else if(jQueryindex==7){
                        jQuery("#th7").siblings().hide();
                        jQuery("#th7").show();
                        jQuery("#th7 ~ ul").hide();
                    }
                    else if(jQueryindex==8){
                        jQuery("#th8").siblings().hide();
                        jQuery("#th8").show();
                        jQuery("#th8 ~ ul").hide();
                    }
                    else if(jQueryindex==9){
                        jQuery("#th9").siblings().hide();
                        jQuery("#th9").show();
                        jQuery("#th9 ~ ul").hide();
                    }
                    else if(jQueryindex==10){
                        jQuery("#th10").siblings().hide();
                        jQuery("#th10").show();
                        jQuery("#th10 ~ ul").hide();
                    }
                    var jQueryoff=jQuery(this).position();
                    var jQuerywidth=jQuery(this).width();
                    e.stopPropagation();
                    jQuery(".table_info3").show();
                    jQuery(".table_info3").css({
                        "left":jQueryoff.left,
                        "top":jQueryoff.top+23
                    });
                },
                mouseleave:function(){
                   jQuery(this).hide();
                    jQuery(".table_info3").bind({
                        mousemove:function(){
                            jQuery(".throver3").show();
                        },
                        mouseleave:function(){
                            jQuery(this).hide();
                            jQuery(".throver3").hide();
                        }
                    });
                }
            });
        }
    });

    jQuery(document).click(function(){
        jQuery(".table_info").hide();
        jQuery(".throver").hide();
	jQuery(".table_info2").hide();
        jQuery(".throver2").hide();
	jQuery(".table_info3").hide();
        jQuery(".throver3").hide();
    });

