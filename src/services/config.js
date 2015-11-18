(function () {
    _ = require('lodash');
    var dataService = require('../services/data.js');
    var that = {};
    var type = 'boxplot';
    var renderTo = 'container';

    var labels = {
        x: false,
        y: false
    };

    that.get = function () {
        return {
            chart: {
                renderTo: renderTo,
                type: type
            },
            xAxis: getXAxis(dataService.get(), labels.x),
            yAxis: getYAxis(),
            series: getSeries(dataService.get(), labels, getValuesPerPoint(type))
        }
    };

    that.setlabelsAxis = function (axis, value) {
        if (!_.isUndefined(labels[axis])) {
            labels[axis] = value;
        }
    };

    function getXAxis(data, categories) {
        var object = {};
        if(categories){
            object.categories = getCategories(data);
        }
        return object;
    }

    function getYAxis() {

    }

    function getCategories(data){
        return _.slice(_.first(data), 1);
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

    function getSeries(data, labels, vpp) {
        var series = [];

        if (labels.x) {
            data = _.slice(data, 1);
        }
        _.forEach(data, function (row) {
            if (!_.isEmpty(row)) {
                var object = {};

                if (labels.y) {
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

