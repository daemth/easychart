// Load the framework and Highcharts. Framework is passed as a parameter.

var chartConfig = require('../services/chartConfig.js');
var chart = function () {
    var that = this;
    that.load = function (element) {
        element.innerHTML = '<div id="container" ></div>';
        new Highcharts.Chart(chartConfig.get());
    };
    return that;

};


module.exports = chart();