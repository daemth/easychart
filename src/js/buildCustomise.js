var tabs = require('./config/customise.json');
var properties = require('./config/dump.json');
var _ = require('lodash');
var fs = require('fs');

var data = _.map(tabs, function (tab) {
    tab.pane = _.map(tab.panes, function(pane){
        pane.options = _.map(pane.options, function(item){
            item.property = _.find(properties, function (record) {
                return record.fullname.toLowerCase() == item.name.toLowerCase();
            });
            return item;
        });
        return pane;
    });
    return tab
});

var outputFilename = './src/js/config/options.json';

fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("JSON saved to " + outputFilename);
    }
});