(function () {
    var constructor = function (services) {
        var h = require('virtual-dom/h');
        var paste = require('./import/paste');
        var upload = require('./import/upload');
        var dad = require('./import/dragAndDrop');
        var url = require('./import/url');
        var table = require('./table')(services);
        var hot = require('./hot')(services);
        var activeTab = services.data.getUrl() ? 'url' : services.data.get().length == 0 ? 'paste' : 'data';
        var mediator = services.mediator;
        mediator.on('goToTable', goToTable);
        var tabOptions = {
            paste: {
                label: 'Paste CSV',
                template: function () {
                    return paste.template(services);
                }
            },
            upload: {
                label: 'upload CSV',
                template: function () {
                    return h('div', [
                        upload.template(services),
                        dad.template(services)
                    ]);
                }
            },
            url: {
                label: 'url CSV',
                template: function () {
                    return url.template(services);
                }
            },
            data: {
                label: 'Data table',
                template: function () {
                    if (typeof Handsontable !== 'undefined') {
                        return hot.template(services);
                    } else {
                        return table.template(services);
                    }

                },
                destroy: function () {
                    if (typeof Handsontable !== 'undefined') {
                        hot.destroy();
                    } else {
                        table.destroy();
                    }
                }
            }
        };

        function tabLinks() {
            var links = ['paste', 'upload', 'url', 'data'];
            return h('ul.vertical-tabs', links.map(function (id) {
                    var className = activeTab === id ? 'active' : '';
                    return h('li', {
                            'className': className
                        }, h('a', {
                            'href': '#' + tabOptions[id].label,
                            'ev-click': function (e) {
                                load(id);
                                e.preventDefault();
                            }
                        }, tabOptions[id].label)
                    )
                })
            )
        }

        function load(id) {
            if (tabOptions[activeTab].destroy) {
                tabOptions[activeTab].destroy();
            }
            activeTab = id;
            mediator.trigger('treeUpdate');
        }

        function goToTable() {
            activeTab = 'data';
            mediator.trigger('treeUpdate');
        }

        function destroy() {
            mediator.off('goToTable', goToTable);
            if (tabOptions[activeTab]['destroy']) {
                tabOptions[activeTab]['destroy']();
            }
        }

        function template() {
            return h('div.vertical-tabs-container', [
                tabLinks(),
                h('div.vertical-tab-content-container',
                    h('div.vertical-tab-content', tabOptions[activeTab].template())
                )
            ]);
        }

        return {
            template: template,
            destroy: destroy
        };
    };

    module.exports = constructor;
})();