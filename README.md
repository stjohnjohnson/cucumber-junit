# cucumber-junit

[![wercker status](https://app.wercker.com/status/a4b60396ae8a91bf223f44cdac8e09df/m "wercker status")](https://app.wercker.com/project/bykey/a4b60396ae8a91bf223f44cdac8e09df)

Converts CucumberJS JSON output into JUnitXML for software like Jenkins to read.

## Install

cucumber-junit should be added to your test codebase as a dev dependency.  You can do this with:

``` shell
$ npm install --save-dev cucumber-junit
```

Alternatively you can manually add it to your package.json file:

``` json
{
  "devDependencies" : {
    "cucumber-junit": "latest"
  }
}
```

then install with:

``` shell
$ npm install --dev
```

## Run

cucumber-junit should be appended to your existing Cucumber.JS commands

``` shell
$ node_modules/.bin/cucumber-js --format=json | node_modules/.bin/cucumber-junit > output_JUnit.xml
```

The following options are supported by `lib/cucumber_junit`:

* strict - if true, pending or undefined steps will be reported as failures
* indent - passed to the [XML formatter][XML], defaults to 4 spaces
* stream - passed to the [XML formatter][XML] to return the result as a stream
* declaration - passed to the [XML formatter][XML]
* prefix - added to each test suite name (if test are executed against multiple browsers/devices)

These options can be specified on the command line when calling `.bin/cucumber-junit`:

* `-s` or `--strict`
* `-i 4` or `--indent 4` 
* `-e UTF-8` or `--encoding "UTF-*"` - applied to the XML declaration 

## Gulp

cucumber-junit can be called from [Gulp](http://gulpjs.com/):

```javascript
gulp.task('cucumber:report', ['cucumber'], function() {
    gulp.src('test-reports/cucumber.json')
        .pipe(cucumberXmlReport({strict: true}))
        .pipe(gulp.dest('test-reports'));
});

function cucumberXmlReport(opts) {
    var gutil = require('gulp-util'),
        through = require('through2'),
        cucumberJunit = require('cucumber-junit');
    
    return through.obj(function (file, enc, cb) {
        // If tests are executed against multiple browsers/devices
        var suffix = file.path.match(/\/cucumber-?(.*)\.json/);
        if (suffix) {
            opts.prefix = suffix[1] + ';';
        }
        
        var xml = cucumberJunit(file.contents, opts);
        file.contents = new Buffer(xml);
        file.path = gutil.replaceExtension(file.path, '.xml');
        cb(null, file);
    });
}
```

## License

[MIT](http://opensource.org/licenses/MIT) © [St. John Johnson](http://stjohnjohnson.com)
[XML]: https://www.npmjs.com/package/xml#options
