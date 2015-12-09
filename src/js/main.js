(function () {
    var css = require('../css/style.css');
    var Delegator = require("dom-delegator");
    Delegator();
    function constructor(element){
        var router = require('./services/router.js');
        var dataService = require('./services/data');
        var confService = require('./services/config');
        var optionsService = require('./services/options');
        var mediator = require('mediatorjs');

        var mInstance = new mediator.Mediator();
        var data = new dataService(mInstance);
        var config = new confService(mInstance, data);
        var services = {
            data: data,
            config: new confService(mInstance, data),
            mediator: mInstance,
            options: new optionsService()
        };

        element.className += ' ec';
        new router(element, 'customise', services);
        function setData (data){
            services.data.set(data);
        }

        function getData (){
            return services.data.get();
        }

        function setDataUrl(){

        }

        function setOptions(options){
            services.options.set(options);
        }

        function setConfig(config){
            services.config.set(config);
        }

        function getConfig(config){
            return services.config.getRaw(config);
        }

        function setConfigTemplate(configTemplate){
            services.config.setConfigTemplate(configTemplate);
        }
        return {
            setData:setData,
            getData:getData,
            setDataUrl:setDataUrl,
            setOptions:setOptions,
            setConfig:setConfig,
            getConfig:getConfig,
            setConfigTemplate: setConfigTemplate,
        }
    }

    window.ec = constructor;
})();
