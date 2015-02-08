![schema](docs/schema-intro.png)

# Scribe.js logs collector example
AMQP + Scribe.js for a lightweight logs management
It's an example showing how to build a logs collector with [Scribe.js](https://github.com/bluejamesbond/Scribe.js) for a SOA app.

### The server
It's a NodeJS app that runs Scribe.js with its WebPanel and listen for logs over an AMQP queue.

```
node log_server.js
```

### An example of client
This is a NodeJS app that logs something.

```
node client.js
```
