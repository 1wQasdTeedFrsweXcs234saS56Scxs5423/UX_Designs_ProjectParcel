var app = angular.module('ossApp', ['angularTreeview']).
config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'partials/home.html'
        });
        $routeProvider.when('/in/orderSummary', {
            templateUrl: 'partials/orderSummary.html'
        });
        $routeProvider.when('/in/orderheaderdetail', {
            templateUrl: 'partials/orderDetail.html'
        });
        $routeProvider.when('/in/shipmentInformation/:hpdeliveryno/:legacyNo', {
            templateUrl: 'partials/shipmentInformation.html',
            controller: trackingListCtrl
        });
        $routeProvider.when('/viewReports', {
            templateUrl: 'partials/viewReports.html',
            controller: viewReportsController
        });
        $routeProvider.when('/in/dataMaintainTools', {
            templateUrl: 'partials/dataMaintainTools.html'
        });
        $routeProvider.when('/showCount', {
            templateUrl: 'partials/showCount.html'
        });
        $routeProvider.when('/in/orderHistory', {
            templateUrl: 'partials/orderHistory.html',
        });
        $routeProvider.when('/in/upgradeBrowseAlert', {
            templateUrl: '/int/upgradeBrowseAlert.html'
        });
         $routeProvider.when('/orderBased', {
            templateUrl: 'partials/EventNotification.html'
        });
        $routeProvider.when('/eventOption', {
            templateUrl: 'partials/saveSetUp.html'
        });
        $routeProvider.when('/detailed', {
            templateUrl: 'partials/detailedActive.html'
        });
        $routeProvider.when('/in/CustomerHierarchy', {
            templateUrl:'partials/customerhierarchy.html'
        });
        $routeProvider.when('/in/orderLifeCycle', {
            templateUrl: 'partials/orderLifeCycle.html'
        });
        $routeProvider.when('/advancedSearch', {
            templateUrl: 'partials/advancedSearch.html'
        });
        $routeProvider.when('/in/orderLifeCycleDetails', {
            templateUrl: 'partials/orderLifeCycleDetails.html'
        });
        $routeProvider.when('/in/productDetails/:orderNo/:itemNo/:hpOrderNo', {
            templateUrl: 'partials/productDetails.html'
        });
          $routeProvider.when('/in/shipment', {
            templateUrl: 'partials/shipment.html',
        });
           $routeProvider.when('/in/trackingInformation', {
            templateUrl: 'partials/trackingInformation.html',
        });
          $routeProvider.when('/in/boxInformation', {
            templateUrl: 'partials/boxInformation.html',
        });
          $routeProvider.when('/in/itemInformation', {
            templateUrl: 'partials/itemInformation.html',
        });
          $routeProvider.when('/in/statusHistory', {
            templateUrl: 'partials/statusHistory.html',
        });
          $routeProvider.when('/in/RFID-UID-Information', {
            templateUrl: 'partials/RFID-UID-Information.html',
        });
           $routeProvider.when('/in/shipAddress', {
            templateUrl: 'partials/shipAddressDetails.html',
        });
        $routeProvider.when('/in/itemBox', {
            templateUrl: 'partials/itemBoxPopup.html',
        });
         $routeProvider.when('/in/numbers', {
            templateUrl: 'partials/helpNumbers.html',
        });
        $routeProvider.when('/in/codes', {
            templateUrl: 'partials/helpCodes.html',
        });
        $routeProvider.when('/in/dates', {
            templateUrl: 'partials/helpDates.html',
        });
        $routeProvider.when('/in/status', {
            templateUrl: 'partials/helpStatus.html',
        });
         $routeProvider.when('/in/amount', {
            templateUrl: 'partials/helpAmount.html',
        });
        $routeProvider.otherwise({
            redirectTo: '/'
        });
    }
]);
app.config(function($compileProvider) {
    $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|chrome-extension):/);
});

app.constant('customerrormsgs', function(errString){
    var respString = getErrorMsgs(errString);
    return respString;

 });
function getErrorMsgs(errString){
    if(new RegExp('QueryServerBusy').test(errString)== true){
        return 'Too many records found, please refine your search.'
    }else if(new RegExp('limit reached ! Pre-select found').test(errString)== true){
        return 'Too many records found, please refine your search.'
    }else if(new RegExp('field').test(errString)== true){
        return 'Technical error occurred, please contact support.'
    }else if(new RegExp('Unable to alloc initial memory').test(errString)== true){
        return 'Technical error occurred, please contact support.'
    }else if(new RegExp('Unexpected tokens').test(errString)== true){
        return 'Technical error occurred, please contact support.'
    }else if(new RegExp('Undetermined string').test(errString)== true){
        return 'Technical error occurred, please contact support.'
    }else if(new RegExp('SQLSelectStatement').test(errString)== true){
        return 'Technical error occurred, please contact support.'
    }else if(new RegExp('NonExistingOrder').test(errString)== true){
        return 'No records found.'
    }else if(new RegExp('ORA').test(errString)== true){
        return 'Technical error occurred, please contact support.'
    }else{
        return errString;
    }
}

app.factory('pageTitle', function() {
    var title = 'Home';
    return {
        title: function() {
            return title;
        },
        setTitle: function(newTitle) {
            title = newTitle;
        }
    };
});

app.factory('createDialog', ["$document", "$compile", "$rootScope", "$controller", "$timeout",
    function ($document, $compile, $rootScope, $controller, $timeout) {
        var defaults = {
            id: null,
            template: null,
            templateUrl: null,
            title: 'Default Title',
            backdrop: true,
            success: {label: 'OK', fn: null},
            cancel: {label: 'Close', fn: null},
            controller: null, //just like route controller declaration
            backdropClass: "modal-backdrop",
            footerTemplate: null,
            modalClass: "modal",
            css: {
                top: '100px',
                left: '30%',
                margin: '0 auto'
            }
        };
        var body = $document.find('body');
        return function Dialog(templateUrl/*optional*/, options, passedInLocals) {
            // Handle arguments if optional template isn't provided.
            if(angular.isObject(templateUrl)){
                passedInLocals = options;
                options = templateUrl;
            } else {
                options.templateUrl = templateUrl;
            }
            options = angular.extend({}, defaults, options); //options defined in constructor

            var key;
            var idAttr = options.id ? ' id="' + options.id + '" ' : '';
            var defaultFooter = '<button class="btn" ng-click="$modalCancel()">{{$modalCancelLabel}}</button>' +
            '<button class="btn btn-primary" ng-click="$modalSuccess()">{{$modalSuccessLabel}}</button>';
            var footerTemplate = '<div class="modal-footer">' +
            (options.footerTemplate || defaultFooter) +
            '</div>';
            var modalBody = (function(){
                if(options.template){
                    if(angular.isString(options.template)){
                        return '<div class="modal-body">' + options.template + '</div>';
                    } else {
                        return '<div class="modal-body">' + options.template.html() + '</div>';
                    }
                } else {
                    return '<div class="modal-body" ng-include="\'' + options.templateUrl + '\'"></div>'
                }
            })();
            var modalEl = angular.element(
                '<div class="' + options.modalClass + ' fade"' + idAttr + '>' +
                modalBody +
                '</div>');
            for(key in options.css) {
                modalEl.css(key, options.css[key]);
            }
            var backdropEl = angular.element('<div ng-click="$modalCancel()">');
            backdropEl.addClass(options.backdropClass);
            backdropEl.addClass('fade in');
            var handleEscPressed = function (event) {
                if (event.keyCode === 27) {
                    scope.$modalCancel();
                }
            };

            var closeFn = function () {
                body.unbind('keydown', handleEscPressed);
                modalEl.remove();
                if (options.backdrop) {
                    backdropEl.remove();
                }
            };
            body.bind('keydown', handleEscPressed);
            var ctrl, locals,
            scope = options.scope || $rootScope.$new();
            scope.$title = options.title;
            scope.$modalClose = closeFn;
            scope.$modalCancel = function () {
                var callFn = options.cancel.fn || closeFn;
                callFn.call(this);
                scope.$modalClose();
            };
            scope.$modalSuccess = function () {
                $rootScope.$broadcast("success", 'Y');
                var callFn = options.success.fn || closeFn;
                callFn.call(this);
                scope.$modalClose();
            };
            scope.$modalSuccessLabel = options.success.label;
            scope.$modalCancelLabel = options.cancel.label;

            if (options.controller) {
                locals = angular.extend({$scope: scope}, passedInLocals);
                ctrl = $controller(options.controller, locals);
                modalEl.contents().data('$ngControllerController', ctrl);
            }

            $compile(modalEl)(scope);
            $compile(backdropEl)(scope);
            body.append(modalEl);
            if (options.backdrop) body.append(backdropEl);
            $timeout(function () {
                modalEl.addClass('in');
            }, 200);
        };
    }]);

app.factory('summaryPage', function() {
    var pageUrl = '';
    return {
        getPageUrl: function() {
            return pageUrl;
        },
        setPageUrl: function(latestPageUrl) {
            pageUrl = latestPageUrl;
        }
    };
});


app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        if (input != undefined) {
            return input.slice(start);
        }
    }
});
app.filter('reportFilter', function() {
    return function(items, selectedItem) {
        var outItems = [];
        angular.forEach(items, function(item) {
            if (selectedItem == 'Others') {
                if (jQuery.inArray(item.name, reportNames) == -1) {
                    outItems.push(item);
                }
            } else if (selectedItem == item.name) {
                outItems.push(item);
            } else if (selectedItem == '' || selectedItem == null) {
                outItems.push(item);
            }
        });
        return outItems;
    };
});

app.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});

app.directive('navMenu', ['$parse', '$compile', function($parse, $compile) {
    return {
        restrict: 'C', //Element
        scope:true,
        link: function (scope, element, attrs)
        {
            scope.selectedNode = null;
            scope.$watch( attrs.menuData, function(val)
            {
                var template = angular.element('<ul id="parentTreeNavigation"><li ng-repeat="node in ' + attrs.menuData + '" ng-class="{active:node.active && node.active==true, \'has-dropdown\': !!node.children && node.children.length}"><a ng-href="{{node.href}}" ng-click="{{node.click}}" target="{{node.target}}" >{{node.text}}</a><sub-navigation-tree></sub-navigation-tree></li></ul>');
                var linkFunction = $compile(template);
                linkFunction(scope);
                element.html(null).append( template );
            }, true );
        }
    };
}])
.directive('subNavigationTree', ['$compile', function($compile)
{
    return {
        restrict: 'E', //Element
        scope:true,
        link: function (scope, element, attrs)
        {
            scope.tree = scope.node;
            if(scope.tree.children && scope.tree.children.length )
            {
                var template = angular.element('<ul class="dropdown "><li ng-repeat="node in tree.children" node-id={{node.' + attrs.nodeId + '}}  ng-class="{active:node.active && node.active==true, \'has-dropdown\': !!node.children && node.children.length}"><a ng-href="{{node.href}}" href ng-click="{{node.click}}" target="{{node.target}}" ng-bind-html-unsafe="node.text"></a><sub-navigation-tree tree="node"></sub-navigation-tree></li></ul>');
            //var template = angular.element('<div class="tooltip_corner">&nbsp;</div><ul class="dropdown "><li ng-repeat="node in tree.children" node-id={{node.' + attrs.nodeId + '}}  ng-class="{active:node.active && node.active==true, \'has-dropdown\': !!node.children && node.children.length}"><div ng-click="{{node.click}}"><a href ng-bind-html-unsafe="node.text"></a></div><sub-navigation-tree tree="node"></sub-navigation-tree></li></ul>');
                var linkFunction = $compile(template);
                linkFunction(scope);
                element.replaceWith( template );
            }
            else
            {
                element.remove();
            }
        }
     };
}]);

