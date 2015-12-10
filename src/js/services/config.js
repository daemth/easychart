(function () {
    function constructor (mediator, data) {
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            cloneDeep: require('lodash.clonedeep'),
            forEach: require('lodash.foreach'),
            merge: require('lodash.merge'),
            isEmpty: require('lodash.isempty')
        };
        var series = require('../factories/series.js');
        var templates = require('../config/templates.json');
        var that = {};
        var presetConf = {
            type: 'line',
            preset: 'dataLabels'
        };

        var configTemplate = {
            chart: {

            },
            plotOptions: {
                series: {
                    'animation': false
                }
            }
        };

        var config = _.cloneDeep(configTemplate);

        that.get = function () {
            var labels = hasLabels(data.get());
            var object = _.cloneDeep(config);
            object.series = series.get(data.getData(labels.series, labels.categories), object, labels, data.getCategories(), data.getSeries());
            return _.cloneDeep(object);
        };

        that.getRaw = function (){
            return _.cloneDeep(config);
        };

        that.set = function (_config_) {
            delete _config_.series;
            config = _.cloneDeep(_config_);
        };

        that.setConfigTemplate = function(newTemplate){
            configTemplate = newTemplate;
        };

        that.getConfigTemplate = function(){
            return _.cloneDeep(configTemplate);
        };

        that.reset = function (preset) {
            config = _.merge(_.cloneDeep(configTemplate), preset)
        };

        that.setValue = function (path, value) {
            ids = path.split('.');
            var step;
            var object = config;
            while (step = ids.shift()) {
                if (ids.length > 0) {
                    if (!_.isUndefined(object[step])) {
                        object = object[step];
                    } else {
                        object[step] = {};
                        object = object[step];
                    }
                } else {
                    object[step] = value;
                }
            }
            mediator.trigger('configUpdate', that.get());
        };

        that.setValues = function (array) {
            _.forEach(array, function (row) {
                that.setValue(row[0], row[1]);
            });
            mediator.trigger('configUpdate', that.get());
        };

        that.getValue = function (path) {
            var object = that.get();
            path = path.split('.');
            var step;
            while (step = path.shift()) {
                if (!_.isUndefined(object[step])) {
                    object = object[step];
                } else {
                    object = undefined;
                    break;
                }
            }
            return object;
        };

        that.removeValue = function (path) {
            var object = config;
            path = path.split('.');
            while (step = path.shift()) {
                if (!_.isUndefined(object[step])) {
                    if (path.length > 0) {
                        object = object[step];
                    } else {
                        delete object[step];
                    }
                }
            }
            mediator.trigger('configUpdate',that.get());
        };

        that.setPreset = function (type, preset) {
            presetConf = {
                type: type,
                preset: preset
            };
            that.reset(loadPreset(type, preset));
            mediator.trigger('configUpdate',that.get());
        };

        function loadPreset(type, preset) {
            var typeConfig = _.find(templates, {id: type});
            return _.cloneDeep(_.find(typeConfig.presets, {id: preset}).definition);
        }

        function hasLabels(data) {
            var labels = {
                categories: true,
                series: true
            };
            if (data[0]) {
                // if the first cell is empty, make the assumption that the first column are labels.
                if (_.isEmpty(data[0][0]) || data[0][0] == 'cat' || data[0][0] == 'categories') {
                    labels.categories = true;
                } else {
                    labels.categories = false;
                }
            }
            return labels;
        }

        return that;
    }

    module.exports = constructor;
})();