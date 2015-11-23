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

    var labels = {
        series: true,
        categories: true
    };

    that.get = function () {
        var preset = loadPreset(type, preset);
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
    };

    function loadPreset(){
        var typeConfig = _.find(templates,{id:type});
        return _.find(typeConfig.presets, {id:preset}).definition;
    }

    function hasLabels (newDataSet){
        // if the first cell is empty, make the assumption that the first column are labels.
        if(_.isEmpty(newDataSet[0][0]) || newDataSet[0][0] == 'cat' || newDataSet[0][0] == 'categories'){
            labels.categories = true;
        } else {
            labels.categories = false;
        }
    }

    mediator.on('dataUpdate', function (data) {
        hasLabels(data);
    });

    module.exports = that;
})();