(function () {
    function constructor(){
        var jsonfn = require('json-fn');
        var temp = require('../config/themes.json');
        var themes = jsonfn.parse(jsonfn.stringify(temp));
        var that = {};
        var _ = {
            cloneDeep: require('lodash.clonedeep')
        };

        that.get = function(){
            return _.cloneDeep(themes);
        };

        that.set = function(_themes_){
            themes = _themes_;
        };
        return that;
    }

    module.exports = constructor;
})();
