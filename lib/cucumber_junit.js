var xml = require('xml');

/**
 * Creates a <property> element with the given name and value
 *
 * @method createProperty
 * @param  {String} name    <property>'s name attribute
 * @param  {String} value   <property>'s value attribute
 * @return {Object}         The <property> element
 */
function createProperty(name, value) {
    return {
        property: [{
            _attr: {
                name: name,
                value: value
            }
        }]
    };
}

/**
 * Creates a <failure> element with an failure message
 *
 * @method createFailure
 * @param message           result.error_message or result.status
 * @returns {Object}        The <failure> element
 */
function createFailure(message) {
    return {
        failure: [
            { _attr: { message: message.split("\n").shift() } },
            message
        ]
    };
}

/**
 * Convert a step from Cucumber.JS into <testcase> XML
 *
 * @method convertStep
 * @param  {Object}    stepJson     Step output from Cucumber.JS
 * @param  {Object}    scenarioJson Scenario output from Cucumber.JS
 * @param  {Object}    options      if `strict` is true, pending or undefined steps will be reported as failures
 * @return {Array}                  Array of elements for an XML element <testcase>
 */
function convertStep (stepJson, scenarioJson, options) {
    var stepOutput = [{
            _attr: {
                name: stepJson.keyword + stepJson.name,
                classname: scenarioJson.id
            }
        }],
        result = stepJson.result || {};

    if (options.prefix) {
        stepOutput[0]._attr.name = options.prefix + stepOutput[0]._attr.name;
    }

    if (result.duration) {
        // Convert from nanosecond to seconds
        stepOutput[0]._attr.time = result.duration / 1000000000;
    }
    switch (result.status) {
        case 'passed':
            break;
        case 'failed':
            stepOutput.push(createFailure(result.error_message));
            break;
        case 'pending':
        case 'undefined':
            if (options.strict) {
                stepOutput.push(createFailure(result.status == 'pending' ? 'Pending' :
                        'Undefined step. Implement with the following snippet:\n' +
                        '  this.' + stepJson.keyword.trim() + '(/^' + stepJson.name + '$/, function(callback) {\n' +
                        '      // Write code here that turns the phrase above into concrete actions\n' +
                        '      callback(null, \'pending\');\n' +
                        '  });'
                ));
                break;
            }
            // else fall through
        case 'skipped':
            stepOutput.push({
                skipped: [
                    {
                        _attr: {
                            message: ""
                        }
                    }
                ]
            });
            break;
    }
    return stepOutput;
}


/**
 * Convert a scenario from Cucumber.JS into an XML element <testsuite>
 *
 * @method convertScenario
 * @param  {Object}    scenarioJson Scenario output from Cucumber.JS
 * @param  {Object}    options      if `strict` is true, pending or undefined steps will be reported as failures.
 *                                  if `prefix` is provided, it will be added to the testsuite name.
 * @return {Array}                  Array of elements for an XML element <testsuite>
 */
function convertScenario (scenarioJson, options) {
    var scenarioOutput = [{
            _attr: {
                name: scenarioJson.id,
                tests: 0,
                failures: 0,
                skipped: 0
            }
        }, {
            properties: []
        }];
    if(options.prefix) {
        scenarioOutput[0]._attr.name = options.prefix + scenarioOutput[0]._attr.name;
    }

    if(scenarioJson.tags) {
        scenarioJson.tags.forEach(function (tagJson) {
            var tag = (typeof tagJson == "string" ? tagJson : tagJson.name);
            scenarioOutput[1].properties.push(createProperty(tag, true));
        });
    }
    if(scenarioJson.properties) {
        for (var propertyName in scenarioJson.properties) {
            if (scenarioJson.properties.hasOwnProperty(propertyName)) {
                scenarioOutput[1].properties.push(createProperty(
                    propertyName, scenarioJson.properties[propertyName]
                ));
            }
        }
    }
    if(scenarioJson.steps) {
        scenarioJson.steps
        .filter(function (stepJson) {
          return !stepJson.hidden;
        })
        .forEach(function (stepJson) {
            // Step passed the filter, incrementing the counter
            scenarioOutput[0]._attr.tests += 1;
            var testcase = convertStep(stepJson, scenarioJson, options);
            // Check for errors and increment the failure rate
            if (testcase[1] && testcase[1].failure) {
                scenarioOutput[0]._attr.failures += 1;
            }
            if (testcase[1] && testcase[1].skipped) {
                scenarioOutput[0]._attr.skipped += 1;
            }
            scenarioOutput.push({ testcase: testcase });
        });
    }

    return { testsuite: scenarioOutput };
}

/**
 * Skips background steps and calls `convertScenario` each element
 */
function convertFeature(featureJson, options) {
    var elements = featureJson.elements || [];
    return elements
        .filter(function(scenarioJson) {
            return (scenarioJson.type !== 'background');
        })
        .map(function (scenarioJson) {
            var scenario = convertScenario(scenarioJson, options);
            if (featureJson.uri) {
                scenario.testsuite[1].properties.push(createProperty('URI', featureJson.uri));
            }
            return scenario;
        });
}

/**
 * options:
 *  - indent - passed to the XML formatter, defaults to 4 spaces
 *  - stream - passed to the XML formatter
 *  - declaration - passed to the XML formatter
 *  - strict - if true, pending or undefined steps will be reported as failures
 *
 * @method exports
 * @param  {string} cucumberRaw  the Cucumber JSON report
 * @param  {object=} options     eg: {indent: boolean, strict: boolean, stream: boolean, declaration: {encoding: 'UTF-8'}}
 * @return {string} the JUnit XML report
 */
function cucumberJunit (cucumberRaw, options) {
    var cucumberJson,
        output = [];
    options = options || {};
    if (options.indent === undefined) {
        options.indent = '    ';
    }
    if (!options.declaration) {
        options.declaration = { encoding: 'UTF-8' };
    }


    if (cucumberRaw && cucumberRaw.toString().trim() !== '') {
        cucumberJson = JSON.parse(cucumberRaw);
        cucumberJson.forEach(function (featureJson) {
            output = output.concat(convertFeature(featureJson, options));
        });

        // If no items, provide something
        if (output.length === 0) {
            output.push( { testsuite: [] } );
        }
    }

    // wrap all <testsuite> elements in <testsuites> element
    return xml({ testsuites: output }, options);
};

module.exports = cucumberJunit;
