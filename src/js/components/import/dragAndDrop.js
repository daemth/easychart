(function () {
    var dragDrop = require('drag-drop');
    var dataService;
    var papa = require('papaparse');
    var h = require('virtual-dom/h');

    var that = {};
    that.template = function (services) {
        dataService = services.data;

        var Hook = function () {};
        Hook.prototype.hook = function (node) {
            dragDrop(node, function (files) {
                console.log('Here are the dropped files', files);

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
        };

        return h('div.file_drop', {
            'hook': new Hook()
        }, 'Drop your files here');
    };
    function saveData(value) {
        dataService.set(papa.parse(value).data);
    }

    module.exports = that;
})();
