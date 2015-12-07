(function () {
    var constructor = function(services){
        var _ = require('lodash');
        var h = require('virtual-dom/h');
        var data = services.data.get();
        var mediator = services.mediator;

        mediator.on('dataUpdate', function (_data_) {
            data = _data_;
            mediator.trigger('treeUpdate');
        });

        function template() {
            var rows = [];
            _.forEach(data, function (row, rowIndex) {
                var cells = [];
                _.forEach(row, function(cell, cellIndex){
                    cells.push(h('td',{
                        contentEditable : true,
                        "ev-input": function(e){
                            var value = _.trim(e.target.innerHTML);
                            if(cell !== e.target.innerHTML){
                                services.data.setValue(rowIndex,cellIndex, value);
                            }
                        }
                    }, cell));
                });
                rows.push(h('tr', cells));
            });
            return h('table.table--data.table--bordered', rows);
        }

        return {
            template: template
        };
    };

    module.exports = constructor;

})();




