(function () {
    var ColorPicker = require('simple-color-picker');
    var css = require('../../../../node_modules/simple-color-picker/simple-color-picker.css');
    var h = require('virtual-dom/h');
    var _ = {
        isUndefined: require('lodash.isundefined'),
        forEach: require('lodash.foreach'),
        isEqual: require('lodash.isequal'),
        merge: require('lodash.merge'),
        cloneDeep: require('lodash.clonedeep')
    };

    function constructor(property, configService, configValue, disabled) {
        var Hook = function () {};
        Hook.prototype.hook = function (node) {

        };
        var list = [];
        var values = _.merge(_.cloneDeep(property.defaults), configValue, []);
        _.forEach(property.defaults, function (value, index) {
            var colorPicker;
            list.push(h('div.form-item', [
                h('div.form-item__label', h('label', {title: property.description}, property.title + ' ' + index + ' :')),
                h('div.form-item__input', h('input', {
                    'type': 'text',
                    'hook': new Hook(),
                    'disabled': disabled,
                    'value': !_.isUndefined(configValue) && !_.isUndefined(configValue[index]) ? configValue[index] : property.defaults[index],
                    'ev-focus':function(e){
                        colorPicker = new ColorPicker({
                            color: e.target.value,
                            background: 'white',
                            width: 200
                        });
                        colorPicker.appendTo(e.target.parentNode);
                        colorPicker.onChange(function(){
                            e.target.value = colorPicker.getHexString();
                            values[index] = colorPicker.getHexString();
                            if (_.isEqual(property.defaults, values)) {
                                configService.removeValue(property.fullname);
                            } else {
                                configService.setValue(property.fullname, values);
                            }
                        })
                    },
                    'ev-blur' :function(){
                        colorPicker.remove();
                    }

                }))
            ]))
        });
        /*
        'ev-input': function (e) {
            values[index] = e.target.value != '' ? e.target.value : property.defaults[index];
            if (_.isEqual(property.defaults, values)) {
                configService.removeValue(property.fullname);
            } else {
                configService.setValue(property.fullname, values);
            }
        }
        */
        return h('div', [
            h('div', h('h4', [property.title])),
            h('div', list)
        ]);
    }

    module.exports = constructor;
})();
