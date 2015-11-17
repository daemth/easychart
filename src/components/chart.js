var Highcharts = require('highcharts-commonjs');
var dataService = require('../services/data.js');
var configService = require('../services/config.js');
var chart = function () {
    var that = this;

    that.load = function (element) {
        element.innerHTML = '<div id="container" style="width:100%; height:400px;"></div>';
        container = element.firstChild;
        var config = {
            chart: {
                type: 'bar'
            },
            title: {
                text: 'Fruit Consumption'
            },
            xAxis: {
                categories: ['Apples', 'Bananas', 'Oranges']
            },
            yAxis: {
                title: {
                    text: 'Fruit eaten'
                }
            },
            series: [{
                name: 'Jane',
                data: [1, 0, 4]
            }, {
                name: 'John',
                data: [5, 7, 3]
            }]
        };

        var chart = Highcharts.createChart(
            container,
            config,
            function () {
                console.log('Chart initialized');
            }
        );
    };
    return that;
};


module.exports = chart();