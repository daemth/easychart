(function () {
    var constructor = function (services) {
        var _ = {
            forEach: require('lodash.foreach'),
            trim: require('lodash.trim'),
            size: require('lodash.size'),
            fill: require('lodash.fill'),
            pullAt: require('lodash.pullat'),
            map: require('lodash.map'),
            clone: require('lodash.clone')
        };

        var h = require('virtual-dom/h');
        var data = services.data.get();
        var mediator = services.mediator;
        mediator.on('dataUpdate', function (_data_) {
            data = _data_;
        });

        function template() {
            var rows = [];

            var editRow = [];
            editRow.push(h('td'));

            for(var i = 0; i < data[0].length; i++){
                var temp = _.clone(i);
                editRow.push(h('td', [
                    h('button', {
                        'ev-click': function () {
                            removeColumn(temp, services.data.get())
                        }
                    }, 'remove row')
                ]));
            }

            rows.push(h('tr', editRow));

            _.forEach(data, function (row, rowIndex) {
                var cells = [];
                cells.push(h('td', [
                    h('button', {
                        'ev-click': function () {
                            removeRow(rowIndex, services.data.get())
                        }
                    }, 'remove row')
                ]));
                _.forEach(row, function (cell, cellIndex) {
                    cells.push(h('td', {
                        contentEditable: true,
                        "ev-input": function (e) {
                            var value = _.trim(e.target.innerHTML);
                            services.data.setValue(rowIndex, cellIndex, value);
                        }
                    }, cell));
                });
                rows.push(h('tr', cells));
            });
            return h('div', [
                h('button', {
                    'ev-click': function () {
                        addRow(services.data.get())
                    }
                }, 'add row'),
                h('button', {
                    'ev-click': function () {
                        addColumn(services.data.get())
                    }
                }, 'add column'),
                h('table.table--data.table--bordered', rows)
            ]);
        }

        function addRow(data) {
            data.push(_.fill(Array(data[0].length), ''))
            services.data.set(data);
        }

        function addColumn(data) {
            _.forEach(data, function (row) {
                row.push('')
            });
            services.data.set(data);
        }

        function removeColumn(index, data) {

            data = _.map(data, function(row){
                _.pullAt(row, index);
                return row;
            });
            console.log(index);
            console.log(data);
            services.data.set(data);
        }

        function removeRow(index, data) {
            _.pullAt(data, index);
            services.data.set(data);
        }

        return {
            template: template
        };
    };

    module.exports = constructor;
})();




