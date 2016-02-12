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
 * Convert a step from Cucumber.JS into <testcase> XML
 *
 * @method convertStep
 * @param  {Object}    stepJson     Step output from Cucumber.JS
 * @param  {Object}    scenarioJson Scenario output from Cucumber.JS
 * @return {Array}                  Array of elements for an XML element <testcase>
 */
function convertStep (stepJson, scenarioJson) {
    var stepOutput = [{
            _attr: {
                name: stepJson.keyword + stepJson.name,
                classname: scenarioJson.id
            }
        }],
        result = stepJson.result || {};

    if (result.duration) {
        // Convert from nanosecond to seconds
        stepOutput[0]._attr.time = result.duration / 1000000000;
    }
    switch (result.status) {
        case 'passed':
            break;
        case 'failed':
            stepOutput.push({
                failure: [
                    {
                        _attr: {
                            message: result.error_message.split("\n").shift()
                        }
                    }, result.error_message
                ]
            });
            break;
        case 'skipped':
        case 'undefined':
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
 * @return {Array}                  Array of elements for an XML element <testsuite>
 */
function convertScenario (scenarioJson) {
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
            var testcase = convertStep(stepJson, scenarioJson);
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
 * [convertFeature description]
 * @method convertFeature
 * @param  {[type]}       featureJson [description]
 * @return {[type]}                   [description]
 */
function convertFeature(featureJson) {
    var elements = featureJson.elements || [];
    return elements
        .filter(function(scenarioJson) {
            return (scenarioJson.type !== 'background');
        })
        .map(function (scenarioJson) {
            var scenario = convertScenario(scenarioJson);
            if (featureJson.uri) {
                scenario.testsuite[1].properties.push(createProperty('URI', featureJson.uri));
            }
            return scenario;
        });
}

/**
 * [exports description]
 * @method exports
 * @param  {[type]} cucumberRaw [description]
 * @return {[type]}             [description]
 */
function cucumberJunit (cucumberRaw) {
    var cucumberJson,
        output = [];

    if (cucumberRaw && cucumberRaw.toString().trim() !== '') {
        cucumberJson = JSON.parse(cucumberRaw);
        cucumberJson.forEach(function (featureJson) {
            output = output.concat(convertFeature(featureJson));
        });

        // If no items, provide something
        if (output.length === 0) {
            output.push( { testsuite: [] } );
        }
    }

    // wrap all <testsuite> elements in <testsuites> element
    return xml({ testsuites: output }, {
        indent: '    ',
        declaration: { encoding: 'UTF-8' }
    });
};

module.exports = cucumberJunit;
