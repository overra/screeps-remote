# screeps-remote

Write your screeps in ES6 and any editor with automatic uploading.

![](https://i.imgur.com/Lrsu31K.png)

## Features

- Remote CLI console with console input history, GCL, CPU and Memory status
- Automatic babel transform and upload
- [Organize](#organize-with-folders) your code with folders

## Setup

- `git clone https://github.com/overra/screeps-remote.git`
- Rename sample.config.json -> config.json
- Create a new screeps branch in game by duplicating another
- Use the name of the new screeps branch in config.json
- The main world and PTR world have separate username and password so if `ptr` is set to `true` make sure the PTR account has a username and password set.
- Install devDependencies `npm install`
- Run `npm start` and start writing your screeps!

## Organize with folders

Example directory structure

```
src/
  main.js
  roles/
      harvester.js
      ...
  controllers/
      room.js
      ...
```

Use `require('roles.harvester')` instead of `require('roles/harvester')`
