(function () {
    var config = require('../config/customise.json');

    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var that = {};
    that.load = function(element){
        element.innerHTML = 'customise';
    };

    module.exports = that;

})();