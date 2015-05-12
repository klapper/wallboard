var logger = require('../logging/logging.js').logger;

// Connect to MongoDB using Mongoose
var mongoose = require('mongoose');
var db = mongoose.connection;
var async = require('async');


var connect_to_db = function() {
    var uri = 'mongodb://localhost/wallboardapp';
    var connection_options = {
        server: { poolSize:4 }
        // user:'user'
        // pass:'pass'
    };
	db = mongoose.createConnection(uri, connection_options);
};



connect_to_db();

db.on('disconnected', function() {
    logger.info('Database disonnected.');
    setTimeout(connect_to_db,5000);
});

db.on('error', function() {
    logger.info('Database error.');
    setTimeout(connect_to_db,5000);
});

db.on('connected', function() {
    logger.info("Database connected.");
})
db.on('connecting', function() {
    logger.info("connecting to database...");
})



var board_models = require('../models/boards.js');
var Board = db.model('boards', board_models.BoardSchema);
var Stream = db.model('streams', board_models.StreamSchema);

// JSON API for list of boards
exports.list = function(req, res) {
	// Query Mongo for boards, just get back the name text
	Board.find({}, 'name', function(error, boards) {
		res.json(boards);
	});
};

exports.index = function(req, res){
  res.render('base', { title: 'Wallboard' });
};

exports.index_min = function(req, res){
  res.render('base_min', { title: 'Wallboard' });
};

exports.create = function(req, res) {
	var reqBody = req.body;
	var elements = [];
	var	wallboardObj = {name: reqBody.name, elements: elements};
				
	// Create poll model from built up poll object
	var wallboard = new Board(wallboardObj);
	
	// Save poll to DB
	wallboard.save(function(err, doc) {
		if(err || !doc) {
			throw 'Error';
		} else {
			res.json(doc);
		}
	});
};

//JSON API for getting a single board
exports.board = function(req, res) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Expires', '-1');
    res.setHeader('Pragma', 'no-cache');
	// Board ID comes in the URL
	var boardId = req.params.id;
	
	// Find the board by its ID, use lean as we won't be changing it
	Board.findById(boardId, '', { lean: true }, function(err, board) {
		if(board) {
			res.json(board);
		} else {
			res.json({error:true});
		}
	});
};

exports.send_initialization_done = function(socket) {
    socket.emit('initialization_done',true);
};

send_value_to_clients = function(io,stream_obj) {
    logger.info('Updating ' + stream_obj.stream_name + " on clients with value: " + stream_obj.value,stream_obj);
    //io.sockets.in(stream_obj.stream_name).emit('update',stream_obj);
    io.sockets['in'](stream_obj.stream_name).emit('update',stream_obj);
};

/*
exports.send = function(io) {
    return function(req, res) {
	    if (req.body !== null) {
            if ((req.body.stream_name != null) && (req.body.value != null)) {
                var value=[];
                if (Array.isArray(req.body.value)) {
                   value=req.body.value;
                } else {
                    value=[req.body.value];
                }
                var stream_obj = {stream_name:req.body.stream_name,value:value};
                
                Stream.findOne({'stream_name':stream_obj.stream_name}, function (err, doc) {
                    if (err) {
                        logger.error("DB stream findOne error occured: " + err);
                        res.json({error:true,message:"Database error: "+err});
                    } else if (!doc) {
                        logger.info("First time saw stream_name: " + stream_obj.stream_name + " so createing one..");
                        var stream = new Stream(stream_obj);
                        stream.save(function (err) {
                            if (!err) {
                                logger.debug("Succesfully created stream document in db. ",stream_obj);
                                send_value_to_clients(io,stream_obj);
                                res.json({success:true});
                            } else {
                                logger.error("Error while createing document: " + err);
                                res.json({error:true,message:"Not created, reason: "+err});
                            }
                        });
                    } else {
                        //console.log("Updating document, id="+ doc._id + ", stream_name="+doc.stream_name + ", value="+stream_obj.value);
                        doc.value=stream_obj.value;
                        doc.save(function (err) {
                            if (!err) {
                                send_value_to_clients(io,stream_obj);
                                res.json({success:true});
                            } else {
                                res.json({error:true,message:"Not updated, reason: "+err});
                            }
                        });
                    }
                });
            } else if (req.body.client_refresh === true) {
                var refresh_within = 10*1000;
                logger.info("Requesting clients to refresh within "+refresh_within + " ms.");
                io.sockets.emit('client_refresh',refresh_within);
                res.json({success:true});
            } else {
                res.json({error:true,message:"You must specify stream_name and value!"});
            }
	    } else {
            res.json({error:true,reason:"Body can not be empty"});
        }
}};
*/

