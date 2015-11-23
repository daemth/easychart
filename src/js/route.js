(function(){
    var StateMan = require('stateman');
    var templates = require('./components/templates.js');
    var table = require('./components/table.js');
    var chart = require('./components/chart.js');
    var dataImport = require('./components/import.js');
    var customise = require('./components/customise.js');
    var stateman = new StateMan({
        title: "Easychart",
        strict: true
    });
    var app;

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
                app.innerHTML = '<div id="input"></div><div id="table"></div>';
                var importElement = app.querySelector('#input');
                dataImport.load(importElement);
                var tableElement = app.querySelector('#table');
                table.load(tableElement);
            },
            leave: function(){
                table.destroy();
            }
        }),

        "app.templates":  cfg({
            enter: function( option ){
                app.innerHTML = '<div id="chart"></div><div id="templates"></div>';
                chart.load(app.querySelector('#chart'));
                templates.load(app.querySelector('#templates'));
            }
        }),

        "app.customise":  cfg({
            enter: function( option ){
                app.innerHTML = '<div id="chart"></div><div id="form"></div>';
                chart.load(app.querySelector('#chart'));
                customise.load(app.querySelector('#form'));
            }
        })
    }).on("notfound", function(){
        this.go('app.import');
    });

    document.addEventListener("DOMContentLoaded", function(event) {
        app = document.getElementById('app');
        stateman.start({});
    });

})();
