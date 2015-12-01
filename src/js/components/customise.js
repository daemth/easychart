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
    var activeTab = _.first(customise).id;
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
                generateTabs(genericConfig(customise), activeTab),
                generateSeriesTabs(typeConfig(customise, 'series'),activeTab)
            ]);
        var content = generateContent(customise, activeTab);
        var container = h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        render(container);
    }

    function genericConfig(customise){
        var newCustomise = _.cloneDeep(customise);
        return _.remove(newCustomise, function(panel){
            return panel.id !== "axes" && panel.id !== "series" && panel.id !== "plotBands";
        })
    }

    function typeConfig(customise, type){
        return _.find(customise, function(item){
            return item.id == type;
        })
    }

    function generateContent(panels, activeId) {
        var activeTab = _.find(panels, function (panel) {
            return panel.id == activeId;
        });

        var title = h('h2', activeTab.panelTitle);
        var presetList = [];
        _.forEach(activeTab.panes, function (pane) {
            var inputs = [];

            _.forEach(pane.options, function(option){
                inputs.push(propertyServices.get(option.name));
            });

            var item = h('h3',pane.title);
            presetList.push(h('div', [item, inputs] ))
        });

        return h('div',{className:"vertical-tab-content-container"}, [title, presetList]);
    }

    function generateTabs(panes, active) {
        var links = [];
        _.forEach(panes, function (pane, index) {
            var className = '';
            var childs = [];
            if (pane.id == activeTab) {
                className = "vertical-tab is-active"
            }
            else {
                className = "vertical-tab";
            }

            var link = h('li.hover', {
                className: className,
                'ev-click': function () {
                    setActive(pane.id);
                }
            }, [pane.panelTitle, childs]);

            links.push(link);
        });
        return links;
    }

    function generateSeriesTabs(config, activeTab){
        var series = configService.get().series;
        console.log(config);

    }

    function setActive(id) {
        activeTab = id;
        build();
    }

    function render(newTabs) {
        var patches = diff(tabs, newTabs);
        rootNode = patch(rootNode, patches);
        tabs = newTabs;
    }
    module.exports = that;

})();