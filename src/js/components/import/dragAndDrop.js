(function () {
    var dragDrop = require('drag-drop');
    var dataService = require('../../services/data.js');
    var papa = require('papaparse');
    var _ = require('lodash');
    var h = require('virtual-dom/h');
    var createElement = require('virtual-dom/create-element');

    var that = {};
    that.load = function(element){
        var dropElement = createElement(h('div.file_drop',{},'Drop your files here'));

        dragDrop(dropElement, function (files) {
            console.log('Here are the dropped files', files)

            // `files` is an Array!
            files.forEach(function (file) {

                // convert the file to a Buffer that we can use!
                var reader = new FileReader();

                reader.addEventListener('load', function (e) {
                    saveData(reader.result)
                });
                reader.addEventListener('error', function (err) {
                    console.error('FileReader error' + err)
                });
                reader.readAsText(file);
            })
        });

        element.appendChild(dropElement);
    };
    function saveData(value) {
        dataService.set(papa.parse(value).data);
    }
    module.exports = that;
})();
