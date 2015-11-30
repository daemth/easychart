(function () {
    var _ = require('lodash');
    var dataService = require('../services/data.js');
    var series = require('../services/series.js');
    var templates = require('../config/templates.json');
    var mediator = require('mediatorjs');
    var that = {};

    var config = {
        preset :{
            type: 'line',
            preset: 'dataLabels'
        },
        chart: {

        },
        plotOptions:{
            series:{
                'animation': false
            }
        }
    };

    that.get = function () {
        var preset = loadPreset(config.preset.type, config.preset.preset);
        var labels = hasLabels(dataService.get());
        var object = JSON.parse(JSON.stringify(_.merge(preset,config)));
        object.series = series.get(dataService.getData(labels.series, labels.categories), preset, labels);
        return JSON.parse(JSON.stringify(object));
    };

    that.set = function (_config_) {
        config = JSON.parse(JSON.stringify(_config_));
    };

    that.setValue = function(path, value){
        ids = path.split('.');
        var step;
        var object = config;
        while (step = ids.shift()) {
            if(ids.length > 0){
                if(!_.isUndefined(object[step])){
                    object = object[step];
                } else {
                    object[step] = {};
                    object = object[step];
                }
            } else {
                object[step] = value;
            }
        }
        mediator.trigger('configUpdate');
    };

    that.setValues = function(array){
        _.forEach(array, function(row){
            that.setValue(row[0], row[1]);
        });
        mediator.trigger('configUpdate');
    };

    that.getValue = function(path){
        var object = that.get();
        path = path.split('.');
        var step;
        while (step = path.shift()) {
            if(!_.isUndefined(object[step])){
                object = object[step];
            } else {
                object = undefined;
                break;
            }
        }
        return object;
    };

    that.removeValue = function(path){
        var object = config;
        path = path.split('.');
        while (step = path.shift()) {
            if(!_.isUndefined(object[step])){
                if(path.length > 0){
                    object = object[step];
                } else {
                    delete object[step];
                }
            }
        }
        mediator.trigger('configUpdate');
    };

    that.setPreset = function(type, preset){
        config.preset = {
            type: type,
            preset: preset
        };
        mediator.trigger('configUpdate');
    };


    function loadPreset(type, preset){
        var typeConfig = _.find(templates,{id:type});
        return JSON.parse(JSON.stringify(_.find(typeConfig.presets, {id:preset}).definition));
    }

    function hasLabels (data){
        var labels = {
            categories: true,
            series: true
        };
        if(data[0]){
            // if the first cell is empty, make the assumption that the first column are labels.
            if(_.isEmpty(data[0][0]) || data[0][0] == 'cat' || data[0][0] == 'categories'){
                labels.categories = true;
            } else {
                labels.categories = false;
            }
        }
        return labels;
    }

    module.exports = that;
})();