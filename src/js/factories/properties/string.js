(function () {
  var h = require('virtual-dom/h');

  function constructor(property, configService, configValue, disabled, defaultValue) {
    return h('div.form-item', [
      h('div.form-item__label', h('label', {
        title: property.description,
        'ev-click': function (e) {
          if(!disabled) {
            e.target.parentNode.parentNode.querySelector('input').focus();
          }
        }
      }, [property.title])),
      h('div.form-item__input', h('input', {
        disabled  : disabled,
        'type'    : 'text',
        'placeholder' : property.defaults,
        'value': configValue ? configValue : '',
        'ev-input': function (e) {
          if (e.target.value !== '') {
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
