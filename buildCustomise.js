var guiConfig = require('./src/js/config/customise.json');
var highchartsOptionsDump = require('./src/js/config/dump.json');
var _ = {
    isUndefined: require('lodash.isundefined'),
    find: require('lodash.find'),
    map: require('lodash.map'),
    filter: require('lodash.filter')
};
var fs = require('fs');

var data = _.map(guiConfig, function (panel) {
    panel.panes = panesMap(panel.panes);
    return panel;
});

function panesMap(panes){
    return _.map(panes, function(pane){
        if(pane.fullname){
            pane.data = _.find(highchartsOptionsDump, function (record) {
                return record.fullname.toLowerCase() == pane.fullname.toLowerCase();
            });
        }
        pane.options = optionsMap(pane.options);
        if(pane.panes){
            pane.panes = panesMap(pane.panes);
        }
        pane.options = _.filter(pane.options,function(option){return !_.isUndefined(option) });
        return pane;
    });
}
function optionsMap(options){
    return _.map(options, function(item){
        var _item_ = _.find(highchartsOptionsDump, function (record) {
            return record.fullname.toLowerCase() == item.fullname.toLowerCase();
        });
        if(_item_ && !_.isUndefined(item.title)){_item_.title = item.title;}
        if(_item_ && !_.isUndefined(item.defaults)){_item_.defaults = item.defaults;}
        if(_item_ && !_.isUndefined(item.options)){_item_.options = optionsMap(item.options)}
        return _item_;
    });
}

var outputFilename = './src/js/config/options.json';

fs.writeFile(outputFilename, JSON.stringify(data, null, 4), function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("JSON saved to " + outputFilename);
    }
});