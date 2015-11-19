(function(){
    _ = require('lodash');
    var mediator = require('mediatorjs');

    var that = {};
    var dataSet = [];

    var labels = {
        x: false,
        y: false
    };

    that.getCategories = function (data){
        return _.first(dataSet);
    };

    that.get = function(){
        return _.cloneDeep(_.slice(dataSet, 1));
    };
    that.getRaw = function(){
        return _.cloneDeep(dataSet, 1);
    };

    that.set = function(newDataSet){
        if(!_.isEqual(dataSet, newDataSet)){
            dataSet = [].concat([that.getCategories()], newDataSet);
            mediator.trigger('dataUpdate', that.get());
        }
    };
    that.setRaw = function(newDataSet){
        if(!_.isEqual(dataSet, newDataSet)){
            dataSet = _.cloneDeep(newDataSet);
            mediator.trigger('dataUpdate', that.get());
        }
    };


    module.exports = that;

})();

