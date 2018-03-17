const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const sassMiddleware = require('node-sass-middleware');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
require('dotenv').config();

const index = require('./routes/index');
const playlist = require('./routes/playlist');
const login = require('./routes/login');

const app = express();

const mongoose = require('mongoose');
const options = {};
const mongodbUri = process.env.MONGODB_URI || process.env.MY_MONGODB_URI;
const User = require('./models/user.js');
mongoose.connect(mongodbUri, options).then(
  () => { console.log('Successfully connected');/** ready to use. The `mongoose.connect()` promise resolves to undefined. */ },
  err => { throw err;/** handle initial connection error */ }
);

const appKey = process.env.APP_KEY;
const appSecret = process.env.APP_SECRET;
const callbackURL = process.env.CALLBACK_URL;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in 
//   and spotify profile), and invoke a callback with a user object.
passport.use(new SpotifyStrategy({
		clientID: appKey,
		clientSecret: appSecret,
		callbackURL: callbackURL
	},
	function(accessToken, refreshToken, expires_in, profile, done) {
		// asynchronous verification, for effect...
		process.nextTick(function () {
			console.log(`APP LOG: accessToken is ${accessToken} refreshToken is ${refreshToken}`);
			// The user's spotify profile is returned to
			// represent the logged-in user.
			User.findOne({spotifyId: profile.id}, function(err,obj) {
				if (err) throw err;
				if (!obj) {
					let spotifyUser = new User({
						_id: mongoose.Types.ObjectId(),
						spotifyId: profile.id,
						accessToken: accessToken,
						refreshToken: refreshToken,
						expires_in: expires_in
					});
					//save
					spotifyUser.save(function(er, usr){
						if (er) throw er;
						console.log('Spotify user saved.');
					});
				}
				else {
					let spotifyUser = new User({
						accessToken: accessToken,
						refreshToken: refreshToken
					});
					//update
					User.update({spotifyId: profile.id}, spotifyUser, function(er, usr) {
						if (err) throw err;
						console.log('Spotify user updated.');
					});
				}
				return done(null, profile);
			});
		});
	}
));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(methodOverride());
app.use(session({ secret: process.env.SESSION_SECRET }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(sassMiddleware({
	src: path.join(__dirname, 'public'),
	dest: path.join(__dirname, 'public'),
	indentedSyntax: true, // true = .sass and false = .scss
	sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/playlist', playlist);
app.use('/login', login);

// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
app.get('/auth/spotify',
	passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'playlist-read-private', 'playlist-read-collaborative'], showDialog: true}),
	function(req, res){
// The request will be redirected to spotify for authentication, so this
// function will not be called.
});

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/callback',
	passport.authenticate('spotify', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/');
	}
);

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed. Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/login');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
