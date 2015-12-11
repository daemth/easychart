(function () {
    var css = require('../css/style.css');
    var Delegator = require("dom-delegator");
    Delegator();
    function constructor(element){
        var router = require('./services/router.js');
        var dataService = require('./services/data');
        var confService = require('./services/config');
        var optionsService = require('./services/options');
        var templateService = require('./services/templates');
        var mediator = require('mediatorjs');
        var h = require('virtual-dom/h');
        var Api = require('./services/api');
        var mInstance = new mediator.Mediator();
        var data = new dataService(mInstance);
        var config = new confService(mInstance, data);
        var services = {
            data: data,
            config: new confService(mInstance, data),
            mediator: mInstance,
            options: new optionsService(),
            templates: new templateService()
        };

        element.className += ' ec';
        var states = {
            'import': {
                title: 'Import',
                dependencies: function(){
                    var that = {};
                    that.import = require('./components/import.js')(services);
                    return that;
                },
                template: function (dependencies) {
                    return h('div', [dependencies.import.template()]);
                }
            },
            'templates': {
                title: 'Templates',
                dependencies: function(){
                    var that = {};
                    that.templateSelection = require('./components/templateSelection.js')(services);
                    return that;
                },
                template: function (dependencies) {
                    return h('div', [dependencies.templateSelection.template()]);
                }
            }
        };

        var mainRouter = new router(element, states , services);
        mainRouter.goToState('import');

        return new Api(services);
    }

    window.ec = constructor;
})();
