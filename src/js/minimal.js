(function () {
    function constructor(element){
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
        var chart = require('./components/chart.js');
        chart.load(element, services);

        function setData (data){
            services.data.set(data);
        }

        function setDataUrl(){
            services.data.setUrl(url);
        }

        function setConfig(config){
            services.config.set(config);
        }

        return {
            setData:setData,
            setDataUrl:setDataUrl,
            setConfig:setConfig
        }
    }

    window.ec = constructor;
})();
