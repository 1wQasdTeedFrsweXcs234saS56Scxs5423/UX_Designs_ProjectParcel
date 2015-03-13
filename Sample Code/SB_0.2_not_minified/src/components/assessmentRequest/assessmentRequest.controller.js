'use strict';
angular.module('skillBuilder')
    /**
     * @ngdoc controller
     * @name $AssessmentRequestCtrl
     *
     * @param {Object} $scope Scope of MyProfileCtrl
     * @short-description
     * controller for my profile block
     */
    .controller('AssessmentRequestCtrl', function($scope, MainFactory) {
        $scope.assessmentRequest = MainFactory.assessmentRequestData();
    })
    /**
     * @ngdoc directive
     * @name $sbAssessmentRequest
     *
     * @short-description
     * directive for my profile block
     */
    .directive('sbAssessmentRequest', function() {
        return {
            templateUrl: 'components/assessmentRequest/assessmentRequest.html',
            restrict: 'AE',
            replace: 'true'
        };
    });
