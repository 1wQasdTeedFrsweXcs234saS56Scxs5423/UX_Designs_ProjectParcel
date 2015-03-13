'use strict';
angular.module('skillBuilder')
    /**
     * @ngdoc controller
     * @name $MyProfileCtrl
     *
     * @param {Object} $scope Scope of MyProfileCtrl
     * @description
     * controller for my profile block
     */
    .controller('CustomTableCtrl', function($scope, MainFactory) {
        $scope.myProfile = MainFactory.myProfileData();
    })
    /**
     * @ngdoc directive
     * @name $MyProfile
     *
     * @description
     * directive for my profile block
     */
    .directive('sbCustomTable', function() {
        return {
            templateUrl: 'components/customTable/customTable.html',
            restrict: 'AE',
            replace: 'true',
            require: '^ngTitle',
            scope: {
                ngTitle: '@',
                ngFilter: '@',
                ngFocussed: '@'
            }
        };
    });
