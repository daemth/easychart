var Handsontable = require("../../bower_components/handsontable/dist/handsontable.full.js");
var css = require("../../bower_components/handsontable/dist/handsontable.full.css");

function dataImport(){
    var that = this;
    that.init = function() {
        var data = [
            ["", "Ford", "Volvo", "Toyota", "Honda"],
            ["2014", 10, 11, 12, 13],
            ["2015", 20, 11, 14, 13],
            ["2016", 30, 15, 12, 13]
        ];

        var container = document.getElementById('table');
        var hot = new Handsontable(container, {
            data: data,
            minSpareRows: 1,
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true
        });

    };
    return that;
}

module.exports = dataImport();