(function () {

    var _ = {
        isUndefined: require('lodash.isundefined'),
        cloneDeep: require('lodash.clonedeep'),
        forEach: require('lodash.foreach'),
        first: require('lodash.first'),
        isArray: require('lodash.isarray'),
        isString: require('lodash.isstring'),
        isEqual: require('lodash.isequal')

    };

    var h = require('virtual-dom/h');
    var that = {};

    that.get = function (option, configService, indexName) {
        if (option) {
            var localProperty = _.cloneDeep(option);
            // sometimes we will get an index name, this will be a name with an index.
            // e.g. series are arrays and have indexes : series.0.name
            localProperty.fullname = !_.isUndefined(indexName) ? indexName : option.fullname;
            return that.createProperty(localProperty, configService);
        }
    };

    that.createProperty = function (property, configService) {
        var element;
        var configValue = configService.getValue(property.fullname);

        if (!_.isUndefined(property.defaults) && !_.isArray(property.defaults)) {
            // defaults is a string
            if (_.isString(property.defaults)) {
                property.defaults = property.defaults.replace(/\[|\]|\"/g, '').split(',');
            }
            if (property.defaults.length == 1) {
                property.defaults = _.first(property.defaults).trim();
                configValue = !_.isUndefined(configValue) ? configValue : property.defaults;
            } else if (property.defaults.length > 1) {
                if (!configValue) {

                    configValue = [];
                }
                _.forEach(property.defaults, function (defaultValue, index) {
                    configValue[index] = configValue && configValue[index] ? configValue[index] : property.defaults[index].trim();
                })
            }
        }

        if (property.hasOwnProperty('values') && property.values !== '') {
            var options = [];
            values = property.values.replace(/\[|\]|\"|\s/g, '').split(',');
            _.forEach(values, function (value) {
                var selected = value == configValue;

                var item = h('option', {
                    value: value,
                    selected: selected
                }, value === 'null' ? '' : value);
                options.push(item);
            });

            element = h('div.form-item', [
                h('div.form-item__label', h('label', {title: property.description}, [property.title])),
                h('div.form-item__input', h('select', {
                    'ev-input': function (e) {
                        if (e.target.value === 'null') {
                            configService.removeValue(property.fullname);
                        } else {
                            configService.setValue(property.fullname, e.target.value);
                        }
                    }
                }, options))
            ]);
        }


        else {
            switch (true) {
                // check if array
                case (property.returnType.lastIndexOf('Array', 0) === 0):
                    var list = [];
                    var values = !_.isUndefined(configValue) ? configValue : [];
                    _.forEach(property.defaults, function (value, index) {
                        //values.push(configValue[index]);
                        list.push(h('div.form-item', [
                            h('div.form-item__label', h('label', {title: property.description}, property.title + ' ' + index + ' :')),
                            h('div.form-item__input', h('input', {
                                'type': 'text',
                                'value': !_.isUndefined(configValue) && !_.isUndefined(configValue[index]) ? configValue[index] : property.defaults[index],
                                'ev-input': function (e) {
                                    values[index] = e.target.value != '' ? e.target.value : property.defaults[index];
                                    if (_.isEqual(property.defaults, values)) {
                                        configService.removeValue(property.fullname);
                                    } else {
                                        configService.setValue(property.fullname, values);
                                    }
                                }
                            }))
                        ]))
                    });
                    element = h('div', [
                        h('div', h('h4', [property.title])),
                        h('div', list)
                    ]);
                    break;
                case property.returnType.toLowerCase() == 'number':
                    element = h('div.form-item', [
                        h('div.form-item__label', h('label', {title: property.description}, [property.title])),
                        h('div.form-item__input', h('input', {
                            'type': 'number',
                            'value': configValue,
                            'ev-input': function (e) {
                                if (parseInt(property.defaults) !== parseInt(e.target.value)) {
                                    configService.setValue(property.fullname, parseInt(e.target.value));
                                } else {
                                    configService.removeValue(property.fullname);
                                }
                            }
                        }))
                    ]);
                    break;
                case property.returnType.toLowerCase() == 'boolean':
                    if (_.isString(configValue)) {
                        configValue = configValue == 'true';
                    }
                    element = h('div.form-item', [
                        h('div.form-item__label', h('label', {title: property.description}, [property.title])),
                        h('div.form-item__input', h('input', {
                            'type': 'checkbox',
                            'checked': configValue,
                            'ev-click': function (e) {
                                if (property.defaults !== e.target.checked) {
                                    configService.setValue(property.fullname, e.target.checked);
                                } else {
                                    configService.removeValue(property.fullname);
                                }
                            }
                        }))
                    ]);
                    break;

                case property.returnType.toLowerCase() == 'string':
                    element = h('div.form-item', [
                        h('div.form-item__label', h('label', {title: property.description}, [property.title])),
                        h('div.form-item__input', h('input', {
                            'type': 'text',
                            'value': configValue,
                            'ev-input': function (e) {
                                if (property.defaults !== e.target.value) {
                                    configService.setValue(property.fullname, e.target.value);
                                } else {
                                    configService.removeValue(property.fullname);
                                }
                            }
                        }))
                    ]);
                    break;
                default:
                    element = h('div.form-item', [
                        h('div.form-item__label', h('label', {title: property.description}, [property.title])),
                        h('div.form-item__input', h('input', {
                            'type': 'text',
                            'value': configValue,
                            'ev-input': function (e) {
                                if (property.defaults !== e.target.value) {
                                    configService.setValue(property.fullname, e.target.value);
                                } else {
                                    configService.removeValue(property.fullname);
                                }
                            }
                        }))
                    ]);
                    break;
            }
        }
        return element;
    };

    module.exports = that;
})();