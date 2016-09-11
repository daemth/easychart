(function () {
    var h = require('virtual-dom/h');
    var iconLoader = require('../factories/iconLoader');
    var logo = iconLoader.get('logo');
    module.exports = h('div.logo',[logo]);
})();
