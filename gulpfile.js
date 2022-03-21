const gulp = require('gulp')
const nodemon = require('gulp-nodemon')
const babel = require('gulp-babel')
const Cache = require('gulp-file-cache')

const cache = new Cache()

gulp.task('compile', function () {
  var stream = gulp
    .src('./src/**/*.js') // your ES2015 code
    .pipe(cache.filter()) // remember files
    .pipe(babel({ presets: ['es2015'], plugins: ['transform-runtime'] })) // compile new ones
    .pipe(cache.cache()) // cache them
    .pipe(gulp.dest('./dist')) // write them
  return stream // important for gulp-nodemon to wait for completion
})

gulp.task('watch', function (done) {
  var stream = nodemon({
    script: 'index.js', // run ES5 code
    watch: 'src', // watch ES2015 code
    tasks: ['compile'],
    done: done // compile synchronously onChange
  })
  stream
    .on('restart', function () {
      console.log('restarted!')
    })
    .on('crash', function () {
      console.error('Application has crashed!\n')
      stream.emit('restart', 10) // restart the server in 10 seconds
    })
})

gulp.task('default', gulp.series('watch', 'compile'))
