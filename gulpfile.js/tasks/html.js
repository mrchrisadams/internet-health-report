var config       = require('../config')
if(!config.tasks.html) return

var browserSync  = require('browser-sync');
var data         = require('gulp-data');
var gulp         = require('gulp');
var gulpif       = require('gulp-if');
var handleErrors = require('../lib/handleErrors');
var htmlmin      = require('gulp-htmlmin');
var path         = require('path');
var render       = require('gulp-nunjucks-render');
var properties   = require('properties-parser');
var exclude      = path.normalize('!**/{' + config.tasks.html.excludeFolders.join(',') + '}/**');

var getData = function(langFolder) {
  var dataPath = path.resolve(config.root.src, config.tasks.html.src, '_locales/' + langFolder + '/content.properties')
  return properties.read(dataPath);
}

var manageEnvironment = function(environment) {
  environment.addFilter('lines', function(str) {
    if (str === undefined) {
      str = '';
    }
    return '<p>' + str.replace(/\r|\n|\r\n/g, '</p><p>') + '</p>';
  });
};

var compileLanguageTask = function(language) {
  var src = [path.join(config.root.src, config.tasks.html.src, '/**/*.{' + ["html", "json"] + '}'), exclude];
  var dest = language === 'en-us' ? path.join(config.root.dest, config.tasks.html.dest) : path.join(config.root.dest, config.tasks.html.dest, language);

  return gulp.src(src)
    .pipe(data(getData(language)))
    .on('error', handleErrors)
    .pipe(render({
      manageEnv: manageEnvironment,
      path: [path.join(config.root.src, config.tasks.html.src)],
      envOptions: {
        watch: false,
        autoescape: false
      }
    }))
    .on('error', handleErrors)
    .pipe(gulpif(global.production, htmlmin(config.tasks.html.htmlmin)))
    .pipe(gulp.dest(dest))
    .on('end', browserSync.reload)
}

var languages = ["en-us", "fr"];
var htmlLangTask = function() {
  languages.forEach(function(langString) {
    compileLanguageTask(langString);
  });
}

gulp.task('html', htmlLangTask)
module.exports = htmlLangTask
