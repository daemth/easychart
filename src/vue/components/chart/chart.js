var Vue = require('vue');

function renderChart (element) {
    console.log(element);
    var chart = new Highcharts.Chart({
        chart:{
            renderTo:element.$el
        }
    });

}
module.exports = {
    template: require('./chart.html'),
    mounted: function() {
        renderChart(this)
    }
};

/*
(function() {
    // Load the framework and Highcharts. Framework is passed as a parameter.
    var mediator;
    var configService;
    var that = {};



})();
    */