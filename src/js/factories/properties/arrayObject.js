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
        var fullnamePartial = option.fullname.split(property.title)[1];
        optionsList.push(propertyService.get(option, configService, property.fullname + '.' + index + fullnamePartial))
      });
      list.push(h('div.item', [title, h('div.options', optionsList)]))
    });

    function removeButton(name){
      return h('button.btn.btn--small', {
        'ev-click': function (e) {
          configService.removeValue(name);
          e.preventDefault();
        }
      }, 'remove')
    }

    function addButton(type, typeConfig, label) {
      return h('button.btn.btn--small', {
        'ev-click': function (e) {
          if(typeof typeConfig == 'undefined'){
            configService.setValue(type, []);
            configService.setValue(type + '.' + 0, {});
          } else {
            configService.setValue(type + '.' + typeConfig.length, {});
          }
          e.preventDefault();
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
