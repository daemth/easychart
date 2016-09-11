(function () {
    var dragDrop = require('drag-drop');
    var dataService;
    var h = require('virtual-dom/h');
    var that = {};
    that.template = function (services) {
        dataService = services.data;
        var mediator = services.mediator;
        var Hook = function () {};
        var content = 'Drop your CSV file here';
        Hook.prototype.hook = function (node) {
            dragDrop(node, function (files) {
                // `files` is an Array!
                files.forEach(function (file) {
                    // convert the file to a Buffer that we can use!
                    var reader = new FileReader();
                    reader.addEventListener('loadstart', function (e) {
                        node.innerHTML = '<div class="loader"></div>'
                        e.preventDefault();
                    });
                    reader.addEventListener('load', function (e) {
                        saveData(reader.result);
                        node.innerHTML = 'Drop your files here';
                        mediator.trigger('goToTable');
                        e.preventDefault();
                    });

                    reader.addEventListener('error', function (err) {
                        console.error('FileReader error' + err);
                        err.preventDefault();
                    });
                    reader.readAsText(file);
                })
            });
        };

        return h('div.file_drop', {
            'hook': new Hook()
        }, content);
    };

    function saveData(value) {
        dataService.setCSV(value);
    }

    module.exports = that;
})();
