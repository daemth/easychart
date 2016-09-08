var gulp = require('gulp')
var watchify = require('watchify')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var gutil = require('gulp-util')
var uglify = require('gulp-uglify')
var sourcemaps = require('gulp-sourcemaps')
var header = require('gulp-header')
var pkg = require('./package.json')
var rename = require('gulp-rename')
var notify = require('gulp-notify')
var pug = require('gulp-pug')
var browserSync = require('browser-sync').create()

const cssDir = './src/css/**/*.css'
const pugDir = './src/pug/**/*.pug'

// in favor of postcss styles task
var postcss = require('gulp-postcss')

var banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''
].join('\n')

gulp.task('app:watch', function () {
  gulp.start('sass:watch', 'watchify')
})

gulp.task('pug', function () {
  gulp.src(pugDir)
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.stream({match: '**/*.html'})) // TODO checken

    //  {match: '**/*.css'}
    //  https://www.browsersync.io/docs/api#api-stream
    //  http://stackoverflow.com/questions/31163754/browser-sync-does-not-refresh-page-after-changes-with-gulp
})

gulp.task('css', function () {
  gulp.src('./src/css/easychart.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([
      require('postcss-easy-import')({prefix: '_'}),
      require('postcss-apply')(),
      require('precss')(),
      require('postcss-cssnext')({ browsers: ['last 3 versions'] }),
      require('cssnano')()
    ]))
    .pipe(sourcemaps.write())
    .pipe(rename({
      dirname: 'css',
      basename: 'easychart',
      prefix: '',
      suffix: '.min',
      extname: '.css'
    }))
    //  .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.stream())
    //  .pipe(notify({message: 'postcss task complete :-)', onLast: true}))
})

gulp.task('pug:watch', ['pug'], function (done) {
  browserSync.reload()
  done()
})

gulp.task('css:watch', ['css'], function (done) {
  browserSync.reload()
  done()
})

gulp.task('serve', ['css', 'pug'], function () {
  // Serve files from the root of this project
  browserSync.init({
    server: {
      baseDir: './dist',
      directory: true
    },
    injectChanges: true
  })
  // add browserSync.reload to the tasks array to make
  // all browsers reload after tasks are complete.
  gulp.watch(pugDir, ['pug:watch'])
  gulp.watch(cssDir, ['css:watch'])
})

gulp.task('sass:watch', function () {
  gulp.watch('./src/scss/**/*.scss', ['sass'])
})

gulp.task('browserify:app', function () {
  return build('app', 'ec')
})

gulp.task('browserify:render', function () {
  return build('render', 'ec.render')
})

function build (file, output) {
  var bundler = browserify('./src/js/' + file + '.js', {
    fullPaths: false
  })
  return bundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(output + '.js'))
    .pipe(buffer())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(rename({
      extname: '.min.js'
    }))
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest('./dist'))
}

gulp.task('watchify:app', function () {
  return bundle('app', 'ec')
})

gulp.task('watchify:render', function () {
  return bundle('render', 'ec.render')
})

function bundle (file, output) {
  watchify.args.verbose = true
  watchify.args.poll = true
  var bundler = watchify(browserify('./src/js/' + file + '.js'), watchify.args)
  bundler.on('update', rebundle)
  bundler.on('log', gutil.log.bind(gutil))

  function rebundle () {
    return bundler.bundle()
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source(output + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({
        loadMaps: true
      })) // loads map from browserify file
      // Add transformation tasks to the pipeline here.
      .pipe(sourcemaps.write('./')) // writes .map file
      .pipe(gulp.dest('./dist'))
  }
  return rebundle()
}

gulp.task('build', ['sass', 'browserify:app', 'browserify:render'])
gulp.task('watch:app', ['sass:watch', 'watchify:app'])
gulp.task('watch:render', ['watchify:render'])
