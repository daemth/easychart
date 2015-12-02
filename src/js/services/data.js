(function () {
    var _ = require('lodash');
    var mediator = require('mediatorjs');

    var that = {};
    var dataSet = [];

    that.getSeries = function () {
        return cloneDeep(_.first(dataSet));
    };

    that.getCategories = function () {
        return cloneDeep(_.map(_.slice(dataSet, 1), function (row) {
            return _.first(row);
        }));
    };

    that.get = function () {
        return cloneDeep(dataSet);
    };

    that.getData = function (series, categories) {
        var data = dataSet;

        if (series) {
            data = _.slice(data, 1);
        }

        if (categories) {
            data = _.map(data, function (row) {
                return _.rest(row);
            });
        }

        return cloneDeep(data);
    };

    that.set = function (newDataSet) {
        if (!_.isEqual(dataSet, newDataSet)) {
            dataSet = cloneDeep(newDataSet);
            mediator.trigger('dataUpdate', that.get());
        }
    };
    that.setValue = function(row, cell, value){
        if(!_.isUndefined(dataSet[row]) && !_.isUndefined(dataSet[row][cell])){
            dataSet[row][cell] = value;
        }
        mediator.trigger('dataValueUpdate', that.get());
    };
    module.exports = that;
})
();

