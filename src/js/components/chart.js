(function() {
    // Load the framework and Highcharts. Framework is passed as a parameter.
    var mediator = require('mediatorjs');
    var configService = require('../services/config');
    var _ = require('lodash');
    var that = {};
    that.load = function (element) {
        var options = configService.get();
        var chart = new Highcharts.Chart(options);
        mediator.on('configUpdate', function () {
            var options = configService.get();
            chart = new Highcharts.Chart(options);
        });
        mediator.on('dataUpdate', function () {
            var options = configService.get();
            chart = new Highcharts.Chart(options);
        });
        mediator.on('dataValueUpdate', function () {
            var options = configService.get();
            chart = new Highcharts.Chart(options);
        });

    };
    module.exports = that;
})();