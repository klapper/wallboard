var mongoose = require('mongoose');

var value_list = new mongoose.Schema ({
    value : {type: String, required: true }
});

/*
 
 exports.StreamSchema = new mongoose.Schema({
    stream_name: {type: String, required: true },
    value: [{type: String, required: true }]
});
*/

exports.StreamSchema = new mongoose.Schema({
    stream_name: {type: String, required: true },
    value: mongoose.Schema.Types.Mixed
});


var template_config_schema = new mongoose.Schema({
    name: String,
    value: String
});

var elementSchema = new mongoose.Schema({
    element_template: { type : String, required:true},
    template_config: [template_config_schema],
    display_config: {
        col: Number,
        row: Number,
        sizeX:Number,
        sizeY:Number
    },
});

exports.BoardSchema = new mongoose.Schema({
	name: { type: String, required: true },
	creator_name: 'String',
	create_date: 'String',
	elements: [elementSchema],
	grid_size_x: "Number",
	grid_size_y: "Number"
});
