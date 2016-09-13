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
        var values = _.cloneDeep(configValue) || [];

        _.forEach(configValue, function (value, index) {
            var optionsList = [];
            var title = h('div.title', [h('h4', '' + (index + 1)), removeButton(property.fullname + '.' + index)]);

            _.forEach(property.options, function (option) {
                optionsList.push(_.join(option, ","));
            });

            list.push(h('div.form-item', [
                h('div.form-item__label', [
                    h('label', {
                        'ev-click': function (e) {
                            if (!disabled) {
                                e.target.parentNode.parentNode.querySelector('input').focus(); // todo
                            }
                        }
                    }, index)
                ]),
                h('div.form-item__input', [
                    h('input', {
                            type: 'text',
                            'ev-input': function (e) {
                                values[index] = e.target.value != '' ? _.split(e.target.value, ",") : property.defaults[index];
                                configService.setValue(property.fullname, values);
                            }
                            , value: _.join(value, ",")
                        }
                    ),
                    removeButton(property.fullname + '.' + index)
                ])
            ]));
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
