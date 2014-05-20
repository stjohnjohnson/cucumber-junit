var xml = require('xml');

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
        }];

    if (stepJson.result.duration) {
        // Convert from nanosecond to seconds
        stepOutput[0]._attr.time = stepJson.result.duration / 1000000000;
    }
    switch (stepJson.result.status) {
        case 'passed':
            break;
        case 'failed':
            stepOutput.push({
                error: [
                    {
                        _attr: {
                            message: stepJson.result.error_message.split("\n").shift()
                        }
                    }, stepJson.result.error_message
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
                tests: scenarioJson.steps.length,
                failures: 0,
                skipped: 0
            }
        }];

    scenarioJson.steps.forEach(function (stepJson) {
        var testcase = convertStep(stepJson, scenarioJson);
        // Check for errors and increment the failure rate
        if (testcase[1] && testcase[1].error) {
            scenarioOutput[0]._attr.failures += 1;
        }
        if (testcase[1] && testcase[1].skipped) {
            scenarioOutput[0]._attr.skipped += 1;
        }
        scenarioOutput.push({ testcase: testcase });
    });

    return { testsuite: scenarioOutput };
}

/**
 * [convertFeature description]
 * @method convertFeature
 * @param  {[type]}       featureJson [description]
 * @return {[type]}                   [description]
 */
function convertFeature(featureJson) {
    return featureJson.elements.map(function (scenarioJson) {
        return convertScenario(scenarioJson);
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

    return xml(output, { indent: '    ' });
}

module.exports = cucumberJunit;