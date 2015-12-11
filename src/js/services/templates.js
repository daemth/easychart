(function () {
    function constructor(){
        var templates = require('../config/templates.json');
        var that = {};
        var _ = {
            cloneDeep: require('lodash.clonedeep')
        };
        that.get = function(){
            return _.cloneDeep(templates);
        };

        that.set = function(_templates_){
            templates = _templates_;
        };
        return that;
    }

    module.exports = constructor;
})();
