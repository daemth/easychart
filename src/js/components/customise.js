(function(){
    var config = require('../config/config.json');
    var that = {};

    that.load = function (element){
        element.innerHTML = 'customise';
    };

    /*
    var xAxis = document.createElement('input');
    xAxis.type = 'checkbox';
    input.appendChild(xAxis);
    xAxis.checked = configService.getlabelsAxis('x');
    xAxis.onclick = function(event){
        configService.setlabelsAxis('x', this.checked)
    };
    */

    module.exports = that;
})();