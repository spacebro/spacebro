# Setting up

In this section we will go over installing spacebro and connecting
spacebro clients.

## Prerequisites

Spacebro and most existing spacebro clients work on [NodeJS](https://nodejs.org/en/)
v6.10.3 and up. On MacOS and other Unix systems the [Node Version
Manager](https://github.com/creationix/nvm) is a good way to quickly
install the latest version of NodeJS and keep up it up to date.

After successful installation, the `node` and `npm` commands should be
available on the terminal and show something similar when running the
following commands:

```
$ node --version
v6.10.3
```

```
$ npm --version
3.10.10
```

Spacebro client does work in the browser. The
examples used in this guide will however might only work in the most recent
versions of Chrome, Firefox, Safari and Edge.

## Installation

Install globally spacebro on your machine

```
npm i -g spacebro
```

## Run

```
spacebro --hidedashboard
```

Now spacebro is running on your local machine.  
Let's reveal its power by running two clients.

## Run two clients

Spacebro is made to connect clients together. To showcase its usage, we
will run two clients and connect them.

Let's say we want to apply a blur filter to every image that is written
in a local folder, we will use
[chokibro](https://github.com/soixantecircuits/chokibro) to watch new
files in the local folder, and
[blurrybro](https://github.com/spacebro/blurrybro) to blur
images.

```
+----------------------------------------+                    +----------------------------------------+
|                                        |                    |                                        |
|                                        |                    |                                        |
|                               outMedia +------------------->+ inMedia                       outMedia |
|                                        |                    |                                        |
|                                        |                    |                                        |
|               CHOKIBRO                 |                    |               BLURRYBRO                |
|                                        |                    |                                        |
|                                        |                    |                                        |
|                                        |                    |                                        |
|                                        |                    |                                        |
|                                        |                    |                                        |
+----------------------------------------+                    +----------------------------------------+
```

### chokibro

Chokibro is your friend to watch a folder and send a message on spacebro
for every new file in this folder.

Let's open a new terminal, install it and tell it to watch the `pictures` folder

```
mkdir /tmp/pictures
git clone https://github.com/soixantecircuits/chokibro
cd chokibro
nvm use
npm i
node index.js --service.spacebro.host localhost --service.spacebro.port
36000 --folder /tmp/pictures
```

It is now connected to spacebro and watches the pictures folder.

Try chokibro by adding pictures in the folder : let's open a new terminal and

```
cd /tmp/pictures
wget https://loremflickr.com/320/240/cat.jpg
```

See the logs in chokibro mentioning it found a new file. See the logs in
spacebro mentioning it received an `outMedia` message from chokibro.

Now let's run blurrybro to blur those images

### blurrybro

Blurrybro is an example spacebro client for this tutorial's sake,
it blurs an image using imagemagick.

Blurrybro waits for an image in its
`inMedia` inlet, processes the image to blur it, and then outputs the
image on its `outMedia` outlet.

Let's open a new terminal, install, and run it.

```
git clone https://github.com/soixantecircuits/blurrybro
sudo apt-get install imagemagick
# or $ brew install imagemagick
# or $ yaourt imagemagick
cd blurrybro
nvm use
npm i
node index.js --service.spacebro.host localhost --service.spacebro.port
36000
```

Blurrybro is now running and is waiting for images to process. Let's
connect it to chokibro.

### connect the two apps.

Connections between two apps is made by telling spacebro to connect
them. This can be done from different places: in the settings of
spacebro itself, or via [spacebroUI](http://spacebro.space/), or
directly when running an app. Let's pick that last option for
simplicity's sake.

Stop blurrybro with a ctrl+c and rerun it with a connection:

```
node index.js --service.spacebro.host localhost --service.spacebro.port
36000 --service.spacebro.connection "chokibro/outMedia=>blurrybro/inMedia"
```

Notice in spacebro logs that it received the connection.

Now let's try the process we've setup: add an image in a folder and get
it blurred:


```
cd /tmp/pictures
wget https://loremflickr.com/320/240/spacecat.jpg
```

Notice in the spacebro logs that blurrybro sent an image as a json
object:

```
{
  url: "http://localhost:37200/spacecat.jpg"
}
```

Open that url to see your blurry cat.

🎉 You've setup your first spacebro process!

## What's next?

Want more? Let's [write our first spacebro client
app](./starting.md).  
Want an exercise? Run the two apps on different machines on your local
network.  
Want to know more about common spacebro clients like chokibro and
blurrybro? Take a [tour](https://github.com/spacebro/awesome-spacebro#apps)!
