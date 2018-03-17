const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	_id: {type: Schema.Types.ObjectId, required: false},
	spotifyId: {type: String},
	accessToken: {type: String},
	refreshToken: {type: String},
	expires_in: {type: Number}
});

let User = mongoose.model('User', userSchema);

module.exports = User;