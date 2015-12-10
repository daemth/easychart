(function () {
    var that = {};
    var h = require('virtual-dom/h');
    that.template = function (services) {
        var dataService = services.data;

        var inputNode;
        var Hook = function(){};
        Hook.prototype.hook = function(node) {
            inputNode = node;
        };

        var input = h('input', {
            "type": 'text',
            "hook": new Hook()
        });

        var importElement = h('button.btn.btn--small', {
            'ev-click': function (e) {
                e.preventDefault();
                dataService.setUrl(inputNode.value);
            }
        }, 'import');

        return h('div', [input, importElement])
    };
    module.exports = that;
})();
