(function () {
    _ = require('lodash');
    var dataService = require('../services/data.js');

    var dump = require('../config/dump.json');
    var that = {};
    var type = 'line';
    var renderTo = 'container';

    that.get = function () {
        return {
            chart: {
                renderTo: renderTo,
                type: type
            },
            xAxis: getXAxis(dataService.get(), dataService.getCategories()),
            yAxis: getYAxis(),
            series: getSeries(dataService.get(), getValuesPerPoint(type))
        }
    };

    function getXAxis(data, categories) {
        var object = {};
        if(categories){
            object.categories = categories;
        }
        return object;
    }

    function getYAxis() {

    }

    function getValuesPerPoint(type) {
        var vpp;
        switch (type) {
            case 'arearange':
            case 'areasplinerange':
            case 'columnrange':
            case 'errorbar':
            case 'scatter':
                vpp = 2;
                break;
            case 'bubble':
                vpp = 3;
                break;

            case 'boxplot':
                vpp = 5;
                break;

            default:
                vpp = 1;
                break;
        }
        return vpp;
    }

    function getSeries(data, vpp) {
        var series = [];
        _.forEach(data, function (row) {
            if (!_.isEmpty(row)) {
                var object = {};
                if (true) {
                    object.name = row[0];
                    object.data = _.slice(row, 1);
                } else {
                    object.data = row;
                }
                object.data = parsDataInt(object.data);
                if (vpp > 1) {
                    object.data = _.chunk(object.data, vpp);
                }
                series.push(object);
            }
        });
        return series;
    }

    function parsDataInt(data) {
        var newData = [];
        _.forEach(data, function (value, index) {
            if (_.isArray(value)) {
                newData[index] = parsDataInt(data);
            }
            else {
                newData[index] = parseInt(value);
            }
        });
        return newData;
    }

    module.exports = that;
})();