app.directive("ossCols", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in columnNames" ng-show="{{name.id}}" class="table_details" ' + 'ng-class="{sortedASC: ($parent.reverse==true && $parent.predicate == name.id), ' + 'sortedDESC: ($parent.reverse==false && $parent.predicate == name.id)}" ' + 'ng-click="sortColumn($parent, name.id, name.sort);"><span class="tblHeaderTxt">{{name.value}}</span>' + '<span ng-hide="name.sort"></span><span class="icn_srt" ng-show="name.sort">' + '<a href="javascript:void(0)">&nbsp;</a></span></th>',
        link: function($scope, $element, $attrs) {
            for (var i = 0; i < $scope.columnNames.length; i++) {
                $scope[$scope.columnNames[i].id] = true;
            }
            $scope.sortColumn = function($parent, colId, hasSort) {
                if (hasSort != "false") {
                    $scope.showColSort();
                    $parent.predicate = colId;
                    $parent.reverse = !$parent.reverse;
                    if (!$scope.preSortColumn) $scope.preSortColumn = colId;
                    $scope["sortedTD_" + $scope.preSortColumn] = "";
                    $scope["sortedTD_" + colId] = "sorted";
                    $scope.preSortColumn = colId;
                }
            };
        }
    };
});
app.directive("ossColsLineItems", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in lineItemsColumnNames" class="table_details"><span class="tblHeaderTxt">{{name.value}}</span></th>',
        link: function($scope, $element, $attrs) {
            //console.log($scope.lineItemsColumnNames);
            for (var i = 0; i < $scope.lineItemsColumnNames.length; i++) {
                $scope[$scope.lineItemsColumnNames[i].id] = true;
            }
            $scope.sortColumn = function($parent, colId, hasSort) {
                if (hasSort != "false") {
                    $scope.showColSort();
                    $parent.predicate = colId;
                    $parent.reverse = !$parent.reverse;
                    if (!$scope.preSortColumn) $scope.preSortColumn = colId;
                    $scope["sortedTD_" + $scope.preSortColumn] = "";
                    $scope["sortedTD_" + colId] = "sorted";
                    $scope.preSortColumn = colId;
                }
            };
        }
    };
});


app.directive("ossIndentCols", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in indentColumnNames" ng-show="{{name.id}}" class="table_details"><span class="tblHeaderTxt">{{name.value}}</span></th>',
        link: function($scope, $element, $attrs) {
                    $scope.$on('gotPageData', function(events, data) {
                    $scope.items = data.data;
                    $scope.pageOff = true;
                    $scope.perPage = $scope.items.length;
                    $scope.itemsPerPage = $scope.items.length;
                    $scope.initPagination();
                });

            }
    };
});
app.directive('tab', function () {
  return {
    restrict: 'E',
    replace: true,
    require: '^tabset',
    scope: {
      title: '@',
      templateUrl: '@'
    },
  link: function(scope, element, attrs, tabsetController, shipmentInformationCtrl) {
     /*    scope.$on('tabData', function(events, data) {
                console.log(data);});*/
      tabsetController.addTab(scope);

      scope.select = function () {
        tabsetController.selectTab(scope);
        //console.log(scope);
   // console.log(scope.$parent.ack);
      }

      scope.$watch('selected', function () {
        if (scope.selected) {
         /* var parentScope = element.parent().parent().scope();
          parentScope.templateUrl = scope.templateUrl;*/
          tabsetController.setTabTemplate(scope.templateUrl);
        }
      });
    },
    template:
      '<li ng-class="{active: selected}">' +
        '<a href="" ng-click="select()">{{title}}</a>' +
      '</li>'
  };
});
app.directive('tabset', function () {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    controller: function($scope) {
      $scope.templateUrl = '';
      var tabs = $scope.tabs = [];
      var controller = this;
      var count=0;
   // console.log($scope);
   // console.log($scope.$parent);
      this.selectTab = function (tab) {
        angular.forEach(tabs, function (tab) {
          tab.selected = false;
        });
        tab.selected = true;
      };

      this.setTabTemplate = function (templateUrl) {
       //   count++;
     //   if(count != 1){
            $scope.templateUrl = templateUrl;
     /*   }
        else{
            console.log($scope.eventsFlag);
            $scope.templateUrl = 'partials/EventBasedInfo.html';
        }*/
      }
      this.addTab = function (tab) {
        if (tabs.length === 0) {
          controller.selectTab(tab);
        }
        tabs.push(tab);
      };
    },
    template:
      '<div class="row-fluid">' +
        '<div class="row-fluid">' +
          '<div class="tab nav-tabs" ng-transclude></div>' +
        '</div>' +
        '<div class="row-fluid">' +
          '<div ng-include src="templateUrl"></div>' +
        '</div>' +
      '</div>'
  };
});

app.directive("ossPagination", function() {
    return {
        restrict: 'C',
        template: '<table class="goto"><tr>' + '<td><input type=text maxlength=5 ng-model="pageNo" class="gotoTextBox"></td>' + '<td><span ng-click="gotoPage()" class="button slim primary btn_label_slim">GO</span></td>' + '</tr></table>' + '<div class="num">' + '<span class="font_black">{{recordCount}}</span> items, ' + '<span class="font_black">{{pageCount}}</span> pages' + '</div>' + '<ul>' + '<li ng-class="{disabled: currentPage == 0}">' + '<a href ng-click="prevPage()" class="prevnext"><span class="pag_prev">&nbsp;</span></a>' + '</li>' + '<li ng-repeat="n in range(startIndex,endIndex)" ng-class="{active: n == currentPage}" ng-click="setPage()">' + '<a href ng-bind="n + 1">1</a>' + '</li>' + '<li ng-class="{disabled: currentPage == pageCount - 1}">' + '<a href ng-click="nextPage()" class="prevnext"><span class="pag_next">&nbsp;</span></a>' + '</li>' + '</ul>',
        link: function($scope, elm, attrs) {
            $scope.currentPage = 0;
            $scope.itemsPerPage = 10;
            $scope.pagesToShow = 5;

            $scope.startIndex = 0;
            $scope.endIndex = 5;
            $scope.pageSize = 1000;
            $scope.pageIndex = 0;
            $scope.recordCount = 100;
            $scope.pageCount = 0;
            $scope.pageStart = 1;
            $scope.pageEnd = 1000;

            $scope.pagedItems = [];
            $scope.$on('gotPageData', function(events, data) {
                if (data.data) {
                    $scope.items = data.data;
                    if (data.pageNo && data.pageSize && data.recordCount) {
                        $scope.pageSize = parseInt(data.pageSize);
                        $scope.pageIndex = (parseInt(data.pageNo) - 1) * ($scope.pageSize / $scope.itemsPerPage);
                        $scope.recordCount = parseInt(data.recordCount);
                        $scope.pageStart = ((parseInt(data.pageNo) - 1) * $scope.pageSize) + 1;
                        $scope.pageEnd = parseInt(data.pageNo) * parseInt(data.pageSize);
                    } else {
                        $scope.pageSize = $scope.items.length;
                        $scope.pageIndex = 0;
                        $scope.recordCount = $scope.items.length;
                        $scope.pageStart = 0;
                        $scope.pageEnd = $scope.items.length;
                    }
                    $scope.initPagination();
                    $scope.loadRecordCounts();
                }
            });

            function resetEndIndex() {
                $scope.endIndex = $scope.startIndex + $scope.pagesToShow;
                if ($scope.endIndex > $scope.pageCount) {
                    $scope.endIndex = $scope.pageCount;
                }
            }
            // init the filtered items
            $scope.initPagination = function() {
                $scope.pageCount = Math.ceil($scope.recordCount / $scope.itemsPerPage);
                // now group by pages
                $scope.pagedItems = [];
                for (var i = 0; i < $scope.items.length; i++) {
                    if (i % $scope.itemsPerPage === 0) {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [$scope.items[i]];
                    } else {
                        $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.items[i]);
                    }
                }
                resetEndIndex();
            };

            $scope.range = function(start, end) {
                var ret = [];
                if (!end) {
                    end = start;
                    start = 0;
                }
                for (var i = start; i < end; i++) {
                    ret.push(i);
                }
                return ret;
            };

            function getDataIfRequire() {
                var currentPageEndIndex = ($scope.currentPage + 1) * $scope.itemsPerPage;
                if (currentPageEndIndex < $scope.pageStart || currentPageEndIndex > $scope.pageEnd) {
                    var requiredPageNo = Math.floor(($scope.currentPage * $scope.itemsPerPage) / $scope.pageSize) + 1;
                    $scope.getData(requiredPageNo);
                }
            }
            $scope.prevPage = function() {
                if (($scope.currentPage === $scope.startIndex) && ($scope.startIndex > 0)) {
                    $scope.startIndex = $scope.startIndex - $scope.pagesToShow;
                    resetEndIndex();
                }
                if ($scope.currentPage > 0) {
                    $scope.currentPage--;
                }
                getDataIfRequire();
            };
            $scope.nextPage = function() {
                if ($scope.currentPage < $scope.pageCount - 1) {
                    $scope.currentPage++;
                }
                if ($scope.currentPage === $scope.endIndex) {
                    $scope.startIndex = $scope.startIndex + $scope.pagesToShow;
                    resetEndIndex();
                }
                getDataIfRequire();
            };
            $scope.setPage = function() {
                $scope.currentPage = this.n;
                getDataIfRequire();
            };
            $scope.gotoPage = function() {
                if ($scope.pageNo && $scope.pageNo > 0 && $scope.pageNo <= $scope.pageCount) {
                    $scope.currentPage = $scope.pageNo - 1;
                    if ($scope.currentPage < $scope.startIndex || $scope.currentPage > $scope.endIndex) {
                        $scope.startIndex = $scope.currentPage - ($scope.currentPage % $scope.pagesToShow);
                        resetEndIndex();
                    }
                    $scope.pageNo = "";
                    getDataIfRequire();

                } else {
                    $scope.pageNo = "";
                }
            };
        }
    };
});

