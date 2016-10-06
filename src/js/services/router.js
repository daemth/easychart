(function () {
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');
    var logo = require('./../templates/logo');

    var mainLoop = require("main-loop");
    var _ = {
        keys: require('lodash.keys'),
        size: require('lodash.size'),
        without: require('lodash.without'),
        slice: require('lodash.slice')
    };

    function constructor(element, states, services, showLogo) {
        var initState = {
            links: _.keys(states)
        };
        var editStateNames = _.without(_.keys(states), 'chart', 'debug'); // names of states meant for editing the chart
        var numberOfEditStates = editStateNames.length; // number of states available without the debug and dashboard state
        var loop = mainLoop(initState, render, {
            create: require("virtual-dom/create-element"),
            diff: require("virtual-dom/diff"),
            patch: require("virtual-dom/patch")
        });
        var revisionElement = require('./../components/revision')(services.mediator, services.revision.getList());

        element.appendChild(loop.target);

        function goToState (state) {
            // find available state if no state is passed as argument
            if(state === undefined) {
                state = _.slice(editStateNames, 0, 1);
            }

            if (states[state]) {
                var newState = loop.state;
                if (loop.state.destroy && newState.dependencies) {
                    loop.state.destroy(newState.dependencies);
                }
                newState.dependencies = states[state].dependencies();
                newState.template = states[state].template;
                newState.title = states[state].title;
                newState.destroy = states[state].destroy;
                loop.update(newState);
            }
        }

        function render(state) {
            if (state.dependencies && state.template) {
                if (state.title == 'Chart preview'){ // todo: use an id instead?
                    chartElement.className = "";
                } else {
                    chartElement.className = "right";
                }
                window.dispatchEvent(new Event('resize'));
                return h('div',
                    [
                    state.title != 'Chart preview' ? h('div.header', [
                        showLogo ? h('h1.logo', 'EASYCHART') : null,
                        h('div.navigation.accordion-tabs-minimal', [
                            h('ul.tab-list', state.links.map(function (id) {
                                var className = state.title === states[id].title ? 'is-active' : '';
                                return h('li.tab-link', {
                                    'className': className
                                }, h('a', {
                                    'href': '#' + id,
                                    'ev-click': function (e) {
                                        e.preventDefault();
                                        goToState(id);
                                    }
                                }, states[id].title))
                            }))
                        ])
                    ]) :
                        // only show edit button when there are multiple states
                        numberOfEditStates > 0 ?
                            h('div.btn.btn--small',{
                                style:{
                                    position:'absolute',
                                    'z-index': '10'
                                },
                                'ev-click': function (e) {
                                    e.preventDefault();
                                    goToState();
                                }
                            },'Edit')
                        : null,
                    state.title != 'Chart preview' ? h('div.left', state.template(state.dependencies)) : null
                ])
            } else {
                return h('div.header', showLogo ? h('h1.logo', 'EASYCHART') : null)
            }
        }

        services.mediator.on('treeUpdate', function () {
            loop.update(loop.state);
        });

        
        
        // chart stuff
        var chartElement;
        var chart = require('./../components/chart.js');

        chartElement = createElement(h('div.right'));
        element.appendChild(chartElement);
        chart.load(chartElement, services);
        element.appendChild(revisionElement.template());
        return {
            goToState: goToState
        };
    }

    module.exports = constructor;
})();