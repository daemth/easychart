(function () {
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');
    var logo = require('./../templates/logo');
    var mainLoop = require("main-loop");
    function constructor(element, initState, services) {
        var states = {
            'import': {
                title: 'Import',
                dependencies: function(){
                    var that = {};
                    that.import = require('./../components/import.js')(services);
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
                    that.templates = require('./../components/templates.js')(services);
                    return that;
                },
                template: function (dependencies) {
                    return h('div', [dependencies.templates.template()]);
                }
            },
            'customise': {
                title: 'Customise',
                dependencies: function(){
                    var that = {};
                    that.configurate = require('./../components/configurate.js')(services);
                    return that;
                },
                template: function (dependencies) {
                    return h('div', [dependencies.configurate.template()]);
                }
            }
        };

        var currentState = initState;
        var currentDependencies = states[initState].dependencies();
        var loop = mainLoop(initState, render, {
            create: require("virtual-dom/create-element"),
            diff: require("virtual-dom/diff"),
            patch: require("virtual-dom/patch")
        });
        element.appendChild(loop.target);


        function goToSate(state) {
            currentDependencies = states[state].dependencies();
            currentState = state;
            loop.update();
        }

        function render() {
            var links = ['import', 'templates', 'customise'];
            return h('div', [
                logo,
                h('ul.navigation.navigation--steps', links.map(function (id) {
                    var className = currentState === id ? 'active' : '';
                    return h('li.navigation__item', {
                        'className': className
                    }, h('a', {
                        'href':'#' + id,
                        'ev-click': function (e) {
                            e.preventDefault();
                            goToSate(id);
                        }
                    }, states[id].title))
                })),
                h('h1', states[currentState].title),
                h('div.left', states[currentState].template(currentDependencies))
            ])
        }

        services.mediator.on('treeUpdate',function(){
            loop.update();
        });

        // chart stuff
        var chartElement;
        var chart = require('./../components/chart.js');
        chartElement = createElement(h('div.right', {id: 'chartContainer'}));
        element.appendChild(chartElement);
        chart.load(chartElement, services);
    }

    module.exports = constructor;
})();