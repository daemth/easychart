
(function () {
    function constructor(services){
        // data
        function setData (data){
            services.data.set(data);
        }
        function getData (){
            return services.data.get();
        }
        // data csv
        function setDataCSV(csv){
            services.data.setCSV(csv);
        }
        // data url
        function setDataUrl(url){
            services.data.setUrl(url);
        }
        function getDataUrl(){
            return services.data.getUrl();
        }
        // options
        function setOptions(options){
            services.options.set(options);
        }
        function getOptions(){
            return services.options.get();
        }
        function setOptionsUrl(url){
            services.options.setUrl(url);
        }
        function getOptionsUrl(){
            return services.options.getUrl();
        }
        // templates
        function setTemplates(templates){
            services.templates.set(templates);
        }
        function getTemplates(){
            return services.templates.get();
        }
        // config
        function setConfig(config){
            services.config.set(config);
        }
        function getConfig(config){
            return services.config.getRaw(config);
        }

        // preset
        function setPreset(preset){
            services.config.setPreset(preset);
        }
        function getPreset(preset){
            services.config.getPreset(preset);
        }
        // events
        function on(event, callback){
            services.mediator.on(event, function (data) {
                callback(data);
            });
        }

        return {
            setData:setData,
            getData:getData,
            setDataUrl:setDataUrl,
            getDataUrl:getDataUrl,
            setDataCSV: setDataCSV,
            setOptions:setOptions,
            getOptions: getOptions,
            setTemplates:setTemplates,
            getTemplates:getTemplates,
            setConfig:setConfig,
            getConfig:getConfig,
            setOptionsUrl:setOptionsUrl,
            getOptionsUrl:getOptionsUrl,
            setPreset:setPreset,
            getPreset:getPreset,
            on:on
        }
    }

    module.exports = constructor;
})();
