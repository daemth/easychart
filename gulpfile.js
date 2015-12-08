var gulp = require('gulp');
var sass = require('gulp-sass');
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('app:watch', function () {
    gulp.start('sass:watch', 'watchify');
});

gulp.task('sass', function () {
    gulp.src('src/scss/style.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: require('node-neat').includePaths
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./src/scss/**/*.scss', ['sass']);
});

gulp.task('browserify:main', function () {
    return build('main', 'ec');
});

gulp.task('browserify:minimal', function () {
    return build('minimal', 'ec-minimal')
});

function build(file, output) {
    var bundler = browserify('./src/js/' + file + '.js');
    return bundler.bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source(output + '.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
}

gulp.task('watchify:main', function () {
    return bundle('main', 'ec')
});

gulp.task('watchify:minimal', function () {
    return bundle('minimal', 'ec-minimal')
});

function bundle(file, output) {
    watchify.args.debug = true;
    var bundler = watchify(browserify('./src/js/' + file + '.js', watchify.args));
    bundler.on('update', rebundle);
    bundler.on('log', gutil.log.bind(gutil));
    function rebundle() {
        return bundler.bundle()
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))
            .pipe(source(output + '.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
            // Add transformation tasks to the pipeline here.
            .pipe(sourcemaps.write('./')) // writes .map file
            .pipe(gulp.dest('./dist'));
    }

    return rebundle();
}

gulp.task('build', ['sass', 'browserify:main', 'browserify:minimal']);
gulp.task('watch:main', ['sass:watch', 'watchify:main']);
gulp.task('watch:minimal', ['watchify:minimal']);