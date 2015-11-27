(function() {
    // Load the framework and Highcharts. Framework is passed as a parameter.
    var mediator = require('mediatorjs');
    var configService = require('../services/config');
    var _ = require('lodash');
    var that = {};
    that.load = function (element) {
        configService.setValue('chart.renderTo', element);
        var options = configService.get();
        var chart = new Highcharts.Chart(options);

        mediator.on('configUpdate', function () {
            chart = new Highcharts.Chart(configService.get());
        });
        mediator.on('dataUpdate', function () {
            chart = new Highcharts.Chart(configService.get());
        });
    };


    module.exports = that;
})();