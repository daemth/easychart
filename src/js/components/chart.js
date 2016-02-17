(function() {
    // Load the framework and Highcharts. Framework is passed as a parameter.
    var mediator;
    var configService;
    var that = {};

    that.load = function (element, services) {
        mediator = services.mediator;
        configService = services.config;
        var options = configService.get();
        options.chart.renderTo = element;
        var chart = new Highcharts.Chart(options);
        mediator.on('configUpdate', function (config) {
            config.chart.renderTo = element;
            chart = new Highcharts.Chart(config);
        });
    };

    module.exports = that;
})();