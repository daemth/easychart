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
        var activeId = _.first(services.themes.get()).id;
        var config = services.config;

        that.theme = function () {
            var activeType = _.find(services.themes.get(), function (type) {
                return type.id == activeId;
            });
            var themes = services.themes.get();
            var tabs = generateTabs(themes, activeId);
            var content = generateContent(activeType);
            return h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        };

        function generateContent(activeType) {
            var themeList = [];

            _.forEach(activeType.themes, function (theme) {
                var svg = iconLoader.get(theme.icon ? theme.icon : activeType.icon);
                var item = h('a',
                    {
                        className: "themelist__item",
                        'ev-click': function (e) {
                            //if (theme.path) {
                            //    var temp = require("../config/" + theme.path);
                            //    var definition = jsonfn.parse(jsonfn.stringify(temp));
                            //} else {
                                var definition = theme.definition;
                            //}
                            config.setTheme(definition);
                            e.preventDefault();
                        }
                    }, [
                        svg,
                        h('div', theme.title)
                    ]);
                themeList.push(item)
            });
            var themeGrid = h('div', {className: "themelist"}, themeList);
            return h('div.vertical-tab-content-container', h('div.vertical-tab-content', themeGrid));
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