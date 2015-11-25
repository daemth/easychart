(function () {
    var StateMan = require('stateman');
    var h = require('virtual-dom/h');
    var diff = require('virtual-dom/diff');
    var patch = require('virtual-dom/patch');
    var createElement = require('virtual-dom/create-element');

    var templates = require('./components/templates.js');
    var table = require('./components/table.js');
    var chart = require('./components/chart.js');
    var dataImport = require('./components/import.js');
    var customise = require('./components/customise.js');
    var stateman = new StateMan({
        title: "Easychart",
        strict: true
    });

    var app;
    var container;
    var header;
    var rootNode;

    stateman.state({
            "app": {},
            "app.import": {
                enter: function (state) {
                    var importElement = createElement(h('div'));
                    app.appendChild(importElement);
                    dataImport.load(importElement);

                    var tableElement = createElement(h('div'));
                    app.appendChild(tableElement);
                    table.load(tableElement);
                },
                leave: function () {
                    table.destroy();
                }
            },

            "app.templates": {
                enter: function (state) {
                    var chartElement = createElement(h('div'));
                    chart.load(chartElement);
                    app.appendChild(chartElement);

                    var templateElement = createElement(h('div'));
                    templates.load(templateElement);
                    app.appendChild(templateElement);
                }
            },

            "app.customise": {
                enter: function (state) {

                }
            }
        })

        .on("begin", function (state) {
            app.innerHTML = '';
            render(state);
        })
        .on("notfound", function () {
            this.go('app.import');
        });




    function render(state) {
        var newHeader = headerTemplate(state);
        var patches = diff(header, newHeader);
        rootNode = patch(rootNode, patches);
        header = newHeader;
    }

    function headerTemplate(state) {
        var links = ['/app/import', '/app/templates', '/app/customise'];
        var titles = {
            '/app/import': 'import',
            '/app/templates': 'templates',
            '/app/customise': 'customise'
        };
        return h('div', [
            h('ul', links.map(function (href) {
                return h('li', h(
                    'a' + (state.path === href ? '.is-active' : ''),
                    {href: '#' + href},
                    titles[href]
                ))
            })),
            h('h1', titles[state.path])
        ])
    }


    document.addEventListener("DOMContentLoaded", function (event) {
        container = document.getElementById('container');
        header = h('div');

        rootNode = createElement(header);
        container.appendChild(rootNode);

        app = createElement(h('div'));
        container.appendChild(app);

        stateman.start();
    });


})();
