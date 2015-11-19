(function(){
    _ = require('lodash');
    var mediator = require('mediatorjs');

    var that = {};
    var dataSet = [];

    var labels = {
        x: true,
        y: false
    };

    that.getCategories = function (){
        return _.first(dataSet);
    };

    that.axisHasLabel = function(axis){
        return labels[axis];
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
        // if the first cell is empty, make the assumption that the first column are labels.
        if(_.isEmpty(newDataSet[0][0]) || newDataSet[0][0] == 'cat' || newDataSet[0][0] == 'categories'){
            labels.y = true;
        } else {
            labels.y = false;
        }
        console.log(labels);
        if(!_.isEqual(dataSet, newDataSet)){
            dataSet = _.cloneDeep(newDataSet);
            mediator.trigger('dataUpdate', that.get());
        }
    };


    module.exports = that;

})();

