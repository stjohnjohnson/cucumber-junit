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

function convertFeature(featureJson) {
    return featureJson.elements.map(function (scenarioJson) {
        return convertScenario(scenarioJson);
    });
}

module.exports = function (cucumberRaw) {
    var cucumberJson = JSON.parse(cucumberRaw),
        output = [];

    cucumberJson.forEach(function (featureJson) {
        output = output.concat(convertFeature(featureJson));
    });

    return xml(output, { indent: '    ' });
};