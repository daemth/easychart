(function(){
    var that = {};
    _ = require('lodash');
    var crel = require('crel');
    var templateTypes = require('../config/templates.json');
    var includeFolder = require('include-folder'),
        icons = includeFolder("./src/icons");
    that.load = function(element){
        element.innerHtml = '';
        var tabs = document.createElement('ul');
        var itemTemplate = _.template('<div><%= title %></div>');
        var typeTemplate = _.template('<h3><%= type %></h3>');
        _.forEach(templateTypes.types, function(type){
            var tab = document.createElement('li');

            var logo = document.createElement('div');
            logo.innerHTML = icons[type.icon];
            var svg = logo.querySelector('svg');
            svg.setAttribute("height", "50px");
            svg.setAttribute("width", "50px");

            tab.innerHTML = typeTemplate({type: type.type});
            var list = document.createElement('ul');
            _.forEach(type.presets, function(preset){
                var item = document.createElement('li');
                item.innerHTML = itemTemplate({title: preset.desc});
                list.appendChild(item);
            });
            tab.appendChild(logo);
            tab.appendChild(list);
            tabs.appendChild(tab);
        });
        element.appendChild(tabs);

    };
    module.exports = that;
})();