(function(){
    _ = require('lodash');
    var mediator = require('mediatorjs');

    var that = {};
    var dataSet = [];

    that.get = function(){
        return _.cloneDeep(dataSet);
    };

    that.set = function(newDataSet){
        if(!_.isEqual(dataSet, newDataSet)){
            dataSet = _.cloneDeep(newDataSet);
            mediator.trigger('dataUpdate', that.get());
        }
    };

    module.exports = that;

})();

