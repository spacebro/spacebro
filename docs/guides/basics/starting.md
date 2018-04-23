# Our first Spacebro application

Now that we are [set up](./setup.md) we can create our first Spacebro
application. We will write a NodeJS app here and write for the browser in a next chapter.
Let's write an app called `sepiabro` that will add a sepia effect to an image.
First, let's create a new folder for all our examples to run in.

```
mkdir sepiabro
cd sepiabro
```

Since we will create a NodeJS application, we need a
default [package.json](https://docs.npmjs.com/files/package.json) using
`npm`:

```
npm init --yes
```

## Installing spacebro-client

Spacebro-client can be installed like any other Node module by installing the
[spacebro-client](https://www.npmjs.com/package/spacebro/spacebro-client)
package through [npm](https://www.npmjs.com). The same package can also
be used with a module loader like Browserify or Webpack and React
Native.

```
npm install spacebro-client --save
```

## Your first app

The base of any Spacebro application is the *spacebro-client
object* which is basically a socket.io-client
connection with a few more params.

Remember that Spacebro is about making connections between apps: to do
so, it needs a name for your app and the name of its inputs and
outputs. Inputs are the messages the app will react to, and outputs are
the messages it will send.

Our app is called `sepiabro`.
It will receive a picture with the message `inMedia` and send the generated
image with the message `outMedia`.
Let's throw this in a few lines in a `app.js` file.

```js
const { SpacebroClient } = require('spacebro-client')

const client = new SpacebroClient({
  host: 'localhost',
  port: 36000,
  channelName: 'media-stream',
  client: {
    name: 'sepiabro',
    description: 'a tool to add a sepia effect to image',
    in: {
      inMedia: {
        eventName: 'inMedia',
        description: 'Input image',
        type: 'all'
      }
    },
    out: {
      outMedia: {
        eventName: 'outMedia',
        description: 'Output image with sepia effect',
        type: 'all'
      }
    }
  }
})
```

The client is now connected. Now let's add the logic, we need to listen on `inMedia`, download the
image to add the sepia effect and send the new picture.
We will use the two main methods of spacebroClient:

* `on('message', function)` to listen to incoming messages
* `emit('message', {data})` to emit messages

```js
const gm = require('gm').subClass({imageMagick: true})
const download = require('download')
const express = require('express')
const path = require('path')
const mkdirp = require('mkdirp')

// create folder to store input and output files
let outputFolder = '/tmp/output'
let tmpFolder = '/tmp/'

let host = process.env.HOST || 'localhost'
let port = process.env.PORT || 8080

spacebroClient.on('inMedia', media => {
  download(media.url, tmpFolder).then(() => {
    let image = path.join(tmpFolder, path.basename(media.url))
    let outImage = path.join(outputFolder, path.basename(media.url))
    gm(image)
    .sepia()
    .write(outImage, function (err) {
      if (!err) {
        let outMedia = {
          url: `http://$host:$port/${path.basename(outImage)}`
        }
        spacebroClient.emit('outMedia', outMedia)
        console.log('emit ' + JSON.stringify(outMedia, null, 2))
      } else console.log(err)
    })
  })
})

var app = express()
app.use(express.static(outputFolder))
app.listen(port)
```

You can now run the app with `node app.js`.  
OK it is running now! But we need to feed it with an image to test it!

Let's use chokibro to send images added in a folder.

Open a new terminal to install and run chokibro

```
mkdir /tmp/pictures
git clone https://github.com/soixantecircuits/chokibro
cd chokibro
nvm use
npm i
node index.js --service.spacebro.host localhost --service.spacebro.port
36000 --folder /tmp/pictures --service.spacebro.connection "chokibro/outMedia=>sepiabro/inMedia"
```

Notice the last argument where we connect chokibro to sepia bro.

Now add an image in the watched folder:

```
cd /tmp/pictures
wget
https://www.nasa.gov/sites/default/files/styles/full_width_feature/public/archives_ngc6946.jpg
```

And you should see in the sepiabro log

```js
{ url : 'http://localhost:8080/archives_ngc6946.jpg'}
```

Open that link in a browser, and 🎉 see the galaxy in sepia

> __Pro tip:__ Notice the image address is in the url property of data,
> this complies with [standard
> media](https://github.com/soixantecircuits/standard/blob/master/media.json).

> __Pro tip:__ You like standards? You can use spacebro-client with [standard-settings](https://github.com/soixantecircuits/standard-settings) to put all a settings away from your code, and reduce the number of lines. Check the [blurrybro](https://github.com/spacebro/blurrybro/blob/master/index.js) example to learn how to use it.

## What's next?

In this chapter we created our first Spacebro application that receives
a media and emits one.  
Want an exercice? Try to write an app with many inputs and outputs.  
Want to see an production app that uses spacebro? Check
[etna](https://github.com/soixantecircuits/etna)

