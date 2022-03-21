Spacebro

> An open source realtime server and connecting layer for microservices and modern applications.

Spacebro is the [|](<https://en.wikipedia.org/wiki/Pipeline_(Unix)>) in GNU/Linux for apps running on different computers.

As its core, Spacebro is a minimal socket.io server to connect applications on demand, that makes it easy to create a multi-apps system without touching the server code. With Spacebro, you can literally connect your apps in minutes.

Spacebro achieves this by being the glue code between socket.io clients, all clients emit messages to spacebro and spacebro routes them based on connections. That makes it easier to understand, maintain and scale minimalist, modular applications that each make one thing well.

You will design and build spacebro clients. Keep in mind that the output of every spacebro client becomes the input to another, as yet unknown, spacebro client.

If you're interested, you can read more about [how and why Spacebro came to be](https://medium.com/@egeoffray/how-and-why-spacebro-came-to-be-5bb4eb954285) or find out more about its [ecosystem](https://github.com/spacebro/awesome-spacebro#apps).

If you've decided that Spacebro might be for you, fell free to drive right in and [learn about the basics](./guides/basics/readme.md).
