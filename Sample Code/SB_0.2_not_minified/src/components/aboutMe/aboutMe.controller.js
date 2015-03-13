'use strict';
angular.module('skillBuilder')
	/**
	 * @ngdoc controller
	 * @name $AboutMeCtrl
	 *
	 * @param {Object} $scope Scope of NavbarCtrl
	 * @description
	 * controller for about me block
	 */
	.controller('AboutMeCtrl', function ($scope, MainFactory) {
    	$scope.aboutMe = MainFactory.aboutMeData();
  	})

	/**
	 * @ngdoc directive
	 * @name $AboutMe
	 *
	 * @description
	 * directive for about me block
	 */
	.directive('sbAboutMe', function() {
		return {
      		templateUrl: 'components/aboutMe/aboutMe.html'
    	};
  	});
