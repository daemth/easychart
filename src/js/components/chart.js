// Load the framework and Highcharts. Framework is passed as a parameter.

var config = require('../services/config');
var chart = function () {
    var that = this;


    that.load = function (element) {
        element.innerHTML = '<div id="container" ></div>';
        console.log(config.get());
        new Highcharts.Chart(config.get());
    };
    return that;

};


module.exports = chart();