(function () {
    var that = {};
    var _ = {
        isUndefined: require('lodash.isundefined'),
        find: require('lodash.find'),
        map: require('lodash.map'),
        cloneDeep: require('lodash.clonedeep'),
        remove: require('lodash.remove'),
        forEach: require('lodash.foreach'),
        first: require('lodash.first'),
        union: require('lodash.union'),
        slice: require('lodash.slice'),
        drop: require('lodash.drop'),
        size: require('lodash.size'),
        isArray: require('lodash.isarray'),
        isEmpty: require('lodash.isempty'),
        merge: require('lodash.merge')
    };

    that.get = function (data, config, labels, categories, series) {
        var object = generateDataSeries(config, data);
        if (labels.categories) {
            object = setCategories(object, categories);
        }
        if (labels.series) {
            object = setSeries(object, series);
        }
        return object;
    };

    function setCategories(series, categorieLabels) {
        _.forEach(series, function (item, index) {
            _.forEach(item.data, function (row, dataIndex) {

                categorieLabels[dataIndex] = parseCategoryLabel(categorieLabels[dataIndex]);
                
                // depending on the notation (turbothreshold, infra) we add the categorylabel to the array or set it as a property
                if(series[index]['data'][dataIndex].isArray) {
                    series[index]['data'][dataIndex] = _.union([categorieLabels[dataIndex]], row);
                } else {
                    // is the label is a string -> assign to name-property
                    if(typeof categorieLabels[dataIndex] === 'string'){
                        series[index]['data'][dataIndex].name = categorieLabels[dataIndex];
                    } else { // assign numeric labels to the x-property
                        series[index]['data'][dataIndex].x = categorieLabels[dataIndex];
                    }
                }
            });
        });
        return series;
    }

    function parseCategoryLabel(label){
        // timestamp -> parse as integer
        var regexTimestamp = /^[1-9]\d*$/;
        if (regexTimestamp.test(label)) {
            label = parseFloat(label);
        }

        // ISO 8601 date format -> convert to timestamp
        var regexIsoDate = /(\d{4})(\-(\d{2})){2}/;
        if (regexIsoDate.test(label)) {
            var array = label.split('-'),
                y = array[0], m = array[1] - 1, d = array[2]; // month correction
            //var [y, m, d] = label.split('-'); // ES6 destructuring assignment
            label = Date.UTC(y, m, d);
        }
        return label;
    }

    function setSeries(series, seriesLabels) {
        seriesLabels = _.remove(seriesLabels, function (n) {
            return !_.isEmpty(n);
        });

        _.forEach(series, function (item, index) {
            if (_.isUndefined(series[index].name)) {
                series[index].name = seriesLabels[index];
            }
        });

        return series;
    }

    function generateEmptySeries(series, defaultType, size, animation) {
        var array = [];
        var index = 0;
        while (size > 0) {
            var object = {};
            // look for settings for the series;
            if (series && series[index]) {
                object = _.merge(object, series[index]);
            } else {
                object.type = defaultType;
            }
            object.animation = animation ? animation : false;
            object.data = [];
            size = size - getValuesPerPoint(object.type).points;
            array.push(object);
            index++;
        }
        return array;
    }

    function generateDataSeries(config, data) {
        // check for series config for the data and apply this
        var configClone = _.cloneDeep(config);
        var emptySeries = generateEmptySeries(configClone.series, configClone.chart.type, _.size(_.first(data)), configClone.chart.animation);
        return _.map(emptySeries, function (item, index) {

            var vpp = getValuesPerPoint(_.isUndefined(item.type) || item.type === null ? config.chart.type : item.type);
            _.forEach(data, function (row, rowIndex) {
                var cell = {};
                if (!_.isUndefined(configClone.series) && !_.isUndefined(configClone.series[index]) && !_.isUndefined(configClone.series[index].data) && !_.isUndefined(configClone.series[index].data[rowIndex])) {
                    cell = configClone.series[index].data[rowIndex];
                }

                var points = parseDataFloat(_.slice(row, 0, vpp.points));

                // check for turboThreshold
                if(data.length >= 1000){
                    // unnamed points (array) if more than 1000 datapoints
                    cell = points;
                } else {
                    // named points if less than 1000 datapoints
                    _.forEach(vpp.definition, function(label, pointIndex){
                        if( points[pointIndex] !== 'null'){
                            cell[label] = points[pointIndex];
                        } else {
                            cell[label] = null;
                        }
                    });
                }
                item.data.push(cell);
                data[rowIndex] = _.drop(data[rowIndex], vpp.points);
            });
            return item;
        });
    }


    function getValuesPerPoint(type) {
        var vpp;
        switch (type) {
            case 'scatter':
            case 'polygon':
                vpp = {
                    points: 2,
                    definition: ['x', 'y']
                };
                break;
            case 'bubble':
                vpp = {
                    points: 3,
                    definition: ['x', 'y', 'z']
                };
                break;
            case 'heatmap':
                vpp = {
                    points: 2,
                    definition: ['y', 'value']
                };
                break;
            case 'boxplot':
                vpp = {
                    points: 5,
                    definition: ['low', 'q1', 'median', 'q3', 'high']
                };
                break;
            case 'errorbar':
            case 'areasplinerange':
            case 'arearange':
            case 'columnrange':
                vpp = {
                    points: 2,
                    definition: ['low', 'high']
                };
                break;
            case 'line':
            case 'spline':
            case 'treemap':
            case 'solidgauge':
            case 'pyramid':
            case 'pie':
            case 'funnel':
            case 'gauge':
            case 'areaspline':
            case 'waterfall':
            case 'column':
            case 'bar':
                vpp = {
                    points: 1,
                    definition: ['y']
                };
                break;
            default:
                vpp = {
                    points: 1,
                    definition: ['y']
                };
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
                newData[index] = value === '' || value === 'null' || isNaN(value) || value === null ? null : parseFloat(value);
            }
        });
        return newData;
    }

    module.exports = that;
})();