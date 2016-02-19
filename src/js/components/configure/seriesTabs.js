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

function constructor (services){
    var configService = services.config;
    function tabs(options, setActive, activeTab, activeTabChild, config) {
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
                        }, 'Data series'),
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
    function panelContent(panel, series, index, config) {
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

    function content(panel, child, config) {
        if (!_.isUndefined(child)) {
            return panelContent(panel, config.series[child], child, config);
        } else {
            return panelContent(panel, config.series[0], 0, config);
        }
    }

    return{
        tabs: tabs,
        content: content
    }
}
module.exports = constructor;