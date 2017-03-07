#!/usr/bin/env node

'use strict';

let gulp = require('gulp');
let browserSync = require('browser-sync');
let beml = require('gulp-beml');
let concat = require('gulp-concat');
let uglify = require('gulp-uglifyjs');
let cssnano = require('gulp-cssnano');

let handlebars = require('handlebars');
let gulpHandlebars = require('gulp-compile-handlebars');
let rename = require('gulp-rename');

let stylus = require('gulp-stylus');
let wrap = require('gulp-wrap');
let declare = require('gulp-declare');
let prettyTime = require('pretty-hrtime');
let chalk = require('chalk');
let gutil = require('gulp-util');
let failed = false;

// options

// Format orchestrator errors
function formatError(e) {
    if (!e.err) {
        return e.message;
    }

    // PluginError
    if (typeof e.err.showStack === 'boolean') {
        return e.err.toString();
    }

    // Normal error
    if (e.err.stack) {
        return e.err.stack;
    }

    // Unknown (string, number, etc.)
    return new Error(String(e.err)).stack;
}

// Total hack due to poor error management in orchestrator
gulp.on('err', function() {
    failed = true;
});

gulp.on('task_start', function(e) {
    // TODO: batch these
    // so when 5 tasks start at once it only logs one time with all 5
    gutil.log('Starting', '\'' + chalk.cyan(e.task) + '\'...');
});

gulp.on('task_stop', function(e) {
    let time = prettyTime(e.hrDuration);
    gutil.log(
        'Finished', '\'' + chalk.cyan(e.task) + '\'',
        'after', chalk.magenta(time)
    );
});

gulp.on('task_err', function(e) {
    let msg = formatError(e);
    let time = prettyTime(e.hrDuration);
    gutil.log(
        '\'' + chalk.cyan(e.task) + '\'',
        chalk.red('errored after'),
        chalk.magenta(time)
    );
    gutil.log(msg);
});

gulp.on('task_not_found', function(err) {
    gutil.log(
        chalk.red('Task \'' + err.task + '\' is not in your gulpfile')
    );
    gutil.log('Please check the documentation for proper gulpfile formatting');
    process.exit(1);
});

// options

gulp.task('beml', function () {
    var templateData = {
        firstName: 'Poly-Bem.js'
    },
    options = {
        ignorePartials: true,
        partials : {},
        batch : ['assets/section'],
        helpers : {
            capitals : function(str){
                return str.toUpperCase();
            }
        }
    }
    return gulp.src('assets/layout.hbs')
        .pipe(gulpHandlebars(templateData, options))
        .pipe(beml())
        .pipe(rename('index.html'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('styl', function () {
    return gulp.src('assets/css/style.styl')
        .pipe(stylus())
        .pipe(gulp.dest('assets/css'))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.reload({stream: true}))
});

gulp.task('scripts', function() {
    return gulp.src([
        'assets/plugins/jquery/dist/jquery.min.js'
        ])
        .pipe(concat('plugins.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('assets/js'))
        .pipe(gulp.dest('dist/js'));
});

gulp.task('css-libs', ['styl'], function() {
    return gulp.src('assets/css/libs.css')
        .pipe(cssnano())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('assets/css'))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('all-scripts', function() {
    return gulp.src('assets/js/main.js')
        .pipe(gulp.dest('assets/js/'))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: './dist/'
        },
        notify: false
    });
});


gulp.task('watch', ['browser-sync', 'styl', 'css-libs', 'scripts', 'all-scripts', 'beml'], function() {
    gulp.watch('./assets/**/*.styl', ['styl']);
    gulp.watch('./assets/**/*.hbs', ['beml'], browserSync.reload);
    gulp.watch('./dist/**/*.html', browserSync.reload);
    gulp.watch('./assets/**/*.js', ['all-scripts'], browserSync.reload);
});

gulp.start('watch');
