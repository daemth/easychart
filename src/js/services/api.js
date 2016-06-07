(function () {
    function constructor(services) {
        // data
        function setData(data) {
            services.data.set(data);
        }

        function getData() {
            return services.data.get();
        }

        // data csv
        function setDataCSV(csv) {
            services.data.setCSV(csv);
        }

        // data url
        function setDataUrl(url) {
            services.data.setUrl(url);
        }

        function getDataUrl() {
            return services.data.getUrl();
        }

        // options
        function setOptions(options) {
            services.options.set(options);
        }

        function getOptions() {
            return services.options.get();
        }

        function setOptionsUrl(url) {
            services.options.setUrl(url);
        }

        function getOptionsUrl() {
            return services.options.getUrl();
        }

        // templates
        function setTemplates(templates) {
            services.templates.set(templates);
        }

        function getTemplates() {
            return services.templates.get();
        }

        // config
        function setConfig(config) {
            services.config.set(config);
        }

        function setConfigStringified(string) {
            services.config.setStringified(string);
        }

        function getConfig() {
            return services.config.getRaw();
        }
        
        function getConfigAndData(){
            return services.config.get();
        }
        
        function getConfigStringified() {
            return services.config.getStringified();
        }

        // presets
        function setPresets(presets) {
            services.config.setPresets(presets);
        }

        function getPresets(presets) {
            services.config.getPresets(presets);
        }

        // events
        function on(event, callback) {
            services.mediator.on(event, function (data) {
                callback(data);
            });
        }

        return {
            setData: setData,
            getData: getData,
            setDataUrl: setDataUrl,
            getDataUrl: getDataUrl,
            setDataCSV: setDataCSV,
            setOptions: setOptions,
            getOptions: getOptions,
            setTemplates: setTemplates,
            getTemplates: getTemplates,
            setConfig: setConfig,
            setConfigStringified: setConfigStringified,
            getConfig: getConfig,
            getConfigAndData: getConfigAndData,
            getConfigStringified: getConfigStringified,
            setOptionsUrl: setOptionsUrl,
            getOptionsUrl: getOptionsUrl,
            setPresets: setPresets,
            getPresets: getPresets,
            on: on
        }
    }

    module.exports = constructor;
})();
