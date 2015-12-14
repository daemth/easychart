(function () {
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');
    var logo = require('./../templates/logo');
    var mainLoop = require("main-loop");
    var _ = {
        keys : require('lodash.keys')
    };
    function constructor(element, states, services) {
        var initState = {
            links : _.keys(states)
        };
        var loop = mainLoop(initState, render, {
            create: require("virtual-dom/create-element"),
            diff: require("virtual-dom/diff"),
            patch: require("virtual-dom/patch")
        });

        element.appendChild(loop.target);

        function goToState(state) {
            var newState = loop.state;
            if(loop.state.destroy && newState.dependencies){
                loop.state.destroy(newState.dependencies);
            }
            newState.dependencies = states[state].dependencies();
            newState.template = states[state].template;
            newState.title = states[state].title;
            newState.destroy = states[state].destroy;
            loop.update(newState);

        }

        function render(state) {
            if(state.dependencies && state.template){
                return h('div', [
                    logo,
                    h('ul.navigation.navigation--steps', state.links.map(function (id) {
                        var className = state.title === states[id].title ? 'active' : '';
                        return h('li.navigation__item', {
                            'className': className
                        }, h('a', {
                            'href':'#' + id,
                            'ev-click': function (e) {
                                e.preventDefault();
                                goToState(id);
                            }
                        }, states[id].title))
                    })),
                    h('h1', state.title),
                    h('div.left', state.template(state.dependencies))
                ])
            } else {
                return h('div', logo)
            }

        }

        services.mediator.on('treeUpdate',function(){
            loop.update(loop.state);
        });

        // chart stuff
        var chartElement;
        var chart = require('./../components/chart.js');
        chartElement = createElement(h('div.right', {id: 'chartContainer'}));
        element.appendChild(chartElement);
        chart.load(chartElement, services);

        return {
            goToState: goToState
        };
    }

    module.exports = constructor;
})();