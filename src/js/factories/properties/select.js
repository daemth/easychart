(function () {
  var h = require('virtual-dom/h');
  var _ = {
    forEach: require('lodash.foreach'),
    isUndefined: require('lodash.isundefined')
  };

  function constructor(property, configService, configValue, disabled) {
    var options = [];
    values = property.values.replace(/\[|\]|\"|\s/g, '').split(',');

      // fix for properties where values doesn't contain the default value
      if(values.indexOf(property.defaults) == -1 && values.indexOf('') == -1 && values.indexOf('null') == -1){
         values.unshift(property.defaults);
      }

    _.forEach(values, function (value) {
      var selected = !_.isUndefined(configValue) ? value === configValue : value === property.defaults;

      var item = h('option', {
        value   : value,
        selected: selected
      }, value === 'null' ? '' : value);
      options.push(item);
    });

    return h('div.form-item', [
      h('div.form-item__label', h('label', {
        title     : property.description,
        'ev-click': function (e) {
          if(!disabled) {
            e.target.parentNode.parentNode.querySelector('select').focus();
          }
        }
      }, [property.title])),
      h('div.form-item__input', h('select', {
        disabled  : disabled,
        'ev-change': function (e) {
          if (e.target.value === 'null' || e.target.value === 'false') {
            configService.removeValue(property.fullname);
          } else {
            configService.setValue(property.fullname, e.target.value);
          }
        }
      }, options))
    ]);
  }

  module.exports = constructor;
})();