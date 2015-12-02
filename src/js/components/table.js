(function () {
    var dataService = require('../services/data.js');
    var mediator = require('mediatorjs');
    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');
    var that = {};
    var hot;

    that.load = function (element) {
        var data = dataService.get();

        element.appendChild(createElement(generate(data)));
        mediator.on('dataUpdate', function (data) {
            element.innerHTML = '';
            element.appendChild(createElement(generate(data)));
        });
    };

    function generate (data){
        var rows = [];
        _.forEach(data, function(row, rowIndex){
            var cells = [];
            _.forEach(row, function(cell, cellIndex){
                cells.push(h('td',{
                    contentEditable : true,
                    "ev-input": function(e){
                        var value = e.target.innerHTML;
                        if(cell !== e.target.innerHTML){
                            dataService.setValue(rowIndex,cellIndex, value);
                        }
                    }
                }, cell));
            });
            rows.push(h('tr', cells));
        });
        return h('table.table--data.table--bordered',rows);

    }


    module.exports = that;
})();




