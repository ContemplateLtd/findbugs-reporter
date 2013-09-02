/*jslint browser: true*/
/*global $, console*/

//Parses the locations with bugs.
function process_buglocations(buginst) {
    "use strict";

    var meth = {}, class_tag = {}, field = {}, src = {}, locations = [];

    //Class processing 
    class_tag.classname = buginst.find('Class').attr('classname');
    class_tag.tag = "class";
    class_tag.line = buginst.find('Class').find('SourceLine').attr('start');
    class_tag.msg = buginst.find('Class').find('Message').text();

    class_tag.filen = buginst.find('Class').find('SourceLine').attr('sourcefile');

    locations.push(class_tag);

    /* Not really relevant.
    bug.class_tag.primary = buginst.find('Class').attr('primary');
    class_tag.endline = buginst.find('Class').find('SourceLine').attr('end');
    */

    //Process methods
    buginst.find('Method').each(function (i) {

        meth.tag = 'method';

        meth.classname = $(this).attr('classname');
        meth.name_attr = $(this).attr('name');
        //Parse soucefile stuff
        meth.line = $(this).find('SourceLine').attr('start');
        meth.desc = $(this).attr('signature');

        //Filename
        meth.filen = $(this).find('SourceLine').attr('sourcefile');
        /* Not too relevant, skip
        meth.primary = buginst.attr('primary');
        meth.isStatic = buginst.attr('isStatic');

        meth.startline = buginst.find('SourceLine').attr('end');

        //Message stuff
        meth.msg = buginst.find('Message').text();
        */
        locations.push(meth);
    });

    //Try to get a field if one exists
    if (buginst.find('Field').attr('classname') !== undefined) {
        field.tag = 'field';
        field.classname = buginst.find('Field').attr('classname');
        field.name_attr = buginst.find('Field').attr('name');
        field.msg = buginst.find('Field').find('Message').text();
        field.desc = buginst.find('Field').attr('signature');
        field.line = undefined; //As of now we can't really get a line number for this
        //Filename
        field.filen = buginst.find('Field').find('SourceLine').attr('sourcefile');

        locations.push(field);
        /* Irrelevant
        field.primary = buginst.find('Field').attr('primary');
        field.isStatic = buginst.find('Field').attr('isStatic');
        */
    }

    return locations;

}

/*Does the actual findbugs parsing. Relies on preparsed bugpatterns*/
function parse_buginstances(xml, bugpatterns, callback) {
    "use strict";

    //Collecotr variable
    var n, filenames = [], bugs = [];

    //Generate initial containers
    bugs['by-id'] = [];

    //Simplify the rank type, by converting it to severity
    bugs['by-sev'] = [];

    bugs['by-type'] = [];

    bugs['by-cat'] = [];

    bugs['by-class'] = [];

    bugs.msgs = bugpatterns; //Various different messages are stored here.

    //Iterate over each BugInstance entry
    $('BugInstance', xml).each(function (i) {

        //Temporary variables for holding onto the data
        var bug = {}, abbrev, category;

        filenames = []; //Clear filenames

        bug.primary = function () { //Returns the primary error location
            return this.locations[0];
        };

        category = $(this).attr('category');
        bug.category = bugpatterns[category].msg;


        //Parse attributes in bug instance
        if ($(this).attr('rank') > 10) {
            bug.severity = 'minor';
        } else {
            bug.severity = 'major';
        }

        abbrev = $(this).attr('abbrev');
        bug.errortype = $(this).attr('type');
        bug.details = bugpatterns[category][abbrev][bug.errortype].details;

        //Populate locations:
        bug.locations = process_buglocations($(this));

        //Parse the two messages
        bug.descr = $(this).find('ShortMessage').text();
        bug.msg = $(this).find('LongMessage').text();

        //Populate the final datastructure
        bugs['by-id'].push(bug);

        if (bugs['by-type'][bug.errortype] === undefined) {
            bugs['by-type'][bug.errortype] = [];
        }
        bugs['by-type'][bug.errortype].push(bugs['by-id'][i]);

        /* Uncomment to get sorting by priority
        bug.priority = $(this).attr('priority');

        if (bugs['by-prio'][bug.priority] === undefined) {
            bugs['by-prio'][bug.priority] = [];
        }

        bugs['by-prio'][bug.priority].push(bugs['by-id'][i]);

        */
        if (bugs['by-sev'][bug.severity] === undefined) {
            bugs['by-sev'][bug.severity] = [];
        }

        bugs['by-sev'][bug.severity].push(bugs['by-id'][i]);

        if (bugs['by-cat'][bug.category] === undefined) {
            bugs['by-cat'][bug.category] = [];
        }

        bugs['by-cat'][bug.category].push(bugs['by-id'][i]);

        //Code for sorting bugs by class.

        for (n = 0; n < bug.locations.length; n += 1){
            if (!contains(bug.locations[n].filen, filenames)){
                if (bug.locations[n].msg === undefined && n !== 0){
                    //Skip things that should not be highlighted
                    continue;
                }
                filenames.push(bug.locations[n].filen);
            }
            if (bugs['by-class'][bug.locations[n].filen] === undefined) {
                bugs['by-class'][bug.locations[n].filen] = [];
            }
        }

        for (n = 0; n < filenames.length; n += 1){
            bugs['by-class'][filenames[n]].push(bugs['by-id'][i]);
        }

    });

    callback(bugs);

}

