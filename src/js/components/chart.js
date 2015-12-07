(function() {
    // Load the framework and Highcharts. Framework is passed as a parameter.
    var mediator;
    var configService;
    var _ = require('lodash');
    var that = {};
    that.load = function (element, services) {
        mediator = services.mediator;
        configService = services.config;
        var options = configService.get();
        options.chart.renderTo = element;
        var chart = new Highcharts.Chart(options);
        mediator.on('configUpdate', function () {
            mediator.trigger('treeUpdate'); // to update series-tab-name
            var options = configService.get();
            options.chart.renderTo = element;
            chart = new Highcharts.Chart(options);
        });
        mediator.on('dataUpdate', function () {
            var options = configService.get();
            options.chart.renderTo = element;
            chart = new Highcharts.Chart(options);
        });
        mediator.on('dataValueUpdate', function () {
            var options = configService.get();
            options.chart.renderTo = element;
            chart = new Highcharts.Chart(options);
        });
    };
    module.exports = that;
})();