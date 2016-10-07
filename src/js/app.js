var css = require('../../dist/ec.css');
var Delegator = require("dom-delegator");
Delegator();
function constructor(opts) {
    var router = require('./services/router.js');
    var dataService = require('./services/data');
    var confService = require('./services/config');
    var optionsService = require('./services/options');
    var revisionService = require('./services/revision');
    var templateService = require('./services/templates');
    var initializer = require('./services/initializer');
    var Api = require('./services/api');
    var mediator = require('mediatorjs');
    var h = require('virtual-dom/h');
    var mInstance = new mediator.Mediator();
    var data = new dataService(mInstance);
    var config = new confService(mInstance, data);

    var services = {
        data: data,
        config: config,
        mediator: mInstance,
        options: optionsService(mInstance),
        templates: templateService(),
        revision: revisionService(mInstance)
    };

    var states = {};

    if(opts.chartTab == true){
        states.chart = {
            title: 'Chart preview',
            dependencies: function () {
                var that = {};
                return that;
            },
            template: function (dependencies) {
                return '';
            }
        }
    }

    // by default show this tab
    if(opts.dataTab != false) {
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

    if(opts.templatesTab != false) {
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
        states.debug = {
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

    // initialise the application with given options
    initializer(opts, services);
    if (typeof opts.element !== 'undefined') {
        opts.element.className += ' ec';

        var mainRouter = new router(opts.element, states, services, opts.showLogo !== false);
        if (opts.chartTab == true) {
            mainRouter.goToState('chart');
        } else if(opts.dataTab != false) {
            mainRouter.goToState('data');
        } else if(opts.templatesTab != false) {
            mainRouter.goToState('templates');
        } else if(opts.customiseTab != false) {
            mainRouter.goToState('customise');
        } else if(opts.debuggerTab == true) {
            mainRouter.goToState('debug');
        }
    }

    return new Api(services);
}

module.exports = constructor;
window.ec = constructor;