app.directive("ossautofilter", function() {
    return {
        restrict: 'A',
        transclude: true,
        template: '<a href id="autoFilterBut" ng-click="showAutoFilter();" class="slim  button secondary btn_label_slim" >auto filter</a>',
        link: function(scope, element, attrs) {
            scope.showAutoFilter = function() {
                scope.autofilterflag = !scope.autofilterflag;
            };
        },
    };
});

app.directive("ossexportexcel", function() {
    return {
        restrict: 'A',
        transclude: true,
        template: '<a href ng-click="exportToExcel();" class="slim  button secondary btn_label_slim" >export to excel</a>',
        link: function(scope, element, attrs) {}
    };
});
app.directive("ossAutoFilterTextBoxes", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in columnNames" ng-show="{{name.id}}" class="autofilterheder">' + '<input type=text ng-model="$parent.search[name.id]" class="form-input js_color_change" style="height:25px;"></th>'
    };
});
app.directive("ossAutoFilterLineItemsTextBoxes", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in lineItemsColumnNames" ng-show="{{name.id}}" class="autofilterheder">' + '<input type=text ng-model="$parent.search[name.id]" class="form-input js_color_change" style="height:25px;"></th>'
    };
});

app.directive("ossswitchtablepanel", function() {
    return {
        restrict: 'A',
        template: '<div style="float:right;" class="js_paging_views paging_views"><div class="js_paging_cnt paging_cnt">View:' + '</div><div class="pag_arrows">' + '<a tabindex="250" class="js_page_back pag_back icn_back_active" href="javascript:void(0)">' + '<span class="icn_pag_list" ng-click="setDisplayModel(\'isTable\');switchSrc(\'palImg\')">&nbsp;</span>' + '</a>' + '<a tabindex="250" class="js_page_forward pag_forward" href="javascript:void(0)">' + '<span class="icn_pag_table" ng-click="setDisplayModel(\'isPanel\');switchSrc(\'palImg\')">&nbsp;</span>' + '</a></div></div>'
    };
});

app.directive("ossreportsswitchtablepanel", function() {
    return {
        restrict: 'A',
        template: '<div style="float:right;" class="js_paging_views paging_views"><div class="js_paging_cnt paging_cnt">View:' + '</div><div class="pag_arrows">' + '<a tabindex="250" class="js_page_back pag_back" href="javascript:void(0)">' + '<span class="icn_pag_list" ng-click="setDisplayModel(\'isTable\');switchSrc(\'palImg\')">&nbsp;</span>' + '</a>' + '<a tabindex="250" class="js_page_forward pag_forward icn_forward_active" href="javascript:void(0)">' + '<span class="icn_pag_table" ng-click="setDisplayModel(\'isPanel\');switchSrc(\'palImg\')">&nbsp;</span>' + '</a>' + '</div></div>'
    };
});
app.directive("osspanel", function(filterFilter) {
    return {
        restrict: 'A',
        template: '<ul ng-repeat="item in pagedItems[currentPage-pageIndex]">' + '<li class="rightpd" style="height:520px;">' + '<div class="whitearea panel-view">' + '<dl class="dotline titleline_blue" style="border-bottom: 1px solid #e8e8e8;margin-bottom:8px;">' + '<dt class="title"><img src="../common/images/list_tb.png"></dt>' + '<dd class="title">' + '<span style="color:#767676;">No:</span>' + '<a class="orderNoLink" href ng-click="redirectToOrderDetails(\'{{item.orderNo}}\');" id="{{item.orderNo}}">{{item.orderNo}}</a>' + '</dd><hr>' + '</dl>' + '<dl ng-repeat="name in columnNames">' + '<dt class="content">{{name.value}} : </dt>' + '<dd class="content" ng-switch on="name.format">' + '<div ng-switch-when="date">{{item[name.id]| date:"yyyy-MM-dd"}}</div>' + '<div ng-switch-default>{{item[name.id]}}</div>' + '</dd>' + '</dl>' + '<a href ng-click="redirectToOrderDetails(\'{{item.orderNo}}\');" class="button slim primary btn_label_slim" style="font-size: 12px; margin-left:-10px!important;" id="{{item.orderNo}}">Details</a>' + '</div>' + '</li>' + '</ul>',
        link: function(scope, elm, attrs) {
            if (attrs.query) {
                scope.filteredData = filterFilter(scope.data, scope.$eval(attrs.query));
            } else {
                scope.filteredData = scope.data;
            }
        }
    };
});
app.directive("profilepanel", function(filterFilter) {
    return {
        restrict: 'A',
        //template: '<ul ng-repeat="item in items">' + '<li class="rightpd" style="height:520px;">' + '<div class="whitearea panel-view">' + '<dl class="dotline titleline_blue" style="border-bottom: 1px solid #e8e8e8;margin-bottom:8px;">' + '<dt class="title"><img src="../common/images/list_tb.png"></dt>' + '<dd class="title">' + '<span style="color:#767676;">No:</span>' + '<a class="orderNoLink" href ng-click="redirectToOrderDetails(\'{{item.relpath}}\');" id="{{item.relpath}}">{{item.relpath}}</a>' + '</dd><hr>' + '</dl>' + '<dl ng-repeat="name in items">' + '<dt class="content">{{name.relpath}} : </dt>' + '<dd class="content" ng-switch on="name.format">' + '<div ng-switch-when="date">{{item[name.id]| date:"yyyy-MM-dd"}}</div>' + '<div ng-switch-default>{{item[name.id]}}</div>' + '</dd>' + '</dl>' + '<a href ng-click="redirectToOrderDetails(\'{{item.orderNo}}\');" class="button slim primary btn_label_slim" style="font-size: 12px; margin-left:-10px!important;" id="{{item.orderNo}}">Details</a>' + '</div>' + '</li>' + '</ul>',
        template: '<div id="boxDiv" ng-repeat="item in items"><div class="box">'+
                        '<div class="boxFirstCol">'+
                            '<div class="circle" ng-show="{{item.watchProfileFlag}}"><img src="../common/images/watchon.png" width="15" height="15"></div>'+
                            '<div class="circle" ng-hide="{{item.watchProfileFlag}}"><img src="../common/images/watchoff.png" width="15" height="15"></div>'+
                         '</div>'+
                        '<div class="boxSecndCol">'+
                            '<div class="txtheading">{{item.relpath}}</div>'+
                            '<div ng-show="{{item.watchProfileFlag}}"><a class="linkText" href ng-click=redirectToSaveProfile("{{item.iobject_name}}","{{item.watchProfileFlag}}","{{item.iobject_id}}")>View Notification</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a class="linkText" href>Info</a></div></div></div></div>'
    }
});
app.directive("ossAddRemoveClm", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<div class="dropDownBtnMainDiv">' + '<div  class="showhideclmDiv" ng-click = "showDropDown()">' + '<span class="fontH4 btnTitle" >View By</span>' + '<span class="fontH7 btnTxt" ng-show="btnTxtShow">All</span>' + '<span class="fontH7 btnTxt" ng-hide="btnTxtShow">Selected Columns</span>' + '<span class="dropDownImg"></span>' + '</div>' + '<div class="clmDropDownMain"  ng-show = "showClmDropDown">' + '<div class="dropDownHeader">' + '<span class="fontH4 dropDownHeaderTxt">Show / Hide Columns</span>' + '<span class="popCloseIcon" ng-click = "showDropDown()"></span>' + '</div>' + '<ul ><li ng-repeat="clmName in columnNames" ><input name="{{clmName.id}}" type="checkbox" value="{{clmName.id}}" ng-click="showHideColumn(\'{{clmName.id}}\');" ng-checked="{{clmName.id}}" class="test"><label  class=\'fontH7 tblClmName\'>{{clmName.value}}</label></li></ul>' + '</div>' + '</div>',
        link: function($scope, $element, $attrs) {
            for (var i = 0; i < $scope.columnNames.length; i++) {
                $scope[$scope.columnNames[i].id] = true;
            }
            $scope.isDisabled = false;
            $scope.showClmDropDown = false;
            $scope.showDisplayOpt = false;
            $scope.btnTxtShow = true;
            // Add/Remove Column
            $scope.showDropDown = function() {
                if ($(".ossAddRemoveClm .clmDropDownMain").is(":visible")) {
                    $(".ossAddRemoveClm .clmDropDownMain").hide();
                } else {
                    $(".ossAddRemoveClm .clmDropDownMain").show();
                }
            }

            $(".showhideclmDiv > a").live("click", function() {});
            $(document).mousedown(function(e) {
                $(".clmDropDownMain").hide();
            });
            $(".showhideclmDiv>a, .clmDropDownMain").mousedown(function(e) {
                e.stopPropagation();
            });

            $scope.showHideColumn = function(id) {
                if ($(".test:checked").length < $scope.columnNames.length) {
                    $scope.btnTxtShow = false;
                } else {
                    $scope.btnTxtShow = true;
                }
                if ($(".test:checked").length < 2) {
                    $(".test:checked").attr("disabled", "disabled");
                    $(".test:checked + label.tblClmName").css("color", "#ccc");
                } else {
                    $(".test:checked").removeAttr("disabled");
                    $("label.tblClmName").css("color", "#4d4d4d");
                }
                $scope[id] = !$scope[id];
            };
            // Add/Remove Column
        }
    };
});

app.directive("ossorderDetailDisplayResultOpt", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<div class="pagination resultsPerPage" ng-show="recCount">' + '<ul>' + '<li ng-repeat="perPageOpt in displayRecordOption" ng-class="{active: perPageOpt==perPage}" ng-click="listRecords({{perPageOpt}})" class="ng-scope"><a href class="ng-binding">{{perPageOpt}}</a>' + '</li>' + '<li ng-click="paginationOff()" ng-class="{active: pageOff}"><a href class="ng-binding">Off</a></li>' + '</ul>' + '</div>',
        link: function($scope, $element, $attrs) {
            $scope.displayRecordOption = [10, 20, 50];
            $scope.recCount = true;
            $scope.loadRecordCounts = function() {
                $scope.perPage = $scope.itemsPerPage;
                if ($scope.items.length > 10) {
                    $scope.recCount = true;
                }
            }
            $scope.listRecords = function(val) {
                $scope.pageOff = false;
                $scope.perPage = val;
                $scope.itemsPerPage = val;
                $scope.initPagination();
            }

            $scope.paginationOff = function() {
                $scope.pageOff = true;
                $scope.perPage = $scope.items.length;
                $scope.itemsPerPage = $scope.items.length;
                $scope.initPagination();
            }
        }
    };
});

