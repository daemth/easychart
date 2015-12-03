(function () {
    var customise = require('../config/customise.json');
    var configService = require('../services/config');
    var propertyServices = require('../services/properties');

    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');

    var tabs;
    var rootNode;
    var activeTab = 'series';
    var activeTabChild;
    var that = {};

    that.load = function (element) {
        tabs = h('div');
        rootNode = createElement(tabs);
        element.appendChild(rootNode);
        build();
    };

    function build() {
        var tabs = h('ul', {className: "vertical-tabs"},
            [
                generateGenericTabs(genericConfig(customise), activeTab),
                generateSeriesTabs(typeConfig(customise, 'series'), activeTab)
            ]);
        var content = h('div', [
            generateContent(customise, activeTab, activeTabChild)
        ]);
        var container = h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        render(container);
    }

    function genericConfig(customise) {
        var newCustomise = ec.cloneDeep(customise);
        return _.remove(newCustomise, function (panel) {
            return panel.id !== "series";
        })
    }

    function typeConfig(customise, type) {
        return _.find(customise, function (item) {
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
        var title = h('h2', panel.panelTitle);
        var presetList = [];
        _.forEach(panel.panes, function (pane) {
            var inputs = [];
            _.forEach(pane.options, function (option) {
                inputs.push(propertyServices.get(option.name));
            });

            var item = h('h3', pane.title);
            presetList.push(h('div', [item, inputs]))
        });

        return h('div', {className: "vertical-tab-content-container"}, [title, presetList]);
    }

    function generateSeriesContent(panel, child) {
        var series = configService.get().series;
        if(!_.isUndefined(child)){
            return seriesPanel(panel, series[child], child);
        } else {
            return seriesPanel(panel, series[0], 0);
        }
    }

    function seriesPanel(panel, series, index){
        var title = h('h2', series.name);
        var presetList = [];
        _.forEach(panel.panes, function (pane) {
            var inputs = [];
            _.forEach(pane.options, function (option) {
                inputs.push(propertyServices.get(option.name, 'series.' + index + option.name.replace("series", "")));
            });

            var item = h('h3', pane.title);
            presetList.push(h('div', [item, inputs]))
        });

        return h('div', {className: "vertical-tab-content-container"}, [title, presetList]);
    }

    function generateGenericTabs(panes, active) {
        var links = [];
        _.forEach(panes, function (pane, index) {
            var children = [];
            var className = pane.id === activeTab ? 'active' : '';
            var link = h('li', {className: className},
                          h('a',{
                            'href' : '#' + pane.panelTitle,
                            'ev-click': function () {
                                setActive(pane.id);
                            }
                          },[pane.panelTitle, children]
                          )
            );

            links.push(link);
        });
        return links;
    }

    function generateSeriesTabs(config, activeTab) {
        var series = configService.get().series;
        var listItems = [];
        var className = '';
        if (config.id == activeTab) {
            className = 'active';
            _.forEach(series, function (serie, index) {
                var className = index === activeTabChild ? 'active' : '';
                listItems.push(
                    h('li',{'className' : className}, h('a', {
                        'href' : '#' + serie.name.replace(/\s/g, '-'),
                        'ev-click': function () {
                            setActive(config.id, index);
                        }
                    }, serie.name))
                  )
              })
        }
        else {
            className = '';
        }

        return h('li', {'className': className}, [
                    h('a',{
                          'href' : '#data-series',
                          'ev-click': function () {
                              setActive(config.id);
                          }
                      }, 'data series'),
                    h('ul', listItems)
              ])
    }

    function setActive(id, child) {
        activeTab = id;
        activeTabChild = _.isUndefined(child) ? 0 : child;
        build();
    }

    function render(newTabs) {
        var patches = diff(tabs, newTabs);
        rootNode = patch(rootNode, patches);
        tabs = newTabs;
    }

    module.exports = that;

})();