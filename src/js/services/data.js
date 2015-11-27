(function () {
    var _ = require('lodash');
    var mediator = require('mediatorjs');

    var that = {};
    var dataSet = [];

    that.getSeries = function () {
        return JSON.parse(JSON.stringify(_.first(dataSet)));
    };

    that.getCategories = function () {
        return JSON.parse(JSON.stringify(_.map(_.slice(dataSet, 1), function (row) {
            return _.first(row);
        })));
    };

    that.get = function () {
        return JSON.parse(JSON.stringify(dataSet));
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

        return JSON.parse(JSON.stringify(data));
    };

    that.set = function (newDataSet) {
        if (!_.isEqual(dataSet, newDataSet)) {
            dataSet = JSON.parse(JSON.stringify(newDataSet));
            mediator.trigger('dataUpdate', that.get());
        }
    };

    module.exports = that;
})
();

