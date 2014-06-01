var args = require('yargs').argv;
var concat = require('gulp-concat');
var glob = require("glob");
var gulp = require('gulp');
var less = require('gulp-less');
var minify = require('gulp-minify-css');
var shell = require('gulp-shell');
var uglify = require('gulp-uglify');
var fs = require('fs');

/******* Locale processage */

var locales = glob.sync("i18n/*.json").map(function(filename){return filename.split("/")[1].replace(".json", "");}).sort();
var messageformatExecutable = fs.realpathSync("./node_modules/.bin/messageformat");

locales.forEach(function(locale) {
	gulp.task("i18n-js:" + locale, shell.task([messageformatExecutable + ' --locale $ --include $.json --output i18n.$.js'.replace(/\$/g, locale)], {cwd: 'i18n'}));
});

gulp.task("i18n-js", locales.map(function(l) { return "i18n-js:" + l; }));

/******* Javascript buildage */

var locale = args.locale;

if(!locale) {
	console.error("You haven't set a locale for the build. Use --locale (" + locales.join("|") + ") to set one.");
	process.exit(1);
}

if(locales.indexOf(locale) == -1) {
	console.error("I only know of locales " + locales.join(", ") + " -- your locale setting " + locale + " is not one of them.");
	process.exit(1);
}

console.log("** Locale for Konopas build:", locale);

var jsFiles = [
	"src/polyfill.js",
	"i18n/i18n." + locale + ".js",
	"src/server.js",
	"src/stars.js",
	"src/app.js"
];

// Higher-order Gulp :)
function _jsTask(targetFile, uglifyOptions) {
	return function() {
		return gulp.src(jsFiles)
			.pipe(uglify(uglifyOptions || {}))
			.pipe(concat(targetFile))
			.pipe(gulp.dest('.'));
	};
}

gulp.task('js-min', ["i18n-js:" + locale], _jsTask('konopas.' + locale + '.min.js'));
gulp.task('js-dev', ["i18n-js:" + locale], _jsTask('konopas.' + locale + '.js', {mangle: false, output: {beautify: true}, compress: false}));

/******* CSS buildage */

gulp.task("css", function() {
	return gulp.src(["skin/main.less"])
		.pipe(less({compress: true}))
		.pipe(concat("skin.css"))
		.pipe(gulp.dest("skin"));
});

/******* Watchage */

gulp.task('watch', function() {
	gulp.watch(["skin/*.less"], ["css"]);
	gulp.watch(["i18n/*.json"], ["i18n-js"]);
	gulp.watch(jsFiles, ["js-dev"]);
});

/******* Helpage */


gulp.task('default', function() {
	console.log("Use the `--locale` switch to build Konopas in a given language.");
	console.log("* js-min  -- build `konopas.LANG.min.js`, suitable for production");
	console.log("* js-dev  -- build `konopas.js`, suitable for development");
	console.log("* css     -- build `skin/skin.css` from LESS files");
	console.log("* i18n-js -- build all message catalogs (you shouldn't need to do this by hand)");
	console.log("* watch   -- build `i18n-js`, `js-dev` and `css` when their source files change");
});