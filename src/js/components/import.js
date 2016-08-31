(function () {
  var constructor = function (services) {
    var h = require('virtual-dom/h')
    var paste = require('./import/paste')
    var upload = require('./import/upload')
    var dad = require('./import/dragAndDrop')
    var url = require('./import/url')
    var table = require('./table')(services)
    var hot = require('./hot')(services)
    var activeTab = services.data.getUrl() ? 'url' : services.data.get().length === 0 ? 'paste' : 'data'
    var mediator = services.mediator
    mediator.on('goToTable', goToTable)

    var tabOptions = {
      paste: {
        label: 'Paste CSV data',
        template: function () {
          return paste.template(services)
        }
      },
      data: {
        label: 'Enter CSV Data',
        template: function () {
          if (typeof Handsontable !== 'undefined') {
            // TODO: reference to HOT
            return hot.template(services)
          } else {
            return table.template(services)
          }
        },
        destroy: function () {
          if (typeof Handsontable !== 'undefined') {
            hot.destroy()
          } else {
            table.destroy()
          }
        }
      },
      upload: {
        label: 'Upload CSV file',
        template: function () {
          return h('div', [
            upload.template(services),
            dad.template(services)
          ])
        }
      },
      url: {
        label: 'Url to CSV file',
        template: function () {
          return url.template(services)
        }
      }
    }

    function tabLinks () {
      var links = ['paste', 'data', 'upload', 'url']
      return h('ul.vertical-tabs', links.map(function (id) {
        var className = activeTab === id ? 'active' : ''
        return h('li', {
          'className': className
        }, h('a', {
          'href': '#' + tabOptions[id].label,
          'ev-click': function (e) {
            load(id)
            e.preventDefault()
          }
        }, tabOptions[id].label))
      }))
    }

    function load (id) {
      if (tabOptions[activeTab].destroy) {
        tabOptions[activeTab].destroy()
      }
      activeTab = id
      mediator.trigger('treeUpdate')
    }

    function goToTable () {
      activeTab = 'data'
      mediator.trigger('treeUpdate')
    }

    function destroy () {
      mediator.off('goToTable', goToTable)
      if (tabOptions[activeTab]['destroy']) {
        tabOptions[activeTab]['destroy']()
      }
    }

    function template () {
      return h('div.vertical-tabs-container', [
        tabLinks(),
        h('div.vertical-tab-content-container',
          h('div.vertical-tab-content', tabOptions[activeTab].template())
        )
      ])
    }

    return {
      template: template,
      destroy: destroy
    }
  }

  module.exports = constructor
})()
