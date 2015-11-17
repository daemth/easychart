(function(){
    _ = require('lodash');

    var that = {};
    var dataSet = [];
    that.get = function(){
        return _.cloneDeep(dataSet);
    };

    that.getSeries = function(){

    };

    that.set = function(newDataSet){
        dataSet = _.cloneDeep(newDataSet);
    };

    module.exports = that;

})();

