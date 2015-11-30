(function () {
    var properties = require('../config/dump.json');
    var _ = require('lodash');
    var configService = require('./config');


    var h = require('virtual-dom/h');
    var that = {};

    that.get = function (fullname) {
        var property = _.find(properties, function (record) {
            return record.fullname.toLowerCase() == fullname.toLowerCase();
        });
        if (property) {
            return that.createProperty(property);
        }
    };

    that.createProperty = function (property) {
        var element;

        if (!_.isUndefined(property.defaults) && !_.isArray(property.defaults)) {
            property.defaults = property.defaults.replace(/\[|\]|\"|\s/g, '').split(',');
            if (property.defaults.length == 1) {
                property.defaults = _.first(property.defaults);
            }
        }

        if (property.hasOwnProperty('values') && property.values !== '') {
            var options = [];
            values = property.values.replace(/\[|\]|\"|\s/g, '').split(',');
            _.forEach(values, function (value) {
                var selected = value == property.defaults;
                var item = h('option', {
                    value: value,
                    selected: selected
                }, value);
                options.push(item);
            });
            element = h('select', {
                'onchange': function (e) {
                    configService.setValue(property.fullname, e.target.value);
                }
            }, options);

        }
        else {
            switch (property.returnType.toLowerCase()) {
                case 'number':
                    var defaultValue = property.defaults ? property.defaults : '';
                    element = h('input', {
                        'type': 'number',
                        'value': defaultValue,
                        'onchange': function (e) {
                            if (parseInt(property.defaults) !== parseInt(e.target.value)) {
                                configService.setValue(property.fullname, parseInt(e.target.value));
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

                case 'array<color>':
                    var list = [];
                    var values = [];
                    _.forEach(property.defaults, function (value, index) {
                        values.push(value);
                        list.push(h('div', [
                            h('span', property.title + ' ' + index + ' :'),
                            h('input', {
                                'type': 'text',
                                'value': value,
                                'onchange': function (e) {
                                    values[index] = e.target.value != '' ? e.target.value : property.defaults[index];
                                    if (!_.isEqual(property.defaults, values)) {
                                        configService.setValue(property.fullname, values);
                                    } else {
                                        configService.removeValue(property.fullname);
                                    }
                                },
                                'onfocus': function (e) {

                                }
                            })
                        ]))
                    });
                    element = h('div', list);
                    break;

                case 'boolean':
                    property.defaults = property.defaults == 'true';
                    element = h('input', {
                        'type': 'checkbox',
                        'checked': defaultValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.checked) {
                                configService.setValue(property.fullname, e.target.checked);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

                case 'string':
                    var defaultValue = property.defaults ? property.defaults : '';
                    element = h('input', {
                        'type': 'text',
                        'value': defaultValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, e.target.value);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

                default:
                    var defaultValue = property.defaults ? property.defaults : '';
                    element = h('input', {
                        'type': 'text',
                        'value': defaultValue,
                        'onchange': function (e) {
                            if (property.defaults !== e.target.value) {
                                configService.setValue(property.fullname, e.target.value);
                            } else {
                                configService.removeValue(property.fullname);
                            }
                        }
                    });
                    break;

            }
        }


        var label = h('span', property.title);

        return h('div', [label, element]);
    };

    module.exports = that;
})();