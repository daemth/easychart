(function() {
    // Load the framework and Highcharts. Framework is passed as a parameter.
    var mediator = require('mediatorjs');
    var configService = require('../services/config');
    var that = {};
    that.load = function (element) {
        element.style.width = "100%";
        element.style["max-width"] = "100%";
        element.style.height = "400px";
        element.style.float = "left";
        var config = configService.get();
        config.chart.renderTo = element;
        var chart = new Highcharts.Chart(config);
        mediator.on('presetUpdate', function () {
            config = configService.get();
            config.chart.renderTo = element;
            chart = new Highcharts.Chart(config);
        });
    };
    console.log('test');
    module.exports = that;
})();