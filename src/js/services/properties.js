(function () {
    var properties = require('../config/dump.json');
    var _ = require('lodash');
    var that = {};
    console.log(properties);
    that.get = function(fullname){
        console.log(fullname);
        _.find(properties, function(){

        })
    };
    module.exports = that;
})();