app.directive("ossDisplayResultOpt", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<div class="pagination resultsPerPage" ng-show="recCount">' + '<ul>' + '<li ng-repeat="perPageOpt in displayRecordOption" ng-class="{active: perPageOpt==perPage}" ng-click="listRecords({{perPageOpt}})" class="ng-scope"><a href class="ng-binding">{{perPageOpt}}</a>' + '</li>' + '</ul>' + '</div>',
        link: function($scope, $element, $attrs) {
            $scope.displayRecordOption = [10, 20, 50];
            $scope.recCount = true;
            $scope.loadRecordCounts = function() {
                $scope.perPage = $scope.itemsPerPage;
                if ($scope.items.length > 10) {
                    $scope.recCount = true;
                }
            }
            $scope.listRecords = function(val) {
                $scope.perPage = val;
                $scope.itemsPerPage = val;
                $scope.initPagination();
            }
        }
    };
});

app.directive('myDatepicker', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModelCtrl) {
            $(function() {
                element.datepicker({
                    dateFormat: 'dd-M-yy',
                    showOn: "button",
                    buttonImage: "../common/images/ico_calendar.png",
                    buttonImageOnly: true,
                    onSelect: function(dateText, inst) {
                        ngModelCtrl.$setViewValue(dateText);
                        scope.$apply();
                    }
                });
            });
        }
    }
});
app.directive('myDatepickerDateRange', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            $(element).datepicker({
                dateFormat: 'dd-M-yy',
                showOn: "both",
                buttonImage: "../common/images/ico_calendar.png",
                buttonImageOnly: true,
                buttonText: "",
                changeMonth: true,
                onSelect: function(dateText, inst) {
                    $(".homePage .error").slideUp(500);
                    if (attrs.id == 'orderFromDp') {
                        $("#orderToDp").datepicker("option", "minDate", dateText);
                    } else {
                        $("#orderFromDp").datepicker("option", "maxDate", dateText);
                    }
                    scope.$apply(function() {
                        ngModel.$setViewValue(dateText);
                    });
                }
            });

        }
    }
});

app.directive("collapseexpand", function() {

    return {
        restrict: 'C',
        transclude: true,
        template: '<div ng-show="collapseAll" class="ExpColDiv"><a href ng-click="expandOrCollapseAll(\'c\')"><span class="collapseIcon">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span> Collapse All</span></a></div><div ng-show="expandAll" class="ExpColDiv"><a href ng-click="expandOrCollapseAll(\'e\')" class="expandIcon"><span class="expandIcon">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span><span> Expand All</span></a></div>',

        link: function($scope, $element, $attrs) {

            $scope.collapseAll = true;
            $scope.expandAll = false;
            $scope.expandOrCollapseImg = [];

            angular.forEach($scope.expandOrCollapsePanelNames, function(panelName) {
                $scope[panelName] = true;
                $scope.expandOrCollapseImg[panelName] = "expandImg";
            });

            $scope.expandOrCollapse = function(panelName, mode) {
                $scope[panelName] = !$scope[panelName];
                if (mode) {
                    if (mode == 'e') {
                        $scope[panelName] = true;
                    } else {
                        $scope[panelName] = false;
                    }
                }
                if ($scope[panelName]) {
                    $scope.expandOrCollapseImg[panelName] = "expandImg";
                } else {
                    $scope.expandOrCollapseImg[panelName] = "collapseImg";
                }
            };

            $scope.expandOrCollapseAll = function(mode) {
                $scope.collapseAll = !$scope.collapseAll;
                $scope.expandAll = !$scope.expandAll;
                if($scope.detailTable == true){
                        jQuery('.tableDIV').attr("style", "display:none");
                        jQuery('#autoFilterBut').attr("style", "visibility:hidden");
                        jQuery("#viewByAllWithoutRefine").hide();
                        jQuery("#viewByAllWithRefine").hide();
                        jQuery(".showResultsOptBtns").hide();
                        jQuery(".ossPagination").hide();
                        jQuery(".btn_label_slim").hide();
                    }
                angular.forEach($scope.expandOrCollapsePanelNames, function(panelName) {
                    $scope.expandOrCollapse(panelName, mode);
                });
            };
        }
    }
});
app.directive('querytableheaders',function(){
	return {
		restrict: 'A',
        transclude: true,
        template: '<th ng-repeat="name in tableFields" ng-show="showHeaders" style="white-space: nowrap;background-color: #999;font-size: 14px;color: #fff;">&nbsp;{{name}}&nbsp;</th><th ng-show="showHeaders" style="white-space: nowrap;background-color: #999;font-size: 14px;"></th>'
	};
});
app.directive('editquerytableheaders',function(){
	return {
		restrict: 'A',
        transclude: true,
        template: '<th class="table_details"><div class="chckbox" margin: 0px 0px -15px -5px;><span class="chkbox form"><a class="chbx enabl" href="javascript:void(0)"><input name="selectall" id="selectall" value="selectall" ng-model="selectall" type="checkbox" ng-click="selectAll(selectall)"/><label for="selectall" style="margin: -33px 5px 5px 31px;"></label></a></span></div><span class="tblHeaderTxt">Select All</span></th><th ng-repeat="name in tableFields" ng-show="showHeaders" class="table_details"><span class="tblHeaderTxt">&nbsp;{{name}}&nbsp;</span></th>'
	};
});
app.directive('mydrpdown',function(){
	return {
		restrict: 'E',
        transclude: true,
        template: '<select ng-model="Classification" id="Classification" name="Classification"><option ng-repeat="name in predefined_values" value="{{name}}"> {{name}}</option></select>',
		link: function($scope, $element, $attrs) {
					//console.log($attrs);
					//console.log($element);

					angular.forEach($scope.items, function(key,val){//console.log(key+":"+val)
					angular.forEach(key, function(key1,val){//console.log(key+":"+val)
					angular.forEach($scope.items, function(key,val){//console.log(key)
						angular.forEach(key, function(key2,val){
						if(key1 === key2 && val == "BLOCK_CATEGORY")
						{
							//console.log("Key1"+key1+":Value"+val+"Key2"+key2)
							$scope.Classification = key2;
							$('select[name="Classification"]').val(key2);
							//console.log($scope.Classification)
						}
						});
					});
					//console.log($scope.$parent.Classification)
					});

					});
					//angular.forEach($scope.$parent.Classification, function(key,val){console.log(":Value"+val)});
                }
	};
});
app.directive('addrowbutton', function($compile) {
    return {
		transclude: true,
		replace: true,
        template: '<a class="slim button searchBTN primary btn_label" ng-click="addRow()" style="margin: 5px;">Add</a>',
        link: function(scope, element, attr) {
			scope.addRow = function() {
			var compelement = "";
			var compelement1 = "";
			var rowCount = scope.rowCount;
                    compelement = '<div class="fieldDiv" id="column2">';
                    compelement += '	<div class="ddropdown2">';
                    compelement += '		<div class="relative-styled-select">';
                    compelement += '			<div class="relative-dd_border"></div>';
                    compelement += '				<select id="field'+rowCount+'" ng-model="query.field'+rowCount+'" class="selectAdmin">';
                    compelement += '					<option value="">Select</option>';
                    compelement += '					<option ng-repeat="tablecolumn in tablecolumns" value="{{tablecolumn}}">{{tablecolumn}}</option>';
                    compelement += '				</select>';
                    compelement += '		</div>';
                    compelement += '	</div>';
                    compelement += '	<div class="ddropdown2">';
                    compelement += '		<div class="relative-styled-select">';
                    compelement += '			<div class="relative-dd_border"></div>';
                    compelement += '			<select id="op'+rowCount+'" ng-model="query.op'+rowCount+'" class="selectAdmin"><option value="">Select</option>';
                    compelement += '				<option value="=" selected>= </option>';
                    compelement += '				<option value="<>"><></option>';
                    compelement += '				<option value="<"><</option>';
                    compelement += '				<option value=">">></option>';
                    compelement += '				<option value="like">like</option>';
                    compelement += '				<option value="not like">not like</option>';
                    compelement += '				<option value="is null">is NULL</option>';
                    compelement += '				<option value="is not null">is not NULL </option>';
                    compelement += '			</select>';
                    compelement += '		</div>';
                    compelement += '	</div>';
                    compelement += '	<input type="text" id="value'+rowCount+'" ng-model="query.value'+rowCount+'" class="txtfield1">';
                    compelement += '	<div class="removelink">&nbsp;&nbsp;<a class="slim button searchBTN primary btn_label" href ng-click="RemovRow('+rowCount+')" style="margin: 5px;">Remove</a></div>';
                    compelement += '</div>';

                    compelement1 = '<div id="fieldRow'+(rowCount)+'" class="fieldRow" >';
                    compelement1 += '<div class="btnDiv" id="column1">';
                    compelement1 += '		<div class="relative-styled-select">';
                    compelement1 += '			<div class="relative-dd_border"></div>';
                    compelement1 += '			<select id="sel'+(rowCount)+'" ng-model="query.sel'+(rowCount)+'" class="selectAdmin">';
                    compelement1 += '				<option value="">Select</option>';
                    compelement1 += '				<option value="AND" selected>AND</option>';
                    compelement1 += '				<option value="OR">OR</option>';
                    compelement1 += '			</select>';
                    compelement1 += '		</div>';
                    compelement1 += '</div>';
                    compelement1 += '</div>';
                    scope.el = $compile(compelement)(scope);
                    scope.el1 = $compile(compelement1)(scope);
                    $('#dataMaintainToolsForm .dynamicRows').append(scope.el1);
                    $('#dataMaintainToolsForm #fieldRow'+rowCount).append(scope.el);
                    scope.rowCount++;
			}
            scope.RemovRow = function(rowCount) {
				var compelement = $('#dataMaintainToolsForm #fieldRow'+rowCount);
				scope.el = $compile(compelement)(scope);
				var relativeOperators = "op"+rowCount;
				var logicalOperators = "sel"+rowCount;
				var dynamicField = "field"+rowCount;
				var dynamicfieldVal = "value"+rowCount;
				scope.el.remove();
				angular.forEach(scope.query,function(key,value){
					if(value == relativeOperators){
						delete scope.query[value];
					}
					if(value == logicalOperators){
						delete scope.query[value];
					}
					if(value == dynamicField){
						delete scope.query[value];
					}
					if(value == dynamicfieldVal){
						delete scope.query[value];
					}
				});
				scope.rowCount--;
			}
        }
    };
});

app.directive("admintable",function(){
    return{
            restrict: 'A',
            templateUrl: 'showCount'
        };
    });
