var _ = {
    forEach: require('lodash.foreach')
};

function constructor(opts, services) {

    if(typeof opts.data !== 'undefined'){
        services.data.set(opts.data);
    }
    if(typeof opts.dataCSV !== 'undefined'){
        services.data.setCSV(opts.dataCSV);
    }
    if(typeof opts.dataUrl !== 'undefined'){
        services.data.setUrl(opts.dataUrl);
    }
    if(typeof opts.options !== 'undefined'){
        services.options.set(opts.options);
    }
    if(typeof opts.optionsUrl !== 'undefined'){
        services.options.setUrl(opts.optionsUrl);
    }
    if(typeof opts.templates !== 'undefined'){
        services.templates.set(opts.templates);
    }
    if(typeof opts.config !== 'undefined'){
        services.config.set(opts.config);
    }
    if(typeof opts.preset !== 'undefined'){
        services.config.setPreset(opts.preset);
    }
    if(typeof opts.events !== 'undefined'){
        _.forEach(opts.events, function(callback, event){
            services.mediator.on(event, function (data) {
                callback(data);
            });
        });
    }

}

module.exports = constructor;
