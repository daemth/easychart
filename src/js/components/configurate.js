(function () {
    var constructor = function (services) {
        var optionsService = services.options;
        var mediator = services.mediator;
        var configService = services.config;
        var config = configService.get();
        var options = optionsService.get();
        var propertyServices = require('../factories/properties');
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            map: require('lodash.map'),
            cloneDeep: require('lodash.clonedeep'),
            remove: require('lodash.remove'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first')
        };
        var h = require('virtual-dom/h');

        var tabs;
        var activeTab = _.first(options).id;
        var activeTabChild;
        // when any config is updated we just re diff the ui -> e.g series labels
        mediator.on('configUpdate', function (_config_) {
            config = _config_;
            mediator.trigger('treeUpdate');
        });

        function template() {
            var tabs = h('ul', {className: "vertical-tabs"},
                [
                    generateGenericTabs(genericConfig(options)),
                    generateSeriesTabs(typeConfig(options, 'series'))
                ]);
            var content = h('div.vertical-tab-content-container', [
                generateContent(options, activeTab, activeTabChild)
            ]);
            var container = h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
            return container;
        }

        function genericConfig(options) {
            var newOptions = _.cloneDeep(options);
            return _.remove(newOptions, function (panel) {
                return panel.id !== "series";
            })
        }

        function typeConfig(options, type) {
            return _.find(options, function (item) {
                return item.id == type;
            })
        }

        function generateContent(panels, activeId, activeChildId) {
            var activePanel = _.find(panels, function (panel) {
                return panel.id == activeId;
            });
            var content;
            switch (activePanel.id) {
                case 'series':
                    content = generateSeriesContent(activePanel, activeChildId);
                    break;
                default:
                    content = generateGenericContent(activePanel);
            }
            return content;
        }

        function generateGenericContent(panel) {
            var presetList = [];
            _.forEach(panel.panes, function (pane) {
                var inputs = [];
                _.forEach(pane.options, function (option) {
                    inputs.push(propertyServices.get(option, configService));
                });

                var item = h('h3', pane.title);
                presetList.push(h('div.field-group', [h('div.field-group__title', [item]), h('div.field-group__items', inputs)]))
            });

            return h('div.vertical-tab-content', [presetList]);
        }

        function generateSeriesContent(panel, child) {
            if (!_.isUndefined(child)) {
                return seriesPanel(panel, config.series[child], child);
            } else {
                return seriesPanel(panel, config.series[0], 0);
            }
        }

        function seriesPanel(panel, series, index) {
            var title = h('h3', series.name);
            var presetList = [];
            _.forEach(panel.panes, function (pane) {
                var inputs = [];
                _.forEach(pane.options, function (option) {
                    inputs.push(propertyServices.get(option, configService, 'series.' + index + option.fullname.replace("series", "")));
                });

                presetList.push(h('div', [inputs]))
            });
            return h('div.vertical-tab-content', [title, presetList]);
        }
        function generateGenericTabs(panes) {
            var links = [];
            _.forEach(panes, function (pane, index) {
                var children = [];
                var className = pane.id === activeTab ? 'active' : '';
                var link = h('li', {className: className},
                    h('a', {
                            'href': '#' + pane.panelTitle,
                            'ev-click': function (e) {
                                e.preventDefault();
                                setActive(pane.id);
                            }
                        }, [pane.panelTitle, children]
                    )
                );

                links.push(link);
            });
            return links;
        }

        function generateSeriesTabs(options) {
            if (!_.isUndefined(options)) {
                var links = [];
                if (options.id == activeTab) {
                    _.forEach(config.series, function (serie, index) {
                        links.push(
                            h('li.hover', {
                                'className': activeTabChild === index ? 'sub-active' : 'sub-non-active',
                                'ev-click': function (e) {
                                    e.preventDefault();
                                    setActive(options.id, index);
                                }
                            }, serie.name ? serie.name : 'serie ' + index)
                        )
                    });
                    return h('li.active',
                        [
                            h('a', {
                                'href': '#data-series',
                                'ev-click': function (e) {
                                    e.preventDefault();
                                    setActive(options.id);
                                }
                            }, 'data series'),
                            h('ul', links)
                        ])
                }
                else {
                    return h('li',
                        [
                            h('a', {
                                'href': '#data-series',
                                'ev-click': function (e) {
                                    e.preventDefault();
                                    setActive(options.id);
                                }
                            }, 'data series'),
                            h('ul', links)
                        ])
                }


            }

        }

        function setActive(id, child) {
            activeTab = id;
            activeTabChild = _.isUndefined(child) ? 0 : child;
            mediator.trigger('treeUpdate');
        }

        function destroy() {
            mediator.off('configUpate', function () {mediator.trigger('treeUpdate');});
        }

        return {
            template: template,
            destroy: destroy
        };
    };

    module.exports = constructor;

})();