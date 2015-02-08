(function () {

    'use strict';

    var scribe      = require('scribe-js')({
            createDefaultConsole : false
        }),
        amqp_server = require('./scribe_amqp_server.js'),
        app         = require('express')(),
        port        = 5000;

    var console = scribe.console({
        logWriter : false
    });


    //Handle common logs

    var logConsole = scribe.console({
        console : {
            logInConsole : false
        },
        createBasic : true
    });

    var normalLogger = function (msg) {

        /**
         * A log
         *
         * the default format send by scribe_amqp.js is :

            var log = {
                type : "loggerName",
                tags : [],
                location : {
                    filename : 'index.js',
                    line     : 12
                },
                time : ..
                message : ''
            };

        */
        var log = JSON.parse(msg.content.toString());

        //save log
        logConsole.tag.apply(logConsole, log.tags)
            .time(log.time)
            .file(log.location.filename, log.location.line)
            [log.type](log.message);

        //print in console
        console.tag.apply(console, log.tags)
            .time()
            .file(log.location.filename, log.location.line)
            [log.type](log.message);

    };


    //Handle express logs

    var expressConsole = scribe.console({
        console : {
            logInConsole : false
        },
        logWriter : {
            rootPath : 'logExpress'
        },
        createBasic : true
    });

    var expressLogger = function (msg) {

        var log = JSON.parse(msg.content.toString());

        console.log(log);

        //save log
        expressConsole.tag.apply(expressConsole, log.tags)
            .time(log.time)
            .file(log.location.filename, log.location.line)
            [log.type](log.message);

        //print in console
        console.tag.apply(console, log.tags)
            .time()
            .file(log.location.filename, log.location.line)
            [log.type](log.message);
    };

    amqp_server({
            server          : 'amqp://localhost',
            exchange        : 'test-notif',
            exchangeType    : 'fanout',
            exchangeOptions : { durable : false }
        },
        {
            console : normalLogger,
            express : expressLogger
        },
        normalLogger
    ).then(function (connection) {

        app.get('/', function (req, res) {

            res.end('See you at /logs !');
        });

        app.use('/logs', scribe.webPanel());

        app.listen(port, function () {

            console.time().info("Log server running on port %d", port);

        });
    });


}());
