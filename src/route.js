var StateMan = require('stateman');
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
            var doc = document.getElementById('app');
            doc.innerHTML = '<div id="table"></div>';
            var dataImport = require('./components/import.js');
            dataImport.init();
        }
    }),
    "app.template":  cfg({
        enter: function( option ){
            var doc = document.getElementById('app');
            doc.innerHTML = 'template';
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