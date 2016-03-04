var constructor = function (mediator, list) {
    var h = require('virtual-dom/h');
    var createElement = require('virtual-dom/create-element');
    var template = createElement(h('div'));

    function update(_list_) {
        list = _list_;
        template.innerHTML = '';
        if (list.length > 0) {
            var item = list.pop();
            template.appendChild(
                createElement(h('div.revisionElement', [
                    h('span', 'Data updated on ' + new Date(item.time).toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1") + '. '),
                    h('a',
                        {
                            'ev-click': function () {
                                mediator.trigger('backup.revert.last');
                            }
                        }
                        , 'Undo last update'
                    )]
                ))
            );
        }
    }


    mediator.on('backup.list.update', function (_list_) {
        update(_list_);
    });

    function toHHMMSS(string) {
        var sec_num = parseInt(string, 10); // don't forget the second param
        var hours = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        var time = hours + ':' + minutes + ':' + seconds;

        return time;
    }

    update(list);
    return {
        template: function () {
            return template;
        }
    };
};

module.exports = constructor;


