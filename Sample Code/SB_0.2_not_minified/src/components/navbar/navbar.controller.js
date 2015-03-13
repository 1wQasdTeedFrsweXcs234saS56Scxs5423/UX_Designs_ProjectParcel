'use strict';
/**
 * @ngdoc controller
 * @name $NavbarCtrl
 *
 * @description
 * Default implementation of $animate that doesn't perform any animations, instead just
 * synchronously performs DOM
 * updates and calls done() callbacks.
 *
 * In order to enable animations the ngAnimate module has to be loaded.
 */
angular.module('skillBuilder')
	.controller('NavbarCtrl', function ($scope, MainFactory) {
		$scope.navbar = MainFactory.navbarData();
	});