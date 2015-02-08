(function () {

    'use strict';

    var amqp = require('amqplib'),
        when = require('when');

    /**
     * amqp_server
     *
     * Listen to log over amqp
     * and fire callback accordingly of routing key
     *
     * @param  {Object}   options
     * @param  {String}   options.server          The amqp server. Optional
     *                                            Default to amqp://localhost
     * @param  {Object}   options.socketOptions   amqplib.connect options. Optional.
     *         @see http://www.squaremobius.net/amqp.node/doc/channel_api.html
     * @param  {String}   options.exchange        The exchange name
     * @param  {String}   options.exchangeType    The exchange type
     * @param  {Object}   options.exchangeOptions The exchange options. Optional.
     *        @see http://www.squaremobius.net/amqp.node/doc/channel_api.html
     *
     * @param  {Object}   consoles                Stores callback functions according to
     *                                            rounting-keys
     *                                            'routingKey' => callbackFunction
     * @param  {Function} defaultLogger           Optional. Default callback not provide
     *                                            in param consoles
     * @return {Promise}
     */
    var amqp_server = function (options, consoles, defaultLogger) {

        //Defaults
        if (typeof options.server !== 'string') {
            options.server = 'amqp://localhost';
        }

        /**
         * handleLogs
         *
         * @param {Object}  msg     an amqplib message
         * @see http://www.squaremobius.net/amqp.node/doc/channel_api.html
         */
        var handleLogs = function (msg) {

            var routingKey = msg.fields.routingKey || '';

            if (consoles && typeof consoles[routingKey] === 'function') {
                consoles[routingKey](msg);
            } else if (typeof defaultLogger === 'function') {
                defaultLogger(msg);
            }

        };

        return amqp.connect(options.server, options.socketOptions || {})

            .then(function (connection) {

                process.once('SIGINT', connection.close.bind(connection)); //close the connection after ctrl+C

                return connection.createChannel()

                    .then(function (channel) {

                        return channel.assertExchange(  //assert exchange given exist
                            options.exchange,
                            options.exchangeType,
                            options.exchangeOptions
                        )

                        .then(function () {
                            return channel.assertQueue('', {exclusive : true}); //create our queue
                        })

                        .then(function (queueOk) {

                            //Let's bind the queue with the exchange for all routing keys

                            var binding,
                            queue = queueOk.queue;

                            if (consoles) { //bind all routing-keys if given
                                binding = when.all(Object.keys(consoles).map(function (console) {

                                    channel.bindQueue(
                                        queue,
                                        options.exchange,
                                        console
                                    );

                                }));

                            } else {

                                //bind all messages if no consoles given
                                binding = channel.bindQueue(
                                    queue,
                                    options.exchange,
                                    ''
                                );

                            }

                            return binding.then(function () {
                                return queue;
                            });
                        })

                        .then(function (queue) {

                            //listen for new message
                            return channel.consume(
                                queue,
                                handleLogs,
                                {noAck : true}
                            );
                        });

                    })

                    .then(function () {
                        return connection;
                    });
            });

    };

    module.exports = amqp_server;

}());
