const Dashboard = require('./lib/dashboard')
const Screeps = require('./lib/screeps-api')
const ModuleManager = require('./lib/module-manager')

module.exports = (config = {}) => {
  config = Object.assign({
    username: process.env.SCREEPS_USERNAME,
    password: process.env.SCREEPS_PASSWORD,
    branch: process.env.SCREEPS_BRANCH || 'default',
    ptr: process.env.SCREEPS_PTR || false,
    src: process.env.SCREEPS_SOURCE || process.cwd()
  }, config)

  const dashboard = new Dashboard()
  const screeps = new Screeps(config)
  const modules = new ModuleManager(config)

  dashboard.console.log('{#666-fg}> Connecting to screeps...{/}')

  dashboard.on('console', (data) => {
    if (data === 'quit') {
      process.exit(0)
    } else {
      screeps.postToConsole(data)
    }
  })

  dashboard.on('quit', () => {
    process.exit(0)
  })

  screeps.on('connected', () => {
    dashboard.console.log('{#666-fg}> Authentication successful!{/}')
    dashboard.console.log('{#666-fg}> Type "quit" to exit.{/}')
  })

  screeps.on('result', (result) => {
    if (result !== 'undefined') {
      dashboard.log(`{#ccc-fg}< ${result}{/}`)
    }
  })

  screeps.on('console', (line) => {
    const time = (new Date()).toTimeString().slice(0, 8)
    if (line.error) {
      const error = line.error.split('\n').map((line, index) => {
        if (index > 0) {
          line = ' '.repeat(11) + line
        }
        return line
      }).join('\n')
      dashboard.log(`{#92676e-fg}[${time}]{/} {#e79da7-fg}${error}{/}`)
    } else {
      dashboard.log(`{#999-fg}[${time}]{/} {#ccc-fg}${line}{/}`)
    }
  })

  screeps.on('cpu', ({cpu, memory}) => {
    const cpuUsage = Math.floor(cpu / screeps.user.cpu * 100)
    const memoryUsage = Math.floor(memory / 2097152 * 100)
    if (cpuUsage >= 66) {
      dashboard.cpuStatus.style.bar.bg = 'red'
    } else if (cpuUsage > 33 && cpuUsage < 66) {
      dashboard.cpuStatus.style.bar.bg = 'yellow'
    } else {
      dashboard.cpuStatus.style.bar.bg = 'green'
    }
    dashboard.cpuStatusText.setContent(`{green-fg}CPU:{/}{|}${cpu}/${screeps.user.cpu}`)
    dashboard.cpuStatus.setProgress(cpuUsage)
    dashboard.memoryStatusText.setContent(`{green-fg}Memory:{/}{|}${Math.round(memory / 1024)} / 2048 KB{/center}`)
    dashboard.memoryStatus.setProgress(memoryUsage)
    dashboard.screen.render()
  })

  screeps.on('gclProgress', (gcl) => {
    const progress = Math.round(gcl.progress / gcl.progressTotal * 100)
    dashboard.gclStatusText.setContent(`{green-fg}GCL ${gcl.level}:{/}{|}${progress}%`)
    dashboard.gclStatus.setProgress(progress)
  })

  modules.on('change', (file) => {
    dashboard.console.log('{grey-fg}ModuleManager:{/} Transforming ${file}...')
  })

  modules.on('change', (file) => {
    dashboard.console.log('{grey-fg}ModuleManager:{/} Upload successful!')
  })

  modules.on('error', (err) => {
    dashboard.console.log('Module manager encountered an error!')
    dashboard.console.log(err)
  })
}
