'use strict';

angular.module('skillBuilder')
    .controller('AssessmentCtrl', function($scope, $stateParams, MainFactory) {
        var test = MainFactory.assessmentRequestData();
        angular.forEach(test.data, function(value) {
        	if(value.id === $stateParams.assessmentId){
        		$scope.longDescription = value.longDescription;
        	}
        });
    });
