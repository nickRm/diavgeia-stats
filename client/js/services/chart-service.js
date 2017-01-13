/* global app, google */

app.service('ChartService', ['Constants', function(Constants) {

    /**
     * Draws a chart of the type determined by the chart type parameter and using the data and
     * options provided, draws it on the specified HTML element.
     *
     * @param {Object} chartData - data used in the chart.
     * @param {Object} options - options for the chart.
     * @param {Number} chartType - type of chart to be drawn, one of Constants.ChartTypes.
     * @param {Object} element - HTML element which will hold the chart.
     */
    this.drawChart = function(chartData, options, chartType, element) {
        var chart;
        switch(chartType) {
            case Constants.ChartTypes['LINE_CHART']:
                chart = new google.visualization.LineChart(element);
                break;
            case Constants.ChartTypes['PIE_CHART']:
                chart = new google.visualization.PieChart(element);
                break;
            case Constants.ChartTypes['COLUMN_CHART']:
                chart = new google.visualization.ColumnChart(element);
                break;
            case Constants.ChartTypes['BAR_CHART']:
                chart = new google.visualization.BarChart(element);
                break;
            case Constants.ChartTypes['COMBO_CHART']:
                chart = new google.visualization.ComboChart(element);
                break;
            default: // Not used
        }

        chart.draw(chartData, options);

        // Resizes the chart when the browser window is resized.
        function resizeHandler() {
            chart.draw(chartData, options);
        }
        if(window.addEventListener) {
            window.addEventListener('resize', resizeHandler, false);
        }
        else if(window.attachEvent) {
            window.attachEvent('onresize', resizeHandler);
        }

        return chart;
    };
}]);
