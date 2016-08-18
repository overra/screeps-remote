const EventEmitter = require('events')
const blessed = require('blessed')

class Dashboard extends EventEmitter {
  constructor() {
    super()

    const screen = this.screen = blessed.screen({
      title: 'screeps-remote',
      smartCSR: true,
      fullUnicode: true,
      autoPadding: true
    })

    this.layoutConsole()
    this.layoutStatus()
    this.history = []
    this.historyIndex = 0

    screen.key(['escape', 'q', 'C-c'], function() {
      process.exit(0)
    })

    screen.render()
  }

  log(message) {
    this.console.log(message)
  }

  layoutConsole() {
    const consoleContainer = blessed.box({
      label: ' Console ',
      padding: 1,
      width: '75%',
      height: '100%',
      left: '0%',
      top: '0%',
      border: {
        type: 'line',
        fg: '#666'
      }
    })

    this.console = blessed.log({
      parent: consoleContainer,
      tags: true,
      width: '100%-5',
      height: '100%-5',
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        inverse: true
      },
      style: {
        scrollbar: {
          bg: '#222'
        }
      },
      keys: true,
      vi: true,
      mouse: true
    })

    blessed.Line({
      parent: consoleContainer,
      type: 'line',
      orientation: 'horizontal',
      top: '100%-5',
      left: -1,
      width: '100%-2',
      style: {
        fg: '#666'
      }
    })

    blessed.Text({
      parent: consoleContainer,
      top: '100%-4',
      height: 1,
      width: 2,
      content: '>'
    })

    this.consoleInput = blessed.Textbox({
      parent: consoleContainer,
      height: 1,
      left: 2,
      top: '100%-4',
      style: {
        fg: '#ccc'
      },
      clickable: true,
      keys: true,
      inputOnFocus: true
    })

    this.consoleInput.on('keypress', (err, key) => {
      if (this.historyIndex < 0) {
        this.historyIndex = 0
      }
      if (key.name === 'up') {
        if (this.history.length > 0) {
          const expression = this.history[this.history.length - (1 + this.historyIndex)]
          if (expression) {
            this.consoleInput.setValue(expression)
            this.historyIndex++
            this.screen.render()
          }
        }
      } else if (key.name === 'down') {
        const expression = this.history[this.history.length - (this.historyIndex - 1)]
        if (expression) {
          this.consoleInput.setValue(expression)
          this.historyIndex--
          this.screen.render()
        } else {
          this.consoleInput.setValue('')
          this.historyIndex--
          this.screen.render()
        }
      }
    })
    this.consoleInput.on('submit', (data) => {
      this.console.log(`{#82a1d6-fg}> ${data}{/}`)
      this.emit('console', data)
      this.history.push(data)
      this.consoleInput.setValue('')
      this.consoleInput.focus()
    })

    this.screen.append(consoleContainer)
    // this.consoleInput.focus()
  }

  layoutStatus() {
    const statusContainer = blessed.box({
      label: ' Status ',
      padding: 1,
      width: '25%',
      height: 15,
      left: '75%',
      top: '0%',
      border: {
        type: 'line',
        fg: '#666'
      },
      // draggable: true
    })

    this.gclStatusText = blessed.text({
      parent: statusContainer,
      top: 0,
      tags: true
    })

    this.gclStatus = blessed.ProgressBar({
      parent: statusContainer,
      height: 1,
      top: 2,
      orientation: 'horizontal',
      style: {
        bg: '#222',
        bar: {
          bg: 'green'
        }
      }
    })


    this.cpuStatusText = blessed.text({
      parent: statusContainer,
      top: 4,
      tags: true
    })

    this.cpuStatus = blessed.ProgressBar({
      parent: statusContainer,
      height: 1,
      top: 6,
      orientation: 'horizontal',
      style: {
        bg: '#222',
        bar: {
          bg: 'green'
        }
      }
    })


    this.memoryStatusText = blessed.text({
      parent: statusContainer,
      top: 8,
      tags: true
    })

    this.memoryStatus = blessed.ProgressBar({
      parent: statusContainer,
      height: 1,
      top: 10,
      orientation: 'horizontal',
      style: {
        bg: '#222',
        bar: {
          bg: 'green'
        }
      }
    })

    this.screen.append(statusContainer)
  }
}

module.exports = Dashboard
