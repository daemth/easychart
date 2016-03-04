(function () {
    var h = require('virtual-dom/h');
    var that = {};
    that.template = function (services) {
        var dataService = services.data;
        var mediator = services.mediator;
        var uploadElement;
        // Check for the various File API support.
        if (window.FileReader) {
            uploadElement =
                h('input.soft--ends', {
                    type: 'file',
                    "size": 50,
                    onchange: function(e){
                        loadFile(e);
                    }
                }, 'upload');
        }

        function loadFile(e) {
            var file = e.target.files[0];
            var reader  = new FileReader();
            reader.onloadend = function () {
                saveData(reader.result)
            };
            if (file) {
                reader.readAsText(file);
            }
        }

        function saveData(value) {
            dataService.setCSV(value);
            mediator.trigger('goToTable');
        }

        return uploadElement;
    };

    module.exports = that;
})();