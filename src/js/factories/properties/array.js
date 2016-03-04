(function () {
  var h = require('virtual-dom/h');
  var _ = {
    isUndefined: require('lodash.isundefined'),
    forEach    : require('lodash.foreach'),
    isEqual    : require('lodash.isequal'),
    merge      : require('lodash.merge'),
    cloneDeep  : require('lodash.clonedeep')
  };

  function constructor(property, configService, configValue, disabled) {
    var list = [];
    var values = _.merge(_.cloneDeep(property.defaults), configValue, []);
    _.forEach(property.defaults, function (value, index) {
      //values.push(configValue[index]);
      list.push(h('div.form-item', [
        h('div.form-item__label', h('label', {
          title     : property.description,
          'ev-click': function (e) {
            if(!disabled){
              e.target.parentNode.parentNode.querySelector('input').focus();
            }
          }
        }, property.title + ' ' + index + ' :')),
        h('div.form-item__input', h('input', {
          disabled  : disabled,
          'type'    : 'text',
          'placeholder': property.defaults[index],
          'value'   : !_.isUndefined(configValue) && !_.isUndefined(configValue[index]) && configValue[index] !== property.defaults[index] ? configValue[index] : '',
          'ev-input': function (e) {
            values[index] = e.target.value != '' ? e.target.value : property.defaults[index];
            if (_.isEqual(property.defaults, values)) {
              configService.removeValue(property.fullname);
            } else {
              configService.setValue(property.fullname, values);
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
