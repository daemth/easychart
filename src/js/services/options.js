(function () {
    var constructor = function (mediator){
        var options = require('../config/options.json');
        var configUrl;
        var that = {};
        var _ = {
            cloneDeep: require('lodash.clonedeep')
        };
        that.get = function(){
            return _.cloneDeep(options);
        };

        that.set = function(_options_){
            options = _.cloneDeep(_options_);
        };

        that.setUrl = function(url){
            if(url !== ''){
                var client = new XMLHttpRequest();
                client.open("GET", url);
                client.onreadystatechange = handler;
                //client.responseType = "text";
                client.setRequestHeader("Accept", "application/json");
                client.send();

                function handler() {
                    if (this.readyState === this.DONE) {
                        if (this.status === 200) {
                            options = JSON.parse(this.response);
                            configUrl = url;
                            mediator.trigger('configUpdate', that.get());
                        }

                        else { reject(this); }
                    }
                }
            } else {
                configUrl = undefined;
            }
        };

        that.getUrl = function(){
            return _.cloneDeep(configUrl);
        };

        return that;
    };
    module.exports = constructor;
})();
