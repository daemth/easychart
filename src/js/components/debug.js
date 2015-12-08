(function () {
    var constructor = function (services) {
        var h = require('virtual-dom/h');
        var configService = services.config;
        var that = {};

        that.template = function(){
          return h('pre', JSON.stringify(configService.get(),null,4))
        };

        return that;
    };

    module.exports = constructor;
})();
