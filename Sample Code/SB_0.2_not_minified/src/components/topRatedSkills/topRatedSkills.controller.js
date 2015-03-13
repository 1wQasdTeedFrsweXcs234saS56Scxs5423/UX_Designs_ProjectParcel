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
    .controller('TopRatedSkillsCtrl', function($scope, MainFactory) {
        $scope.topRatedSkills = MainFactory.topRatedSkillsData();
    })
    /**
     * @ngdoc directive
     * @name $MyProfile
     *
     * @description
     * directive for my profile block
     */
    .directive('sbTopRatedSkills', function() {
        return {
            templateUrl: 'components/topRatedSkills/topRatedSkills.html',
            restrict: 'AE',
            replace: 'true'
        };
    });
