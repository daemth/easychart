(function () {
    function constructor(mediator, data) {
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            cloneDeep: require('lodash.clonedeep'),
            forEach: require('lodash.foreach'),
            merge: require('lodash.merge'),
            isEmpty: require('lodash.isempty'),
            map: require('lodash.map'),
            isArray: require('lodash.isarray')
        };
        var series = require('../factories/series.js');
        var jsonfn = require('json-fn');
        var that = {};
        var presets = {
            chart:{

            },
            xAxis:[{

            }],
            yAxis:[{

            }]
        };


        var config = _.cloneDeep(presets);
        var configCache;

        that.get = function () {
            var labels = hasLabels(data.get());
            var _configObject = _.merge(_.cloneDeep(config), _.cloneDeep(presets));
            var _data = data.getData(labels.series, labels.categories);

            // TODO FIX: getCategories() only when there are cats

            // add series to _configObject
            _configObject.series = series.get(_data, _configObject, labels, data.getCategories(), data.getSeries(labels.categories));
            configCache = _.cloneDeep(_configObject);
            return configCache;
        };

        that.getRaw = function () {
            return _.cloneDeep(config);
        };

        that.getStringified = function(){
            return stringify(config);
        };


        that.set = function (_config_) {
            _config_.series = _.map(_config_.series, function(serie){
                serie.data = _.map(serie.data, function(data){
                    delete data.x;
                    delete data.y;
                    delete data.z;
                    delete data.value;
                    delete data.low;
                    delete data.q1;
                    delete data.median;
                    delete data.q3;
                    delete data.high;
                    return data;
                });
                return serie;
            });
            config = _.cloneDeep(_config_);

            if(!config.xAxis){
                config.xAxis = [{}];
            }
            if(!config.yAxis){
                config.yAxis = [{}];
            }
            configUpdate();
        };

        that.setValue = function (path, value) {
            var ids = path.split('.');
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
            configUpdate();
        };

        that.setValues = function (array) {
            _.forEach(array, function (row) {
                that.setValue(row[0], row[1]);
            });
            configUpdate();
        };

        that.setStringified = function(string){
            that.set(jsonfn.parse(string));
            configUpdate();
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

        that.isEditable = function (path) {
            var object = _.cloneDeep(presets);
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
            return _.isUndefined(object);
        };

        that.removeValue = function (path) {
            var temp = config;
            var parent;
            var parentStep;
            path = path.split('.');
            while (step = path.shift()) {
                if (!_.isUndefined(temp[step])) {
                    if (path.length > 0) {
                        parent = temp;
                        parentStep = step;
                        temp = temp[step];
                    } else {
                        if(Object.prototype.toString.call( temp ) === '[object Array]'){
                            temp.splice(step, 1);
                            if(temp.length === 0){
                                delete parent[parentStep];
                            }
                        } else {
                            delete temp[step];
                        }
                    }
                }
            }
            configUpdate();
        };

        that.loadTemplate = function (template) {
            config = _.merge(_.cloneDeep(presets), template);
            if(!config.xAxis){
                config.xAxis = [{}];
            }
            if(!config.yAxis){
                config.yAxis = [{}];
            }
            configUpdate();
        };

        that.setPresets = function (_presets_) {
            presets = _presets_;
            configUpdate();
        };

        that.getPresets = function () {
            return _.cloneDeep(presets);
        };

        function hasLabels(data) {
            var labels = {
                categories: false,
                series: true
            };
            if (data[0]) {
                // if the first cell is empty, make the assumption that the first column are labels.
                if (_.isEmpty(data[0][0]) || data[0][0] === 'cat' || data[0][0] === 'categories') {
                    labels.categories = true;
                }
            }
            return labels;
        }

        function configUpdate(){
            mediator.trigger('configUpdate', that.get());
            mediator.trigger('configUpdateRaw', that.getRaw());
        }

        mediator.on('dataUpdate', function(data){
            configUpdate();
        });

        String.prototype.replaceAll = function(str1, str2, ignore)
        {
            return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
        }
        function stringify (obj) {
            return JSON.stringify(obj, function (key, value) {
                if (value instanceof Function || typeof value == 'function') {
                    return value.toString().replaceAll('"', '\\"');
                }
                if(typeof value == 'string'){
                    return value.replaceAll('"', '\\"');
                }
                if (value instanceof RegExp) {
                    return '_PxEgEr_' + value;
                }

                return value;
            });
        }
        return that;

    }

    module.exports = constructor;
})();
