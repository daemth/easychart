(function () {
    var h = require('virtual-dom/h');
    var _ = {
        isUndefined: require('lodash.isundefined'),
        forEach: require('lodash.foreach'),
        isEqual: require('lodash.isequal'),
        merge: require('lodash.merge'),
        cloneDeep: require('lodash.clonedeep'),
        split: require('lodash.split'),
        join: require('lodash.join')
    };

    function constructor(property, configService, configValue, propertyService) {
        var list = [];


        console.log(property);
        console.log(configService.get());
        console.log(configValue);


        //var values = _.merge(_.cloneDeep(property.defaults), configValue, []);
        var values = _.cloneDeep(configValue) || [];

        _.forEach(configValue, function (value, index) {
            console.log(configValue);
            var optionsList = [];
            var title = h('div.title', [h('h4', '' + (index + 1)), removeButton(property.fullname + '.' + index)]);
            _.forEach(property.options, function (option) {
                //var fullnamePartial = option.fullname.split(property.title);
                //optionsList.push(propertyService.get(option, configService, property.fullname)[])
                // console.log(option);
                optionsList.push(_.join(option, ","));
            });
            list.push(h('div.item', [title,
                h('input', {
                        type: 'text',
                        'ev-input': function (e) {
                            values[index] = e.target.value != '' ? _.split(e.target.value, ",") : property.defaults[index];
                            //console.log(values);
                            /*if (e.target.value !== '') {
                             //configService.setValue(property.fullname, e.target.value);
                             } else {
                             //configService.removeValue(property.fullname);
                             }
                             */
                            configService.setValue(property.fullname, values);
                        }
                        , value: _.join(value, ",")
                    }
                )]))
        });

        function removeButton(name) {
            return h('button.btn.btn--small', {
                'ev-click': function (e) {
                    //console.log(name);
                    configService.removeValue(name);
                    e.preventDefault();
                }
            }, 'remove')
        }

        function addButton(type, typeConfig, label) {
            return h('button.btn.btn--small', {
                'ev-click': function (e) {
                    // console.log(type);
                    values.push([]);
                    configService.setValue(type, values);
                    // console.log(configService.get());
                    e.preventDefault();
                }
            }, 'add ' + label)
        }

        return h('div.arrayArray', [
            h('div.title', [h('h4', [property.title]), addButton(property.fullname, configValue, property.title)]),
            h('div.list', list)
        ]);
    }

    module.exports = constructor;

})();
