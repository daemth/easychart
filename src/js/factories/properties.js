(function () {
    var _ = {
        isUndefined: require('lodash.isundefined'),
        cloneDeep: require('lodash.clonedeep'),
        forEach: require('lodash.foreach'),
        first: require('lodash.first'),
        isArray: require('lodash.isarray'),
        isString: require('lodash.isstring')
    };

    var that = {};

    that.get = function (option, configService, indexName) {
        if (option) {
            var localProperty = _.cloneDeep(option);
            // sometimes we will get an index name, this will be a name with an index.
            // e.g. series are arrays and have indexes : series.0.name
            localProperty.fullname = !_.isUndefined(indexName) ? indexName : option.fullname;
            return that.createProperty(localProperty, configService);
        }
    };

    that.createProperty = function (property, configService) {
        var element;
        var configValue = configService.getValue(property.fullname);
        var disabled = !configService.isEditable(property.fullname);

        // set the default/configvalue

        if (!_.isUndefined(property.defaults) && !_.isArray(property.defaults)) {
            // defaults is a string
            if (_.isString(property.defaults)) {
                property.defaults = property.defaults.replace(/\[|\]|\"/g, '').split(',');
            }
            if (property.defaults.length == 1) {
                property.defaults = _.first(property.defaults).trim();
            }
        }

        var returnType = property.returnType ? property.returnType : "string";
        // select
        if (property.hasOwnProperty('values') && property.values !== '') {
            element = require('./properties/select')(property, configService, configValue, disabled);
        }
        else {
            // TODO sort out all the different kind of returnTypes
            switch (true) {
                case returnType.toLowerCase() == 'array<color>':
                    element = require('./properties/arrayColor')(property, configService, configValue, disabled);
                    break;

                case returnType.toLowerCase() == 'array<object>':
                    element = require('./properties/arrayObject')(property, configService, configValue, that);
                    break;

                case returnType.toLowerCase() == 'array<string>': // eg xAxis.categories
                    element = require('./properties/arrayString')(property, configService, configValue, disabled);
                    break;

                case returnType.toLowerCase() == 'array<array>':
                    element = require('./properties/arrayArray')(property, configService, configValue, that);
                    break;

                case (returnType.lastIndexOf('Array', 0) === 0):
                    element = require('./properties/array')(property, configService, configValue, disabled);
                    break;

                case returnType.toLowerCase().indexOf('number') > -1:
                    element = require('./properties/number')(property, configService, configValue, disabled);
                    break;

                case returnType.toLowerCase() == 'boolean':
                    element = require('./properties/boolean')(property, configService, configValue, disabled);
                    break;

                case returnType.toLowerCase() == 'color':
                    element = require('./properties/color')(property, configService, configValue, disabled);
                    break;

                case returnType.toLowerCase() == 'object':
                    element = require('./properties/object')(property, configService, configValue, disabled);
                    break;

                case returnType.toLowerCase() == 'string':
                    element = require('./properties/string')(property, configService, configValue, disabled);
                    break;

                default:
                    element = require('./properties/string')(property, configService, configValue, disabled);
                    break;
            }
        }
        return element;
    };

    module.exports = that;
})();