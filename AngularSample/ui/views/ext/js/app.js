var app = angular.module('ossApp', []).
config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'partials/home.html'
        });
        $routeProvider.when('/ex/orderSummary', {
            templateUrl: 'partials/orderSummary.html'
        });
        $routeProvider.when('/ex/orderheaderdetail', {
            templateUrl: 'partials/orderDetail.html'
        });
        $routeProvider.when('/ex/shipmentInformation/:hpdeliveryno/:legacyNo', {
            templateUrl: 'partials/shipmentInformation.html',
            controller: trackingListCtrl
        });
        $routeProvider.when('/viewReports', {
            templateUrl: 'partials/viewReports.html',
            controller: viewReportsController
        });
        $routeProvider.when('/ex/orderHistory', {
            templateUrl: 'partials/orderHistory.html'
        });
        $routeProvider.when('/ex/eventBased', {
            templateUrl: 'partials/EventNotification.html'
        });
        $routeProvider.when('/ex/upgradeBrowseAlert', {
            templateUrl: '/ext/upgradeBrowseAlert.html',
            controller: viewReportsController
        });
        $routeProvider.when('/advancedSearch', {
            templateUrl: 'partials/advancedSearch.html'
        });
        $routeProvider.when('/ex/trackingInformation', {
            templateUrl: 'partials/trackingInformation.html',
        });
        $routeProvider.when('/ex/boxInformation', {
            templateUrl: 'partials/boxInformation.html',
        });
        $routeProvider.when('/ex/itemInformation', {
            templateUrl: 'partials/itemInformation.html',
        });
        $routeProvider.when('/ex/statusHistory', {
            templateUrl: 'partials/statusHistory.html',
        });
        $routeProvider.when('/ex/shipAddress', {
            templateUrl: 'partials/shipAddressDetails.html',
        });
        $routeProvider.when('/ex/itemBox', {
            templateUrl: 'partials/itemBoxPopup.html',
        });
        $routeProvider.when('/ex/productDetails/:orderNo/:itemNo', {
            templateUrl: 'partials/productDetails.html'
        });
        $routeProvider.when('/ex/status', {
            templateUrl: 'partials/helpStatus.html',
        });
        $routeProvider.otherwise({
            redirectTo: '/'
        });
    }
]);
app.config(function($compileProvider) {
    $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|chrome-extension):/);
});
app.constant('customerrormsgs', function(errString) {
    var respString = getErrorMsgs(errString);
    return respString;

});

