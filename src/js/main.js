(function () {
    var router = require('./router.js');
    var Delegator = require("dom-delegator");

    var dataService = require('./services/data');


    var that = {};

    that.init = function(element){
        Delegator();
        router.init(element, 'import');
    };

    that.setData = function(data){

    };

    that.getData = function(){

    };

    that.getDataUrl = function(){

    };

    that.setDataUrl = function(){

    };

    that.setConfig = function(config){

    };

    that.getConfig = function(config){

    };

    that.cloneDeep = function (src) {
        if (typeof src !== 'undefined') {
            return JSON.parse(JSON.stringify(src));
        } else {
            return src;
        }
    };

    window.ec = that;
})();
