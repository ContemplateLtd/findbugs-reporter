/*jslint node: true*/
/*global $:true, console, window:true, assert, parser:true*/

//Test framework
var buster = require("buster");
buster.spec.expose();

//Jquery stuff
var jsdom = require("jsdom");
var doc = jsdom.jsdom("<!DOCTYPE html><html/>", jsdom.level(1, "core"));
window = doc.createWindow();
$ = require("../findbugs-reporter/html/lib/jquery.js");

//The parser library.
parser = require("../findbugs-reporter/html/lib/findbugs_parser.js");

//Fetch the xml witout using xmlhttprequest
var sys = require('util');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();

function findbugs_tests(findbugs) { //Tests go here.
    "use strict";
    buster.testCase("Tests to see if parsing the findbugs file was correct", {

        //Couple of tests to see if we have read all findbugs from the file.
        "Test the number of ESync_EMPTY_SYNC findbugs encountered": function () {
            assert.equals(findbugs['by-type'].ESync_EMPTY_SYNC.length, 3);
        },

        "Test the number of SS_SHOULD_BE_STATIC findbugs encountered": function () {
            assert.equals(findbugs['by-type'].SS_SHOULD_BE_STATIC.length, 1);
        },

        //Test Some random values, hope to catch an error 
        "Test second buginstance's message": function () {
            assert.equals(findbugs['by-id'][1].msg,
                "Synchronization on interned String in locking.ReusedObjSync.synchronizeOnStringLiteral()");
        },

        "Test the 'primary' function.": function () {
            assert.equals(findbugs['by-type'].ML_SYNC_ON_FIELD_TO_GUARD_CHANGING_THAT_FIELD[0].locations[0],
                findbugs['by-type'].ML_SYNC_ON_FIELD_TO_GUARD_CHANGING_THAT_FIELD[0].primary());
        },

        "Test parrsing of some locations properties 1": function () {
            assert.equals(findbugs['by-type'].ESync_EMPTY_SYNC[1].locations[2].classname, 'locking.ReusedObjSync');
        },

        "Test parrsing of some locations properties 2": function () {
            assert.equals(findbugs['by-id'][0].locations[0].line, 3);
        },

        "Test parrsing of some locations properties 3": function () {
            assert.equals(findbugs['by-type'].ML_SYNC_ON_FIELD_TO_GUARD_CHANGING_THAT_FIELD[0].locations[1].name_attr, 'setLock');
        },

        "Test that error type is detected correctly": function () {
            assert.equals(findbugs['by-type'].ESync_EMPTY_SYNC[2].errortype, 'ESync_EMPTY_SYNC');
        },

        "Test category 1": function () {
            assert.equals(findbugs['by-type'].DL_SYNCHRONIZATION_ON_SHARED_CONSTANT[0].category, 'Multithreaded correctness');
        },

        "Test category 2": function () {
            assert.equals(findbugs['by-cat'].Performance[0].category, 'Performance');
        },

        "Test severity 1": function () {
            assert.equals(findbugs['by-sev'].minor[2].severity, 'minor');
        },

        "Test severity 2": function () {
            assert.equals(findbugs['by-type'].ML_SYNC_ON_FIELD_TO_GUARD_CHANGING_THAT_FIELD[0].severity, 'major');
        }

    });
}

/*Function that reads the xml file, parses it and tests.*/
function test() {
    "use strict";

    xhr.onreadystatechange = function () {

        if (this.readyState === 4) {
            var xmldoc = this.responseText;

            //Parses with a tests function as callback
            parser.parse_bugpatterns(xmldoc, parser.parse_buginstances, findbugs_tests);
        }
    };

    /*jslint nomen: true*/ //Prevents jslint from compaining about __
    xhr.open("GET", "file://" + __dirname + "/findbugs_formatted.xml");
    xhr.send();
    /*jslint nomen: false*/
}

//Execute the tests
test();