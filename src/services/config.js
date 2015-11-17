(function(){
    _ = require('lodash');

    var that = {};
    var config = {};
    that.get = function(){
        return _.cloneDeep(config);
    };

    that.set = function(newConfig){
        config = _.cloneDeep(newConfig);
    };

    module.exports = that;
})();

