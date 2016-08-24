(function () {
    var h = require('virtual-dom/h');

    function constructor(property, configService, configValue, disabled) {
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
                step: '0.01',
                disabled: disabled,
                placeholder: property.defaults,
                type: 'number',
                value: typeof configValue !== 'undefined' ? configValue : "",
                'ev-blur': function (e) {
                    if (e.target.value !== '') {
                        configService.setValue(property.fullname, parseFloat(e.target.value));
                    } else {
                        configService.removeValue(property.fullname);
                    }
                }
            }))
        ]);
    }

    module.exports = constructor;
})();