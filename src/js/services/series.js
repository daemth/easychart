(function () {
    var that = {};
    that.get = function(data, config, labels) {

        var series = generateDataSeries(config, data);

        /*
        var data = dataService.get();
        var vpp = getValuesPerPoint(type);
        var ylabel = dataService.axisHasLabel('y');
        var seriesLabels = dataService.getSeries();
        var categories = dataService.getCategories();
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
        */

        return _.merge(config.series, series);
    };

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
