(function () {
    _ = require('lodash');
    var dataService = require('../services/data.js');
    var that = {};
    var type = 'bubble';
    var renderTo = 'container';

    that.get = function () {
        return {
            chart: {
                renderTo: renderTo,
                type: type
            },
            xAxis: getXAxis(),
            series: getSeries(dataService.get(), getValuesPerPoint(type), dataService.axisHasLabel('y'), dataService.getSeries())
        }
    };

    function getXAxis() {
        var object = {};
        object.categories = dataService.getCategories();
        return object;
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

    function getSeries(data, vpp, ylabel, seriesLabels) {
        var series = [];

        if (ylabel) {
            data = _.map(data, function(row){
                return _.rest(row);
            })
        }
        // remove the empty labels
        seriesLabels = _.remove(seriesLabels, function(n) {
            return !_.isEmpty(n);
        });

        _.forEach(seriesLabels ,function(serieLabel, index){
            var object = {};
            object.name = serieLabel;
            object.data = [];
            _.forEach(data, function (row) {
                // remove the first item if there are categories
                console.log(vpp);
                object.data.push(_.slice(row,index*vpp, index*vpp+vpp));
            });
            object.data = parsDataInt(object.data);
            series.push(object);
        });

        return series;
    }

    function parsDataInt(data) {
        var newData = [];
        _.forEach(data, function (value, index) {
            if (_.isArray(value)) {
                newData[index] = parsDataInt(value);
            }
            else {
                newData[index] = parseInt(value);
            }
        });
        return newData;
    }

    module.exports = that;
})();

