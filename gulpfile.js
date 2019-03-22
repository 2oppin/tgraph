const { src, dest } = require('gulp');
const mini = require('gulp-minify');

function defaultTask(cb) {
    return src('src/*.js')
        .pipe(mini())
        .pipe(dest('dist/'));
}

exports.default = defaultTask;