app.service('legacyOrder', function() {
    var legacyOrderNo = '';
    return {
        getLegacyorderNo: function() {
            return legacyOrderNo;
        },
        setLegacyorderNo: function(newLegacyorderNo) {
            legacyOrderNo = newLegacyorderNo;
        }
    };
});
app.service('rolelist', function() {
    var rolelist = '';
    return {
        getRoleList: function() {
            return rolelist;
        },
        setRoleList: function(newrolelist) {
            rolelist = newrolelist;
        }
    };
});
app.directive("querytable",function(){
    return {
	    	restrict:'C',
			transclude: true,
			template: '<div style="overflow:auto;">'+
            '<table width="100%" cellspacing="1" cellpadding="0" border="0" class="hpTbl">'+
                '<thead><tr querytableheaders></tr></thead>'+
                '<tbody>'+
                    '<tr ng-repeat="item in items">'+
                        '<td ng-repeat="columnName in columnNames">'+
                            '<ng-switch on="isDropDown(columnName)">'+
                            '<span ng-switch-when="false">{{item[columnName]}}</span>'+
                            '<span ng-switch-when="true">'+
                                '<div class="relative-styled-select">'+
                                '<div class="relative-dd_border"></div>'+
                                '<select ng-model="category">'+
                                    '<option ng-repeat="(key,val) in dropDownList" value="{{key}}" ng-selected="key == item[columnName]"> {{val}}</option>'+
                                '</select>'+
                            '</div>'+
                            '</span>'+
                        '</td>'+
                    '</tr>'+
                '</tbody>'+
            '</table>'+
        '</div>'
    };
    });
app.directive("hpcheckboxes",function($compile){
    return{
        restrict:'A',
        transclude:true,
        link:function(scope, element, attrs){
            var jsonkey = attrs.id;
            var modelname = "row_"+attrs.id;
            var template = '<div class="chckbox"><span class="chkbox form"><a class="chbx enabl" href="javascript:void(0)"><input name="row_{{$index}}" id="row_{{$index}}" value="row_{{$index}}" ng-model="'+modelname+'" type="checkbox" ng-click="enableRow(item,'+modelname+','+jsonkey+')"/><label for="row_{{$index}}" style="margin: -33px 5px 5px 31px;"></label></a></span></div>';
            scope.el = $compile(template)(scope);
            element.append(scope.el);
                scope.enableRow = function(item,chkval,jsonkey){
                if(chkval == true){
                    scope.updatedItems[jsonkey] = item;
                }else{
                    delete scope.updatedItems[jsonkey];
                    }
                    //console.log(scope.updatedItems);
                }
            }
        }
    });
app.directive("updatequerytable",function(){
    return {
	    	restrict:'C',
			transclude: true,
			template: '<div style="overflow:auto;">'+
            '<table width="100%" cellspacing="1" cellpadding="0" border="0" class="hpTbl">'+
                '<thead><tr editquerytableheaders></tr></thead>'+
                '<tbody>'+
                    '<tr ng-repeat="item in items">'+
                    '<td><div hpcheckboxes id="{{$index}}"></div></td>'+
                        '<td ng-repeat="columnName in columnNames">'+
                            '<ng-switch on="isDropDown(columnName)">'+
                            '<span ng-switch-when="false"><input type="text" ng-disabled="!rowid" ng-model="item[columnName]"></span>'+
                            '<span ng-switch-when="true">'+
                                '<div class="relative-styled-select">'+
                                '<div class="relative-dd_border"></div>'+
                                '<select ng-model="category" ng-disabled="!rowid">'+
                                    '<option ng-repeat="(key,val) in dropDownList" value="{{key}}" ng-selected="key == item[columnName]"> {{val}}</option>'+
                                '</select>'+
                            '</div>'+
                            '</span>'+
                        '</td>'+
                    '</tr>'+
                '</tbody>'+
            '</table>'+
        '</div>'
    };
    });

app.directive('addmore', function($compile) {
    return {
		transclude: true,
		replace: true,
        template: '<div class="slim button primary btn_label flLeft" style="margin:10px 0 0 91px" ng-click="addRow()">Add More</div>',
		link: function(scope, element, attr) {
			scope.addRow = function() {
			var compelement = "";
			var rowCount = scope.rowCount;


            compelement = '<div class="ddropdown'+rowCount+'" id="ddropdown'+rowCount+'">';
            compelement += '   <select class="dd2" id="resp'+rowCount+'" ng-model="emaildetails.emailType'+rowCount+'">';
            compelement += '		<br><br><br><option value="C">CC</option><option value="T">To</option>';
            compelement += '	</select>';
            compelement += '</div>';
            compelement += '<input type="text" id="emailaddress'+rowCount+'" class="txtfield1" id="aqqq" ng-model="emaildetails.emailaddress'+rowCount+'"/>';
            compelement += '	<div id="removelink'+rowCount+'" class="removelink" style="float: left;">&nbsp;&nbsp;<a href ng-click="RemovRow('+rowCount+')">Remove</a></div>';

            scope.el = $compile(compelement)(scope);

            $('.dynamicRows').append(scope.el);
                scope.rowCount++;
				//console.log(scope.rowCount);
			}
            scope.RemovRow = function(rowCount) {
                var compelement = $('.dynamicRows .ddropdown'+rowCount);
                var compelement1 = $('.dynamicRows #emailaddress'+rowCount);
                var compelement2 = $('.dynamicRows #removelink'+rowCount);
                scope.el = $compile(compelement)(scope);
                scope.el1 = $compile(compelement1)(scope);
                scope.el2 = $compile(compelement2)(scope);
                scope.el.remove();
                scope.el1.remove();
                scope.el2.remove();
                var emailaddress="emailaddress"+rowCount;
                var emailType="emailType"+rowCount;
                //console.log(scope);
                delete scope.emaildetails[emailaddress];
                delete scope.emaildetails[emailType];
               // console.log(scope.emaildetails);
                //angular.forEach(scope.emaildetails,function(key,value){
                scope.rowCount--;
               // console.log(scope.rowCount);

                //});
            }

        }
    };
});
app.directive('addmorebynum', function($compile) {
    return {
        transclude: true,
        replace: true,
        template: '<div style="color: #57BAE8;font-size: 13px;line-height: 26px;cursor: pointer;float:left" ng-click="addNewRows()">Add More</div>',
            link: function(scope, element, attr) {

            scope.addNewRows = function() {
            var compelement = "";
            var rowCountNum = scope.rowCountNum;

            if($("#searchNum"+(rowCountNum-1)).val() == "" || $("#searchName"+(rowCountNum-1)).val() == ""){
                alert("please enter previous input to add more search criteria");
                return false;
            }

            compelement = '<div id="newrown'+rowCountNum+'"><div class="styledSelect flLeft" style="width:183px;overflow:hidden;" >';
            compelement += '<div class="dd_border"></div>';
            compelement += '<select name="searchName" id="searchName'+rowCountNum+'" ng-model="searchByNumbers.searchName'+rowCountNum+'" style="width:203px;background: transparent;">';
            compelement += '<option value=""> Please Select</option>';
            compelement += '<option ng-repeat="(name,val) in SearchbyNumbers"  value="{{name}}">{{val}}</option>';
            compelement += '</select>';
            compelement += '</div>';
            compelement += '<div style="margin-left:6px;float:left" >';
            compelement += '<input style="height: 27px;border: 2px solid #CCC;"type="text" id="searchNum'+rowCountNum+'" class="form-input js_color_change" ng-model="searchByNumbers.searchNum'+rowCountNum+'" ng-enter="isRSFormValid()">';
            compelement += '</div>';
            compelement += '<div style="float:left">';
            compelement += '<span  style="color: #57BAE8;font-size: 13px;line-height: 25px;cursor: pointer;" ng-click="RemoveRow('+rowCountNum+')">Remove</span>';
            compelement += '</div></div>';

            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.searchbynumrows');
            scope.rowCountNum++;
            }
            scope.RemoveRow = function(rowCountNum) {

                var compelement = $('#newrown'+rowCountNum);
                scope.el = $compile(compelement)(scope);
                scope.el.remove();

                var searchName="searchName"+rowCountNum;
                var searchNum="searchNum"+rowCountNum;

                delete scope.searchByNumbers[searchName];
                delete scope.searchByNumbers[searchNum];

                scope.rowCountNum--;

            }
        }
    };
});

app.directive('addmorebycode', function($compile) {
    return {
        transclude: true,
        replace: true,
        template: '<div  style="color: #57BAE8;font-size: 13px;line-height: 26px;cursor: pointer;float:left" ng-click="addNewCodes()">Add More</div>',
            link: function(scope, element, attr) {

            scope.addNewCodes = function() {
            var compelement = "";
            var rowCountCode = scope.rowCountCode;

             if($("#searchCodes"+(rowCountCode-1)).val() == "" || $("#byCodes"+(rowCountCode-1)).val() == "" ){
                alert("please enter previous input to add more search");
                return false;
            }

            compelement = '<div id="newrowc'+rowCountCode+'"><div class="styledSelect flLeft" style="clear:both;width: 185px; overflow:hidden;">';
            compelement += '<div class="dd_border"></div>';
            compelement += '<select name="byCodes" id="byCodes'+rowCountCode+'" ng-model="searchByCodes.searchName'+rowCountCode+'" ng-click="lookupValues('+rowCountCode+')" style="width:205px;background: transparent;">';
            compelement += '<option value=""> Please Select</option>';
            compelement += '<option ng-repeat="(name,val) in SearchbyCodes"  value="{{name}}" >{{name}}</option>';
            compelement += '</select>';
            compelement += '</div>';
            compelement += '<div style="float:left;margin-left:6px;" >';
            compelement += '<input style="height: 27px;border: 2px solid #CCC;"type="text" id="searchCodes'+rowCountCode+'" class="form-input js_color_change" ng-model="searchByCodes.searchNum'+rowCountCode+'" ng-enter="isRSFormValid()" >';
            compelement +=  '</div>';
            compelement +=  '<div ng-show="lookupFlag'+rowCountCode+'" style="float:left">';
            compelement += '<div ng-click="searhByCodes()" ><img src="../../common/images/popupArrow.jpg"></img></div>';
            compelement += '</div>';
            compelement += '<div  style="float:left">';
            compelement += '<div  style="color: #57BAE8;font-size: 13px;line-height: 26px;cursor: pointer;" ng-click="RemoveCodes('+rowCountCode+')">Remove</div>';
            compelement += '</div></div>';

            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.searchbycoderows');
            scope.rowCountCode++;

            }
            scope.RemoveCodes = function(rowCountCode) {

                var compelement = $('#newrowc'+rowCountCode);
                scope.el = $compile(compelement)(scope);
                scope.el.remove();

                var searchName="searchName"+rowCountCode;
                var searchNum="searchNum"+rowCountCode;

                delete scope.searchByCodes[searchName];
                delete scope.searchByCodes[searchNum];

                scope.rowCountCode--;

            }
        }
    };
});

