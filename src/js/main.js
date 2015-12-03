(function () {
    var Delegator = require("dom-delegator");
    Delegator();
    function constructor(element){
        var router = require('./services/router.js');
        var dataService = require('./services/data');
        var confService = require('./services/config');
        var mediator = require('mediatorjs');
        var mInstance = new mediator.Mediator();
        var data = new dataService(mInstance);
        var config = new confService(mInstance, data);
        var services = {
            data: data,
            config: new confService(mInstance, data),
            mediator: mInstance
        };

        element.className += ' ec';
        var r = new router(element, 'import', services);

        function setData (data){
            services.data.set(data);
        }

        function getData (){
            return services.data.get();
        }

        function getDataUrl (){

        }

        function setDataUrl(){

        }

        function setConfig(config){

        }

        function getConfig(config){

        }

        return {
            setData:setData,
            getData:getData,
            getDataUrl:getDataUrl,
            setDataUrl:setDataUrl,
            setConfig:setConfig,
            getConfig:getConfig
        }
    }

    window.ec = constructor;
})();
