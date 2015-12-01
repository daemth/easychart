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

    var _ = require('lodash');

    var app;
    var container;
    var header;
    var rootNode;
    var chartElement;
    var currentState;
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
                return h('li',
                    h('a',{
                        href:'#'+id,
                        "ev-click":function(e){
                            // prevent needless rerendering
                            if(currentState !== id){
                                _.forEach(e.target.parentNode.parentNode.childNodes,function(li){
                                    if(li !== e.target.parentNode){
                                        if(li.classList.contains('active')){
                                            li.classList.remove('active');
                                        }
                                    } else {
                                        // currentState !== id -> li has no active class
                                        li.classList.add('active');
                                    }
                                });
                                goToSate(id);
                            }
                            e.preventDefault();
                        }
                    }, states[id].title))
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
