
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , constants = require('constants');
  

var fs = require('fs');

var settings = require('./config/settings.js').settings;

var _ = require('underscore');

var logger = require('./logging/logging.js').logger;

var loggerStream = {
        write: function(message, encoding) {
            logger.info(message);
        }
};


var options = {
        //
        // This is the default secureProtocol used by Node.js, but it might be
        // sane to specify this by default as it's required if you want to
        // remove supported protocols from the list. This protocol supports:
        //
        // - SSLv2, SSLv3, TLSv1, TLSv1.1 and TLSv1.2
        //
        secureProtocol: 'SSLv23_method',
       
        //
        // Supply `SSL_OP_NO_SSLv3` constant as secureOption to disable SSLv3
        // from the list of supported protocols that SSLv23_method supports.
        //
        secureOptions: constants.SSL_OP_NO_SSLv3 | constants.SSL_OP_NO_SSLv2,
        
        key: fs.readFileSync(settings.certificate.key_file_path),
        cert: fs.readFileSync(settings.certificate.cert_file_path)
};


var app = express();
var server = https.createServer(options,app);
//var server = http.createServer(app);


/*
var io = require('socket.io').listen(server, {
    'log level':1
});
*/


var io = require('socket.io').listen(server, {
    'key' : options.key,
    'cert' : options.cert,
    'log level':1
});

function error(err, req, res, next) {
    logger.info("Invalid request: ",err.stack);
    res.send(400);
  }

// all environments
app.set('port', 443);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.disable('x-powered-by');
app.use(function(req, res, next) {
    res.header('X-Frame-Options', 'DENY');
    next();
});
app.use(express.compress());
app.use(express.favicon());
//send express web server logs to log file through logger object
app.use(express.logger({stream:loggerStream}));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
//cache 1 day
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000 }));
app.use(express.limit('5mb'));
app.use(error);

//listen on http port 80 and redirect to https
var httpApp = express();
var server_http = http.createServer(httpApp);
httpApp.disable('x-powered-by');
httpApp.get('*', function(req,res) {
    res.redirect(['https://', req.get('Host'), req.url].join(''));
});
server_http.listen(80, function(){
    logger.info('Express http server listening on port ' + 80);
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//Handle Errors gracefully
app.use(function(err, req, res, next) {
	if(!err) { return next(); }
	logger.error(err.stack);
	res.json({error: true});
});

// Main App Page
app.get('/', routes.index);
app.get('/min', routes.index_min);

// MongoDB API Routes
app.get('/boards/boards', routes.list);
app.get('/boards/:id', routes.board);
app.post('/boards', routes.create);
app.post('/send', routes.send(io));


var clear_interests = function(socket) {
    //this will disconnect from board channel too
    var interests = socket.rooms;
    for (var key in interests) {
        if (interests.hasOwnProperty(key) && (key !== '') && (key !== undefined)) {
            logger.debug(socket.id + ' leaving channel: ' + key);
            socket.leave(key);
        }
    }
};

io.sockets.on('connection', function (socket) {
	socket.on('interested_in', function(data) {
        clear_interests(socket);
        var uniq_elements = _.uniq(data.elements);
        var board_name = data.board_name;
        logger.debug("Client " + this.id + " is interested in the following element changes:" + uniq_elements);
        for (var i=0;i < uniq_elements.length; i++) {
            socket.join(uniq_elements[i]);
            logger.debug(this.id + " is joining channel: " + uniq_elements[i]);
            routes.send_current_value_to_socket(socket,uniq_elements[i]);
        }
		if ((data.board_name !== undefined) && (data.board_name !== '')) {
            socket.join('board/'+data.board_name);
		}
	});
	//logger.debug("Request list of element changes notification from client " + socket.id);
	//socket.emit('show_me_your_interest','in_json_list');
	socket.on('update_layout', function(data) {
        logger.info("Layout update",data);
        routes.update_board_layout(data,socket,io);
	});
	socket.on('clear_interest', function(data) {
        return clear_interests(socket);
	});
	socket.on("getStreamsName", function(data) {
        routes.getStreamsName(data,socket);
	});
	
});


server.listen(app.get('port'), function(){
  logger.info('Express https server listening on port ' + app.get('port'));
});






