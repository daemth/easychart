(function () {
    var h = require('virtual-dom/h');
    var _ = {
        isString: require('lodash.isstring')
    };
    function constructor (property, configService, configValue, disabled){
        if (_.isString(configValue)) {
            configValue = configValue == 'true';
        }
        return h('div.form-item', [
            h('div.form-item__label', h('label', {title: property.description}, [property.title])),
            h('div.form-item__input', h('input', {
                disabled: disabled,
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
    }

    module.exports = constructor;
})();
