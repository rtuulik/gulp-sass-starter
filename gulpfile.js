const { src, dest, watch, series, parallel, lastRun } = require("gulp"); // Importing specific gulp API functions lets us write them below as series() instead of gulp.series() and gulp.tasks
const sass = require("gulp-dart-sass"); //  compiles SCSS to CSS
const postcss = require("gulp-postcss"); // runs autoprefixer and cssnano
const dependents = require("gulp-dependents");
const cssnano = require("cssnano"); // minifies CSS
const concat = require("gulp-concat"); // concatenates multiple files into one file
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps"); // maps the CSS styles back to the original SCSS file in your browser dev tools
const del = require("del"); // Delete files and directories using globs

const terser = require("gulp-terser"); // minifies JS. gulp-uglify doesn´t support ES6 syntax
const order = require("gulp-order");

const cssRoot = "src/sass";
const jsRoot = "src/js";
const dist = "dist";

const glob = {
	sass: [`${cssRoot}/*.scss`, `${cssRoot}/**/*.scss`],
	sassDist: `${dist}/css`,
	js: [`${jsRoot}/*.js`, `${jsRoot}/**/*.js`],
	jsDist: `${dist}/js`,
};

// the 'clean' task deletes the generated files
const clean = () => {
	return del(["dist/"]);
};

const compileCSS = cb => {
	//	return src("sass/**/*.scss") // create a stream for reading all SCSS files
	return src(glob.sass, { since: lastRun(compileCSS) }) // filter only changed files
		.pipe(dependents()) // find sass files to re-compile
		.pipe(sourcemaps.init()) // sourcemaps needs to be added first after src()
		.pipe(sass().on("error", sass.logError)) // does the compiling of all the SCSS files to one CSS file
		.pipe(postcss([cssnano()])) // postcss() runs two other plugins, autoprefixer() to add vendor prefixes & cssnano() to minify the CSS file
		.pipe(concat("main.css")) // concatenate all the css files into one css file
		.pipe(rename({ suffix: ".min" })) // rename file to minified
		.pipe(sourcemaps.write(".")) // creates the sourcemaps file in the same directory.
		.pipe(dest(glob.sassDist)) // pass the compiled data to the dest()
		.on("end", cb);
};

// JS task: concatenates and minifies JS files to script.js
const compileJS = () => {
	return src(glob.js, { since: lastRun(compileJS) })
		.pipe(
			order([
				// prettier-ignore
				// When passing gulp.src stream directly to order, don't include path source/scripts in the order paths. They should be relative to the /**/*.js. ex. "vendor/js1.js".
				"script.js",
				"**/*.js",
			]),
		)
		.pipe(concat("main.js")) // concatenate all the JS files into one JS file
		.pipe(terser()) // minify the JS file. gulp-uglify doesn´t support ES6 syntax
		.pipe(rename({ suffix: ".min" }))
		.pipe(dest(glob.jsDist)); // move the final JS file into the /dist folder
};

const watchCSS = () => {
	watch(glob.sass, compileCSS);
};

const watchJS = () => {
	watch(glob.js, compileJS);
};

exports.clean = clean;
exports.compileCSS = compileCSS;
exports.compileJS = compileJS;
exports.watchCSS = watchCSS;
exports.watchJS = watchJS;
// default task is a task that is executed if no task name is specified with Gulp CLI. It runs series tasks in sequential order and parrallel tasks sequentially
// prettier-ignore
exports.default = series(
	clean,
	parallel(compileCSS, compileJS),
	parallel(watchCSS, watchJS),
);
