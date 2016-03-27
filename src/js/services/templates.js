(function () {
    function constructor(){
        var jsonfn = require('json-fn');
        var temp = require('../config/templates.json');
        var templates = jsonfn.parse(jsonfn.stringify(temp));
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