var process_one_stream = function(data,io,callback) {
    console.log("process one stream",data);
    if (data.hasOwnProperty('stream_name') && data.hasOwnProperty('value')) {
        var stream_obj = {stream_name:data.stream_name,value:data.value};

        Stream.findOne({'stream_name':stream_obj.stream_name}, function (err, doc) {
            if (err) {
                logger.error("DB stream findOne error occured: " + err);
                callback({error:true,message:"Database error: "+err});
            } else if (!doc) {
                logger.info("First time saw stream_name: " + stream_obj.stream_name + " so createing one..");
                var stream = new Stream(stream_obj);
                stream.save(function (err) {
                    if (!err) {
                        logger.debug("Succesfully created stream document in db. ",stream_obj);
                        send_value_to_clients(io,stream_obj);
                        callback({success:true});
                    } else {
                        logger.error("Error while createing document: " + err);
                        callback({error:true,message:"Not created, reason: "+err});
                    }
                });
            } else {
                doc.value=stream_obj.value;
                doc.markModified('value');
                doc.save(function (err) {
                    if (!err) {
                        send_value_to_clients(io,stream_obj);
                        callback({success:true});
                    } else {
                        callback({error:true,message:"Not updated, reason: "+err});
                    }
                });
            }
        });
    } else if (data.hasOwnProperty('client_refresh') && (data.client_refresh === true)) {
        var refresh_within = 10*1000;
        logger.info("Requesting clients to refresh within "+refresh_within + " ms.");
        io.sockets.emit('client_refresh',refresh_within);
        callback({success:true});
    } else {
        callback({error:true,reason:"You must specify stream_name and value"});
    }
};


exports.send = function(io) {
    return function(req, res) {
        if (req.body !== null) {
            console.log(req.body);
            var req_data = req.body;
            if (Array.isArray(req_data)) {
                var items=[];
                var results=[];
                var queue = async.queue(function (task,callback) {
                    return process_one_stream(task,io,callback);
                });
                queue.drain = function() {
                    logger.debug("Multiple updates done.");
                    res.json(results);
                };
                req.body.forEach(function(value,index) {
                   queue.push(value,function (result) {
                       results.push(result);
                   });
                });
            } else {
                process_one_stream(req_data,io,function(result) {
                    res.json(result);
                });
                
            }
        } else {
            res.json({error:true,reason:"Body can not be empty"});
        }
}};


exports.send_current_value_to_socket = function(socket,stream_name) {
    Stream.findOne({'stream_name':stream_name}, function (err, doc) {
        if (!err) {
            if (doc) {
                logger.debug("Sending last known value for streame_name:" + stream_name + "valuetype:"+ typeof(doc.value));
                var stream_obj = {stream_name:doc.stream_name,value:doc.value};
                socket.emit("update",stream_obj);
            } else {
                logger.info("Stream name: " + stream_name + " not found in database.");
            }
        }
    });
};

exports.update_board_layout = function(data,socket,io) {
    logger.info("Updating board in db", data);
    var boardId = data.id;
    Board.findById(boardId, function(err, board) {
        if (!err && board) {
            var board_oldname = board.name;
            board.name = data.name;
            board.elements = data.elements;
            board.save(function (err) {
                if (!err) {
                    logger.info("Board updated");
                    socket.broadcast.to('board/'+board.name).emit('reload_board',{});
                    if (board.oldname !== undefined && board.name !== board.oldname) {
                        //if board name changed than emit in the old name for old clients
                        socket.broadcast.to('board/'+board_oldname).emit('reload_board',{});
                    }
                } else {
                    logger.error("Error while updateing board in db. ",err);
                }
            });
        } else {
            logger.error("Board not found in db. ", err);
            //todo
        }
    });
};

exports.getStreamsName = function(data,socket) {
    Stream.find({}, function(err,docs) {
        var names = docs.map(function(x) {return x.stream_name;});
        socket.emit("list_of_streams",names);
    });
};

