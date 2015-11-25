(function () {
    var config = require('../config/config.json');
    var h = require('virtual-dom/h');
    var template =
        h('div', [
            h('p', 'Pretty sweet, isn\'t it?'),
            h('p', 'Here, let me give some examples or something.')
        ]);

    module.exports = template;
})();