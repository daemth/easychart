(function () {
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');

    var _ = require('lodash');
    var that = {};
    var app;
    var header;
    var rootNode;
    var chartElement;
    var currentState;

    that.init = function(element, state){
        header = h('div');
        rootNode = createElement(header);
        element.appendChild(rootNode);

        app = createElement(h('div.left'));
        element.appendChild(app);

        var chart = require('./components/chart.js');
        chartElement = createElement(h('div.right', {id:'chartContainer'}));
        element.appendChild(chartElement);
        chart.load(chartElement);

        goToSate(state);
    };

    var states = {
        'import': {
            title: 'Import',
            content: function(element){
                var dataImport = require('./components/import.js');
                var importElement = createElement(h('div'));
                element.appendChild(importElement);
                dataImport.load(importElement);

                var table = require('./components/table.js');
                var tableElement = createElement(h('div'));
                element.appendChild(tableElement);
                table.load(tableElement);
            }
        },
        'templates': {
            title: 'Templates',
            content: function (element) {
                var templates = require('./components/templates.js');
                var templateElement = createElement(h('div'));
                templates.load(templateElement);
                element.appendChild(templateElement);
            }
        },
        'customise': {
            title: 'Customise',
            content: function (element) {
                var customise = require('./components/customise.js');
                var customiseElement = createElement(h('div'));
                customise.load(customiseElement);
                element.appendChild(customiseElement);
            }
        }
    };

    function goToSate(state){
        app.innerHTML = '';
        currentState = state;
        var newState = states[state];
        newState.content(app);
        render(state);
    }

    function render(state) {
        var newHeader = template(state);
        var patches = diff(header, newHeader);
        rootNode = patch(rootNode, patches);
        header = newHeader;
    }

    function template(state, page) {
        var links = ['import', 'templates', 'customise'];
        return h('div', [
            h('ul', links.map(function (id) {
                var className = state === id ? 'active' : '';

                return h('li',{'className' : className},
                    h('a',{
                        'href':'#' + id,
                        'ev-click': function(){
                            goToSate(id);
                        }
                    }, states[id].title))
                })),
            h('h1', states[state].title)
        ])
    }
    module.exports = that;
})();