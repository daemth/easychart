(function(){
    var StateMan = require('stateman');
    var templates = require('./components/templates.js');
    var dataImport = require('./components/import.js');
    var stateman = new StateMan({
        title: "EasyChart",
        strict: true
    });

    var config = {
        enter: function(option){
            console.log("enter: " + this.name + "; param: " + JSON.stringify(option.param))
        },
        leave: function(option){
            console.log("leave: " + this.name + "; param: " + JSON.stringify(option.param))
        },
        update: function(option){
            console.log("update: " + this.name + "; param: " + JSON.stringify(option.param))
        }
    };

    function cfg(o){
        o.enter = o.enter || config.enter;
        o.leave = o.leave || config.leave;
        o.update = o.update || config.update;
        return o;
    }

    stateman.state({
        "app": config,
        "app.import":  cfg({
            enter: function( option ){
                dataImport.load(document.getElementById('app'));
            },
            leave: function(){
                dataImport.destroy();
            }
        }),
        "app.templates":  cfg({
            enter: function( option ){
                var chart = require('./components/chart.js');
                var doc = document.getElementById('app');
                doc.innerHTML = '<div id="chart"></div><div id="templates"></div>';
                chart.load(doc.querySelector('#chart'));
                templates.load();
            }
        }),

        "app.customise":  cfg({
            enter: function( option ){
                var doc = document.getElementById('app');
                doc.innerHTML = 'customise';
            }
        })
    }).on("notfound", function(){
        this.go('app.import');
    });

    document.addEventListener("DOMContentLoaded", function(event) {
        stateman.start({});
    });

})();
