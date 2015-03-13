'use strict';

angular.module('skillBuilder', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngResource', 'ui.router', 'ui.bootstrap', 'vr.directives.slider'])
    .config(function($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'app/main/main.html',
                controller: 'MainCtrl'
            })
            .state('assessment', {
                url: '/assessment/:assessmentId',
                templateUrl: 'app/assessment/assessment.html',
                controller: 'AssessmentCtrl'
            })
            .state('assessment.single', {
                url: '/single',
                template:'<div ng-controller="CustomTableCtrl" class="col-lg12 col-md-12 col-sm-12 col-xs-12">' +
                             '<sb-custom-table class="sb-custom-table" ng-title="Skills" ng-filter="false" ng-focussed="false"></sb-custom-table>' +
                         '</div>'
            });

        $urlRouterProvider.otherwise('/');
    });
