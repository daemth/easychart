(function () {
    var that = {};
    var _ = require('lodash');

    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');

    var virtualize = require('vdom-virtualize');

    var templateTypes = require('../config/templates.json');
    var config = require('../services/config');
    var includeFolder = require('include-folder'),
        icons = includeFolder("./src/icons");
    var tabs;
    var rootNode;
    var activeTab = _.first(templateTypes).id;

    that.load = function (element) {
        tabs = h('div');
        rootNode = createElement(tabs);
        element.appendChild(rootNode);
        build();
    };

    function build() {
        var tabs = generateTabs(templateTypes, activeTab);
        var content = generateContent(templateTypes, activeTab);
        var container = h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        render(container);
    }

    function generateContent(types, activeId) {

        var activeType = _.find(types, function (type) {
            return type.id == activeId;
        });
        var title = h('h2', activeType.type);

        var presetList = [];

        var svg = createSvgVnode(icons[activeType.icon]);

        _.forEach(activeType.presets, function (preset) {
            var item = h('a',
                {
                    className: "templatelist__item",
                    'ev-click': function(){
                        config.setPreset(activeType.id, preset.id);
                    }
                },[
                    svg,
                    h('div', preset.title)
                ]);
            presetList.push(item)
        });

        var presetGrid = h('div', {className: "templatelist"}, presetList);
        return h('div',{className:"vertical-tab-content-container"}, [title, presetGrid]);
    }

    function createSvgVnode (svg){
        var logo = document.createElement('div');
        logo.innerHTML = svg;
        return virtualize(logo.firstChild);
    }

    function generateTabs(types, active) {
        var links = [];
        _.forEach(types, function (type, index) {
            var className = type.id === activeTab ? 'active' : '';

            var link = h('li', {
                    'className': className
                }, h('a', {
                        'href' : '#' + type.type,
                        'ev-click' : function () {
                            setActive(type.id);
                        }
                    },type.type));

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