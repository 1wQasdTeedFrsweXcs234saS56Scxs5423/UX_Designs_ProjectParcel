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
    .controller('MyProfileCtrl', function($scope, MainFactory) {
        $scope.myProfile = MainFactory.myProfileData();
    })
    /**
     * @ngdoc directive
     * @name $MyProfile
     *
     * @description
     * directive for my profile block
     */
    .directive('sbMyProfile', function() {
        return {
            templateUrl: 'components/myProfile/myProfile.html',
            restrict: 'AE',
            replace: 'true'
        };
    });
