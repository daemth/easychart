(function () {
    var h = require('virtual-dom/h');
    var createElement = require('virtual-dom/create-element');
    var paste = require('./import/paste');
    var upload = require('./import/upload');
    var dad = require('./import/dragAndDrop');
    var that = {};
    that.load = function (element) {
        var pasteElement = createElement(h('div'));
        element.appendChild(pasteElement);
        paste.load(pasteElement);

        var uploadElement = createElement(h('div'));
        element.appendChild(uploadElement);
        upload.load(uploadElement);

        var ddElement = createElement(h('div'));
        element.appendChild(ddElement);
        dad.load(ddElement);
    };

    module.exports = that;
})();



