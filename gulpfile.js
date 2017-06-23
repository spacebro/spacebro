const gulp = require('gulp')
const nodemon = require('gulp-nodemon')
const babel = require('gulp-babel')
const Cache = require('gulp-file-cache')

gulp.task('default', ['watch', 'compile'])

var cache = new Cache();

gulp.task('compile', function () {
  var stream = gulp.src('./src/**/*.js') // your ES2015 code
                   .pipe(cache.filter()) // remember files
                   .pipe(babel({ presets: ['es2015'], plugins: ['transform-runtime'] })) // compile new ones
                   .pipe(cache.cache()) // cache them
                   .pipe(gulp.dest('./dist')) // write them
  return stream // important for gulp-nodemon to wait for completion
})

gulp.task('watch', ['compile'], function () {
  var stream = nodemon({
                 script: 'index.js' // run ES5 code
               , watch: 'src' // watch ES2015 code
               , tasks: ['compile'] // compile synchronously onChange
               })

  return stream
})