(function(){
    _ = require('lodash');
    var mediator = require('mediatorjs');

    var that = {};
    var dataSet = [];

    var labels = {
        x: true,
        y: false
    };

    that.getSeries = function (){
        return _.cloneDeep(_.first(dataSet));
    };

    that.getCategories = function(){
        return _.cloneDeep(_.map(_.slice(dataSet,1), function(row){
            return _.first(row);
        }));
    };

    that.axisHasLabel = function(axis){
        return labels[axis];
    };

    that.get = function(){
        // remove categories
        var data = _.slice(dataSet, 1);
        return _.cloneDeep(data);
    };

    that.getRaw = function(){
        return _.cloneDeep(dataSet);
    };

    that.set = function(newDataSet){
        // if the first cell is empty, make the assumption that the first column are labels.
        if(_.isEmpty(newDataSet[0][0]) || newDataSet[0][0] == 'cat' || newDataSet[0][0] == 'categories'){
            labels.y = true;
        } else {
            labels.y = false;
        }
        if(!_.isEqual(dataSet, newDataSet)){
            dataSet = _.cloneDeep(newDataSet);
            mediator.trigger('dataUpdate', that.get());
        }
    };

    module.exports = that;
})();

