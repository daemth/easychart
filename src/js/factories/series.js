(function () {
    var that = {};
    var _ = require('lodash');

    that.get = function(data, config, labels) {
        var series = generateDataSeries(config, data);
        if(labels.categories){
            series = setCategories(series, getCategories(data));
        }

        if(labels.series){
            series = setSeries(series, getSeries(data));
        }
        return series;
    };

    function getCategories(data){
        return _.cloneDeep(_.map(_.slice(data, 1), function (row) {
            return _.first(row);
        }));
    }

    function getSeries(data){
        return _.cloneDeep(_.first(data));
    }

    function setCategories (series, categorieLabels){
        _.forEach(series ,function(item, index){
            _.forEach(item.data, function (row, dataIndex) {
                series[index]['data'][dataIndex] = _.union([categorieLabels[dataIndex]], row);
            });
        });
        return series;
    }

    function setSeries (series, seriesLabels){
        seriesLabels = _.remove(seriesLabels, function(n) {
            return !_.isEmpty(n);
        });

        _.forEach(series ,function(item, index){
            if(_.isUndefined(series[index].name)){
                series[index].name = seriesLabels[index];
            }
        });

        return series;
    }

    function generateEmptySeries(series, defaultType, size){
        var array = [];
        _.forEach(series, function(item){
            if(size > 0){
                var object = {
                    data: [],
                    type: item.type !== null ? item.type : defaultType
                };
                size = size - getValuesPerPoint(object.type);
                array.push(object);
            }
        });

        while(size > 0){
            var object = {
                data: [],
                type: defaultType
            };
            size = size - getValuesPerPoint(defaultType);
            array.push(object);
        }
        return array;
    }

    function generateDataSeries(config, data){
        var emptySeries = generateEmptySeries(config.series, config.chart.type, _.size(_.first(data)));
        return _.map(emptySeries, function(item, index){
            var vpp = getValuesPerPoint(item.type);
            _.forEach(data, function(row, index){
                item.data.push(parseDataFloat(_.slice(row,0,vpp)));
                data[index] = _.drop(data[index],vpp);
            });
            // check for series config and apply this
            if(!_.isUndefined(config.series) && !_.isUndefined(config.series[index])){
                item = _.merge(config.series[index], item);
            }
            return item;
        });

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
