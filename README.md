# screeps-remote

Write your screeps in ES6 and any editor with automatic uploading.

![](https://i.imgur.com/Lrsu31K.png)

## Features

- Remote CLI console with console input history, GCL, CPU and Memory status
- Automatic babel transform and upload
- [Organize](#organize-with-folders) your code with folders

## Example

An example of an "out of the box" script repository using `screeps-remote` is available here:

https://github.com/troygoode/screeps-remote-example

## Manual Setup

Install the package as a devDependency:

```bash
~/my-screep-scripts $ npm install -D screeps-remote
```

Add a file (example: `remote.js`) to your project that will be responsible for launching the `screeps-remote` dashboard:

```javascript
const path = require('path')
const remote = require('screeps-remote')

remote({
  // required
  username: 'janedoe@example.com', // MUST change (or use the SCREEPS_USERNAME envvar)
  password: 'password', // MUST change (or use the SCREEPS_PASSWORD envvar)

  // optional
  src: path.resolve(__dirname, './src'), // defaults to the working directory if not specified (or use the SCREEPS_SOURCE envvar)
  branch: 'default', // defaults to "default" if not provided (or use the SCREEPS_BRANCH envvar)
  ptr: false // defaults to `false` if not provided (or use the SCREEPS_PTR envvar)
})
```

Now add that file to your `package.json` as a script:

```json
{
  "name": "my-screep-scripts",
  "version": "1.0.0",
  "private": true,
  "devDependencies": {
    "screep-remote": "^1.0.0"
  },
  "scripts": {
    "remote": "node remote.js"
  }
}
```

Finally, launch the dashboard from your shell:

```bash
~/my-screep-scripts $ npm run remote
```

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
