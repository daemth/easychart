(function () {
    /**
     * Service for setting and getting the customisable options list for the customise page.
     * @param mediator
     * @returns {{}}
     */
    var constructor = function (mediator){
        var options = require('../config/options.json');
        var configUrl;
        var that = {};

        var xhr = require("xhr");
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
                xhr.get(url, function(err, resp){
                    if (resp.statusCode === 200) {
                        options = JSON.parse(resp.body);
                        configUrl = url;
                        mediator.trigger('configUpdate', that.get());
                    }
                });
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
