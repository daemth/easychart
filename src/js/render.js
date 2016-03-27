(function () {
    function constructor(opts) {
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

        if (typeof opts.data !== 'undefined') {
            services.data.set(opts.data);
        }

        if (typeof opts.dataUrl !== 'undefined') {
            services.data.setUrl(opts.dataUrl);
        }

        if (typeof opts.config !== 'undefined') {
            services.config.set(opts.config);
        }
        if (typeof opts.presets !== 'undefined') {
            services.config.setPresets(opts.presets);
        }

        if (typeof opts.element !== 'undefined') {
            opts.element.className += ' ec';
            var chart = require('./components/chart.js');
            chart.load(opts.element, services);
        }

        function setData(data) {
            services.data.set(data);
        }

        function setDataUrl() {
            services.data.setUrl(url);
        }

        // config
        function setConfig(config) {
            services.config.set(config);
        }

        function setConfigStringified(string) {
            services.config.setStringified(string);
        }

        function getConfig(config) {
            return services.config.getRaw(config);
        }

        function getConfigStringified() {
            return services.config.getStringified();
        }

        function setPresets(presets) {
            services.config.setPresets(presets);
        }

        return {
            setData: setData,
            setDataUrl: setDataUrl,
            setConfig: setConfig,
            setConfigStringified: setConfigStringified,
            getConfig: getConfig,
            getConfigStringified: getConfigStringified,
            setPresets: setPresets
        }
    }

    window.ec = constructor;
})();