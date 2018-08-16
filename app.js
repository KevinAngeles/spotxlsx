const express = require('express');
const path = require('path');
const favicons = require('serve-favicons');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const moment = require('moment');
require('dotenv').config();

const indexController = require('./routes/index');
const playlistController = require('./routes/playlist');
const authController = require('./routes/auth');

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
passport.serializeUser( (user, done) => {
	done(null, user);
});

passport.deserializeUser( (obj, done) => {
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
	(accessToken, refreshToken, expires_in, profile, done) => {
		// asynchronous verification, for effect...
		process.nextTick( () => {
			// The user's spotify profile is returned to
			// represent the logged-in user.
			User.findOne({spotifyId: profile.id}, (err,obj) => {
				if (err) throw err;
				let new_expiration_date = moment().add(expires_in, 'seconds'); 
				if (!obj) {
					let spotifyUser = new User({
						_id: mongoose.Types.ObjectId(),
						spotifyId: profile.id,
						accessToken: accessToken,
						refreshToken: refreshToken,
						expiration_date: new_expiration_date
					});
					// Save user
					spotifyUser.save( (er, usr) => {
						if (er) throw er;
					});
				}
				else {
					let spotifyUser = new User({
						accessToken: accessToken,
						refreshToken: refreshToken,
						expiration_date: new_expiration_date
					});
					// Update user
					User.update({spotifyId: profile.id}, spotifyUser, (er, usr) => {
						if (err) throw err;
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

app.use(favicons({
	'/favicon.ico': __dirname + '/public/favicons/favicon.ico',
	'/apple-icon-57x57.png': __dirname + '/public/favicons/apple-icon-57x57.png',
	'/apple-icon-60x60.png': __dirname + '/public/favicons/apple-icon-60x60.png',
	'/apple-icon-72x72.png': __dirname + '/public/favicons/apple-icon-72x72.png',
	'/apple-icon-76x76.png': __dirname + '/public/favicons/apple-icon-76x76.png',
	'/apple-icon-114x114.png': __dirname + '/public/favicons/apple-icon-114x114.png',
	'/apple-icon-120x120.png': __dirname + '/public/favicons/apple-icon-120x120.png',
	'/apple-icon-144x144.png': __dirname + '/public/favicons/apple-icon-144x144.png',
	'/apple-icon-152x152.png': __dirname + '/public/favicons/apple-icon-152x152.png',
	'/apple-icon-180x180.png': __dirname + '/public/favicons/apple-icon-180x180.png',
	'/android-icon-192x192.png': __dirname + '/public/favicons/android-icon-192x192.png',
	'/favicon-32x32.png': __dirname + '/public/favicons/favicon-32x32.png',
	'/favicon-96x96.png': __dirname + '/public/favicons/favicon-96x96.png',
	'/favicon-16x16.png': __dirname + '/public/favicons/favicon-16x16.png',
	'/ms-icon-144x144.png': __dirname + '/public/favicons/ms-icon-144x144.png'
}));

// Log all the responses with status code greater than or equal to 400 and send them to stderr
// using combined format
app.use(morgan('combined', {
	skip: (req, res) => {
		return res.statusCode < 400
	}, stream: process.stderr
}));

// Log all the responses with status code less than 400 and send them to stdout
// using combined format
app.use(morgan('combined', {
	skip: (req, res) => {
		return res.statusCode >= 400
	}, stream: process.stdout
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(methodOverride());
app.use(session({ 
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

/**
 * Summary. Middleware that ensures that the user is authenticated.
 *
 * Description. If the request is authenticated, the request proceeds. Otherwise
 * the user is redirected to the 'login' page.
 *
 * @param {Object}   req           Request.
 * @param {Object}   res           Response.
 * @param {Function} next          Next.
 * 
 * @return {Function} next.
 */
function ensureAuthenticated(req, res, next) {
	const LOGIN_PATH = '/auth/login';
	const pathsExcepted = ['/auth/spotify', '/auth/spotify/callback'];
	// if there is a request to any of the paths in pathsExcepted, continue
	if ( pathsExcepted.includes(req.path) ) { 
		console.log(1);
		return next(); 
	}
	// if there is a request to login
	else if ( req.path === LOGIN_PATH ) {
		// if user was already authenticated 
		if ( req.isAuthenticated() ) {
			// redirect to home page
			return res.redirect('/');
		}
		// if user was not authenticated
		// continue to login
		return next();
	}
	// if user was authenticated and path is not part of 'pathsExcepted' nor 'LOGIN_PATH'
	else if ( req.isAuthenticated() ) {
			// continue
			return next();
	}
	// if user was not authenticated and path is not part of 'pathsExcepted' nor 'LOGIN_PATH'
	// redirect to login
	return res.redirect('/auth/login');
}

app.use(ensureAuthenticated);

app.use('/', indexController);
app.use('/playlist', playlistController);
app.use('/auth', authController);

// catch 404 and forward to error handler
app.use( (req, res, next) => {
	let err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use( (err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
