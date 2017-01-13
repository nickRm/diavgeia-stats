/* global google */

// Load the Visualization API and the corechart package.
google.load('visualization', '1.0', {
    'packages': ['corechart']
});

// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(function() {
    angular.bootstrap(document.body, ['diavgeiaApp']);
});

var app = angular.module("diavgeiaApp", ['ngResource', 'ngRoute', 'ngAnimate', 'ui.bootstrap', 'ui.filters']);

app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            controller: 'HomeController',
            templateUrl: 'views/home.html'
        })
        .when('/financial', {
            controller: 'FinancialController',
            templateUrl: 'views/financial.html'
        })
        .otherwise({
            redirectTo: '/'
        });
});

// Global constants
app.constant('Constants', {
    ChartTypes: {
        LINE_CHART: 0,
        PIE_CHART: 1,
        COLUMN_CHART: 3,
        BAR_CHART: 4,
        COMBO_CHART: 5
    }
});
