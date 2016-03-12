(function () {
    var constructor = function (services) {
        var that = {};
        var _ = {
            find: require('lodash.find'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first')
        };
        var h = require('virtual-dom/h');
        var iconLoader = require('../factories/iconLoader');
        var mediator = services.mediator;
        var activeId = _.first(services.templates.get()).id;
        var config = services.config;

        that.template = function () {
            var activeType = _.find(services.templates.get(), function (type) {
                return type.id == activeId;
            });
            var templates = services.templates.get();
            var tabs = generateTabs(templates, activeId);
            var content = generateContent(activeType);
            return h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        };

        function generateContent(activeType) {
            var templateList = [];

            _.forEach(activeType.templates, function (template) {
                var svg = iconLoader.get(template.icon ? template.icon : activeType.icon);
                var item = h('a',
                    {
                        className: "templatelist__item",
                        'ev-click': function (e) {
                            config.loadTemplate(template.definition);
                            e.preventDefault();
                        }
                    }, [
                        svg,
                        h('div', template.title)
                    ]);
                templateList.push(item)
            });
            var templateGrid = h('div', {className: "templatelist"}, templateList);
            return h('div.vertical-tab-content-container', h('div.vertical-tab-content', templateGrid));
        }

        function generateTabs(types, active) {
            var links = [];
            _.forEach(types, function (type, index) {
                var className = type.id === active ? 'active' : '';

                var link = h('li', {
                    'className': className
                }, h('a', {
                    'href': '#' + type.type,
                    'ev-click': function (e) {
                        activeId = type.id;
                        mediator.trigger('treeUpdate');
                        e.preventDefault();
                    }
                }, type.type));

                links.push(link);
            });
            return h('ul', {className: "vertical-tabs"}, links);
        }

        return that;
    };

    module.exports = constructor;
})();