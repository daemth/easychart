var constructor = function (services) {
    var h = require('virtual-dom/h');
    function template(){
        return h('button', {
            'ev-click':  function(){
                services.revision.revertLastChange();
            }
        }, 'undo')
    }

    return {
        template: template
    }
};

module.exports = constructor;
