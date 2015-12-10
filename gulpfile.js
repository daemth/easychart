var gulp = require('gulp');
var sass = require('gulp-sass');
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var header = require('gulp-header');
var pkg = require('./package.json');
var rename = require('gulp-rename');

var banner = ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''].join('\n');


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
        .pipe(gulp.dest('./src/css'));
});

gulp.task('sass:watch', function () {
    gulp.watch('./src/scss/**/*.scss', ['sass']);
});

gulp.task('browserify:full', function () {
    return build('full', 'ec.full');
});

gulp.task('browserify:minimal', function () {
    return build('minimal', 'ec.minimal')
});

gulp.task('browserify:simple', function () {
    return build('simple', 'ec.simple')
});

function build(file, output) {
    var bundler = browserify('./src/js/' + file + '.js');
    return bundler.bundle()
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source(output + '.js'))
        .pipe(buffer())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest('./dist'))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(uglify())
        .pipe(header(banner, { pkg : pkg } ))
        .pipe(gulp.dest('./dist'));
}

gulp.task('watchify:full', function () {
    return bundle('full', 'ec.full')
});

gulp.task('watchify:minimal', function () {
    return bundle('minimal', 'ec.minimal')
});

gulp.task('watchify:simple', function () {
    return bundle('simple', 'ec.simple')
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

gulp.task('build', ['sass', 'browserify:full','browserify:simple', 'browserify:minimal']);
gulp.task('watch:full', ['sass:watch', 'watchify:full']);
gulp.task('watch:minimal', ['watchify:minimal']);
gulp.task('watch:simple', ['watchify:simple']);