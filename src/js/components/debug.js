(function () {
    var constructor = function (services) {
        var h = require('virtual-dom/h');
        var highlight =  require('highlight.js')
        var configService = services.config;
        var that = {};

        that.template = function () {
            return h('pre')
        };


        return that;
    };

    module.exports = constructor;
})();
