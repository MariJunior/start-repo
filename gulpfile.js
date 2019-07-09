/* global exports process */
/* eslint-disable no-console */
'use strict';

const {series, parallel, src, dest, watch} = require('gulp');
const path = require('path');
const del = require('del');
const htmlprettify = require('gulp-html-prettify');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const minify = require('gulp-csso');
const rename = require('gulp-rename');
const server = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify');
const ghpages = require('gh-pages');

// Удаление директории 'build'
function clean() {
  return del('build');
}

// Копирование неизменяемых файлов из директории 'source' в директорию 'build'
function copy() {
  return src([
    'source/fonts/**/*.{woff,woff2,eot,ttf}',
    // 'source/img/favicons/*.{ico}',
    // 'source/img/favicons/site.webmanifest'
  ], {
    base: 'source'
  })
    .pipe(dest('build'));
}

// Подключение плагина 'gulp-pug' и компиляция всех основных .pug файлов из директории 'source' в .html, их сохранение в директории 'build', последующая антиминификация и начало отслеживания изменений
function html() {
  return src('source/pages/*.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(htmlprettify({
      indent_char: ' ',
      indent_size: 2
    }))
    .pipe(dest('build'))
    .pipe(server.stream());
}

// Преобразование файлов стилей:
// 1. Получение основного файла стилей - 'style.less' из директории 'source/less'
// 2. Подключение 'gulp-plumber' для отслеживания возможных ошибок и формирования вывода сообщения о них (без прерывания работы таска)
// 3. Подключение 'gulp-less' для компиляции 'style.less' в 'style.css'
// 4. Подключение 'gulp-postcss' и его плагина 'autoprefixer' для добавления вендорных префиксов в нужных местах с учётом последних 4-х версий популярных браузеров
// 5. Сохранение полученного файла в директорию 'build/css'
// 6. Минификация стилей
// 7. Переименование минифицированного файла стилей в 'style.min.css'
// 8. Сохранение полученного файла в директорию 'build/css'
// 9. Подключение локального сервера с помощью 'browser-sync' и начало отслеживания изменений
function style() {
  return src('source/less/style.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 3 versions']
      })
    ]))
    .pipe(dest('build/css'))
    .pipe(minify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('build/css'))
    .pipe(server.stream());
}

// Оптимизация графики:
// 1. Получение всех файлов с расширениями '.jpg', '.png' и '.svg' из директории 'source/img' на любом уровне
// 2. Подключение 'gulp-imagemin' и его настройка: уровень сжатия png = 3 (из 10); для jpg использовать прогрессивное сжатие; для svg не удалять атрибут viewBox и запретить краткий формат записи hex-цветов
// 3. Сохранение преобразованных изображений в директиву 'build/img'
function images() {
  return src(['source/img/**/*.{png,jpg,svg}'/* , '!source/img/sprite.svg' */])
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo({
        plugins: [
            {removeViewBox: false},
            {convertColors: {shorthex: false}}
        ]
      })
    ]))
    .pipe(dest('build/img'));
}

// Сборка js c webpack, последующая минификация полученного .js файла и сохранение в директорию 'build/js'
function buildJs() {
  return src('source/js/script.js')
    .pipe(plumber())
    .pipe(webpackStream({
      mode: 'production',
      output: {
        filename: 'script.js',
      },
      module: {
        rules: [
          {
            test: /\.(js)$/,
            exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    'targets': {
                      'browsers': ["> 1%", "last 3 versions"]
                    },
                    'debug': true,
                    "corejs": "3.0.0",
                    'useBuiltIns': 'usage'
                  }
                ]
              ]
            }
          }
        ]
      },
      optimization: {
        minimize: false
      },
      // externals: {
      //   jquery: 'jQuery'
      // }
    }))
    .pipe(dest('build/js'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest('build/js'));
}

function reload(done) {
  server.reload();
  done();
}

function deploy(cb) {
  ghpages.publish(path.join(process.cwd(), './build'), cb);
}

exports.clean = clean;
exports.copy = copy;
exports.html = html;
exports.style = style;
exports.images = images;
exports.buildJs = buildJs;
exports.deploy = deploy;

// Подключение плагина 'browser-sync' и начало отслеживания изменений файлов в директории 'build/', выполнения соотв. задач и перезагрузки страницы
function serve() {
  server.init({
    // browser: 'google chrome',
    server: 'build/',
    startPath: 'index.html',
    notify: false,
    open: false,
    cors: true,
    ui: false
  });

  watch(['source/pages/**/*.pug', 'source/pug/**/*.pug'], { events: ['add', 'change', 'unlink'], delay: 50 }, series(
    html,
    reload
  ));
  watch(['source/less/**/*.less'], { events: ['add', 'change', 'unlink'], delay: 50 }, series(
    style,
    reload
  ));
  watch(['source/js/**/*.js'], { events: ['add', 'change', 'unlink'], delay: 50 }, series(
    buildJs,
    reload
  ));
  watch(['source/img/*'], { events: ['all'], delay: 50 }, series(
    images,
    reload
  ))
}

exports.build = series(
  clean,
  parallel(copy, images),
  parallel(html, style, buildJs)
);

exports.default = series(
  clean,
  parallel(copy, images),
  parallel(html, style, buildJs),
  serve
);
