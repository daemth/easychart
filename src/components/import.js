(function(){
    var Handsontable = require("../../bower_components/handsontable/dist/handsontable.full.js");
    var css = require("../../bower_components/handsontable/dist/handsontable.full.css");
    var dataService = require('../services/data.js');
    var papa = require('papaparse');
    var mediator = require('mediatorjs');
    var that = {};
    var table;
    var hot;

    that.load = function(element) {
        var data = dataService.get();
        element.innerHTML = '<div id="input"></div><div id="table"></div>';

        input = element.querySelector('#input');
        input.innerHTML = '<textarea></textarea><button id="import">import</button>';

        input.querySelector("#import").addEventListener("click", function(){
            dataService.set(papa.parse(input.firstChild.value).data);
        });

        table = element.querySelector('#table');
        hot = new Handsontable(table, {
            startRows: 8,
            startCols: 5,
            minSpareRows: 1,
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true,

        });

        if(!_.isEmpty(data)){
            hot.updateSettings({data:data});
        }
        mediator.on('dataUpdate', function(data) {
            hot.updateSettings({data:data});
        });
    };

    that.destroy = function(){
        mediator.stopListening('dataUpdate', function(data) {
            hot.updateSettings({data:data});
        });
        dataService.set(hot.getData());
        hot.destroy();
    };

    module.exports = that;
})();



