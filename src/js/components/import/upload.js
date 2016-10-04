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
                h('input', {
                    style: {
                        padding: "20px 0px"
                    },
                    type: 'file',
                    'size': 50,
                    onchange: function(e){
                        loadFile(e);
                        e.preventDefault();
                    }
                }, 'upload');
        }

        function loadFile(e) {
            var file = e.target.files[0];
            var reader  = new FileReader();
            reader.onloadend = function (e) {
                saveData(reader.result);
                e.preventDefault();
            };
            if (file) {
                reader.readAsText(file);
            }
            e.preventDefault();
        }

        function saveData(value) {
            dataService.setCSV(value);
            mediator.trigger('goToTable');
        }

        return uploadElement;
    };

    module.exports = that;
})();