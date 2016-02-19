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

    function tabs(options, setActive, activeTab, activeTabChild, config) {
        if (!_.isUndefined(options)) {
            var links = [];
            if (options.id == activeTab) {
                if (generalOptions(options.panes)) {
                    links.push(
                        h('li.hover', {
                            'className': activeTabChild === 'general' ? 'sub-active' : 'sub-non-active',
                            'ev-click': function (e) {
                                e.preventDefault();
                                setActive(options.id, 'general');
                            }
                        }, 'general')
                    )
                }
                if(config.xAxis){
                    _.forEach(config.xAxis, function (axis, index) {
                        links.push(
                            h('li.hover', {
                                'className': activeTabChild === 'xAxis' +index ? 'sub-active' : 'sub-non-active',
                                'ev-click': function (e) {
                                    e.preventDefault();
                                    setActive(options.id, 'xAxis' +index);
                                }
                            }, axis.name ? axis.name : 'X axis ' + (index + 1))
                        )
                    });
                } else {
                    links.push(
                        h('li.hover', {
                            'className': activeTabChild === 'xAxis' +  0 ? 'sub-active' : 'sub-non-active',
                            'ev-click': function (e) {
                                e.preventDefault();
                                setActive(options.id, 'xAxis' +  0);
                            }
                        }, 'X axis')
                    )
                }

                if(config.yAxis){
                    _.forEach(config.yAxis, function (axis, index) {
                        links.push(
                            h('li.hover', {
                                'className': activeTabChild === 'yAxis' + index ? 'sub-active' : 'sub-non-active',
                                'ev-click': function (e) {
                                    e.preventDefault();
                                    setActive(options.id, 'yAxis' + index);
                                }
                            }, axis.name ? axis.name : 'Y axis ' + (index + 1))
                        )
                    });
                } else {
                    links.push(
                        h('li.hover', {
                            'className': activeTabChild === 'yAxis' +  0 ? 'sub-active' : 'sub-non-active',
                            'ev-click': function (e) {
                                e.preventDefault();
                                setActive(options.id, 'yAxis' +  0);
                            }
                        }, 'Y axis')
                    )
                }


                return h('li.active',
                    [
                        h('a', {
                            'href': '#data-series',
                            'ev-click': function (e) {
                                e.preventDefault();
                                setActive(options.id, 'general');
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
                                setActive(options.id, 'general');
                            }
                        }, 'Axis')
                    ])
            }
        }
    }

    function generalOptions(panes) {
        return _.find(panes, function (pane) {
            return pane.id == "general";
        })
    }


    function generalContent(pane) {
        var presetList = [];
        var inputs = [];
        _.forEach(pane.options, function (option) {
            inputs.push(propertyServices.get(option, configService));
        });
        var item = h('h3', pane.title);
        presetList.push(h('div.field-group', [h('div.field-group__title', [item]), h('div.field-group__items', inputs)]));

        return h('div.vertical-tab-content', [presetList]);
    }

    function axisContent(panes, config, child) {

        var inputs = [];
        var type = child.substring(0, 5);
        var index = child.substring(5, 6);
        var pane = _.find(panes, function(pane){
            return pane.id == type;
        });


        if(pane){
            var title = h('h3', pane.title);
            _.forEach(pane.options, function (option) {
                inputs.push(propertyServices.get(option, configService, type + '.' + index + '.' + option.fullname.replace(type + '.', "")));
            });
        }

        return h('div.vertical-tab-content', [title, inputs]);
    }
    function content(panel, child, config) {
        if (child == 'general') {
            return generalContent(generalOptions(panel.panes));
        } else {
            return axisContent(panel.panes, config, child);
        }
    }


    return {
        tabs: tabs,
        content: content
    }
}
module.exports = constructor;