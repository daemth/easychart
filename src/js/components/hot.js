(function () {
    //var _ = require('lodash');

    var _ = {
        forEach: require('lodash.foreach'),
        isEmpty: require('lodash.isempty'),
        isUndefined: require('lodash.isundefined')
    };


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
            readOnly = services.data.getUrl() ? true : false;
            if (readOnly){
                element.appendChild(createElement(h('div.readOnlyBox', h('span', 'A data url was found, the data will be read only'))));
            }
            element.appendChild(wrapper);
            var data = services.data.get();
            data = _.isUndefined(data[0]) ? [[]] : data;

            hot = new Handsontable(wrapper, {
                minRows: 2,
                minCols: 2,
                minSpareRows: 1,
                //minSpareCols: 1,
                height: 500,
                stretchH: 'all',
                rowHeaders: true,
                colHeaders: true,
                contextMenu: true,
                data: data,
                afterChange: function () {
                    if(!readOnly){
                        services.data.set(removeEmptyRows(this));
                    }
                },
                afterRemoveRow:function () {
                    if(!readOnly){
                        services.data.set(removeEmptyRows(this));
                    }
                },
                afterRemoveCol:function (test) {
                    if(!readOnly){
                        services.data.set(removeEmptyRows(this));
                    }
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
            if (!_.isEmpty(data) && !readOnly) {
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
