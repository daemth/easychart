(function () {
  var h = require('virtual-dom/h');
  var _ = {
    isUndefined: require('lodash.isundefined'),
    forEach    : require('lodash.foreach'),
    isEqual    : require('lodash.isequal'),
    merge      : require('lodash.merge'),
    cloneDeep  : require('lodash.clonedeep')
  };

  function constructor(property, configService, configValue, propertyService) {
    var list = [];
    _.forEach(configValue, function(value, index){
      var optionsList = [];
      var title = h('div.title',[h('h4', '' + (index + 1)), removeButton(property.fullname + '.' + index)]);
      _.forEach(property.options, function(option){
        optionsList.push(propertyService.get(option, configService, property.fullname + '.' + index + '.' + option.title))
      });
      list.push(h('div.item', [title, h('div.options', optionsList)]))
    });


    function removeButton(name){
      return h('button.btn.btn--small', {
        'ev-click': function () {
          configService.removeValue(name);
        }
      }, 'remove')
    }

    function addButton(type, typeConfig, label) {
      return h('button.btn.btn--small', {
        'ev-click': function () {
          configService.setValue(type + '.' + typeConfig.length, {});
        }
      }, 'add ' + label)
    }

    return h('div.objectArray', [
      h('div.title', [h('h4', [property.title]), addButton(property.fullname, configValue, property.title)]),
      h('div.list', list)
    ]);
  }
  module.exports = constructor;

})();
