var propertyServices = require('../../factories/properties');
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

function constructor(services) {
    var configService = services.config;

    function genericConfig(options) {
        var newOptions = _.cloneDeep(options);
        return _.remove(newOptions, function (panel) {
            return panel.id !== "series" && panel.id !== "axis";
        })
    }

    function tabs(options, setActive, activeTab) {
        var links = [];
        var panes = genericConfig(options);
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


    function content(panel) {
        return h('div.vertical-tab-content', [generateContent(panel)]);
    }

    function generateContent(panel) {
        var list = [];
        _.forEach(panel.panes, function (pane) {
            var inputs = [];
            _.forEach(pane.options, function (option) {
                inputs.push(propertyServices.get(option, configService));
            });
            var subPanes = pane.panes ? generateContent(pane) : '';
            var item = h('h3', pane.title);
            list.push(h('div.field-group',
                [
                    h('div.field-group__title', [item]),
                    h('div.field-group__items', inputs),
                    h('div', subPanes)
                ]
            ))
        });
        return list;
    }

    return {
        tabs: tabs,
        content: content
    }
}
module.exports = constructor;