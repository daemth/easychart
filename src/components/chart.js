// Load the framework and Highcharts. Framework is passed as a parameter.
var HighCharts = require('highcharts-browserify');
var HighCharts = require('highcharts-browserify/more');
var configService = require('../services/config.js');
var chart = function () {
    var that = this;
    that.load = function (element) {
        element.innerHTML = '<div id="container" ></div>';
        new Highcharts.Chart(configService.get());
    };
    return that;
};


module.exports = chart();