(function () {
    var constructor = function(services){
        var that = {};
        var _ = {
            find: require('lodash.find'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first')
        };
        var h = require('virtual-dom/h');
        var templateTypes = require('../config/templates.json');
        var iconLoader = require('../factories/iconLoader');
        var mediator = services.mediator;
        var config;
        var activeTab = _.first(templateTypes).id;
        config = services.config;

        that.template = function(){
            var tabs = generateTabs(templateTypes, activeTab);
            var content = generateContent(templateTypes, activeTab);
            return h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        };

        function generateContent(types, activeId) {
            var activeType = _.find(types, function (type) {
                return type.id == activeId;
            });
            var title = h('h2', activeType.type);
            var presetList = [];
            var svg = iconLoader.get(activeType.icon);
            _.forEach(activeType.presets, function (preset) {
                var item = h('a',
                    {
                        className: "templatelist__item",
                        'ev-click': function () {
                            config.setPreset(activeType.id, preset.id);
                        }
                    }, [
                        svg,
                        h('div', preset.title)
                    ]);
                presetList.push(item)
            });
            var presetGrid = h('div', {className: "templatelist"}, presetList);
            return h('div', {className: "vertical-tab-content-container"}, [title, presetGrid]);
        }

        function generateTabs(types, active) {
            var links = [];
            _.forEach(types, function (type, index) {
                var className = type.id === activeTab ? 'active' : '';

                var link = h('li', {
                    'className': className
                }, h('a', {
                    'href' : '#' + type.type,
                    'ev-click' : function (e) {
                        e.preventDefault();
                        activeTab = type.id;
                        mediator.trigger('treeUpdate');
                    }
                },type.type));

                links.push(link);
            });
            return tabs = h('ul', {className: "vertical-tabs"}, links);
        }

        return that;
    };


    module.exports = constructor;
})();