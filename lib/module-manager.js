const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const {post} = require('request')
const {watch} = require('chokidar')
const {transformFileSync} = require('babel-core')

const isJS = file => /\.js$/.test(file)

class ModuleManager extends EventEmitter {
  constructor(config) {
    super()

    this.config = config
    this.sourceDir = path.resolve(__dirname, '..', 'src')
    this.modules = this.transformModules(
      path.resolve(__dirname, '..', 'src')
    )

    const watcher = watch(this.sourceDir)

    watcher.on('ready', () => {
      watcher.on('all', (event, filePath) => {
        if (isJS(filePath)) {
          this.emit('change', filePath.replace(this.sourceDir, '').slice(1))
          const module = this.transformModule(filePath)
          this.modules[module.name] = module.code
          this.upload(filePath)
        }
      })
    })
  }

  getModuleName (file, prefix) {
    if (file.includes('index')) {
      return prefix
    } else {
      return ((prefix) ? `${prefix}.` : '') + file.slice(0, -3)
    }
  }

  transformModule(filePath) {
    const file = filePath.replace(this.sourceDir, '').slice(1)
    const prefix = path.dirname(file).replace('/', '.')
    const moduleName = this.getModuleName(
      path.basename(file),
      (prefix === '.') ? '' : prefix
    )

    return {
      name: moduleName,
      code: transformFileSync(filePath).code
    }
  }

  transformModules (dir) {
    let modules = {}

    fs.readdirSync(dir)
      .forEach(file => {
        const filePath = path.resolve(dir, file)
        const stat = fs.lstatSync(filePath)

        if (stat.isDirectory()) {
          modules = Object.assign(modules, this.transformModules(filePath, file))
        } else if (isJS(file)) {
          const module = this.transformModule(filePath)
          modules[module.name] = module.code
        }
      })

    return modules
  }

  upload(filePath) {
    const {username, password, branch, ptr} = this.config
    const modules = this.modules
    const url = `https://screeps.com${(ptr ? '/ptr' : '')}/api/user/code`
    const options = {
      url,
      json: true,
      auth: {username, password},
      body: {branch, modules}
    }
    const responseHandler = (err, res, body) => {
      if (err || body.error) {
        this.emit('error', err || body.error)
      } else {
        this.emit('upload')
      }
    }

    post(options, responseHandler)
  }
}

module.exports = ModuleManager
