(function () {
  var h = require('virtual-dom/h');
  var _ = {
    isString: require('lodash.isstring'),
    isUndefined: require('lodash.isundefined')
  };

  function constructor(property, configService, configValue, disabled) {

    if (_.isString(configValue)) {
      configValue = configValue == 'true';
    }
    property.defaults = property.defaults === 'true';

    return h('div.form-item', [
      h('div.form-item__label', h('label', {
        title     : property.description,
        'ev-click': function (e) {
          if(!disabled) {
            var _checkbox = e.target.parentNode.parentNode.querySelector('input');
            var _val = _checkbox.checked;
            _checkbox.checked = !_val;
            if (property.defaults !== !_val) {
              configService.setValue(property.fullname, !_val);
            } else {
              configService.removeValue(property.fullname);
            }
          }
        }
      }, [property.title])),
      h('div.form-item__input', h('input', {
        disabled  : disabled,
        'type'    : 'checkbox',
        'checked': _.isUndefined(configValue) ? property.defaults : !property.defaults,
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
