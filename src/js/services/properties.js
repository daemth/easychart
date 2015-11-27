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
        return that.createProperty(property);
    };

    that.createProperty = function (property) {
        var element;

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
            element = h('select',{                'onchange' : function(e){
                configService.setValue(property.fullname.toLowerCase(), e.target.value);
            }}, options);

        }
        else {

            element = h('input',{
                'onchange' : function(e){
                    configService.setValue(property.fullname.toLowerCase(), e.target.value);
                }
            });

            switch (property.returnType) {
                case 'array<color>':
                    if (property.defaults !== undefined) {
                        element.properties.value = property.defaults;
                    }
                    break;

                case 'number':
                    if (property.defaults !== undefined) {
                        element.properties.value = property.defaults;
                    }
                    element.properties.type = 'number';
                    element.properties.placeholder = property.fullname;
                    break;

                case 'boolean':
                    element.properties.type = 'checkbox';
                    if (property.defaults === 'true') {
                        element.properties.checked = property.checked;
                    }
                    break;

                case 'string':
                    if (property.defaults !== undefined) {
                        element.properties.value = property.defaults;
                    }
                    element.properties.type = 'text';
                    element.properties.placeholder = property.fullname;
                    break;

                default:
                    if (property.defaults !== undefined) {
                        element.properties.value = property.defaults;
                    }
                    element.properties.type = 'text';
                    element.properties.placeholder = property.fullname;
                    break;
            }
        }


        var label = h('span', property.name);

        return h('div', [label, element]);
    };

    module.exports = that;
})();