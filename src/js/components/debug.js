(function () {
    var constructor = function (services) {
        var h = require('virtual-dom/h');
        var hljs = require('../../../node_modules/highlight.js/lib/highlight');
        hljs.registerLanguage('json', require('../../../node_modules/highlight.js/lib/languages/json'));
        window.hljs = hljs;

        var configService = services.config;
        var that = {};
        var config = JSON.stringify(configService.get(),null,4);
        var Hook = function(){};
        Hook.prototype.hook = function(node){
            setTimeout(function(){
                hljs.highlightBlock(node);
            });
        };

        that.template = function () {
            return h('pre', h('code', {'afterRender': new Hook()}, config));
        };

        return that;
    };

    module.exports = constructor;
})();
