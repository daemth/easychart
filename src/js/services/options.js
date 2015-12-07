(function () {
    var constructor = function (services){
        var options = require('../config/options.json');
        var that = {};
        var _ = {
            cloneDeep: require('lodash.clonedeep')
        };
        that.get = function(){
            return _.cloneDeep(options);
        };

        that.set = function(_options_){
            options = _.cloneDeep(_options_);
        };

        return that;
    };

    module.exports = constructor;
})();
