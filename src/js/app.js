var css = require('../css/style.css');
var Delegator = require("dom-delegator");
Delegator();

function constructor(opts) {
    var mediator = require('mediatorjs');
    var mInstance = new mediator.Mediator();
    var initializer = require('./services/initializer');

    var dataService = require('./services/data');
    var confService = require('./services/config');
    var data = new dataService(mInstance);
    var config = new confService(mInstance, data);


    switch (opts.UIMode) {
        case 'viewer':
            var services = {
                data: data,
                config: new confService(mInstance, data),
                mediator: mInstance
            };

            // initialize the application
            initializer(opts, services);

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

            function setDataUrl(url) {
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

            // events
            function on(event, callback) {
                services.mediator.on(event, function (data) {
                    callback(data);
                });
            }

            return {
                setConfig: setConfig,
                setConfigStringified: setConfigStringified,
                setData: setData,
                setDataUrl: setDataUrl,
                setPresets: setPresets,
                getConfig: getConfig,
                getConfigStringified: getConfigStringified,
                on: on
            };

        // app-build
        default:
            var router = require('./services/router.js');
            var optionsService = require('./services/options');
            var revisionService = require('./services/revision');
            var templateService = require('./services/templates');
            //var initializer = require('./services/initializer');
            var Api = require('./services/api');
            var h = require('virtual-dom/h');

            var services = {
                data: data,
                config: config,
                mediator: mInstance,
                options: optionsService(mInstance),
                templates: templateService(),
                revision: revisionService(mInstance)
            };

            var states = {};

            // by default show this tab
            if (opts.dataTab != false) {
                states.data = {
                    title: 'Data',
                    dependencies: function () {
                        var that = {};
                        that.import = require('./components/import.js')(services);
                        return that;
                    },
                    template: function (dependencies) {
                        return h('div', [dependencies.import.template()]);
                    },
                    destroy: function (dependencies) {
                        dependencies.import.destroy()
                    }
                }
            }
            // by default show this tab.

            if (opts.templatesTab != false) {
                states.templates = {
                    title: 'Templates',
                    dependencies: function () {
                        var that = {};
                        that.templateSelection = require('./components/templateSelection.js')(services);
                        return that;
                    },
                    template: function (dependencies) {
                        return h('div', [dependencies.templateSelection.template()]);
                    }
                }
            }
            if (opts.customiseTab != false) {
                states.customise = {
                    title: 'Customise',
                    dependencies: function () {
                        var that = {};
                        that.configurate = require('./components/configure.js')(services);
                        return that;
                    },
                    template: function (dependencies) {
                        return h('div', [dependencies.configurate.template()]);
                    },
                    destroy: function (dependencies) {
                        dependencies.configurate.destroy()
                    }
                }
            }
            if (opts.debuggerTab == true) {
                states.debugger = {
                    title: 'Debug',
                    dependencies: function () {
                        var that = {};
                        that.debug = require('./components/debug.js')(services);
                        return that;
                    },
                    template: function (dependencies) {
                        return h('div', [dependencies.debug.template()]);
                    }
                }
            }

            // initialize the application with given options
            initializer(opts, services);
            
            if (typeof opts.element !== 'undefined') {
                opts.element.className += ' ec';
                var mainRouter = new router(opts.element, states, services, opts.showLogo !== false);
                if (opts.dataTab != false) {
                    mainRouter.goToState('data');
                } else if (opts.templateTab != false) {
                    mainRouter.goToState('templates');
                } else if (opts.customiseTab != false) {
                    mainRouter.goToState('customise');
                }
            }
            return new Api(services);
    }
}


module.exports = constructor;
window.ec = constructor;