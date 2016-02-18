(function () {
    var that = {};
    var h = require('virtual-dom/h');
    that.template = function (services) {
        var dataService = services.data;
        var mediator = services.mediator;
        var inputNode;

        var Hook = function(){};

        Hook.prototype.hook = function(node) {
            inputNode = node;
        };
        var input = h('input.push-half', {
            "size": 50,
            "type": "text",
            "style" : {
                display: "inline"
            },
            value: services.data.getUrl(),
            "hook": new Hook()
        });


        var importElement = h('button.btn.btn--small.push-half', {
            "style" : {
                display: "inline"
            },
            'ev-click': function (e) {
                e.preventDefault();
                dataService.setUrl(inputNode.value);
                mediator.trigger('goToTable');
            }
        }, 'save');

        return h('div', [input, importElement])
    };
    module.exports = that;
})();
