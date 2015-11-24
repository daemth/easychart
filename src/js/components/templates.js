(function(){
    var that = {};
    _ = require('lodash');
    var crel = require('crel');
    var templateTypes = require('../config/templates.json');
    var config = require('../services/config');
    var includeFolder = require('include-folder'),
        icons = includeFolder("./src/icons");
    that.load = function(element){
        element.innerHtml = '';
        var tabs = document.createElement('ul');
        var itemTemplate = _.template('<button><%= title %></button>');
        var typeTemplate = _.template('<h3><%= type %></h3>');
        _.forEach(templateTypes, function(type){
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
                item.innerHTML = itemTemplate({title: preset.title});
                item.onclick = function(){
                    config.setPreset(type.id, preset.id)
                };
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