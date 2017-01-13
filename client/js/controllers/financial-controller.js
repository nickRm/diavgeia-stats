/* global app, google */

app.controller('FinancialController', ['$scope' ,'$filter', '$uibModal', 'ApiService', 'ChartService', 'Constants',
        function($scope, $filter, $uibModal, ApiService, ChartService, Constants) {

    $scope.dateFrom = new Date(); // Search start date.
    $scope.dateFrom.setMonth($scope.dateFrom.getMonth() - 1);
    $scope.dateFrom.setDate($scope.dateFrom.getDate() + 1);
    $scope.dateTo = new Date(); // Search end date.

    // Options for the datepicker dialogs.
    $scope.dateOptions = {
        startingDay: 1 // First day of week (1 = Monday).
    };

    // Keeps track of open dialogs.
    $scope.status = {
        dateFromIsOpen: false,
        dateToIsOpen: false
    };

    // Holds all chart data.
    $scope.charts = {
        financial: {},
        financialByEntity: {}
    };

    /**
     * Opens the search start datepicker dialog.
     */
    $scope.openDateFrom = function() {
        $scope.status.dateFromIsOpen = true;
    };

    /**
     * Opens the search end datepicker dialog.
     */
    $scope.openDateTo = function() {
        $scope.status.dateToIsOpen = true;
    };

    $scope.getOrganizations = function(value) {
        return ApiService.getCachedObject('organizations.json').then(function(response) {
            var output = [];
            for(var i = 0; i < response.organizations.length && output.length < 10; i++) {
                if(response.organizations[i].label.toLowerCase().indexOf(value.toLowerCase()) > -1) {
                    output.push(response.organizations[i].label);
                }
            }
            return output;
        }).catch(function(error) {
            alert('Error: ' + error);
        });
    };

    $scope.getSponsors = function(value) {
        return ApiService.getCachedObject('sponsors.json').then(function(response) {
            var output = [];
            for(var i = 0; i < response.length && output.length < 10; i++) {
                if(response[i].name
                        && response[i].name.toLowerCase().indexOf(value.toLowerCase()) > -1) {
                    output.push(response[i].name);
                }
            }
            return output;
        }).catch(function(error) {
            alert('Error: ' + error);
        });
    };

    /**
     * Clears the organization search text field.
     */
    $scope.clearOrganization = function() {
        $scope.selectedOrganization = null;
    };

    /**
     * Clears the sponsor search text field.
     */
    $scope.clearSponsor = function() {
        $scope.selectedSponsor = null;
    };

    /**
     * Sets the search range to the last 7 days then loads the charts.
     */
    $scope.loadLastWeek = function() {
        $scope.dateFrom = new Date();
        $scope.dateFrom.setDate($scope.dateFrom.getDate() - 6);
        $scope.dateTo = new Date();
        $scope.load();
    };

    /**
     * Sets the search range to this week (Monday to Sunday) then loads the charts.
     */
    $scope.loadCurrentWeek = function() {
        $scope.dateFrom = new Date();
        while($scope.dateFrom.getDay() !== 1) {
            $scope.dateFrom.setDate($scope.dateFrom.getDate() - 1);
        }

        $scope.dateTo = new Date();
        $scope.dateTo.setDate($scope.dateFrom.getDate() + 6);

        $scope.load();
    };

    /**
     * Sets the search range to the previous week then loads the charts.
     */
    $scope.loadPreviousWeek = function() {
        $scope.dateFrom = new Date();
        while($scope.dateFrom.getDay() !== 1) {
            $scope.dateFrom.setDate($scope.dateFrom.getDate() - 1);
        }
        $scope.dateFrom.setDate($scope.dateFrom.getDate() - 7);

        $scope.dateTo = new Date();
        $scope.dateTo.setDate($scope.dateFrom.getDate() + 6);

        $scope.load();
    };

    /**
     * Sets the search range to the last 30 days then loads the charts.
     */
    $scope.loadLastMonth = function() {
        $scope.dateFrom = new Date();
        $scope.dateFrom.setMonth($scope.dateFrom.getMonth() - 1);
        $scope.dateFrom.setDate($scope.dateFrom.getDate() + 1);
        $scope.dateTo = new Date();
        $scope.load();
    };

    /**
     * Sets the search range to the current month then loads the charts.
     */
    $scope.loadCurrentMonth = function() {
        var today = new Date();
        $scope.dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        $scope.dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        $scope.load();
    };

    /**
     * Sets the search range to the previous month then loads the charts.
     */
    $scope.loadPreviousMonth = function() {
        var today = new Date();
        today.setMonth(today.getMonth() - 1);
        $scope.dateFrom = new Date(today.getFullYear(), today.getMonth(), 1);
        $scope.dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        $scope.load();
    };

    /**
     * Sets the search range to the last 365 days then loads the charts.
     */
    $scope.loadLastYear = function() {
        $scope.dateFrom = new Date();
        $scope.dateFrom.setFullYear($scope.dateFrom.getFullYear() - 1);
        $scope.dateFrom.setDate($scope.dateFrom.getDate() + 1);
        $scope.dateTo = new Date();
        $scope.load();
    };

    /**
     * Sets the search range to the current year then loads the charts.
     */
    $scope.loadCurrentYear = function() {
        var today = new Date();
        $scope.dateFrom = new Date(today.getFullYear(), 0, 1);
        $scope.dateTo = new Date(today.getFullYear(), 11, 31);
        $scope.load();
    };

    /**
     * Sets the search range to the previous year then loads the charts.
     */
    $scope.loadPreviousYear = function() {
        var today = new Date();
        today.setFullYear(today.getFullYear() - 1);
        $scope.dateFrom = new Date(today.getFullYear(), 0, 1);
        $scope.dateTo = new Date(today.getFullYear(), 11, 31);
        $scope.load();
    };

    $scope.load = function() {
        if(!$scope.dateFrom || !$scope.dateTo) {
            return;
        }

        if($scope.dateFrom.getTime() > $scope.dateTo.getTime()) {
            alert('Invalid date range!');
            return;
        }

        $scope.status.loading = true;
        if(!$scope.selectedOrganization && !$scope.selectedSponsor) {
            ApiService.getFinancialData($scope.dateFrom, $scope.dateTo).then(function(response) {
                loadFinancialData(response);
            }).catch(function(error) {
                alert('Error:' + error);
            }).finally(function() {
                $scope.status.loading = false;
            });
        }
        else {
            ApiService.getFinancialDataByEntity($scope.dateFrom, $scope.dateTo,
                    $scope.selectedOrganization, $scope.selectedSponsor).then(function(response) {
                loadFinancialDataByEntity(response);
            }).catch(function(error) {
                alert('Error: ' + error);
            }).finally(function() {
                $scope.status.loading = false;
            });
        }
    };

    /**
     * Creates the financial chart from the decisions data set, then draws the chart.
     *
     * @param {type} responseData - financial data fetched from the API.
     */
    var loadFinancialData = function(responseData) {
        // Create the chart data table and set the column types and labels.
        $scope.charts.financial.data = new google.visualization.DataTable();
        $scope.charts.financial.data.addColumn('string', 'Φορέας');
        $scope.charts.financial.data.addColumn('number', 'Ποσό');

        /* The data is already formatted so for each row in the data set push the organization's
         * label and the expense amount (in currency format) to the chart data table. */
        for(var i = 0; i < responseData.length; i++) {
            $scope.charts.financial.data.addRow([responseData[i].organizationLabel,
                { v: responseData[i].expenseAmount,
                    f: $filter('currency')(responseData[i].expenseAmount, '') + ' \u20ac' }]);
        }

        /* Set chart's display options (title, font size, height, horizontal axis format). Height is
         * set depending on the number of rows, with 20 pixels for each row plus 80 pixels for the
         * chart title and the horizontal axis tick labels. */
        var chartAreaHeight = $scope.charts.financial.data.getNumberOfRows() * 20;
        var chartHeight = chartAreaHeight + 80;
        $scope.charts.financial.options = {
            title: 'Έγκριση δαπάνης ' + $filter('date')($scope.dateFrom) + ' - '
                    + $filter('date')($scope.dateTo),
            legend: 'none',
            fontSize: 15,
            titleFontSize: 15,
            height: chartHeight,
            chartArea : {height: chartAreaHeight},
            hAxis: {format: 'currency', scaleType: 'log'},
            tooltip: {trigger: 'selection', isHtml: true}
        };

        var chart = drawFinancialChart();

        // Add action to open dialog with decisions list.
        chart.setAction({
            id: 'modal',
            text: 'Αναρτήσεις',
            action: function() {
                var selection = chart.getSelection();
                var row = selection[0].row;
                var org = $scope.charts.financial.data.getValue(row, 0);

                $uibModal.open({
                    animation: true,
                    size: 'lg',
                    templateUrl: 'views/modal.html',
                    controller: 'ModalController',
                    controllerAs: 'modal',
                    resolve: {
                        title: function() {
                            return $scope.charts.financial.data.getValue(row, 0);
                        },
                        data: function() {
                            var modalData = [];
                            for(var i = 0; i < responseData.length; i++) {
                                if(responseData[i].organizationLabel === org) {
                                    for(var j = 0; j < responseData[i].decisions.length; j++) {
                                        modalData.push(responseData[i].decisions[j]);
                                    }
                                }
                            }
                            return modalData;
                        }
                    }
                });
            }
        });

        // Add action to load organization's graph.
        chart.setAction({
            id: 'graph',
            text: 'Γράφημα',
            action: function() {
                $scope.status.loading = true;

                var selection = chart.getSelection();
                var row = selection[0].row;
                var org = $scope.charts.financial.data.getValue(row, 0);

                ApiService.getFinancialDataByEntity($scope.dateFrom, $scope.dateTo, org, null)
                .then(function(response) {
                    $scope.selectedOrganization = org;
                    loadFinancialDataByEntity(response);
                }).catch(function(error) {
                    alert('Error: ' + error);
                }).finally(function() {
                    $scope.status.loading = false;
                });
            }
        });
    };

    /**
     * Draws the financial chart with a 100ms delay. This is called either when the financial data
     * has finished loading while the financial tab is active, or when the financial tab is
     * activated.
     */
    var drawFinancialChart = function() {
        // Add one more column to the chart which will display each bar's value on the bar.
        var view = new google.visualization.DataView($scope.charts.financial.data);
        view.setColumns([0, 1, {
                calc: 'stringify',
                sourceColumn: 1,
                type: 'string',
                role: 'annotation'
        }]);

        return ChartService.drawChart(view, $scope.charts.financial.options,
            Constants.ChartTypes['BAR_CHART'], document.getElementById('chart_div'));
    };

    var loadFinancialDataByEntity = function(responseData) {
        $scope.charts.financialByEntity.data = new google.visualization.DataTable();
        $scope.charts.financialByEntity.data.addColumn('string', 'Φορέας/Ανάδοχος');
        $scope.charts.financialByEntity.data.addColumn('number', 'Ποσό');
        $scope.charts.financialByEntity.data.addColumn('number', 'Αναρτήσεις');

        var dates = [];
        var d = new Date();
        for(d.setTime($scope.dateFrom.getTime()); d.getTime() <= $scope.dateTo.getTime(); d.setDate(d.getDate() + 1)) {
            dates.push($filter('date')(d));
        }

        responseData = $filter('orderBy')(responseData, 'date');

        for(var i = 0; i < dates.length; i++) {
            var expense = 0;
            var decisionsNo = 0;
            for(var j = 0; j < responseData.length; j++) {
                if($filter('date')(responseData[j].date) === dates[i]) {
                    expense += responseData[j].expenseAmount;
                    decisionsNo++;
                }
            }
            $scope.charts.financialByEntity.data.addRow([dates[i],
                {v: expense, f: $filter('currency')(expense, '') + ' \u20ac'}, decisionsNo]);
        }

        $scope.charts.financialByEntity.options = {
            title: 'Έγκριση δαπάνης '
                    + ($scope.selectedOrganization ? $scope.selectedOrganization + ' ' : '')
                    + ($scope.selectedSponsor ? $scope.selectedSponsor + ' ' : '')
                    + $filter('date')($scope.dateFrom) + ' - ' + $filter('date')($scope.dateTo),
            height: 400,
            seriesType: 'bars',
            series: {
                0: {targetAxisIndex: 0},
                1: {type: 'line', targetAxisIndex: 1}
            },
            vAxes: {
                0: {format: 'currency'},
                1: {format: '#'}
            },
            tooltip: {trigger: 'selection', isHtml: true}
        };

        var chart = drawFinancialChartByEntity();
        chart.setAction({
            id: "modal",
            text: "Αναρτήσεις",
            action: function() {
                var selection = chart.getSelection();
                var row = selection[0].row;
                var no = $scope.charts.financialByEntity.data.getValue(row, 2);

                if(no > 0) {
                    $uibModal.open({
                        animation: true,
                        size: 'lg',
                        templateUrl: 'views/modal.html',
                        controller: 'ModalController',
                        controllerAs: 'modal',
                        resolve: {
                            title: function() {
                                return $scope.charts.financialByEntity.data.getValue(row, 0);
                            },
                            data: function() {
                                var modalData = [];
                                for(var i = 0; i < responseData.length; i++) {
                                    if($filter('date')(responseData[i].decision.issueDate) ===
                                            $scope.charts.financialByEntity.data.getValue(row, 0)) {
                                        modalData.push(responseData[i].decision);
                                    }
                                }
                                return modalData;
                            }
                        }
                    });
                }
            }
        });
    };

    var drawFinancialChartByEntity = function() {
        return ChartService.drawChart($scope.charts.financialByEntity.data,
            $scope.charts.financialByEntity.options, Constants.ChartTypes['COMBO_CHART'],
            document.getElementById('chart_div'));
    };
}]);
