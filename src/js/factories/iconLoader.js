(function () {
    var includeFolder = require('include-folder'),
        icons = includeFolder("./src/icons");
    var virtualize = require('vdom-virtualize');
    var _ = {
        isUndefined: require('lodash.isundefined')
    };
    var that = {};
    that.get = function(id){
        if(!_.isUndefined(icons[id])){
            var logo = document.createElement('div');
            logo.innerHTML = icons[id];
            return virtualize(logo.firstChild);

        } else {
            console.log('Icon not found');
        }
    };

    module.exports = that;
})();
