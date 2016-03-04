function constructor(mediator) {
    var undoAmount = 5;
    var backup = [];
    var _ = {
        cloneDeep: require('lodash.clonedeep')
    };

    mediator.on('backup',function(value){
        backup.push({
            time: Date.now(),
            value: value
        });
        mediator.trigger('backup.list.update', getList());
        if (backup.length > undoAmount){
            backup.shift();
        }
    });

    mediator.on('backup.revert.last',function(value){
        revertLastChange();
    });

    function revertLastChange(){
        var slice = backup.pop();
        if(slice){
            mediator.trigger('backup.revert', slice.value);
            mediator.trigger('backup.list.update', getList());
        }
    }

    function getList(){
        return _.cloneDeep(backup);
    }

    return {
        revertLastChange: revertLastChange,
        getList: getList
    }
}

module.exports = constructor;