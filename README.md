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
$ node_modules/.bin/cucumber-js --format=json | cucumber-junit > output_JUnit.xml
```

## License

[MIT](http://opensource.org/licenses/MIT) © [St. John Johnson](http://stjohnjohnson.com)
