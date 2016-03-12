(function () {
    var constructor = function (services) {
        var optionsService = services.options;
        var mediator = services.mediator;
        var configService = services.config;
        var genericTabs = require('./configure/genericTabs')(services);
        var seriesTabs = require('./configure/seriesTabs')(services);
        var axisTabs = require('./configure/axisTabs')(services);
        var config = configService.get();
        var options = optionsService.get();
        var context = 'configUpdate';
        var _ = {
            isUndefined: require('lodash.isundefined'),
            find: require('lodash.find'),
            map: require('lodash.map'),
            cloneDeep: require('lodash.clonedeep'),
            remove: require('lodash.remove'),
            forEach: require('lodash.foreach'),
            first: require('lodash.first')
        };
        var h = require('virtual-dom/h');
        var tabs;
        var activeTab = _.first(options).id;
        var activeTabChild;

        // when any config is updated we just re diff the ui -> e.g series labels

        mediator.on('configUpdate', function (_config_) {
            config = _config_;
            mediator.trigger('treeUpdate');
        }, context);

        function template() {

            var tabs = h('ul', {className: "vertical-tabs"},
                [
                    genericTabs.tabs(options, setActive, activeTab),
                    axisTabs.tabs(typeConfig(options, 'axis'), setActive, activeTab, activeTabChild, config),
                    seriesTabs.tabs(typeConfig(options, 'series'), setActive, activeTab, activeTabChild, config)
                ]);

            var content = h('div.vertical-tab-content-container', [
                generateContent(options, activeTab, activeTabChild)
            ]);

            return h('div', {className: 'vertical-tabs-container'}, [tabs, content]);
        }

        function typeConfig(options, type) {
            return _.find(options, function (item) {
                return item.id == type;
            })
        }

        function generateContent(panels, activeId, activeChildId) {
            var activePanel = _.find(panels, function (panel) {
                return panel.id == activeId;
            });
            var content;
            switch (activePanel.id) {
                case 'series':
                    content = seriesTabs.content(activePanel, activeChildId, config);
                    break;
                case 'axis':
                    content = axisTabs.content(activePanel, activeChildId, config, setActive);
                    break;
                default:
                    content = genericTabs.content(activePanel);
            }
            return content;
        }

        function setActive(id, child) {
            activeTab = id;
            activeTabChild = _.isUndefined(child) ? 0 : child;
            mediator.trigger('treeUpdate');
        }

        function destroy() {
            mediator.off(null, null, context);
        }
        return {
            template: template,
            destroy: destroy
        };
    };

    module.exports = constructor;
})();