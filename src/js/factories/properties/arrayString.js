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
      // TODO: add styling for textarea
      h('div.form-item__input', h('textarea', {
        disabled  : disabled,
        'placeholder' : property.defaults ? property.defaults : 'comma-separated list\nno quotes',
        'value': configValue ? configValue.join() : '',
        'ev-blur': function (e) {
          var _value = e.target.value;
          if (_value !== '') {
            // remove unnecessary spaces before/after commas, replace newlines with a comma and convert to an array
            _value = _value.replace(/\s*(\,|\n+)\s*/g, ',').split(',');
            configService.setValue(property.fullname, _value);
          } else {
            configService.removeValue(property.fullname);
          }
        }
      }))
    ]);
  }
  module.exports = constructor;
})();
