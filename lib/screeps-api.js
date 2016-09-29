const EventEmitter = require('events')
const request = require('request')
const SockJS = require('sockjs-client')
const {GCL_LEVELS, CONTROLLER_LEVELS} = require('./constants')

const SCREEPS_SOCKET = 'https://screeps.com/socket'
const SIGN_IN_URL = 'https://screeps.com/api/auth/signin'
const USER_ROOMS_URL = 'https://screeps.com/api/user/rooms?id='
const USER_INFO_URL = 'https://screeps.com/api/auth/me'
const CONSOLE_URL = 'https://screeps.com/api/user/console'

class Screeps extends EventEmitter {
  constructor (config) {
    super()

    this.username = config.username
    this.password = config.password
    this.socket = new SockJS(SCREEPS_SOCKET)

    this.socket.onopen = this.authenticate.bind(this)
    this.socket.onmessage = this.parseMessage.bind(this)

    this.poll()
  }

  poll () {
    if (this.user && this.user.token) {
      getUserInfo(this.username, this.user.token)
        .then((user) => {
          if (this.user.gcl !== user.gcl) {
            this.emit('gclProgress', this.getGCLProgress(user.gcl))
          }
          this.user = user
        })
    }
    setTimeout(this.poll.bind(this), 5000)
  }

  authenticate () {
    getAuthToken(this.username, this.password)
      .then((token) => getUserInfo(this.username, token))
      .then((user) => {
        this.emit('connected')
        this.socket.send(`auth ${user.token}`)
        this.emit('gclProgress', this.getGCLProgress(user.gcl))
        this.user = user
      })
      .catch((err) => this.emit('error', err))
  }

  parseMessage (event) {
    let message = event.data
    if (message.includes('auth ok')) {
      const id = this.user._id
      this.socket.send(`subscribe user:${id}/console`)
      this.socket.send(`subscribe user:${id}/cpu`)
      getRooms(id)
        .then(({rooms}) => {
          this.rooms = {}
          rooms.forEach((room) => {
            this.rooms[room] = []
            this.socket.send(`subscribe room:${room}`)
          })
        })
        .catch((err) => this.emit('error', err))
    }

    try {
      message = JSON.parse(message)
    } catch (err) {
      // it's just a string, no need to throw error
    }

    if (typeof message === 'object') {
      const [channel, data] = message

      if (channel.startsWith('room')) {
        this.emit('message', message)
      } else if (channel.startsWith('user')) {
        if (channel.endsWith('console')) {
          if (!data.messages) {
            this.emit('console', data)
          } else {
            data.messages.log.forEach((line) => this.emit('console', line))
            data.messages.results.forEach((result) => this.emit('result', result))
          }
        } else if (channel.endsWith('cpu')) {
          this.emit('cpu', data)
        }
      }
    }
  }

  getControllerProgress (controller) {
    if (!controller.level) return
    const level = CONTROLLER_LEVELS[controller.level]
    if (level.requiredEnergy) {
      return {
        progress: controller.progress,
        total: level.requiredEnergy
      }
    }
  }

  getGCLProgress (gcl) {
    let level = 0
    while (gcl > 0) {
      level++
      gcl -= GCL_LEVELS[level]
    }
    return {
      level,
      progress: GCL_LEVELS[level] + gcl,
      progressTotal: GCL_LEVELS[level]
    }
  }

  postToConsole (expression) {
    postConsole(this.user, expression)
      .catch((err) => console.log('error', err))
  }
}

const getAuthToken = (email, password) => new Promise((resolve, reject) => {
  const options = {
    url: SIGN_IN_URL,
    json: true,
    body: {email, password}
  }

  request.post(options, (err, res, body) => {
    if (err) return reject(err)
    return resolve(body.token)
  })
})

const postConsole = (user, expression) => new Promise((resolve, reject) => {
  const options = {
    url: CONSOLE_URL,
    json: true,
    body: {expression},
    headers: {
      'X-Token': user.token,
      'X-Username': user.token
    }
  }

  request.post(options, (err, res, body) => {
    if (err) return reject(err)
    return resolve(body.ok)
  })
})

const getUserInfo = (username, token) => new Promise((resolve, reject) => {
  const options = {
    url: USER_INFO_URL,
    json: true,
    headers: {
      'X-Token': token,
      'X-Username': username
    }
  }

  request.get(options, (err, res, body) => {
    if (err) return reject(err)
    body.token = res.headers['x-token'] || token
    return resolve(body)
  })
})

const getRooms = (userId) => new Promise((resolve, reject) => {
  request(`${USER_ROOMS_URL}${userId}`, (err, res, body) => {
    if (err) {
      return reject(err)
    }
    try {
      return resolve(JSON.parse(body))
    } catch (err) {
      return reject(err)
    }
  })
})

module.exports = Screeps
