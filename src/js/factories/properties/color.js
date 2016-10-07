(function () {
    var ColorPicker = require('simple-color-picker');

    var h = require('virtual-dom/h');
    var _ = {
        trim: require('lodash.trim'),
        toLower: require('lodash.tolower')
    };


    function constructor(property, configService, configValue, disabled, defaultValue) {
        var colorPicker = new ColorPicker({
            background: '#333333'
        });
        var value;
        var Hook = function () {};
        Hook.prototype.hook = function (node) {};

        return h('div.form-item', [
            h('div.form-item__label', h('label', {
                title: property.description,
                'ev-click': function (e) {
                    if (!disabled) {
                        e.target.parentNode.parentNode.querySelector('input').focus();
                    }
                }
            }, [property.title])),
            h('div.form-item__input', h('input', {
                disabled: disabled,
                'type': 'text',
                'placeholder': property.defaults,
                'value': configValue ? configValue : '',
                'ev-input': function (e) {
                    var _val = _.trim(e.target.value);
                    if (_val !== '') {
                        configService.setValue(property.fullname, _val);
                    } else {
                        configService.removeValue(property.fullname);
                    }
                },
                'ev-focus': function (e) {
                    colorPicker.setColor(e.target.value ? e.target.value : property.defaults);
                    colorPicker.appendTo(e.target.parentNode);
                    colorPicker.onChange(function () {
                        e.target.value = colorPicker.getHexString();
                        value = _.toLower(colorPicker.getHexString());

                        if (property.defaults === value) {
                            configService.removeValue(property.fullname);
                        } else {
                            configService.setValue(property.fullname, value);
                        }
                    });
                    e.target.onblur = function () {
                        colorPicker.remove();
                        e.target.onblur = undefined;
                    }
                }

            }))
        ]);
    }

    module.exports = constructor;
})();