/*Generates container tree like structure for buginstances: It goes like
bugpatterns[category][abbreviation][error_type]*/
function parse_bugpatterns(xml, callback, buginstances_callback) {
    "use strict";
    var bugcat = [], bugcode = [], bugpatterns = [], pattern = {}, category, abbrev, type_attr;

    //Get bugcategories
    $('BugCategory', xml).each(function (i) {
        bugcat[$(this).attr('category')] = $(this).find('Description').text();
    });

    //Get bugcode info
    $('BugCode', xml).each(function (j) {
        bugcode[$(this).attr('abbrev')] = $(this).find('Description').text();
    });

    //Get actual bugpatterns

    $('BugPattern', xml).each(function (k) {
        category = $(this).attr('category');
        abbrev = $(this).attr('abbrev');
        type_attr = $(this).attr('type');

        //Create category if not there
        if (bugpatterns[category] === undefined) {
            bugpatterns[category] = [];
            bugpatterns[category].msg = bugcat[category];
        }

        //Create abbreviation;
        if (bugpatterns[category][abbrev] === undefined) {
            bugpatterns[category][abbrev] = [];
            bugpatterns[category][abbrev].msg = bugcode[abbrev];
        }

        //Create type arrays.
        if (bugpatterns[category][abbrev][type_attr] === undefined) {
            bugpatterns[category][abbrev][type_attr] = [];
            bugpatterns[category][abbrev][type_attr].details = $(this).find('Details').text();
        }


    });

    /*Callback the result here. The callback is intended to be
    the parse_buginstances */
    callback(xml, bugpatterns, buginstances_callback);

}

/* A helper function to check if an element is in a list */

function contains(item, arr) {
    "use strict";
    var i;
    for (i = 0; i < arr.length; i += 1) {
        if (item === arr[i]) {
            return true;
        }
    }
    return false;
}

/*Fetches the findbugs xml and forwards it for parsing*/

function parse_findbugs(filepath, callback) {
    "use strict";

    $.get(filepath, {}, function (xml) {
        parse_bugpatterns(xml, parse_buginstances, callback);
    });
}

/*In order to use with node.js environment and not crash a browser
we need the following:*/
if (typeof exports !== 'undefined') {
    exports.parse_findbugs = parse_findbugs;
    exports.parse_buginstances = parse_buginstances;
    exports.parse_bugpatterns = parse_bugpatterns;
}
