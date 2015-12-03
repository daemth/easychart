(function () {
    var h = require('virtual-dom/h');
    var _ = require('lodash');
    var iconLoader = require('../utility/iconLoader');
    var logo = iconLoader.get('logo');
    logo.properties.height = '50px';
    module.exports = h('div.logo',[logo]);
})();
