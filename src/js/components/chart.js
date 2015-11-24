// Load the framework and Highcharts. Framework is passed as a parameter.
var mediator = require('mediatorjs');
var config = require('../services/config');
var chart = function () {
    var that = this;

    that.load = function (element) {
        element.innerHTML = '<div id="container" ></div>';

        var chart = new Highcharts.Chart(config.get());
        mediator.on('presetUpdate', function(){
            console.log(config.get());
            //chart.destroy();
            chart = new Highcharts.Chart(config.get());

        });

    };
    return that;

};


module.exports = chart();