app.directive('addates', function($compile) {
    return {
        transclude: true,
        replace: true,
        template: '<div style="color: #57BAE8;font-size: 13px;line-height:23px;cursor: pointer;margin-left:33px;float:left" ng-click="addNewRow()">Add More</div>',
        link: function(scope, element, attr) {
        scope.addNewRow = function() {
        var compelement = "";
        var rowCountDate = scope.rowCountDate;

        selectedValue=[];
        selectedValue.push($("#byDate"+(rowCountDate-1)).val());

        if($("#sDate"+(rowCountDate-1)).val() == "" || $("#eDate"+(rowCountDate-1)).val() == "" || $("#byDate"+(rowCountDate-1)).val() == ""){
            alert("please enter previous input to add more search");
            return false;
        }

            compelement = '<div id="newrowd'+rowCountDate+'"><div class="styledSelectAmount flLeft" style="clear:both;width:224px;overflow:hidden;">';
            compelement += '<div class="dd_border"></div>';
            compelement += '<select name="byDate" id="byDate'+rowCountDate+'" ng-model="searchByDates.searchName'+rowCountDate+'" ng-change="checkDuplicate('+scope.rowCountDate+');" style="width:244px;background: transparent;">';
            compelement += '<option value="">Please Select</option>';
            compelement += '<option ng-repeat="(dName,dVal) in SearchbyDates"  value="{{dName}}">{{dVal}}</option>';
            compelement += '</select>';
            compelement += '</div>';
            compelement += '<div class="w_advanced left relPos dpDiv" style="width:168px">'
            compelement += '<input style="height: 27px;border: 2px solid #CCC;border: 2px solid #CCC;margin-left: 8px;float:left;" type="text" id="sDate'+rowCountDate+'" class="form-input js_color_change" placeholder="Start Date" ng-model="searchByDates.searchNum'+rowCountDate+'" ng-enter="isRSFormValid()" my-datepicker>';
            compelement += '</div>';
            compelement += '<div class="w_advanced left relPos dpDiv" style="width:168px">';
            compelement += '<input style="height: 27px;border: 2px solid #CCC;border: 2px solid #CCC;margin-left:16px;float:left;width: 95%;" type="text" id="eDate'+rowCountDate+'" class="form-input js_color_change" placeholder="End Date" ng-model="searchByDates.searchVal'+rowCountDate+'" ng-enter="isRSFormValid()" my-datepicker>';
            compelement += '</div>';
            compelement += '<div style="float:left">';
            compelement += '<div  style="color: #57BAE8;font-size: 13px;margin-left:9px;line-height: 23px;cursor: pointer;" ng-click="RemoveDates('+scope.rowCountDate+')">Remove</div>';
            compelement += '</div></div>';

            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.searchaddates');
            scope.rowCountDate++;

            }
            scope.RemoveDates = function(rowCountDate) {

                var compelement = $('#newrowd'+rowCountDate);
                scope.el = $compile(compelement)(scope);
                scope.el.remove();

                var searchName="searchName"+rowCountDate;
                var searchNum="searchNum"+rowCountDate;
                var searchVal="searchVal"+rowCountDate;
                delete scope.searchByDates[searchName];
                delete scope.searchByDates[searchNum];
                delete scope.searchByDates[searchVal];

                scope.rowCountDate--;

            }

            scope.checkDuplicate=function(rowCountDate){
                if(selectedValue.indexOf($("#byDate"+(rowCountDate)).val()) >-1 ){
                    alert("Duplicate values are not allowed");
                    return false;
                } else {
                    selectedValue.push($("#byDate"+(rowCountDate)).val());
                }
            }
        }
    };
});

app.directive('addmorebyamount', function($compile) {
    return {
        transclude: true,
        replace: true,
        template: '<div style="color: #57BAE8;font-size: 13px;display: inline-block;line-height: 23px;cursor: pointer;" ng-click="addNewTotal()">Add More</div>',
        link: function(scope, element, attr) {
        scope.addNewTotal = function() {
            var compelement = "";
            var rowCountAmt = scope.rowCountAmt;

        if($("#amounttax"+(rowCountAmt-1)).val() == "" || $("#amount"+(rowCountAmt-1)).val() == "" || $("#stotal"+(rowCountAmt-1)).val() == ""){
            alert("please enter previous input to add more search");
            return false;
        }

            compelement = '<div id="newrowa'+rowCountAmt+'"><div class="styledSelectAmount flLeft" style="clear:both;width:224px;overflow:hidden;">';
            compelement += '<div class="dd_border"></div>';
            compelement += '<select name="amount" id="amount'+rowCountAmt+'" ng-model="searchByAmount.searchName'+rowCountAmt+'" style="width:244px;background: transparent;">';
            compelement += '<option value="">Please Select</option>';
            compelement += '<option ng-repeat="(aName,aVal) in SearchbyAmount"  value="{{aName}}">{{aName}}</option>';
            compelement += '</select>';
            compelement += '</div>';
            compelement += '<div>';
            compelement += '<div class="styledSelectTax flLeft" style="margin-left:8px;margin-right:10px;width:168px;overflow:hidden;">';
            compelement += '<div class="dd_border"></div>';
            compelement += '<select name="stotal" id="stotal'+rowCountAmt+'" ng-model="searchByAmount.searchNum'+rowCountAmt+'" style="width:188px;background: transparent;">';
            compelement += '<option ng-repeat="(name,val) in Tax" value="{{name}}">{{val}}</option>';
            compelement += '</select>';
            compelement += '</div>';
            compelement += '<div style="float:left;width: 218px;"><input style="height: 27px;border: 2px solid #CCC;float:left;width:159px" type="text"  id="amounttax'+rowCountAmt+'" class="form-input js_color_change" ng-model="searchByAmount.searchVal'+rowCountAmt+'" ng-enter="isRSFormValid()">';
            compelement += '<span style="color: #57BAE8;font-size: 13px;cursor: pointer;display: inline-block; " ng-click="RemoveAmount('+rowCountAmt+')">Remove</span>';
             compelement += '</div>'
            compelement += '</div></div></div>';

            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.searchbyamountrows');
            scope.rowCountAmt++;

            }
            scope.RemoveAmount = function(rowCountAmt) {

                var compelement = $('#newrowa'+rowCountAmt);
                scope.el = $compile(compelement)(scope);
                scope.el.remove();
                var searchName="searchName"+rowCountAmt;
                var searchNum="searchNum"+rowCountAmt;
                var searchVal="searchVal"+rowCountAmt;

                delete scope.searchByAmount[searchName];
                delete scope.searchByAmount[searchNum];
                delete scope.searchByAmount[searchVal];
                scope.rowCountAmt--;
            }
        }
    };
});

app.directive('addmorebyloc', function($compile) {
    return {
        transclude: true,
        replace: true,
        template: '<div style="color: #57BAE8;font-size: 13px;line-height: 27px;cursor: pointer;float:left;margin-left:-17px" ng-click="addNewLoc()">Add More</div>',
            link: function(scope, element, attr) {
            scope.addNewLoc = function() {
            var compelement = "";
            var rowCountLoc = scope.rowCountLoc;

            if($("#byLocation"+(rowCountLoc-1)).val() == "" || $("#country"+(rowCountLoc-1)).val() == ""){
                alert("please enter previous input to continue search");
                return false;
            }

            compelement  = '<div id="newrowl'+rowCountLoc+'">';
                compelement += '<div  class="styledSelect flLeft" style="clear:both;width:183px;overflow:hidden;">';
                    compelement += '<div class="dd_border"></div>';
                    compelement += '<select name="byLocation" id="byLocation'+rowCountLoc+'" ng-model="searchByLocation.searchName'+rowCountLoc+'" ng-click="searchByCountry('+rowCountLoc+')" style="width:203px;background:transparent">';
                        compelement += '<option value="">Please Select</option>';
                        compelement += '<option ng-repeat="(cName,cVal) in SearchbyLocation" value="{{cName}}">{{cName}}</option>';
                    compelement += '</select>';
                compelement += '</div>';

                compelement += '<div ng-show="shipToFlag'+rowCountLoc+'">';
                    compelement += '<div  class="styledSelectAmount flLeft" style="float:left;margin-left: 5px;width:222px; overflow:hidden;">';
                        compelement += '<div class="dd_border"></div>';
                        compelement += '<select name="state" id="state'+rowCountLoc+'" ng-model="searchByLocation.searchCountry'+rowCountLoc+'" style="width:239px;background:transparent;">';
                            compelement += '<option value="">Select</option>';
                            compelement += '<option ng-repeat="(cName,cVal) in countryCodes" value="{{cName}}">{{cVal}}</option>';
                        compelement += '</select>';
                    compelement += '</div>';
                    compelement += '<div style="margin-left:5px;float:left;">';
                        compelement += '<input style="height: 27px;border: 2px solid #CCC;"type="text" id="location'+rowCountLoc+'" class="form-input js_color_change" ng-model="searchByLocation.searchNum'+rowCountLoc+'" ng-enter="isRSFormValid()">';
                    compelement += '</div>';
                    compelement += '<div style="float:left">';
                        compelement += '<span ng-click="searchByShipRegion()" ><img src="../../common/images/popupArrow1.jpg"></img></span>';
                    compelement += '</div>';
                compelement += '</div>';

                compelement += '<div ng-hide="shipToFlag'+rowCountLoc+'">';
                    compelement += '<div style="margin-left:7px;float:left;" >'
                        compelement += '<input style="height: 27px;border: 2px solid #CCC;" type="text" id="country'+rowCountLoc+'" class="form-input js_color_change" ng-model="searchByLocation.searchNum'+rowCountLoc+'" ng-enter="isRSFormValid()">'
                    compelement += '</div>';
                    compelement +=  '<div style="float:left">';
                        compelement += '<span ng-click="searchByLoc()" ><img src="../../common/images/popupArrow.jpg"></img></span>';
                    compelement += '</div>';
                compelement += '</div>';
                compelement += '<div style="float:left">';
                    compelement += '<div style="color: #57BAE8;font-size: 13px;line-height: 25px;cursor: pointer;margin-left:-19px" ng-click="RemoveLocation('+rowCountLoc+')">Remove</div>';
                compelement += '</div>';
            compelement += '</div>';

            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.searchbylocrows');
            scope.rowCountLoc++;
            }
            scope.RemoveLocation = function(rowCountLoc) {

                var compelement = $('#newrowl'+rowCountLoc);
                scope.el = $compile(compelement)(scope);
                scope.el.remove();

                var searchName="searchName"+rowCountLoc;
                var searchNum="searchNum"+rowCountLoc;
                delete scope.searchByLocation[searchName];
                delete scope.searchByLocation[searchNum];

                scope.rowCountLoc--;

            }
        }
    };
});

