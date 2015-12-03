(function () {
    var h = require('virtual-dom/h');
    var createElement = require('virtual-dom/create-element');
    var paste = require('./import/paste');
    var upload = require('./import/upload');
    var dad = require('./import/dragAndDrop');
    var that = {};
    that.load = function (element, services) {
        var container = createElement(h('div.accordion-tabs-minimal'));
        element.appendChild(container);
        var activeTab = 'upload';
        var tabs = h('div');
        var tabsOptions = {
            paste:{
                label: 'Paste CSV',
                content: function(element){
                    paste.load(element, services);
                }
            },
            upload:{
                label: 'upload CSV',
                content: function(element){
                    upload.load(element, services);
                    dad.load(element, services);
                }
            }
        };

        function goToTab(tab) {
            container.innerHTML = '';
            activeTab = tab;
            container.appendChild(createElement(template(tab)));
            var content = createElement(h('div.tab-content'));
            tabsOptions[tab].content(content);
            container.appendChild(content);
        }

        function template(activeTab) {
            var links = ['paste', 'upload'];
            return h('ul.tab-list', links.map(function (id) {
                    var className = activeTab === id ? 'is-active' : '';
                    return h('li.tab-link', {
                        'className': className,
                        'ev-click': function () {
                            goToTab(id);
                        }
                    }, tabsOptions[id].label)
                }))
        }
        goToTab('upload')
    };

    module.exports = that;
})();



