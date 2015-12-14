(function () {
    var constructor = function(services){
        var h = require('virtual-dom/h');
        var paste = require('./import/paste');
        var upload = require('./import/upload');
        var dad = require('./import/dragAndDrop');
        var url = require('./import/url');
        var table = require('./table')(services);
        var activeTab = 'paste';
        var mediator = services.mediator;

        mediator.on('goToTable', goToTable);

        var tabOptions = {
            paste:{
                label: 'Paste CSV',
                template: function(){
                    return paste.template(services);
                }
            },
            upload:{
                label: 'upload CSV',
                template: function(){
                    return h('div', [
                        upload.template(services),
                        dad.template(services)
                    ]);
                }
            },
            url:{
                label: 'url CSV',
                template: function(){
                    return url.template(services);
                }
            },
            data:{
                label: 'Data table',
                template: function(){
                    return table.template(services);
                },
                destroy: table.destroy
            }
        };

        function tabLinks() {
            var links = ['paste', 'upload', 'url', 'data'];
            return h('ul.tab-list', links.map(function (id) {
                var className = activeTab === id ? 'is-active' : '';
                return h('li.tab-link', {
                    'className': className,
                    'ev-click': function () {
                        activeTab = id;
                        mediator.trigger('treeUpdate');
                    }
                }, tabOptions[id].label)
            }))
        }

        function goToTable(){
            activeTab = 'data';
            mediator.trigger('treeUpdate');
        }

        function destroy(){
            mediator.off('goToTable', goToTable);
            if(tabOptions[activeTab]['destroy']){
                tabOptions[activeTab]['destroy']();
            }
        }

        function template (){
            return h('div.accordion-tabs-minimal', [
                tabLinks(),
                h('div.tab-content', tabOptions[activeTab].template())
            ]);
        }

        return {
            template: template,
            destroy: destroy
        };
    };


    module.exports = constructor;
})();