app.directive('addmorebypor', function($compile) {
    return {
        transclude: true,
        replace: true,
        template: '<div  style="color: #57BAE8;font-size: 13px;line-height: 25px;cursor: pointer;" ng-click="addNewPor()">Add More</div>',
        link: function(scope, element, attr) {
        scope.addNewPor = function() {
        var compelement = "";
        var rowCount = scope.rowCount;
        compelement = '<div id="newrow'+rowCount+'"><div class="styledSelect flLeft" style="width: 42% !important;">';
        compelement += '<div class="dd_border"></div>';
        compelement += '<select name="portal" id="portal'+rowCount+'" ng-model="searchByPortal.searchName'+rowCount+'" style="width: 123%;">';
        compelement += '<option value="">Please Select</option>';
        compelement += '<option ng-repeat="(porName,porVal) in SearchbyPortal" value="{{porName}}">{{porVal}}</option>';
        compelement += '</select>';
        compelement += '</div>';
        compelement += '<div class="two columns rowTitle" style="width: 48% !important;padding-top:0px;margin-left:5px;" >'
        compelement += '<input style="height: 27px;width: 75%"type="text" id="searchPortal" class="form-input js_color_change" ng-model="searchByPortal.searchNum'+rowCount+'" ng-enter="isRSFormValid()">'
        compelement += '</div>'
        compelement += '<div  style="color: #57BAE8;font-size: 13px;display: inline-block;margin-top: 31px;margin-left: 8px;cursor: pointer;" ng-click="RemovePor('+rowCount+')">Remove</div>';
        compelement += '</div></div>';

        scope.el = $compile(compelement)(scope);
        scope.el.appendTo('.searchbyporrows');
        scope.rowCount++;
        }

            scope.RemovePor = function(rowCount) {

                var compelement = $('#newrow'+rowCount);
                scope.el = $compile(compelement)(scope);
                scope.el.remove();
                var searchName="searchName"+rowCount;
                var searchNum="searchNum"+rowCount;

                delete scope.searchByPortal[searchName];
                delete scope.searchByPortal[searchNum];

                scope.rowCount--;

            }
        }
    };
});
app.directive('selectedcodes', function($compile) {
    return {
        restrict:'A',
        transclude: true,
        replace: true,

        link: function(scope, element, attr) {

            var compelement = "";
            var locList = scope.locList;
            var rowCountLoc = scope.rowCountLoc;
            var count = 0;
            compelement = '<select style="width: 100%; height:100%;" multiple="multiple" name="selectedlookup" id="selectedlookup" ng-model="searchByLocation.searchNum'+(rowCountLoc-1)+'" size="10">';

            if(scope.selectedRegions==undefined){
                angular.forEach(locList,function(key,val){
                    compelement +='<option value="'+key.val+'">'+key.name+'</option>';
                });
            }else {
                var len=scope.selectedRegions.length;
                angular.forEach(locList,function(key,val){
                    angular.forEach(scope.selectedRegions,function(i){
                        if(i == key.val){
                            compelement +='<option value="'+key.val+'" style="background-color:yellowgreen" selected>'+key.name+'</option>';
                            scope.regionValue=key.val;
                            delete locList[val];
                        } else {
                            compelement +='<option value="'+key.val+'">'+key.name+'</option>';
                        }
                    });
                });
            }
            compelement +='</select>';
            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.codesdropdown');

        }
    }
});

app.directive('selectedstates', function($compile) {
    return {
        restrict:'A',
        transclude: true,
        replace: true,

        link: function(scope, element, attr) {

            var compelement = "";
            var statesList = scope.statesList;
            var rowCountLoc = scope.rowCountLoc;
            compelement = '<select style="width: 100%; height:100%;" multiple="multiple" name="statesvalue" id="statesvalue" ng-model="searchByLocation.searchNum'+(rowCountLoc-1)+'" size="10">';
            angular.forEach(statesList,function(key,val){
                compelement +='<option value="'+val+'">'+key+'</option>';
            });
            compelement +='</select>';
            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.statesdropdown');

        }
    }
});

app.directive('codeselected', function($compile) {
    return {
        restrict:'A',
        transclude: true,
        replace: true,
        link: function(scope, element, attr) {
            var compelement = "";
            var paymentMethod = scope.paymentMethod;
            var rowCountCode = scope.rowCountCode;
            compelement = '<select style="width: 100%; height:100%;" multiple="multiple" name="codesvalue" id="codesvalue" ng-model="searchByCodes.searchNum'+(rowCountCode-1)+'" size="10">';
            angular.forEach(paymentMethod,function(key,val){
                compelement +='<option value="'+key.val+'">'+key.name+'</option>';
               });
            compelement +='</select>';
            scope.el = $compile(compelement)(scope);
            scope.el.appendTo('.dropdownvalues');

        }
    }
});

app.directive("lastvieworders",function($compile,searchObject){
        return{
            restrict:'A',
            transclude:true,
            template:'<table id="tableOne" cellspacing="0" cellpadding="0" border="1" class="lastvieworderTable">'+
                                '<thead><tr class="tableHeader ossCols"></tr></thead>'+
                                '<tbody>'+
                                '<tr ng-repeat="item in lastvieworders| orderBy:predicate:reverse">'+
                                '<td><a class="orderNoLink"  href="#/in/orderheaderdetail?orderNoFor=OR&orderNo={{item.legacyOrderNo}}" id="{{item.orderNo}}">{{item.orderNo}}</a></td>'+
                                /*'<td><a class="orderNoLink"  href ng-click="redirectToOrderDetails(\'{{item.legacyOrderNo}}\',\'{{item.orderNo}}\')" id="{{item.orderNo}}">{{item.orderNo}}</a></td>'+*/
                                '<td>{{item.purchaseOrderNo}}</td>'+
                                '<td>{{item.status}}</td>'+
                                '<td class="customerNameCls">{{item.customerName}}</td>'+
                                '<td>{{item.customerNo}}</td>'+
                                '<td>{{item.orderType}}</td>'+
                                '<td class="currencyAlign">{{item.totalPrice| currency:""}}</td>'+
                                '<td>{{item.currency}}</td>'+
                                '<td>{{item.lastChange| date:"yyyy-MM-dd"}}</td>'+
                                '</tr>'+
                                '</tbody>'+
                            '</table>',
            link:function($scope,attrs,element,$compile){
                    $scope.redirectToOrderDetails = function(legacyOrderNo,orderNo) {
                    var searchData = {
                        "hpOrderNo" :orderNo,
                        "custPoNo":null,
                        "custId":null,
                        "custName":null,
                        "shipmentNo":null,
                        "status":null,
                        "poDateFrom":null,
                        "poDateTo":null,
                        "recentOrders":null,
                        "invoiceNo":null,
                        "soNo":null,
                        "csr":null,
                        "type":null,
                        "origin":null
                    }
                    searchObject.setSearchObject(searchData);
                    //url = "#/in/orderSummary";
                    //jQuery(location).attr("href", url);
                    url = "#/in/orderheaderdetail?";
                    var orderNo = legacyOrderNo;
                    var urlParams = "orderNo=" + orderNo + "&orderNoFor=OR";
                    url = url + urlParams;
                    jQuery(location).attr("href", url);
                }
            }
        }
    });
app.directive("partialswithinitemstable",function($compile){
        return{
            restrict:'A',
            transclude:true,
            template:'<table id="tableOne" cellspacing="0" cellpadding="0" border="1" class="lastvieworderTable lastviewordertble">'+
                                '<thead><tr class="tableHeader font_black ossCols" ></tr></thead>'+
                                '<tbody>'+
                                '<tr ng-repeat="item in productitems.scheduleLines">'+
                                '<td>{{item.sched_line_qty}}</td>'+
                                '<td>{{item.status}}</td>'+
                                '<td>{{item.fact_delv_no}}</td>'+
                                '<td>{{item.cust_delv_no}}</td>'+
                                '<td>{{item.eshp_actual| date:"yyyy-MM-dd:hh:mm"}}</td>'+
                                '<td>{{item.supplier_sdd| date:"yyyy-MM-dd:hh:mm"}}</td>'+
                                '<td>{{item.pgi_actual| date:"yyyy-MM-dd:hh:mm"}}</td>'+
                                '<td>{{item.last_ack_date| date:"yyyy-MM-dd:hh:mm"}}</td>'+
                                '</tr>'+
                                '</tbody>'+
                            '</table>',
            link:function($scope,attrs,element,$compile){
            }
        }
});
app.directive("exportimportclassificationtable",function($compile){
        return{
            restrict:'A',
            transclude:true,
            template:'<table id="tableOne" cellspacing="0" cellpadding="0" border="1" class="lastvieworderTable lastviewordertble">'+
                        '<thead><tr class="tableHeader font_black ossColsLineItems"></tr></thead>'+
                        '<tbody>'+
                        '<tr ng-repeat="item in productitems.wwClassInfo">'+
                        '<td>{{item.country}}</td>'+
                        '<td>{{item.country_code}}</td>'+
                        '<td>{{item.export_code}}</td>'+
                        '<td>{{item.US_export_code}}</td>'+
                        '<td>{{item.Harmonized_important_code}}</td>'+
                        '<td>{{item.description}}</td>'+
                        '</tr>'+
                        '</tbody>'+
                    '</table>',
            link:function($scope,attrs,element,$compile){
               // console.log($scope.indentColumnNames);
            }
        }
});

app.service('searchObject', function() {
    var searchParamsObj = "";
    return {
        getSearchObject: function() {
            return searchParamsObj;
        },
        setSearchObject: function(newSearchParamsObj) {
            searchParamsObj = newSearchParamsObj;
        }
    };
});
app.directive("ossproductcols", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in productCharsColumnNames" class="table_details"><span class="tblHeaderTxt">{{name.value}}</span></th>',
    };
});


