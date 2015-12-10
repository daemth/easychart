(function () {
    var constructor = function (services) {
        var _ = {
            forEach: require('lodash.foreach'),
            trim: require('lodash.trim'),
            size: require('lodash.size'),
            fill: require('lodash.fill'),
            pullAt: require('lodash.pullat'),
            map: require('lodash.map'),
            clone: require('lodash.clone'),
            cloneDeep: require('lodash.clonedeep'),
            isEqual: require('lodash.isequal')
        };

        var h = require('virtual-dom/h');
        var data = services.data.get();
        var mediator = services.mediator;

        mediator.on('dataUpdate', function (_data_) {
            if (!_.isEqual(_data_, data)) {
                data = _data_;
                mediator.trigger('treeUpdate');
            }
        });

        function template() {
            var url = services.data.getDataUrl();


            var rows = [];
            var editRow = [];
            editRow.push(h('td'));
            // only add if there is data
            if (data[0]) {
                for (var i = 0; i < data[0].length; i++) {
                    var temp = _.clone(i);
                    editRow.push(h('td', [
                        h('button', {
                            'ev-click': function () {
                                removeColumn(temp, data)
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
                                removeRow(rowIndex, data)
                            }
                        }, 'remove row')
                    ]));
                    _.forEach(row, function (cell, cellIndex) {
                        cells.push(h('td', {
                            contentEditable: true,
                            "ev-input": function (e) {
                                var value = _.trim(e.target.innerHTML);
                                data[rowIndex][cellIndex] = value;
                                services.data.setValue(rowIndex, cellIndex, value);
                            },
                            "ev-blur": function (e) {
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
                h('button', {
                    'ev-click': function () {
                        addRow(data)
                    }
                }, 'add row'),
                h('button', {
                    'ev-click': function () {
                        addColumn(data)
                    }
                }, 'add column'),
                h('table.table--data.table--bordered', rows)
            ]);
        }


        function addRow(data) {
            data = _.cloneDeep(data);
            data.push(_.fill(Array(data[0] ? data[0].length : 1), ''));
            services.data.set(data);
        }

        function addColumn(data) {
            data = _.cloneDeep(data);
            _.forEach(data, function (row) {
                row.push('')
            });
            services.data.set(data);
        }

        function removeColumn(index, data) {
            data = _.cloneDeep(data);
            data = _.map(data, function (row) {
                _.pullAt(row, index);
                return row;
            });
            services.data.set(data);
        }

        function removeRow(index, data) {
            data = _.cloneDeep(data);
            _.pullAt(data, index);
            services.data.set(data);
        }

        return {
            template: template
        };
    };

    module.exports = constructor;
})();




