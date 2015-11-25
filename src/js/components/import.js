(function () {
    var dataService = require('../services/data.js');
    var papa = require('papaparse');
    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var createElement = require('virtual-dom/create-element');

    var that = {};
    that.load = function (element) {
        var input = createElement(h('textArea'));

        var importElement = createElement(
            h('button', {
                onclick: saveData
            }, 'import'));

        var transposeElement = createElement(
            h('button', {
                onclick: tranposeData
            }, 'transpose'));

        function saveData() {
            dataService.set(papa.parse(input.value).data);
        }

        function tranposeData() {
            dataService.set(_.unzip(dataService.get()));
        }

        element.appendChild(input);
        element.appendChild(importElement);
        element.appendChild(transposeElement);
    };

    module.exports = that;
})();



