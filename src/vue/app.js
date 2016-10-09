var Vue = require('vue');

function constructor(opts) {
    var vm = new Vue({
        el: opts.element,
        template: require('./app.html'),
        components: {
            'chart': require('./components/chart/chart')
        }
    })
}

module.exports = constructor;
window.ec = constructor;