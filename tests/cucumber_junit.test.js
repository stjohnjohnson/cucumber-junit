/*jslint nomen: true */
var Y = require('yuitest'),
    Assert = Y.Assert,
    fs = require('fs'),
    path = require('path'),
    cucumber_junit;

Y.TestRunner.add(new Y.TestCase({

    name : 'cucumber junit test',

    setUp: function () {
        cucumber_junit = require('../lib/cucumber_junit');
    },

    'conversion was successful': function () {
        var inputJson = fs.readFileSync(path.join(__dirname, '/mocks/input.json')),
            outputXml = fs.readFileSync(path.join(__dirname, '/mocks/output.xml'));

        Assert.areEqual(outputXml, cucumber_junit(inputJson, { indent: '    ' }), 'XML is the same');
    },

    'conversion support emprty steps': function () {
        var emptyJson = fs.readFileSync(path.join(__dirname, '/mocks/empty_steps.json')),
            outputXml = fs.readFileSync(path.join(__dirname, '/mocks/empty_output.xml'));

        Assert.areEqual(outputXml, cucumber_junit(emptyJson, { indent: '    ' }), 'XML is the same');
    },

    'conversion supports empty data': function () {
        Assert.areEqual('<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n</testsuites>', cucumber_junit(' ', { indent: '    ' }), 'No input JSON == Empty XML');
    },

    'conversion supports empty array': function () {
        Assert.areEqual('<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n    <testsuite>\n    </testsuite>\n</testsuites>', cucumber_junit('[]', { indent: '    ' }), 'Empty Array Json == Empty Testcase XML');
    }
}));
