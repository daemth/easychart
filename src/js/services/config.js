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
            series: getSeries(dataService.get(), getValuesPerPoint(type), dataService.axisHasLabel('y'), dataService.getSeries(),  dataService.getCategories())
        }
    };

    function getXAxis() {
        var object = {'type':'category'};   // xAxis.type = category -> for development only
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

    function getSeries(data, vpp, ylabel, seriesLabels, categories) {
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
            _.forEach(data, function (row, dataIndex) {
                // remove the first item if there are categories
                object.data.push(_.union([categories[dataIndex]], parseDataFloat(_.slice(row,index*vpp, index*vpp+vpp))));
            });

            series.push(object);
        });
        return series;
    }

    function parseDataFloat(data) {
        var newData = [];
        _.forEach(data, function (value, index) {
            if (_.isArray(value)) {
                newData[index] = parseDataFloat(value);
            }
            else {
                newData[index] = value === '' || value === 'null' ? null : parseFloat(value);
            }
        });
        return newData;
    }

    module.exports = that;
})();