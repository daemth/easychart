(function () {
    var that = {};
    _ = require('lodash');
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
        /*
         var tabs = document.createElement('ul');
         var itemTemplate = _.template('<button><%= title %></button>');
         var typeTemplate = _.template('<h3><%= type %></h3>');
         _.forEach(templateTypes, function(type){
         var tab = document.createElement('li');
         var logo = document.createElement('div');
         logo.innerHTML = icons[type.icon];
         var svg = logo.querySelector('svg');
         svg.setAttribute("height", "50px");
         svg.setAttribute("width", "50px");
         tab.innerHTML = typeTemplate({type: type.type});
         var list = document.createElement('ul');
         _.forEach(type.presets, function(preset){
         var item = document.createElement('li');
         item.innerHTML = itemTemplate({title: preset.title});
         item.onclick = function(){
         config.setPreset(type.id, preset.id)
         };
         list.appendChild(item);
         });

         tab.appendChild(logo);
         tab.appendChild(list);
         tabs.appendChild(tab);
         });
         element.appendChild(tabs);
         */
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
                    onclick: function(){
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
            if (type.id == activeTab) {
                var className = "vertical-tab is-active"
            }
            else {
                var className = "vertical-tab";
            }

            var link = h('li.hover', {
                className: className,
                onclick: function () {
                    setActive(type.id);
                }
            }, type.type);

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