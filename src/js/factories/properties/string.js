(function () {
    var h = require('virtual-dom/h');
    function constructor (property, configService, configValue, disabled){
        return h('div.form-item', [
            h('div.form-item__label', h('label', {title: property.description}, [property.title])),
            h('div.form-item__input', h('input', {
                disable: disabled,
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
    }

    module.exports = constructor;
})();
