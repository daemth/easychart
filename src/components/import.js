(function(){
    var Handsontable = require("../../bower_components/handsontable/dist/handsontable.full.js");
    var css = require("../../bower_components/handsontable/dist/handsontable.full.css");
    var dataService = require('../services/data.js');
    var that = {};
    var container;
    var hot;
    that.load = function(element) {
        var data = dataService.get();
        element.innerHTML = '<div></div>';
        container = element.firstChild;
        hot = new Handsontable(container, {
            startRows: 8,
            startCols: 5,
            minSpareRows: 1,
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true,
            afterChange: function(){
                dataService.set(this.getData());
            }
        });
        if(!_.isEmpty(data)){
            hot.updateSettings({data:data})
        }
    };

    that.destroy = function(){
        hot.destroy();
    };

    module.exports = that;
})();



