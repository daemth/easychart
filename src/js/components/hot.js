(function () {
    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var createElement = require('virtual-dom/create-element');
    var hot;
    function constructor(services) {
        var that = {};
        var element;
        var readOnly;
        that.load = function (_element_) {
            element = _element_;
            var wrapper = createElement(h('div'));
            element.appendChild(wrapper);
            readOnly = services.data.getUrl() ? true : false;
            var data = services.data.get();
            hot = new Handsontable(wrapper, {
                startRows: 8,
                startCols: 5,
                height: 500,
                stretchH: 'all',
                rowHeaders: true,
                colHeaders: true,
                contextMenu: true,
                data: data,
                afterChange: function () {
                    services.data.set(removeEmptyRows(this));
                },
                afterRemoveRow:function () {
                    services.data.set(removeEmptyRows(this));
                },
                afterRemoveCol:function (test) {
                    services.data.set(removeEmptyRows(this));
                }
            });
            hot.updateSettings({
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    cellProperties.readOnly = readOnly;
                    return cellProperties;
                }
            });

            services.mediator.on('dataUpdate', function (_data_) {
                readOnly = services.data.getUrl() ? true : false;
                if(_data_.length > 0){
                    hot.updateSettings({
                        data: _data_,
                        cells: function (row, col, prop) {
                            var cellProperties = {};
                            cellProperties.readOnly = readOnly;
                            return cellProperties;
                        }
                    });
                } else {
                    hot.clear();
                }

            }, 'hot');
        };

        var Hook = function () {};
        Hook.prototype.hook = function (node) {
            setTimeout(function () {
                that.load(node);
            });
        };

        that.template = function () {
            return h('div', {
                'afterRender': new Hook()
            });
        };

        that.destroy = function () {
            services.mediator.off(null, null, 'hot');
            var data = removeEmptyRows(hot);
            if (!_.isEmpty(data)) {
                services.data.set(removeEmptyRows(hot));
            }
            hot.destroy();
            element.innerHTML = '';
        };

        function removeEmptyRows(hot) {
            var gridData = hot.getData();
            var cleanedGridData = [];
            _.forEach(gridData, function (object, rowKey) {
                if (!hot.isEmptyRow(rowKey)) cleanedGridData[rowKey] = object;
            });
            return cleanedGridData;
        }

        return that;
    }

    module.exports = constructor;
})();
