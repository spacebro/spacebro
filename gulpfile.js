const gulp = require('gulp')
const babel = require('gulp-babel')

const scripts = 'src/**/*.js'

gulp.task('scripts', function () {
  return gulp.src(scripts)
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('dist'))
})

gulp.task('watch', function () {
  gulp.watch(scripts, ['scripts'])
})

gulp.task('default', ['watch', 'scripts'])
