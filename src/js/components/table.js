(function () {
    var constructor = function (services) {
        var _ = {
            forEach: require('lodash.foreach'),
            trim: require('lodash.trim'),
            isEqual: require('lodash.isequal')
        };
        var h = require('virtual-dom/h');
        var mediator = services.mediator;
        var data;

        function template() {
            data = services.data.get();
            mediator.on('dataUpdate', updateData);
            var editable = services.data.getUrl() ? false : true;
            var rows = [];
            var readOnly = !editable ? h('div.readOnlyBox', h('span', 'A data url was found, the data will be read only')) : '';
            var editRow = [];
            // only add if there is data
            if (data[0]) {
                rows.push(h('tr', editRow));
                _.forEach(data, function (row, rowIndex) {
                    var cells = [];
                    _.forEach(row, function (cell, cellIndex) {
                        cells.push(h('td', {
                            contentEditable: services.data.getUrl() ? false : true,
                            "ev-input": function (e) {
                                var value = _.trim(e.target.innerHTML);
                                data[rowIndex][cellIndex] = value;
                                services.data.setValue(rowIndex, cellIndex, value);
                            }
                        }, cell));
                    });
                    rows.push(h('tr', cells));
                });
            }

            return h('div', [
                readOnly,
                h('table.table.table--data.table--bordered', {
                    className: !editable ? "table--disabled" : ""
                }, rows)
            ]);
        }


        function updateData(_data_) {
            if (!_.isEqual(_data_, data)) {
                data = _data_;
                mediator.trigger('treeUpdate');
            }
        }

        function destroy() {
            mediator.off('dataUpdate', updateData);
        }

        return {
            template: template,
            destroy: destroy
        };
    };

    module.exports = constructor;
})();