app.directive("shipmentItemInfo",function($compile){
        return{
            restrict:'A',
            transclude:true,
            template:'<div class="ship-rpt-inner-content bg-color-white"  ng-repeat="itemItems in itemItemsheader">'+
         '<div class="spacer">&nbsp;</div>'+
       '<div class="ship-item-inner-header"  ng-click="expandOrCollapseShipmentInner("showDetails{{itemItems.item_subitem}}","{{itemItems.item_subitem}}")">'+
        '<span id="showDetails{{itemItems.item_subitem}}" class="collapseImg expCloseImgDiv" style="margin-left:1%"></span>'+
         '<div class="three columns shipinnerheader">'+
             '<div class="generals">'+
                '<span>Item:</span>'+
                '<div id="Delivery_Type" class="div_input ng-binding">{{itemItems.item_subitem}}</div>'+
            '</div>'+
             '<div class="generals">'+
                '<span>Ship From:</span>'+
                '<div id="Delivery_Type" class="div_input ng-binding"> {{itemItems.ship_from}} </div>'+
            '</div>'+
        '</div>'+
         '<div class="three columns shipinnerheader">'+
              '<div class="generals">'+
                '<span style="width:42%">HP Product #:</span>'+
                '<div id="Delivery_Type" class="div_input ng-binding">{{itemItems.material_no}}</div>'+
            '</div>'+
            '<div class="generals">'+
                '<span style="width:42%">Vendor Name:</span>'+
                '<div id="Delivery_Type" class="div_input ng-binding">{{itemItems.lsp_name}}</div>'+
            '</div>'+
        '</div>'+
         '<div class="three columns" style="width: 24%;">'+
             '<div class="generals">'+
                '<span style="width: 21%;">Description:</span>'+
        '<div id="Delivery_Type" class="div_input ng-binding" style="width: 76%;">{{itemItems.product_descr}}</div>'+
            '</div>'+
              '<div class="generals">'+
                '<span style="width: 21%;">Partial Qty:</span>'+
                '<div id="Delivery_Type" class="div_input ng-binding">{{itemItems.sched_line_qty}}</div>'+
            '</div>'+
        '</div> '+
         '<div class="three columns" style="width:22%">'+
             '<div class="generals">'+
                '<span style="width:50%">Ordered Qty:</span>'+
                '<div id="Delivery_Type" style="width:40%" class="div_input ng-binding">{{itemItems.so_line_item_qty}}</div>'+
            '</div>'+
            '<div class="generals">'+
                '<span style="width:50%">Customer Product No.:</span>'+
                '<div id="Delivery_Type" class="div_input ng-binding" style="width: 45%;">{{itemItems.cust_product_no}}</div>'+
            '</div>'+
        '</div>'+
        '<div class="three columns" style="width:18%">'+
             '<div class="generals">'+
                '<span>Logistics Codes:</span>'+
                '<div id="Delivery_Type" class="div_input ng-binding">{{itemItems.logistics_codes}}</div>'+
            '</div>'+
             '<div class="generals">'+
                '<span>&nbsp;</span>'+
            '</div>'+
        '</div>'+
     '<div class="spacer">&nbsp;</div>'+
         '<div>'+
             '<div class="generals">'+
                '<span style="width: 8.8%;">Box #:</span>'+
                '<div  id="Delivery_Type" ng-show="hideBox" style="width:70%" class="div_input ng-binding" style="width: 80%;"><ul class="itemBoxDetails"><li ng-repeat="itemBox in itemItemBox4 | filter : {item_subitem: item.item_subitem}">{{itemBox.box_no}},&nbsp;</li></ul>'+
       '<!--     <ul class="itemBoxDetails" ng-show="showParent"><li ng-repeat="itemBox in itemItemBox4 | filter : {item_subitem: item.item_subitem}">{{itemBox.box_no}},&nbsp;</li></ul>'+
                '<ul class="itemBoxDetails" ng-hide="showParent"><li ng-repeat="itemBox in itemItemBox4 | filter : {item_subitem: item.item_subitem}">{{itemBox.parent_box_no}},&nbsp;</li></ul>-->'+
                '<div style="float:left">...<a class="cursor" ng-click="showItemBox()">more</a></div></div>'+
            '</div>'+
        '</div>'+
   '</div>'+
    '<div class="tbl-innerdetails-bg" ng-show="showDetails{{itemItems.item_subitem}}">'+
    '<table cellspacing=0 cellpadding=0 class="tbl-innerdetails tbl-innerdetails-width25">'+
         '<tr>'+
           '<th>Serial Number</th>'+
           '<th>Asset Tag</th>'+
           '<th>Ethernet Mac Address</th>'+
           '<th>Box Number</th>'+
         '</tr>'+
        '</table>'+
      '<div ng-show="itemflag">'+
     '<table cellspacing=0 cellpadding=0 class="tbl-innerdetails tbl-innerdetails-width25 cursor">'+
         '<tr ng-repeat="itemDetail in itemItemsDetails | filter : {item_subitem : item.item_subitem}">'+
           '<td>{{itemDetail.serial_number}}</td>'+
           '<td>{{itemDetail.asset_tag}}</td>'+
           '<td>{{itemDetail.primary_mac_addr}}</td>'+
           '<td>{{itemDetail.box_no}}</td>'+
         '</tr>'+
        '</table>'+
       '</div>'+
       '<div style="clear:both"></div>'+
        '<div ng-hide="itemflag" style="margin-left: 6.09%; width: 92%;" class="div-norecord">'+
             'No Records Found'+
'</div>'+
    '</div>'+
    '<div class="spacer">&nbsp;</div>'+
    '</div>'
,
            link:function($scope,attrs,element,$compile){
            }
        }
    });


app.factory('createDialog', ["$document", "$compile", "$rootScope", "$controller", "$timeout",
  function ($document, $compile, $rootScope, $controller, $timeout) {
    var defaults = {
      id: null,
      template: null,
      templateUrl: null,
      title: 'Default Title',
      backdrop: true,
      success: {label: 'OK', fn: null},
      cancel: {label: 'Close', fn: null},
      controller: null, //just like route controller declaration
      backdropClass: "modal-backdrop",
      footerTemplate: null,
      modalClass: "modal",
      css: {
        top: '100px',
        left: '11%',
        margin: '0 auto',
        width:'80%'
      }
    };
    var body = $document.find('body');

    return function Dialog(templateUrl/*optional*/, options, passedInLocals) {

      // Handle arguments if optional template isn't provided.
      if(angular.isObject(templateUrl)){
        passedInLocals = options;
        options = templateUrl;
      } else {
        options.templateUrl = templateUrl;
      }

      options = angular.extend({}, defaults, options); //options defined in constructor

      var key;
      var idAttr = options.id ? ' id="' + options.id + '" ' : '';
      var defaultFooter = '<button class="btn" ng-click="$modalCancel()">{{$modalCancelLabel}}</button>' +
        '<button class="btn btn-primary" ng-click="$modalSuccess()">{{$modalSuccessLabel}}</button>';
      var footerTemplate = '<div class="modal-footer">' +
        (options.footerTemplate || defaultFooter) +
        '</div>';
      var modalBody = (function(){
        if(options.template){
          if(angular.isString(options.template)){
            // Simple string template
            return '<div class="modal-body">' + options.template + '</div>';
          } else {
            // jQuery/JQlite wrapped object
            return '<div class="modal-body">' + options.template.html() + '</div>';
          }
        } else {
          // Template url
          return '<div class="modal-body" ng-include="\'' + options.templateUrl + '\'"></div>'
        }
      })();
      //We don't have the scope we're gonna use yet, so just get a compile function for modal
      var modalEl = angular.element(
        '<div class="' + options.modalClass + ' fade"' + idAttr + '>' +
        /*  '  <div class="modal-header">' +
          '    <button type="button" class="close" ng-click="$modalCancel()">&times;</button>' +
          '    <h2>{{$title}}</h2>' +
          '  </div>' +*/
          modalBody +
         // footerTemplate +
          '</div>');

      for(key in options.css) {
        modalEl.css(key, options.css[key]);
      }

      var backdropEl = angular.element('<div ng-click="$modalCancel()">');
      backdropEl.addClass(options.backdropClass);
      backdropEl.addClass('fade in');

      var handleEscPressed = function (event) {
        if (event.keyCode === 27) {
          scope.$modalCancel();
        }
      };

      var closeFn = function () {
        body.unbind('keydown', handleEscPressed);
        modalEl.remove();
        if (options.backdrop) {
          backdropEl.remove();
        }
      };

      body.bind('keydown', handleEscPressed);

      var ctrl, locals,
        scope = options.scope || $rootScope.$new();

      scope.$title = options.title;
      scope.$modalClose = closeFn;
      scope.$modalCancel = function () {
        var callFn = options.cancel.fn || closeFn;
        callFn.call(this);
        scope.$modalClose();
      };

      scope.$modalSuccess = function () {
          $rootScope.$broadcast("success", 'Y');
        var callFn = options.success.fn || closeFn;
        callFn.call(this);
        scope.$modalClose();
      };
      scope.$modalSuccessLabel = options.success.label;
      scope.$modalCancelLabel = options.cancel.label;

      if (options.controller) {
        locals = angular.extend({$scope: scope}, passedInLocals);
        ctrl = $controller(options.controller, locals);
        // Yes, ngControllerController is not a typo
        modalEl.contents().data('$ngControllerController', ctrl);
      }

      $compile(modalEl)(scope);
      $compile(backdropEl)(scope);
      body.append(modalEl);
      if (options.backdrop) body.append(backdropEl);

      $timeout(function () {
        modalEl.addClass('in');
      }, 200);
    };
  }]);
app.service('hpyOrderNumber', function() {
    var hpOrderNo = '';
    return {
        getHpOrderNo: function() {
            return hpOrderNo;
        },
        setHpOrderNo: function(newHpOrderNo) {
            hpOrderNo = newHpOrderNo;
        }
    };
});
app.service('legacyOrderNumber', function() {
    var legacyOrderNo = '';
    return {
        getLegacyOrderNo: function() {
            return legacyOrderNo;
        },
        setLegacyOrderNo: function(newLegacyOrderNo) {
            legacyOrderNo = newLegacyOrderNo;
        }
    };
});
/* Filter for Ordering Objects (Associative Arrays or Hashes) with ngRepeat */
app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] - b[field]);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});
app.directive("ossColsWithProductCharsLineItems", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in lineItemsWithProductColumnNames" class="table_details"><span class="tblHeaderTxt">{{name.value}}</span></th>',
        link: function($scope, $element, $attrs) {
            //console.log($scope.lineItemsColumnNames);
            for (var i = 0; i < $scope.lineItemsColumnNames.length; i++) {
                $scope[$scope.lineItemsColumnNames[i].id] = true;
            }
            $scope.sortColumn = function($parent, colId, hasSort) {
                if (hasSort != "false") {
                    $scope.showColSort();
                    $parent.predicate = colId;
                    $parent.reverse = !$parent.reverse;
                    if (!$scope.preSortColumn) $scope.preSortColumn = colId;
                    $scope["sortedTD_" + $scope.preSortColumn] = "";
                    $scope["sortedTD_" + colId] = "sorted";
                    $scope.preSortColumn = colId;
                }
            };
        }
    };
});

