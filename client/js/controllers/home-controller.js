/* global app, google */

app.controller('HomeController', ['$scope', '$filter', '$timeout', '$q', '$uibModal', 'Constants', 'ApiService', 'ChartService',
        function($scope, $filter, $timeout, $q, $uibModal, Constants, ApiService, ChartService) {

    $scope.dateFrom = new Date(); // Search start date.
    $scope.dateFrom.setMonth($scope.dateFrom.getMonth() - 1);
    $scope.dateFrom.setDate($scope.dateFrom.getDate() + 1);
    $scope.dateTo = new Date(); // Search end date.

    // Options for the datepicker dialogs.
    $scope.dateOptions = {
        startingDay: 1 // First day of week (1 = Monday).
    };

    // Keeps track of open dialogs and active tabs.
    $scope.status = {
        dateFromIsOpen: false,
        dateToIsOpen: false,
        dayTabIsActive: true,
        orgTabIsActive: false,
        typeTabIsActive: false
    };

    // Holds the decision data fetched from the API.
    $scope.data;

    // Holds the category label for each organization.
    $scope.categoryLabels;

    // Holds the decision type label for each decision.
    $scope.decisionTypes;

    // Holds all chart data.
    $scope.charts = {
        day: {},
        org: {},
        type: {}
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

    /**
     * Fetches the data from the API, loads the charts and draws them.
     */
    $scope.load = function() {
        // Abort if either of the datepickers have an empty date.
        if(!$scope.dateFrom || !$scope.dateTo) {
            return;
        }

        // Display a message and abort if the start date is after the end date.
        if($scope.dateFrom.getTime() > $scope.dateTo.getTime()) {
            alert('Invalid date range!');
            return;
        }

        /* The ng-disabled property of the page controls is bound to this, it disables them while
         * the data and charts are loading. */
        $scope.status.loading = true;

        /* Initially get all decisions in range, then use the data to fill everything else. Each
         * chart's data is loaded then the chart is drawn, sequentially for each chart. */
        ApiService.getDecisionsInRange($scope.dateFrom, $scope.dateTo)
            .then(function(response) {
                $scope.data = response.data;
                loadDecisionsPerDay();
                ApiService.getOrgCategoryLabels()
                .then(function(orgCategoryLabels) {
                    $scope.categoryLabels = orgCategoryLabels;
                    loadDecisionsPerOrgCategory();
                })
                .then(function() {
                    return ApiService.getDecisionTypes();
                })
                .then(function(decisionData) {
                    $scope.decisionTypes = decisionData.data.decisionTypes;
                    loadDecisionsPerType();
                })
                .catch(function(error) {
                    alert('Error: ' + error);
                });
            })
            .catch(function(error) {
                alert('Error: ' + error);
            })
            .finally(function() {
                // Reactivate the page controls.
                $scope.status.loading = false;
            });
    };

    /**
     * Creates the decisions per day chart from the decisions data set, then draws the chart if the
     * decisions per day tab is active.
     */
    var loadDecisionsPerDay = function() {
        // Create the chart data table and set the column types and labels.
        $scope.charts.day.data = new google.visualization.DataTable();
        $scope.charts.day.data.addColumn('string', 'Ημέρα');
        $scope.charts.day.data.addColumn('number', 'Αναρτήσεις');

        /* Create an array with all dates in the search range. This is done so days with zero
         * decisions will also show up in the chart even if they don't appear in the data set. */
        var dates = [];
        var d = new Date();
        for(d.setTime($scope.dateFrom.getTime()); d.getTime() <= $scope.dateTo.getTime(); d.setDate(d.getDate() + 1)) {
            dates.push($filter('date')(d));
        }

        // Order the data by decision issue date.
        var orderedData = $filter('orderBy')($scope.data.decisions, 'issueDate');

        /* For each date in the search range, compare it to the date of each decision in the data
         * set, increment the counter when a match is found, then push the date and the count to the
         * chart data table. */
        for(var i = 0; i < dates.length; i++) {
            var sum = 0;
            for(var j = 0; j < orderedData.length; j++) {
                if($filter('date')(orderedData[j].issueDate) === dates[i]) {
                    sum++;
                }
            }
            $scope.charts.day.data.addRow([dates[i], sum]);
        }

        // Set chart's display options (title, legend position and vertical axis formatting).
        $scope.charts.day.options = {
            title: 'Αριθμός αναρτήσεων ανά ημέρα ' + dates[0] + ' - ' + dates[dates.length - 1],
            legend: 'none',
            vAxis: {format : 'decimal'},
            tooltip: {trigger: 'selection', isHtml: true}
        };

        /* If the decisions per day tab is active (visible) draw the chart (otherwise it will be
         * drawn once the tab is active). */
        if($scope.status.dayTabIsActive) {
            $scope.drawDayChart();
        }
    };

    /**
     * Creates the decisions per organization category chart from the decisions data set, then draws
     * the chart if the decisions per organization category tab is active.
     */
    var loadDecisionsPerOrgCategory = function() {
        // Create the chart data table and set the column types and labels.
        $scope.charts.org.data = new google.visualization.DataTable();
        $scope.charts.org.data.addColumn('string', 'Κατηγορία');
        $scope.charts.org.data.addColumn('number', 'Αναρτήσεις');

        /* Create an array to hold which category label corresponds to each row of the the decisions
         * data set. */
        var labelsCount = [];
        for(var i = 0; i < $scope.data.decisions.length; i++) {
            for(var j = 0; j < $scope.categoryLabels.length; j++) {
                if($scope.data.decisions[i].organizationId === $scope.categoryLabels[j].orgId) {
                    labelsCount.push({label: $scope.categoryLabels[j].categoryLabel});
                }
            }
        }

        /* Count how many times each unique category label appears in the data set and add it to the
         * chart data. */
        var uniqueLabels = $filter('unique')(labelsCount, 'label');
        uniqueLabels = $filter('orderBy')(uniqueLabels, 'label');
        for(var i = 0; i < uniqueLabels.length; i++) {
            var count = $filter('filter')(labelsCount, uniqueLabels[i].label).length;
            $scope.charts.org.data.addRow([uniqueLabels[i].label, count]);
        }

        // Set chart's display options (title and size of the pie hole).
        $scope.charts.org.options = {
            title: 'Αριθμός αναρτήσεων ανά κατηγορία φορέα ' + $filter('date')($scope.dateFrom)
                    + ' - ' + $filter('date')($scope.dateTo),
            pieHole: 0.4,
            tooltip: {trigger: 'selection', isHtml: true}
        };

        /* If there is only one category, set the text color to black as the text will be inside the
         * pie hole (white background). */
        if($scope.charts.org.data.getNumberOfRows() === 1) {
            $scope.charts.org.options.pieSliceTextStyle = {color: 'black'};
        }

        /* If the decisions per organization category tab is active (visible) draw the chart
         * (otherwise it will be drawn once the tab is active). */
        if($scope.status.orgTabIsActive) {
            $scope.drawOrgChart();
        }
    };

    /**
     * Creates the decisions per decision type chart from the decisions data set, then draws the
     * chart if the decisions per decision type tab is active.
     */
    var loadDecisionsPerType = function() {
        // Create the chart data table and set the column types and labels.
        $scope.charts.type.data = new google.visualization.DataTable();
        $scope.charts.type.data.addColumn('string', 'Είδος πράξης');
        $scope.charts.type.data.addColumn('number', 'Αναρτήσεις');

        /* For each decision type label, compare its UID to the decision type ID of each decision in
         * the data set, increment the counter when a match is found, and if the final count is
         * positive push the decision type label and the count to the chart data table (types with
         * zero decisions in the data set will not appear in the chart). */
        for(var i = 0; i < $scope.decisionTypes.length; i++) {
            var sum = 0;
            for(var j = 0; j < $scope.data.decisions.length; j++) {
                if($scope.data.decisions[j].decisionTypeId === $scope.decisionTypes[i].uid) {
                    sum++;
                }
            }
            if(sum > 0) {
                $scope.charts.type.data.addRow([$scope.decisionTypes[i].label, sum]);
            }
        }

        // Set chart's display options (title and legend position).
        $scope.charts.type.options = {
            title: 'Αριθμός αναρτήσεων ανά είδος πράξης ' + $filter('date')($scope.dateFrom)
                    + ' - ' + $filter('date')($scope.dateTo),
            legend: 'none',
            tooltip: {trigger: 'selection', isHtml: true}
        };

        /* If the decisions per decision type tab is active (visible) draw the chart (otherwise it
         * will be drawn once the tab is active). */
        if($scope.status.typeTabIsActive) {
            $scope.drawTypeChart();
        }
    };

    $scope.drawDayChart = function() {
        // Return if not data has been loaded yet.
        if(!$scope.charts.day.data) {
            return;
        }

        drawChartDelayed($scope.charts.day.data, $scope.charts.day.options,
            Constants.ChartTypes['LINE_CHART'], document.getElementById('chart_div_day'))
            .then(function(chart) {
                chart.setAction({
                    id: 'modal',
                    text: 'Αναρτήσεις',
                    action: function() {
                        var selection = chart.getSelection();
                        var row = selection[0].row;
                        var no = $scope.charts.day.data.getValue(row, 1);

                        if(no > 0) {
                            $uibModal.open({
                                animation: true,
                                size: 'lg',
                                templateUrl: 'views/modal.html',
                                controller: 'ModalController',
                                controllerAs: 'modal',
                                resolve: {
                                    title: function() {
                                        return $scope.charts.day.data.getValue(row, 0);
                                    },
                                    data: function() {
                                        var modalData = [];
                                        for(var i = 0; i < $scope.data.decisions.length; i++) {
                                            if($scope.charts.day.data.getValue(row, 0) ===
                                                    $filter('date')($scope.data.decisions[i].issueDate)) {
                                                modalData.push($scope.data.decisions[i]);
                                            }
                                        }
                                        return modalData;
                                    }
                                }
                            });
                        }
                    }
                });
            });
    };

    /**
     * Draws the decisions per organization category chart with a 100ms delay. This is called either
     * when the decisions per organziation category data has finished loading while the decisions
     * per organization category tab is active, or when the decisions per organization category tab
     * is activated.
     */
    $scope.drawOrgChart = function() {
        // Return if no data has been loaded yet.
        if(!$scope.charts.org.data) {
            return;
        }

        drawChartDelayed($scope.charts.org.data, $scope.charts.org.options,
            Constants.ChartTypes['PIE_CHART'], document.getElementById('chart_div_org'))
            .then(function(chart) {
                chart.setAction({
                    id: 'modal',
                    text: 'Αναρτήσεις',
                    action: function() {
                        var selection = chart.getSelection();
                        var row = selection[0].row;
                        var no = $scope.charts.org.data.getValue(row, 1);

                        if(no > 0) {
                            $uibModal.open({
                                animation: true,
                                size: 'lg',
                                templateUrl: 'views/modal.html',
                                controller: 'ModalController',
                                controllerAs: 'modal',
                                resolve: {
                                    title: function() {
                                        return $scope.charts.org.data.getValue(row, 0);
                                    },
                                    data: function() {
                                        var modalData = [];
                                        for(var i = 0; i < $scope.data.decisions.length; i++) {
                                            for(var j = 0; j < $scope.categoryLabels.length; j++) {
                                                if($scope.data.decisions[i].organizationId === $scope.categoryLabels[j].orgId
                                                        && $scope.categoryLabels[j].categoryLabel === $scope.charts.org.data.getValue(row, 0)) {
                                                    modalData.push($scope.data.decisions[i]);
                                                    break;
                                                }
                                            }
                                        }
                                        return modalData;
                                    }
                                }
                            });
                        }
                    }
                });
            });
    };

    /**
     * Draws the decisions per decision type chart with a 100ms delay. This is called either when
     * the decisions per decision type data has finished loading while the decisions per decision
     * type tab is active, or when the decisions per decision type tab is activated.
     */
    $scope.drawTypeChart = function() {
        // Return if no data has been loaded yet.
        if(!$scope.charts.type.data) {
            return;
        }

        // Add one more column to the chart which will display each bar's value on the bar.
        var view = new google.visualization.DataView($scope.charts.type.data);
        view.setColumns([0, 1, {
                calc: 'stringify',
                sourceColumn: 1,
                type: 'string',
                role: 'annotation'
            }]);

        drawChartDelayed(view, $scope.charts.type.options, Constants.ChartTypes['COLUMN_CHART'],
            document.getElementById('chart_div_type')).then(function(chart) {
                chart.setAction({
                    id: 'modal',
                    text: 'Αναρτήσεις',
                    action: function() {
                        var selection = chart.getSelection();
                        var row = selection[0].row;
                        var no = $scope.charts.type.data.getValue(row, 1);

                        if(no > 0) {
                            $uibModal.open({
                                animation: true,
                                size: 'lg',
                                templateUrl: 'views/modal.html',
                                controller: 'ModalController',
                                controllerAs: 'modal',
                                resolve: {
                                    title: function() {
                                        return $scope.charts.type.data.getValue(row, 0);
                                    },
                                    data: function() {
                                        var modalData = [];
                                        for(var i = 0; i < $scope.data.decisions.length; i++) {
                                            for(var j = 0; j < $scope.decisionTypes.length; j++) {
                                                if($scope.data.decisions[i].decisionTypeId === $scope.decisionTypes[j].uid
                                                        && $scope.decisionTypes[j].label === $scope.charts.type.data.getValue(row, 0)) {
                                                    modalData.push($scope.data.decisions[i]);
                                                    break;
                                                }
                                            }
                                        }
                                        return modalData;
                                    }
                                }
                            });
                        }
                    }
                });
            });
    };

    /**
     * Final call when drawing charts, passes the parameters to the ChartService.drawChart()
     * function with a 100ms delay which is necessary to allow for the page to load first.
     *
     * @param {Object} data - data used in the chart.
     * @param {Object} options - options for the chart.
     * @param {Number} chartType - type of chart to be drawn, one of Constants.ChartTypes.
     * @param {Object} element - HTML element which will hold the chart.
     */
    var drawChartDelayed = function(data, options, chartType, element) {
        var def = $q.defer();

        if(data) {
            $timeout(function() {
                def.resolve(ChartService.drawChart(data, options, chartType, element));
            }, 100);
        }
        else {
            def.reject();
        }

        return def.promise;
    };
}]);
