var propertyServices = require('../../factories/properties');
var _ = {
    isUndefined: require('lodash.isundefined'),
    find: require('lodash.find'),
    map: require('lodash.map'),
    cloneDeep: require('lodash.clonedeep'),
    remove: require('lodash.remove'),
    forEach: require('lodash.foreach'),
    first: require('lodash.first'),
    trim: require('lodash.trim')
};
var h = require('virtual-dom/h');

function constructor(services) {
    var configService = services.config;
    var axesTabTitle = 'Axes';

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

                if (config.xAxis) {
                    _.forEach(config.xAxis, function (axis, index) {
                        var titleText = !_.isUndefined(axis) && !_.isUndefined(axis.title) && !_.isUndefined(axis.title.text) && _.trim(axis.title.text) > 0 ? axis.title.text : 'X axis ' + (index + 1);
                        links.push(
                            h('li.hover', {
                                'className': activeTabChild === 'xAxis' + index ? 'sub-active' : 'sub-non-active',
                                'ev-click': function (e) {
                                    setActive(options.id, 'xAxis' + index);
                                    e.preventDefault();
                                }
                            }, titleText)
                        )
                    });
                }

                if (config.yAxis) {
                    _.forEach(config.yAxis, function (axis, index) {
                        var titleText = !_.isUndefined(axis) && !_.isUndefined(axis.title) && !_.isUndefined(axis.title.text) && _.trim(axis.title.text) ? axis.title.text : 'Y axis ' + (index + 1);
                        links.push(
                            h('li.hover', {
                                'className': activeTabChild === 'yAxis' + index ? 'sub-active' : 'sub-non-active',
                                'ev-click': function (e) {
                                    setActive(options.id, 'yAxis' + index);
                                    e.preventDefault();
                                }
                            }, titleText)
                        )
                    });
                }

                return h('li.active',
                    [
                        h('a', {
                            'href': '#data-series',
                            'ev-click': function (e) {
                                if(generalOptions){
                                    setActive(options.id, 'general');
                                } else {
                                    setActive(options.id, 'xAxis0');
                                }

                                e.preventDefault();
                            }
                        }, axesTabTitle),
                        h('ul', links)
                    ])
            }
            else {
                return h('li',
                    [
                        h('a', {
                            'href': '#data-series',
                            'ev-click': function (e) {
                                if(generalOptions){
                                    setActive(options.id, 'general');
                                } else {
                                    setActive(options.id, 'xAxis0');
                                }
                                e.preventDefault();
                            }
                        }, axesTabTitle)
                    ])
            }

        }
    }

    function generalOptions(panes) {
        return _.find(panes, function (pane) {
            // make the assumption tha the general options will be the one without axis specific options.
            var firstOption = pane.options[0];
            return firstOption.fullname.indexOf('xAxis') == -1 || firstOption.fullname.indexOf('yAxis') == -1 ;
        })
    }

    function generalContent(pane) {
        return h('div.vertical-tab-content', [generateContent({panes:[pane]})]);
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


    function axisContent(panes, child, config, setActive) {
        var type = child.substring(0, 5);
        var index = child.substring(5, 6);
        var pane = _.find(panes, function (pane) {
            var firstOption = pane.options[0];
            return firstOption.fullname.indexOf(type) > -1;
        });

        if (pane) {
            return h('div.vertical-tab-content', [h('div.titleBar',
                [
                    removeButton(type, index, pane.title, config[type], setActive),
                    addButton(type, config[type], setActive)
                ]
            ), generateAxisContentPane({panes:[pane]}, index, type)]);
        }
    }

    function generateAxisContentPane(panel, index, type){
        var list = [];
        _.forEach(panel.panes, function (pane) {
            var inputs = [];
            _.forEach(pane.options, function (option) {
                inputs.push(propertyServices.get(option, configService, type + '.' + index + '.' + option.fullname.replace(type + '.', "")));
            });
            var subPanes = pane.panes ? generateAxisContentPane(pane, index) : '';
            var item = h('h3', pane.title);
            list.push(h('div.field-group',
                [
                    h('div.field-group__title', [item]),
                    h('div.field-group__items', inputs),
                    h('div', subPanes)
                ]
            ));
        });
        return list;
    }

    function removeButton(type, index, title, typeConfig, setActive) {
        if (typeConfig.length > 1) {
            return h('button.btn.btn--small', {
                'ev-click': function (e) {
                    configService.removeValue(type + '.' + index, {});
                    setActive('axis', 'general');
                    e.preventDefault();
                }
            }, 'remove axis');
        }

    }

    function addButton(type, typeConfig, setActive) {
        return h('button.btn.btn--small', {
            'ev-click': function (e) {
                configService.setValue(type + '.' + typeConfig.length, {})
                setActive('axis', type + typeConfig.length);
                e.preventDefault();
            }
        }, 'add ' + type)
    }

    function content(panel, child, config, setActive) {
        if (child == 'general') {
            return generalContent(generalOptions(panel.panes));
        } else {
            return axisContent(panel.panes, child, config, setActive);
        }
    }

    return {
        tabs: tabs,
        content: content
    }
}
module.exports = constructor;