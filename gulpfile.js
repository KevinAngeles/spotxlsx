const gulp         = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const notify       = require('gulp-notify');
const plumber      = require('gulp-plumber');
const sass         = require('gulp-sass');
const sourcemaps   = require('gulp-sourcemaps');

// Start Watching: Run "gulp"
gulp.task('default', ['watch']);

const onError = err => {
	notify.onError({
		title:    "Error",
		message:  "<%= error %>",
	})(err);
	this.emit('end');
};

// Sass to CSS: Run manually with: "gulp buildcss"
gulp.task('buildcss', () => {
	const autoprefixerOptions = { browsers: ['last 2 versions'] };
	const plumberOptions = { errorHandler: onError };
	const sassOptions = { includePaths: [] };

	return gulp.src('src/sass/**/*.sass')
		.pipe(plumber(plumberOptions))
		.pipe(sourcemaps.init())
		.pipe(sass(sassOptions))
		.pipe(autoprefixer(autoprefixerOptions))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./public/stylesheets/', {overwrite: true}))
});

// Default task
gulp.task('watch', () => {
	gulp.watch('src/sass/**/*.{css,sass}', ['buildcss']);
	//gulp.watch('public/js/**/*.js', ['concatjs']);
});