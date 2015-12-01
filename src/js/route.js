(function () {
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');

    var templates = require('./components/templates.js');
    var table = require('./components/table.js');
    var chart = require('./components/chart.js');
    var dataImport = require('./components/import.js');
    var customise = require('./components/customise.js');

    var app;
    var container;
    var header;
    var rootNode;
    var chartElement;
    var states = {
        'import': {
            title: 'Import',
            content: function(element){
                var importElement = createElement(h('div'));
                element.appendChild(importElement);
                dataImport.load(importElement);

                var tableElement = createElement(h('div'));
                element.appendChild(tableElement);
                table.load(tableElement);
            }
        },
        'templates': {
            title: 'Templates',
            content: function (element) {
                var templateElement = createElement(h('div'));
                templates.load(templateElement);
                element.appendChild(templateElement);
            }
        },
        'customise': {
            title: 'Customise',
            content: function (element) {
                var customiseElement = createElement(h('div'));
                customise.load(customiseElement);
                element.appendChild(customiseElement);
            }
        }
    };

    function goToSate(state){
        app.innerHTML = '';
        var currentState = states[state];
        currentState.content(app);
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
                return h('li.hover',{
                    "ev-click":function(){
                        goToSate(id);
                    }
                }, states[id].title)
            })),
            h('h1', states[state].title)
        ])
    }


    document.addEventListener("DOMContentLoaded", function (event) {
        container = document.getElementById('container');
        header = h('div');

        rootNode = createElement(header);
        container.appendChild(rootNode);

        app = createElement(h('div.left'));
        container.appendChild(app);

        chartElement = createElement(h('div.right'));
        chart.load(chartElement);
        container.appendChild(chartElement);

        goToSate('import');
    });


})();
