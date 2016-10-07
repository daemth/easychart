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
            // return not_found.svg if no icon is found
            if(!_.isUndefined('not_found')) {
                var logo = document.createElement('div');
                logo.innerHTML = icons['not_found'];
                return virtualize(logo.firstChild);
            } else {
                console.log('Icon not found.');
            }
        }
    };

    module.exports = that;
})();
