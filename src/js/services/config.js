(function () {
    _ = require('lodash');
    var dataService = require('../services/data.js');
    var series = require('../services/series.js');
    var templates = require('../config/templates.json');
    var mediator = require('mediatorjs');
    var that = {};
    var type = 'column';
    var preset = 'errorbar';
    var renderTo = 'container';



    that.get = function () {
        var preset = loadPreset(type, preset);
        var labels = hasLabels(dataService.get);
        var object = {
            chart: {
                renderTo: renderTo
            },
            series: series.get(dataService.getData(labels.series, labels.categories), preset, labels)
        };
        return _.merge(preset, object);
    };

    that.setPreset = function (_type_, _preset_) {
        type = _type_;
        preset = _preset_;

        mediator.trigger('presetUpdate');
    };

    function loadPreset(){
        var typeConfig = _.find(templates,{id:type});
        return _.find(typeConfig.presets, {id:preset}).definition;
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