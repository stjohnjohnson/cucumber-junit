/*jslint nomen: true */
var Y = require('yuitest'),
    Assert = Y.Assert,
    fs = require('fs'),
    path = require('path'),
    cucumber_junit;

function loadMockData(file) {
    return fs.readFileSync(path.join(__dirname, '/mocks/' + file)).toString().trim();
}

Y.TestRunner.add(new Y.TestCase({

    name : 'cucumber junit test',

    setUp: function () {
        cucumber_junit = require('../lib/cucumber_junit');
    },

    'conversion was successful': function () {
        var inputJson = loadMockData('input.json'),
            outputXml = loadMockData('output.xml');

        Assert.areEqual(outputXml, cucumber_junit(inputJson, { indent: '    ' }), 'XML is the same');
    },

    'conversion in strict mode': function () {
        var inputJson = loadMockData('input.json'),
            outputXml = loadMockData('output-strict.xml');

        Assert.areEqual(outputXml, cucumber_junit(inputJson, { indent: '    ', strict: true }), 'XML is the same');
    },

    'conversion support empty steps': function () {
        var emptyJson = loadMockData('empty_steps/input.json'),
            outputXml = loadMockData('empty_steps/output.xml');

        Assert.areEqual(outputXml, cucumber_junit(emptyJson, { indent: '    ' }), 'XML is the same');
    },

    'conversion supports empty data': function () {
        Assert.areEqual('<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n</testsuites>', cucumber_junit(' ', { indent: '    ' }), 'No input JSON == Empty XML');
    },

    'conversion supports empty array': function () {
        Assert.areEqual('<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n    <testsuite>\n    </testsuite>\n</testsuites>', cucumber_junit('[]', { indent: '    ' }), 'Empty Array Json == Empty Testcase XML');
    },

    'conversion support empty results': function () {
        var emptyJson = loadMockData('empty_result/input.json'),
            outputXml = loadMockData('empty_result/output.xml');

        Assert.areEqual(outputXml, cucumber_junit(emptyJson, { indent: '    ' }), 'XML is the same');
    }
}));
