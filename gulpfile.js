var gulp = require('gulp'),
    sass = require('gulp-sass'),
    browserSync = require('browser-sync'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify-es').default,
    cleancss = require('gulp-clean-css'),
    autoprefixer = require('gulp-autoprefixer'),
    rsync = require('gulp-rsync'),
    newer = require('gulp-newer'),
    rename = require('gulp-rename'),
    responsive = require('gulp-responsive'),
    del = require('del');

// Local Server
gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: 'app'
        },
        notify: false,
        // online: false, // Work offline without internet connection
        // tunnel: true, tunnel: 'evo-site-demos', // Demonstration page: http://projectname.localtunnel.me
    })
});

function bsReload(done) {
    browserSync.reload();
    done();
};

// Custom Styles
gulp.task('styles', function () {
    return gulp.src('app/sass/**/*.sass')
        .pipe(sass({
            outputStyle: 'expanded',
            includePaths: [__dirname + '/node_modules']
        }))
        .pipe(concat('styles.min.css'))
        .pipe(autoprefixer({
            grid: true,
            overrideBrowserslist: ['last 10 versions']
        }))
        .pipe(cleancss({level: {1: {specialComments: 0}}})) // Optional. Comment out when debugging
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.stream())
});

// Библиотеки css
gulp.task('cssLibs', function () {
    return gulp.src('app/libs/**/*.sass')
        .pipe(sass({
            outputStyle: 'expanded',
            includePaths: [__dirname + '/node_modules']
        }))
        .pipe(concat('libs.min.css'))
        .pipe(gulp.dest('dist/css'))
});

// Scripts & JS Libraries
gulp.task('scripts', function () {
    return gulp.src([
        // 'node_modules/jquery/dist/jquery.min.js', // Optional jQuery plug-in (npm i --save-dev jquery)
        'app/js/_libs.js', // JS libraries (all in one)
        'app/js/_custom.js', // Custom scripts. Always at the end
    ])
        .pipe(concat('scripts.min.js'))
        .pipe(uglify()) // Minify js (opt.)
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({stream: true}))
});

// Responsive Images
var quality = 95; // Responsive images quality

// Produce @1x images
gulp.task('img-responsive-1x', async function () {
    return gulp.src('app/img/_src/**/*.{png,jpg,jpeg,webp,raw}')
        .pipe(newer('app/img/@1x'))
        .pipe(responsive({
            '**/*': {width: '50%', quality: quality}
        })).on('error', function (e) {
            console.log(e)
        })
        .pipe(rename(function (path) {
            path.extname = path.extname.replace('jpeg', 'jpg')
        }))
        .pipe(gulp.dest('app/img/@1x'))
});
// Produce @2x images
gulp.task('img-responsive-2x', async function () {
    return gulp.src('app/img/_src/**/*.{png,jpg,jpeg,webp,raw}')
        .pipe(newer('app/img/@2x'))
        .pipe(responsive({
            '**/*': {width: '100%', quality: quality}
        })).on('error', function (e) {
            console.log(e)
        })
        .pipe(rename(function (path) {
            path.extname = path.extname.replace('jpeg', 'jpg')
        }))
        .pipe(gulp.dest('app/img/@2x'))
});
gulp.task('img', gulp.series('img-responsive-1x', 'img-responsive-2x', bsReload));

// Clean @*x IMG's
gulp.task('cleanimg', function () {
    return del(['app/img/@*'], {force: true})
});

// Code & Reload
gulp.task('code', function () {
    return gulp.src('app/**/*.html')
        .pipe(browserSync.reload({stream: true}))
});

// Deploy
gulp.task('rsync', function () {
    return gulp.src('app/')
        .pipe(rsync({
            root: 'app/',
            hostname: 'username@yousite.com',
            destination: 'yousite/public_html/',
            // include: ['*.htaccess'], // Included files
            exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excluded files
            recursive: true,
            archive: true,
            silent: false,
            compress: true
        }))
});

/* ============================== Build START ==================================*/

// Переместить в прод папку минифицированый файл стилей
gulp.task('buildCss', function () {
    return gulp.src('app/css/**/*.css').pipe(gulp.dest('dist/css'));
});

// Переместить в прод папку минифицированый файл скриптов js
gulp.task('buildJs', function () {
    return gulp.src('app/js/scripts.min.js').pipe(gulp.dest('dist/js'));
});

// Переместить в прод папку обработаные изображения
gulp.task('buildImg', function () {
    return gulp.src([
        'app/img/**/*.{png,jpg,jpeg,webp,raw}',
        '!app/img/_src/**/*.{png,jpg,jpeg,webp,raw}' // Кроме
    ]).pipe(gulp.dest('dist/img'));
});

// Переместить в прод папку шрифты
gulp.task('buildFonts', function () {
    return gulp.src([
        'app/fonts/**/*.woff2',
        '!app/fonts/_src/**/*' // Кроме
    ]).pipe(gulp.dest('dist/fonts'));
});

// Переместить в прод папку .htaccess
gulp.task('buildConfig', function () {
    return gulp.src('app/ht.access').pipe(gulp.dest('dist'));
});

// Переместить в прод папку все html файлы
gulp.task('buildHtml', function () {
    return gulp.src('app/**/*.html').pipe(gulp.dest('dist'));
});

// Удалить прод папку перед каждым билдом
gulp.task('delete', function () {
    return del('dist', {force: true})
});

/* ============================== Build END ==================================*/

/* ============================== Общий билд из тасков выше START ==================================*/
gulp.task('build', gulp.series('delete', 'buildCss', 'cssLibs', 'buildJs', 'buildImg', 'buildFonts', 'buildConfig', 'buildHtml'));
/* ============================== Общий билд из тасков выше END ==================================*/

gulp.task('watch', function () {
    gulp.watch('app/sass/**/*.sass', gulp.parallel('styles'));
    gulp.watch(['app/js/_custom.js', 'app/js/_libs.js'], gulp.parallel('scripts'));
    gulp.watch('app/*.html', gulp.parallel('code'));
    gulp.watch('app/img/_src/**/*', gulp.parallel('img'));
});

gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'browser-sync', 'watch'));
