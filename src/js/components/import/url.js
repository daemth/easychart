(function () {
    var that = {};
    var papa = require('papaparse');
    var h = require('virtual-dom/h');
    that.template = function (services) {
        var dataService = services.data;

        var inputNode;
        var Hook = function(){};
        Hook.prototype.hook = function(node) {
            inputNode = node;
        };

        var input = h('input', {
            "hook": new Hook()
        });

        var importElement = h('button.btn', {
            'ev-click': function () {
                that.loadUrl(inputNode.value, dataService)
            }
        }, 'import');

        return h('div', [input, importElement])
    };

    that.loadUrl = function (url, dataService) {
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", function (data) {
            console.log(data);
        });
        oReq.open("GET", url, true);
        oReq.send();
        //dataService.set(papa.parse(value).data);
    };

    module.exports = that;
})();
