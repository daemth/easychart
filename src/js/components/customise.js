(function () {
    var config = require('../config/customise.json');
    var dump = require('../config/dump.json');
    console.log(dump[0]);

    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');
    var virtualize = require('vdom-virtualize');

    var tabs;
    var rootNode;

    var activeTab = _.first(config).id;

    var that = {};

    that.load = function (element) {
        tabs = h('div');
        rootNode = createElement(tabs);
        element.appendChild(rootNode);
        build();
    };

    function build() {
        var tabs = generateTabs(config, activeTab);
        var content = generateContent(config, activeTab);
        var container = h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        render(container);
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
                inputs.push(generateField(option));
            });
            var item = h('h3',pane.title);
            presetList.push(h('div', [item, inputs] ))
        });
        return h('div',{className:"vertical-tab-content-container"}, [title, presetList]);
    }

    function generateField(){

    }

    function generateTabs(panes, active) {
        var links = [];
        _.forEach(panes, function (pane, index) {
            var className = '';
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
            }, pane.panelTitle);

            links.push(link);
        });
        return tabs = h('ul', {className: "vertical-tabs"}, links);
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