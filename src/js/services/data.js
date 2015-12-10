(function () {
    function constructor (_mediator_){
        var mediator = _mediator_;
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            map: require('lodash.map'),
            cloneDeep: require('lodash.clonedeep'),
            slice: require('lodash.slice'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first'),
            isEqual: require('lodash.isequal'),
            rest: require('lodash.rest'),
            isNaN: require('lodash.isnan')
        };
        var papa = require('papaparse');
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

        that.setValue = function(row, cell, value){
            if(!_.isUndefined(dataSet[row]) && !_.isUndefined(dataSet[row][cell])){
                dataSet[row][cell] = _.isNaN(value) ? null : value;
            }
            mediator.trigger('dataUpdate', that.get());
        };

        that.setCSV = function(csv){
            dataSet = papa.parse(csv).data;
            mediator.trigger('dataUpdate', that.get());
        };

        that.setUrl = function(url){
            var oReq = new XMLHttpRequest();
            oReq.addEventListener("load", function (data) {
                dataSet = papa.parse(data).data;
            });
            oReq.open("GET", url, true);
            oReq.send();
        };

        return that;
    }


    module.exports = constructor;
})
();

