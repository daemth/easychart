(function () {
    var dataService;
    var papa = require('papaparse');
    var h = require('virtual-dom/h');

    var that = {};
    that.template = function (services) {
        dataService = services.data;
        var inputNode;
        var Hook = function(){};
        Hook.prototype.hook = function(node) {
            inputNode = node;
        };

        var input = h('textArea', {
            'style': {'height': '200px'},
            "hook": new Hook()
        });

        var importElement = h('button.btn.btn--small', {
            'ev-click': function(){
                saveData(inputNode.value)
            }
        }, 'import');

        function saveData(value) {
            dataService.set(papa.parse(value).data);
        }

        return h('div', [input, importElement])
    };
    module.exports = that;
})();