function getErrorMsgs(errString) {
    if (new RegExp('QueryServerBusy').test(errString) == true) {
        return 'Too many records found, please refine your search.'
    } else if (new RegExp('limit reached ! Pre-select found').test(errString) == true) {
        return 'Too many records found, please refine your search.'
    } else if (new RegExp('field').test(errString) == true) {
        return 'Technical error occurred, please contact support.'
    } else if (new RegExp('Unable to alloc initial memory').test(errString) == true) {
        return 'Technical error occurred, please contact support.'
    } else if (new RegExp('Unexpected tokens').test(errString) == true) {
        return 'Technical error occurred, please contact support.'
    } else if (new RegExp('Undetermined string').test(errString) == true) {
        return 'Technical error occurred, please contact support.'
    } else if (new RegExp('SQLSelectStatement').test(errString) == true) {
        return 'Technical error occurred, please contact support.'
    } else if (new RegExp('ORA').test(errString) == true) {
        return 'Technical error occurred, please contact support.'
    } else if (new RegExp('NonExistingOrder').test(errString) == true) {
        return 'No records found.'
    } else {
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
    function($document, $compile, $rootScope, $controller, $timeout) {
        var defaults = {
            id: null,
            template: null,
            templateUrl: null,
            title: 'Default Title',
            backdrop: true,
            success: {
                label: 'OK',
                fn: null
            },
            cancel: {
                label: 'Close',
                fn: null
            },
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
        return function Dialog(templateUrl /*optional*/ , options, passedInLocals) {
            // Handle arguments if optional template isn't provided.
            if (angular.isObject(templateUrl)) {
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
            var modalBody = (function() {
                if (options.template) {
                    if (angular.isString(options.template)) {
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
            for (key in options.css) {
                modalEl.css(key, options.css[key]);
            }
            var backdropEl = angular.element('<div ng-click="$modalCancel()">');
            backdropEl.addClass(options.backdropClass);
            backdropEl.addClass('fade in');
            var handleEscPressed = function(event) {
                if (event.keyCode === 27) {
                    scope.$modalCancel();
                }
            };

            var closeFn = function() {
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
            scope.$modalCancel = function() {
                var callFn = options.cancel.fn || closeFn;
                callFn.call(this);
                scope.$modalClose();
            };
            scope.$modalSuccess = function() {
                $rootScope.$broadcast("success", 'Y');
                var callFn = options.success.fn || closeFn;
                callFn.call(this);
                scope.$modalClose();
            };
            scope.$modalSuccessLabel = options.success.label;
            scope.$modalCancelLabel = options.cancel.label;

            if (options.controller) {
                locals = angular.extend({
                    $scope: scope
                }, passedInLocals);
                ctrl = $controller(options.controller, locals);
                modalEl.contents().data('$ngControllerController', ctrl);
            }

            $compile(modalEl)(scope);
            $compile(backdropEl)(scope);
            body.append(modalEl);
            if (options.backdrop) body.append(backdropEl);
            $timeout(function() {
                modalEl.addClass('in');
            }, 200);
        };
    }
]);

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

app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});

app.directive('navMenu', ['$parse', '$compile',
    function($parse, $compile) {
        return {
            restrict: 'C', //Element
            scope: true,
            link: function(scope, element, attrs) {
                scope.selectedNode = null;
                scope.$watch(attrs.menuData, function(val) {
                    var template = angular.element('<ul id="parentTreeNavigation"><li ng-repeat="node in ' + attrs.menuData + '" ng-class="{active:node.active && node.active==true, \'has-dropdown\': !!node.children && node.children.length}"><a ng-href="{{node.href}}" ng-click="{{node.click}}" target="{{node.target}}" >{{node.text}}</a><sub-navigation-tree></sub-navigation-tree></li></ul>');
                    var linkFunction = $compile(template);
                    linkFunction(scope);
                    element.html(null).append(template);
                }, true);
            }
        };
    }
])
    .directive('subNavigationTree', ['$compile',
    function($compile) {
        return {
            restrict: 'E', //Element
            scope: true,
            link: function(scope, element, attrs) {
                scope.tree = scope.node;
                if (scope.tree.children && scope.tree.children.length) {
                    var template = angular.element('<ul class="dropdown "><li ng-repeat="node in tree.children" node-id={{node.' + attrs.nodeId + '}}  ng-class="{active:node.active && node.active==true, \'has-dropdown\': !!node.children && node.children.length}"><a ng-href="{{node.href}}" href ng-click="{{node.click}}" target="{{node.target}}" ng-bind-html-unsafe="node.text"></a><sub-navigation-tree tree="node"></sub-navigation-tree></li></ul>');
                    //var template = angular.element('<ul class="dropdown "><li ng-repeat="node in tree.children" node-id={{node.' + attrs.nodeId + '}}  ng-class="{active:node.active && node.active==true, \'has-dropdown\': !!node.children && node.children.length}"><div ng-click="{{node.click}}"><a href ng-bind-html-unsafe="node.text"></a></div><sub-navigation-tree tree="node"></sub-navigation-tree></li></ul>');
                    var linkFunction = $compile(template);
                    linkFunction(scope);
                    element.replaceWith(template);
                } else {
                    element.remove();
                }
            }
        };
    }
]);

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
        template: '<th ng-repeat="name in lineItemsColumnNames" ng-show="{{name.id}}" class="table_details" ' + 'ng-class="{sortedASC: ($parent.reverse==true && $parent.predicate == name.id), ' + 'sortedDESC: ($parent.reverse==false && $parent.predicate == name.id)}" ' + 'ng-click="sortColumn($parent, name.id, name.sort);"><span class="tblHeaderTxt">{{name.value}}</span>' + '<span ng-hide="name.sort"></span><span class="icn_srt" ng-show="name.sort">' + '<a href="javascript:void(0)">&nbsp;</a></span></th>',
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

app.directive('tab', function() {
    return {
        restrict: 'E',
        replace: true,
        require: '^tabset',
        scope: {
            title: '@',
            templateUrl: '@'
        },
        link: function(scope, element, attrs, tabsetController) {
            /*    scope.$on('tabData', function(events, data) {
                console.log(data);});*/
            tabsetController.addTab(scope);

            scope.select = function() {
                tabsetController.selectTab(scope);
                //console.log(scope);
                // console.log(scope.$parent.ack);
            }

            scope.$watch('selected', function() {
                if (scope.selected) {
                    /* var parentScope = element.parent().parent().scope();
          parentScope.templateUrl = scope.templateUrl;*/
                    tabsetController.setTabTemplate(scope.templateUrl);
                }
            });
        },
        template: '<li ng-class="{active: selected}">' + '<a href="" ng-click="select()">{{title}}</a>' + '</li>'
    };
});
app.directive('tabset', function() {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        controller: function($scope) {
            $scope.templateUrl = '';
            var tabs = $scope.tabs = [];
            var controller = this;
            var count = 0;
            this.selectTab = function(tab) {
                angular.forEach(tabs, function(tab) {
                    tab.selected = false;
                });
                tab.selected = true;
            };

            this.setTabTemplate = function(templateUrl) {
                $scope.templateUrl = templateUrl;
            }
            this.addTab = function(tab) {
                if (tabs.length === 0) {
                    controller.selectTab(tab);
                }
                tabs.push(tab);
            };
        },
        template: 
        '<div class="row-fluid">' + 
        '<div class="row-fluid">' + 
        '<div class="tab nav-tabs" ng-transclude style="margin-left: 34px;"></div>' +
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
        template: '<ul ng-repeat="item in pagedItems[currentPage-pageIndex]">' + '<li class="rightpd" style="height:520px;">' + '<div class="whitearea panel-view">' + '<dl class="dotline titleline_blue" style="border-bottom: 1px solid #e8e8e8;margin-bottom:8px;">' + '<dt class="title"><img src="../../common/images/list_tb.png"></dt>' + '<dd class="title">' + '<span style="color:#767676;">No:</span>' + '<a class="orderNoLink" href ng-click="redirectToOrderDetails(\'{{item.order_no}}\');" id="{{item.order_no}}">{{item.order_no}}</a>' + '</dd><hr>' + '</dl>' + '<dl ng-repeat="name in columnNames">' + '<dt class="content">{{name.value}} : </dt>' + '<dd class="content" ng-switch on="name.format">' + '<div ng-switch-when="date">{{item[name.id]| date:"yyyy-MM-dd"}}</div>' + '<div ng-switch-default>{{item[name.id]}}</div>' + '</dd>' + '</dl>' + '<a href ng-click="redirectToOrderDetails(\'{{item.order_no}}\');" class="button slim primary btn_label_slim" style="font-size: 12px; margin-left:-10px!important;" id="{{item.order_no}}">Details</a>' + '</div>' + '</li>' + '</ul>',
        link: function(scope, elm, attrs) {
            if (attrs.query) {
                scope.filteredData = filterFilter(scope.data, scope.$eval(attrs.query));
            } else {
                scope.filteredData = scope.data;
            }
        }
    };
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
                    buttonImage: "../../common/images/ico_calendar.png",
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
                buttonImage: "../../common/images/ico_calendar.png",
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
                if ($scope.detailTable == true) {
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
app.directive('pricingtab', function($compile) {
    return {
        restrict: 'C',
        transclude: true,
        link: function(scope, element, attr) {
            scope.lineItemColpseExpand = function(panelName, mode, index) {
                scope[panelName] = !scope[panelName];
                if (mode) {
                    if (mode == 'e') {
                        scope[panelName] = true;

                    } else {
                        scope[panelName] = false;

                    }
                }
                if (scope[panelName]) {
                    var imagecls = "#" + panelName + index;
                    scope.el1 = $compile(imagecls)(scope);
                    scope.el1.removeClass("collapseImg expCloseImgDiv");
                    scope.el1.addClass("expandImg expCloseImgDiv");
                } else {
                    var imagecls = "#" + panelName + index;
                    scope.el1 = $compile(imagecls)(scope);
                    scope.el1.removeClass("expandImg expCloseImgDiv");
                    scope.el1.addClass("collapseImg expCloseImgDiv");
                }
            }
            scope.$on('pricingtabCtrl', function(events, data) {

                var items = {
                    data: []
                };
                var columnkeys = [];
                var data = data;
                var tableHeader = '';
                var PricingExternalTable = "";

                var columnNames = data.pricing.columnNames;
                scope.colspan = Object.keys(data.pricing.columnNames).length;
                scope.showNonBundle = true;
                if (Object.keys(data.pricing.item.NoBundle).length == 0) {
                    scope.showNonBundle = false;

                }
                var tabledata = data.pricing.item;
                var itemNo;
                var product;
                PricingExternalTable = PricingExternalTable + '<table id="pricingexternal"  cellspacing="1" cellpadding="0" border="0" class="hpTbl" style="table-layout: fixed;border: 1px solid #999999 !important;">';
                PricingExternalTable = PricingExternalTable + '<thead><tr class="tableHeader font_black table_details" style="border: 1px solid #999999;color: #000000;">';
                scope.totalspan=0;
                angular.forEach(columnNames, function(itmkey, itmval) { // column names
                    columnkeys.push(itmval);
                    PricingExternalTable = PricingExternalTable + '<th><span style="font-size: 13px;">' + itmkey + '</span></th>';
                    scope.totalspan++;
                    if(itmkey=="disValue"){
                    }
                });
                PricingExternalTable = PricingExternalTable + '</tr></thead>';
                var option = [];
                var dicountvalues = [];
                //implementing bundle items//

                var count = 0;
                angular.forEach(data.pricing.item, function(key, val) {
                    if (val != "NoBundle") {
                        PricingExternalTable = PricingExternalTable + '<tr><td colspan="{{colspan}}">';
                        if (data.pricing.item.configId != "undefined") {
                            PricingExternalTable = PricingExternalTable + '<div ng-click="lineItemColpseExpand(\'showData\',e,' + count + ')"><div class="collapseImg expCloseImgDiv"  id="showData' + count + '" style="margin-top:-2px;" ></div><div style="font-size:16px;font-weight:bold;color:steelblue;">' + val + '</div></div></td></tr>';
                        } else {
                            PricingExternalTable = PricingExternalTable + '<div ng-click="lineItemColpseExpand(\'showData\',e,' + count + ')"><div class="collapseImg expCloseImgDiv"  id="showData' + count + '" ></div><div style="font-size:16px;font-weight:bold;color:steelblue;">' + val + '</div></div></td></tr>';
                        }
                    }
                    count++;
                    if (val !== "NoBundle") {
                        var existcustproduct="0";
                        angular.forEach(data.pricing.item[val], function(key, vals) {
                            angular.forEach(columnkeys, function(matchedcolumns) {
                                angular.forEach(key, function(key1, val1) {
                                    if (val1 == matchedcolumns) {
                                        if (val1 == "item")
                                            itemNo = key1;
                                        if (val1 == "product")
                                            product = key1;
                                        if (val1 == "custProduct") {
                                            existcustproduct="1";
                                            if (key1 != null) {
                                                custproduct = key1;
                                            } else {
                                                custproduct = "";
                                            }
                                        }
                                        if (val1 == "option") {
                                            var count = 1;
                                            angular.forEach(key1, function(key2, value2) {
                                                PricingExternalTable = PricingExternalTable + '<tr id="showData{{$index}}" ng-show="showData{{$index}}" >';
                                                PricingExternalTable = PricingExternalTable + '<td style="font-size: 13px;">' + ((count == 1) ? itemNo : "") + '</td>';
                                                PricingExternalTable = PricingExternalTable + '<td style="font-size: 13px;">' + ((count == 1) ? product : "") + '</td>';
                                                 if(existcustproduct=="1"){
                                                    PricingExternalTable = PricingExternalTable + '<td class="currencyAlign" style="font-size: 13px;white-space:normal">' + ((count == 1) ? custproduct : "") + '</td>';
                                                 }
                                                angular.forEach(key2, function(key3, value3) {
                                                    if (value3 != "configId" && value3 != "configUId") {
                                                        if (key3 != null && key3 != undefined) {
                                                            PricingExternalTable = PricingExternalTable + '<td><span style="font-size: 13px;white-space:normal;text-align:right">' + key3 + '</span></td>';
                                                        }
                                                    }
                                                });
                                                PricingExternalTable = PricingExternalTable + '</tr>';
                                                count++;
                                            });
                                        }
                                    }
                                });
                            });
                        });
                    }
                });
                 var existcustproduct1="0";
                PricingExternalTable = PricingExternalTable + '<tr ng-show={{showNonBundle}}><td colspan={{colspan}}><span style="font-size: 16px;color:steelblue;font-weight:bold;">Non Bundle</span></td></tr>';
                angular.forEach(data.pricing.item.NoBundle, function(key, val) {
                    angular.forEach(columnkeys, function(matchedcolumns) {
                        angular.forEach(key, function(key1, val1) {
                            if (val1 == matchedcolumns) {
                                if (val1 == "item")
                                    itemNo = key1;
                                if (val1 == "product")
                                    product = key1;

                                if (val1 == "custProduct") {
                                     existcustproduct1="1";
                                    if (key1 != null) {
                                        custproduct = key1;
                                       } else {
                                        custproduct = "";
                                    }
                                }
                                if (val1 == "option") {
                                    var count = 1;
                                    angular.forEach(key1, function(key2, value2) {
                                        PricingExternalTable = PricingExternalTable + '<tr>';
                                        PricingExternalTable = PricingExternalTable + '<td style="font-size: 13px;">' + ((count == 1) ? itemNo : "") + '</td>';
                                        PricingExternalTable = PricingExternalTable + '<td style="font-size: 13px;">' + ((count == 1) ? product : "") + '</td>';
                                        if(existcustproduct1=="1"){
                                            PricingExternalTable = PricingExternalTable + '<td class="currencyAlign" style="font-size: 13px;white-space:normal">' + ((count == 1) ? custproduct : "") + '</td>';

                                        }
                                        angular.forEach(key2, function(key3, value3) {
                                            if (key3 != null && key3 != undefined) {
                                                PricingExternalTable = PricingExternalTable + '<td class="currencyAlign"><span style="font-size: 13px;white-space:normal">' + key3 + '</span></td>';
                                            }
                                        });
                                        PricingExternalTable = PricingExternalTable + '</tr>';
                                        count++;
                                    });
                                }
                            }
                        });
                    });
                });
                var count = 0; // column names
                PricingExternalTable = PricingExternalTable + '<tr>';
                angular.forEach(columnNames, function(itmkey, itmval) {
                    var columnValue= "";
                    if(count==0) {
                        PricingExternalTable += '<td style="font-size:14px;color: steelblue;font-weight: bold;">Total in &nbsp;'+data.pricing.currency+'</td>';

                    } else {

                        if (itmval == "disValue" && data.pricing.totalDiscValue != null) {
                            columnValue = data.pricing.totalDiscValue;
                        } else if (itmval == "discPer" && data.pricing.totalDiscPersentage != null) {
                            columnValue = data.pricing.totalDiscPersentage;
                        } else if (itmval == "listExtPrice" && data.pricing.totallistExtPrice != null) {
                            columnValue = data.pricing.totallistExtPrice;
                        } else if (itmval == "netLinePrice" && data.pricing.totalNetPrice != null) {
                            columnValue = data.pricing.totalNetPrice;
                        } else {
                            columnValue =  "&nbsp;";
                        }

                        PricingExternalTable += '<td style="text-align: right"><span>'+ columnValue  + '</span></td>';

                    }
                    count++;
                });

                PricingExternalTable = PricingExternalTable + '</tr>';
                PricingExternalTable = PricingExternalTable + '</tbody></table><br><br>';
                scope.el = $compile(PricingExternalTable)(scope);
                $("#detailsTable").append(scope.el);
            });
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

app.directive('addmorecontract', function($compile) {
    return {
        transclude: true,
        replace: true,
        template: '<div class="two columns" style="color: #57BAE8;font-size: 13px;line-height: 26px;cursor:pointer;" ng-click="addNewRows()">Add More</div>',
        link: function(scope, element, attr) {

            scope.addNewRows = function() {
                var compelement = "";
                var rowCountRef = scope.rowCountRef;

                if ($("#searchNum" + (rowCountRef - 1)).val() == "" || $("#searchName" + (rowCountRef - 1)).val() == "") {
                    alert("please enter previous input to add more search criteria");
                    return false;
                }

                compelement = '<div id="newrown' + rowCountRef + '"><div class="styledSelectExt flLeft" style="width:225px !important;overflow:hidden;">';
                compelement += '<div class="dd_border"></div>';
                compelement += '<select name="searchName" id="searchName' + rowCountRef + '" ng-model="searchRefContract.searchName' + rowCountRef + '" style="width: 247px;background: transparent;">';
                compelement += '<option value=""> Please Select</option>';
                compelement += '<option ng-repeat="(name,val) in refContract"  value="{{name}}">{{val}}</option>';
                compelement += '</select>';
                compelement += '</div>';
                compelement += '<div class="two columns" style="width:35% !important;margin-left:17px;" >';
                compelement += '<input style="height: 27px;border: 2px solid #CCC;"type="text" id="searchNum' + rowCountRef + '" class="form-input js_color_change" ng-model="searchRefContract.searchNum' + rowCountRef + '" ng-enter="isRSFormValid()">';
                compelement += '</div>';
                compelement += '<div style="float:left">';
                compelement += '<span  style="color: #57BAE8;font-size: 13px;margin-left:9px;line-height: 25px;cursor:pointer" ng-click="RemoveRows(' + rowCountRef + ')">Remove</span>';
                compelement += '</div></div>';

                scope.el = $compile(compelement)(scope);
                scope.el.appendTo('.searchbynumrows');
                scope.rowCountRef++;

            }
            scope.RemoveRows = function(rowCountRef) {

                var compelement = $('#newrown' + rowCountRef);
                scope.el = $compile(compelement)(scope);
                scope.el.remove();

                var searchName = "searchName" + rowCountRef;
                var searchNum = "searchNum" + rowCountRef;

                delete scope.searchRefContract[searchName];
                delete scope.searchRefContract[searchNum];

                scope.rowCountRef--;

            }
        }
    };
});

app.directive('tooltip', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            $(element)
                .attr('title', scope.$eval(attrs.tooltip))
                .tooltip({
                placement: "right"
            });
        }
    }
});
app.directive("ossproductcols", function() {
    return {
        restrict: 'C',
        transclude: true,
        template: '<th ng-repeat="name in productCharsColumnNames" class="table_details"><span class="tblHeaderTxt">{{name.value}}</span></th>',
    };
});
app.directive("exportimportclassificationtable", function($compile) {
    return {
        restrict: 'A',
        transclude: true,
        template: '<table id="tableOne" cellspacing="0" cellpadding="0" border="1" class="lastvieworderTable lastviewordertble">' + '<thead><tr class="tableHeader font_black ossColsLineItems"></tr></thead>' + '<tbody>' + '<tr ng-repeat="item in productitems.wwClassInfo">' + '<td>{{item.country}}</td>' + '<td>{{item.country_code}}</td>' + '<td>{{item.export_code}}</td>' + '<td>{{item.US_export_code}}</td>' + '<td>{{item.description}}</td>' + '</tr>' + '</tbody>' + '</table>',
        link: function($scope, attrs, element, $compile) {
            // console.log($scope.indentColumnNames);
        }
    }
});
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
