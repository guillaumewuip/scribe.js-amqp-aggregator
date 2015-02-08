(function () {

    var amqp = require('amqplib');

    /**
     * scribe_amqp
     *
     * Listen to a Scribe-js console
     * and broadcast all new log to amqp
     *
     * @example
        var scribe_amqp = require('scribe-amqp');

        scribe_amqp(myConsole, {   //myConsole is a Scribe-js console
            server          : 'amqp://localhost',
            socketOptions   : {},
            exchange        : 'test-notif',
            exchangeType    : 'fanout',
            exchangeOptions : {durable : false}
        });
     *
     * @param {Scribe-js console}  scribeConsole
     * @param {Object}             options
     * @param {String}             options.routingKey      Optional. A rounting key. Default ''
     * @param {String}             options.server          The amqp server. Optional
     *                                                     Default to amqp://localhost
     * @param {Object}             options.socketOptions   amqplib.connect options. Optional.
     *        @see http://www.squaremobius.net/amqp.node/doc/channel_api.html
     * @param {String}             options.exchange        The exchange name
     * @param {String}             options.exchangeType    The exchange type
     * @param {Object}             options.exchangeOptions The exchange options. Optional.
     *        @see http://www.squaremobius.net/amqp.node/doc/channel_api.html
     * @param {Function}           logParser               A function that build the JSON object to send
     *                                                     from the scribe-js log it receives.
     *                                                     Optional. There is one default.
     * @return {Promise}
     */
    var scribe_amqp = function (scribeConsole, options, logParser) {

        //Defaults

        if (typeof options.server !== 'string') {
            options.server = 'amqp://localhost';
        }

        if (typeof options.routingKey !== 'string') {
            options.routingKey = '';
        }

        if (typeof logParser !== 'function') {

            logParser = function (log) {
                return {
                    type     : log.type,
                    tags     : log.context.tags,
                    location : log.context.location,
                    time     : log.context.time,
                    message  : log.argsString
                };
            };
        };

        //Connection
        return amqp.connect(options.server, options.socketOptions || {})
            .then(function (conn) {

                connection = conn;

                process.once('SIGINT', connection.close.bind(connection));

                return connection.createChannel().then(function (channel) {

                    return channel.assertExchange(
                            options.exchange,
                            options.exchangeType,
                            options.exchangeOptions || {})
                        .then(function () {
                            return channel;
                        });
                })

                .then(function (channel) {

                    //the amqp thing is ok, let's listen for new log
                    return scribeConsole.on('new', function (log) {

                        var message = logParser(log); //build the message

                        channel.publish(
                            options.exchange,
                            options.routingKey,
                            new Buffer(JSON.stringify(message))
                        );
                    });

                })

                .then(function () {
                    return connection;
                });

            });
    };

    module.exports = scribe_amqp;

}());
