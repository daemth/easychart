(function () {
    var that = {};
    var papa = require('papaparse');
    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var createElement = require('virtual-dom/create-element');
    that.load = function(element, services){
        var dataService = services.data;
        var input = createElement(h('input'));
        var importElement = createElement(
            h('button.btn', {
                'ev-click': function(){
                    that.loadUrl(input.value, dataService)
                }
            }, 'import'));


        element.appendChild(input);
        element.appendChild(importElement);
    };

    that.loadUrl = function(url, dataService){

        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", function(data){
            console.log(data);
        });
        oReq.open("GET", url, true);
        oReq.send();
        //dataService.set(papa.parse(value).data);
    };

    module.exports = that;
})();
