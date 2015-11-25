(function () {
    var Handsontable = require("../../../bower_components/handsontable/dist/handsontable.full.min.js");
    var css = require("../../../bower_components/handsontable/dist/handsontable.full.css");
    var dataService = require('../services/data.js');
    var mediator = require('mediatorjs');
    var _ = require('lodash');
    var that = {};
    var hot;

    that.load = function (element) {

        hot = new Handsontable(element, {
            startRows: 8,
            startCols: 5,
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true
        });

        if (!_.isEmpty(dataService.get())) {
            hot.updateSettings({
                data: dataService.get()
            });
        }
        mediator.on('dataUpdate', function (data) {
            hot.updateSettings({
                data: dataService.get()
            });
        });
    };

    that.destroy = function () {
        mediator.stopListening('dataUpdate', function (data) {
            hot.updateSettings({data: data});
        });
        var data = removeEmptyRows(hot);
        if(!_.isEmpty(data)){
            dataService.set(removeEmptyRows(hot));
        }
        hot.destroy();
    };

    function removeEmptyRows(hot) {
        var gridData = hot.getData();
        var cleanedGridData = [];
        _.forEach(gridData, function (object, rowKey) {
            if (!hot.isEmptyRow(rowKey)) cleanedGridData[rowKey] = object;
        });
        return cleanedGridData;
    }

    module.exports = that;
})();




