(function () {
    _ = require('lodash');
    var mediator = require('mediatorjs');

    var that = {};
    var dataSet = [];

    that.getSeries = function () {
        return _.cloneDeep(_.first(dataSet));
    };

    that.getCategories = function () {
        return _.cloneDeep(_.map(_.slice(dataSet, 1), function (row) {
            return _.first(row);
        }));
    };

    that.get = function () {
        return _.cloneDeep(dataSet);
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

        return _.cloneDeep(data);
    };

    that.set = function (newDataSet) {
        if (!_.isEqual(dataSet, newDataSet)) {
            dataSet = _.cloneDeep(newDataSet);
            mediator.trigger('dataUpdate', that.get());
        }
    };

    module.exports = that;
})
();

