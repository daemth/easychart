(function () {
    var dataService = require('../services/data.js');
    var papa = require('papaparse');
    var _ = require('lodash');
    var that = {};

    that.load = function (element) {
        var data = dataService.get();

        element.innerHTML = '<textarea></textarea>' +
            '<button id="import">import</button>' +
            '<button id="transpose">transpose</button>';

        element.querySelector("#import").addEventListener("click", function () {
            dataService.setRaw(papa.parse(element.firstChild.value).data);
        });

        element.querySelector("#transpose").addEventListener("click", function () {
            dataService.setRaw(_.unzip(dataService.getRaw()));
        });
    };

    module.exports = that;
})();



