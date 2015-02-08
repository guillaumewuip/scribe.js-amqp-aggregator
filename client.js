(function () {

    'use strict';

    var scribe_amqp = require('./scribe_amqp.js'),
        scribe      = require('scribe-js')({
            createDefaultConsole : false
        }),
        when        = require('when'),
        app         = require('express')();

    var console = scribe.console({
        logWriter   : false,
        createBasic : true
    });

    var expressConsole = scribe.console({
        logWriter   : false,
        createBasic : true
    });

    var config1 = scribe_amqp(console, { //listen for common logs
        routingKey      : 'console',
        exchange        : 'test-notif',
        exchangeType    : 'fanout',
        exchangeOptions : {durable : false}
    });

    var config2 = scribe_amqp(expressConsole, { //listen for express logs
        routingKey      : 'express',
        exchange        : 'test-notif',
        exchangeType    : 'fanout',
        exchangeOptions : {durable : false}
    });


    when.all([config1, config2]).then(function (connection) {

        console.tag("Test").log("Hello world! This is a test.");

        app.use(scribe.express.logger(expressConsole));

        app.use(function (req, res) {
            res.send("You're at " + req.path);
        });

        app.listen(5001, function () {
            console.log("See you at locatlhost:5001");
        });

    }).done();

}());
