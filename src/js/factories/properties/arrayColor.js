(function () {
    var ColorPicker = require('simple-color-picker');
    var css = require('../../../../node_modules/simple-color-picker/simple-color-picker.css');
    var h = require('virtual-dom/h');
    var _ = {
        isUndefined: require('lodash.isundefined'),
        forEach: require('lodash.foreach'),
        isEqual: require('lodash.isequal'),
        merge: require('lodash.merge'),
        cloneDeep: require('lodash.clonedeep')
    };

    function constructor(property, configService, configValue, disabled) {
        var Hook = function () {
        };
        Hook.prototype.hook = function (node) {

        };
        var list = [];
        var values = _.merge(_.cloneDeep(property.defaults), configValue, []);
        _.forEach(property.defaults, function (value, index) {
            var colorPicker = new ColorPicker({
                background: 'white',
                width: 200
            });
            var test = 'notest';
            list.push(h('div.form-item', [
                h('div.form-item__label', h('label', {
                    title: property.description,
                    'ev-click': function (e) {
                        if (!disabled) {
                            e.target.parentNode.parentNode.querySelector('input').focus();
                        }
                    }
                }, property.title + ' ' + index + ' :')),
                h('div.form-item__input', h('input', {
                    'type': 'text',
                    'hook': new Hook(),
                    'disabled': disabled,
                    'placeholder': property.defaults[index],
                    'value': !_.isUndefined(configValue) && !_.isUndefined(configValue[index]) && configValue[index] !== property.defaults[index] ? configValue[index] : '',
                    'ev-focus': function (e) {
                        colorPicker.setColor(e.target.value? e.target.value : property.defaults[index]);
                        colorPicker.appendTo(e.target.parentNode);
                        colorPicker.onChange(function () {
                            e.target.value = colorPicker.getHexString();
                            values[index] = colorPicker.getHexString();
                            if (_.isEqual(property.defaults, values)) {
                                configService.removeValue(property.fullname);
                            } else {
                                configService.setValue(property.fullname, values);
                            }
                        });
                        e.target.onblur = function () {
                            colorPicker.remove();
                            e.target.onblur = undefined;
                        }
                    }
                }))
            ]))
        });
        return h('div', [
            h('div', h('h4', [property.title])),
            h('div', list)
        ]);
    }

    module.exports = constructor;
})();
