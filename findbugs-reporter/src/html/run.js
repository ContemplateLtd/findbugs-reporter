/*jslint browser: true*/
/*global $, console, jQuery*/

var problems = []; //For debugging purposes, to be removed from the final version.

/* Previous_highlight global object is used to keep track of the lines highlighted, so
that you don't need to go through the whole document and rehighlight everything.*/
var previous_highlight = {};
/*Keeps track of the classname of the file highlighted so that when files are changed,
everything is highlighted in the new file.*/
previous_highlight.classname = "";
//Tracks which line was previously highlighted
previous_highlight.line = -1;
//Tracks the previously used location array.
previous_highlight.loc = [];

/*Main function, that calls everything in order to build the web page*/

function init_page(findings){
    "use strict";

    //Produces a short summary of the xml file in the bottom left corner.
    produce_summary(findings);

    display_all(findings, 'by-type');

    //Load frame buttons here
    /*Because we are cannot be certain if the frame is going to laod before
    or after the this function is executed we cannot use $.load, unless we
    begin loading the frame exactly here.*/

    $('.code').attr("src", 'intro.html');
        $('.code').load(function () {
        loadframebuttons(findings);
    });

}

function display_all(findings, sorttype) {
    "use strict";
    var prop;

    problems = findings; //For easy debugging, should be gone from the final version

    document.body.style.display = 'none'; //Hide the document to minimise reflows.

    /*Draw the list in the findings div so that it can later be used by jstree
    to construct a tree */
    $('.findings').append('<ul class=main></ul>');
    for (prop in findings[sorttype]) {
        //If it's an actual property, and not the generic ones
        if (findings[sorttype].hasOwnProperty(prop)) {
            showfindings(prop, sorttype, findings);
        }
    }

    /*Function to be executed after jstree is loaded*/
    $('.findings').bind('loaded.jstree', function (e, data) {
        stripeit('.findings'); //Adds stripes to the table for readability

        /*Add a go to start button that restores the initial layout of the page*/
        $('.findings').prepend('<a class=home_button>Go to start</a>');
        $('.home_button').bind('click', function () {
            //If we are not on the intro page, load it
            if ($('.code').attr('src') !== 'intro.html'){
                $('.code').attr("src", 'intro.html');
                $('.code').load(function () {
                    loadframebuttons(findings);
                });
            }

            $('.details').empty();
            produce_summary(findings);
            jQuery.jstree._reference('.findings').close_all();
        });

        document.body.style.display = 'block'; //Show the document once everything is done.
    });

    /*Set the themes path, which does not work otherwise. We are using heavily
    modified default theme */
    $.jstree._themes = "themes/";
    $(function () {
        $(".findings").jstree({
            "plugins" : ["themes", "html_data", "ui", "crrm"],
            "themes": {
                "theme": "default",
                "dots": false,
                "icons": false
            },
            "core" : { "animation" : 200 }
        //Code for opening and closing nodes on click.
        }).bind("open_node.jstree close_node.jstree", function (e) {
                    stripeit('.findings');
        }).delegate(".jstree-open>a", "click.jstree", function (event) {
            $.jstree._reference(this).close_node(this, false, false);
        }).delegate(".jstree-closed>a", "click.jstree", function (event) {
            $.jstree._reference(this).open_node(this, false, false);
        });
    });

}

/*Function that builds the findings list before jstree tree-fies it
it only builds the top level tree nodes, the rest are built by the function
that is called afterwards*/
function showfindings(prop, sorttype, findings) {
    "use strict";
    var i, ico, imgtag, propnospace;

    propnospace = prop.replace(/\ /g, ''); //Space in prop breaks classes

    if (sorttype == 'by-type'){ //Case if we are sorting by type
        //Apend it to the list that was constructed in the display_all function.
        $('.main').append('<li class=' + propnospace + '><a>' + get_severity_icon(findings[sorttype][prop][0]) +
            ' ' + findings[sorttype][prop][0].descr + ' (' +
            findings[sorttype][prop].length + ')</a></li>');
    } else { //Case if we are sorting by any other criteria
        $('.main').append('<li class=' + propnospace + '><a>' + get_severity_icon(findings[sorttype][prop][0]) +
            ' ' + capitalize(prop) + ' (' + findings[sorttype][prop].length + ')</a></li>');
    }

    //Use class 'ul' +prop so that it is a unique name that can later be referenced
    $('.' + propnospace).append('<ul class=ul' + propnospace + '></ul>');
    for (i = 0; i < findings[sorttype][prop].length; i += 1) { //Each finding in type
        divpopulation(findings[sorttype][prop][i], prop, i);
    }
}
/*Finishes building up the tree and also attaches onclick functions that populate
 the details div, load the jxr code and do initial highlighting*/
function divpopulation(finding, prop, i) {
    "use strict";
    var line, url, propnospace;

    propnospace = prop.replace(/\ /g, ''); //Space in prop breaks classes

    //Get the pricese url for the .java file
    line = finding.primary().line;
    url = "jxr/" + fileurl(finding.primary().classname, finding.primary().filen, line);

    /*(Add link to the file. use class li + i so that it is an unique name that can be
    referenced later on by jquery. This is still part of the tree drawing */
    $('.ul' + propnospace).append('<li class="li' + i + '"><a href=' + url + ' target="code">' +
        get_severity_icon(finding) + ' ' + finding.msg + '</a>' + '</li>');

    /*Function that onclick draws everything in the .details div */
    $('.ul' + propnospace).find('.li' + i).find('a').bind('click', function () {

        /* Clear any content from previous location */
        $('.details').empty();
        $('.more_info').empty();

        //First time fill of the previously highlighted locations.
        if (previous_highlight.loc.length === 0){
            console.log("HERE");
            previous_highlight.loc = finding.locations;
        }

        //Highlight the locations in the code iframe
        if ($('.code').attr('src').split('#')[0] === url.split('#')[0]) { /*If we are in the same file already
            we don't need for the frame to load, and that is why we have 2 separate cases here, otherwise
            load never finishes */
            $('.code').attr("src", url);
            highlight_clear(previous_highlight.loc); // Clear highlights
            previous_highlight.loc = finding.locations; //Update locations
            //$('*', window.parent.frames[0].document).css('background-color', 'inherit'); //Clear any previous bgcolour
            //Too slow!

            highlight_all(finding.locations, finding.primary().classname); //Weak highlight of non-primary locations
            hover_all(finding.locations, finding.primary().classname); //Add title to divs
            $('div[class="' + line + '"]', window.parent.frames[0].document).css('background-color', '#62bdf0');

        } else { //If we have to wait for a file to load.

            $('.code').attr("src", url);
            $('.code').load(function () {
                //$('*', window.parent.frames[0].document).css('background-color', 'inherit'); //Clear any previous bgcolour
                highlight_clear(previous_highlight.loc); //Clear highlights
                previous_highlight.loc = finding.locations; //Update locations
                highlight_all(finding.locations, finding.primary().classname); //Weak highlight of non-primary locations
                hover_all(finding.locations, finding.primary().classname); //Add title to divs
                $('div[class="' + line + '"]', window.parent.frames[0].document).css('background-color', '#62bdf0');
            });

        }

        //Update the highlight previous with the correct line/classname information.
        previous_highlight.line = finding.primary().line;
        previous_highlight.classname = finding.primary().classname;

        //Draw the locations table here.
        displaylocations(finding);
        $('.more_info').append('<h3>' + finding.descr + '</h3><br/>' +
            finding.details);

        //When you open a new finding the more_info should be hidden by default
        $('.more_info').hide();
        $('.code').css('height', '100%');
        $('.code').css('border', 'none'); //Otherwise width is not drawn correctly


    });
}

function displaylocations(finding) {
    "use strict";

    var i, j, generic_detail, specific_detail, generic_descr, ico, filtered_loc = [], prev_classname = "";

    ico = get_severity_icon(finding); //Severity icon here

    /*The generic description appears on top of the .details, same as the text on the root node,
    containing the leaf*/
    generic_descr = '<p class="generic_detail"><b>' + finding.descr + '</b> ' +
        '<span class=learn_more>Learn more</span></p>';

    /*The generic detail that appears on the bottom of the .details div*/
    generic_detail = '<p class="generic_detail"><b>Category:</b> ' +
        finding.category + '<br/><b>Severity:</b> ' + ico + capitalize(finding.severity) +
            '<br/><b>Type:</b> ' + finding.errortype + '</p>';

    specific_detail = '<p class="specific_detail">' + finding.msg + '</p>';

    //Append to the DOM the 
    $('.details').append(generic_descr + specific_detail);

    //Show/hide more_info
    $('.learn_more').bind('click', function () {
        if ($('.learn_more').text() === "Learn more") {
            $('.more_info').show();
            $('.more_info').css('height', '30%'); //Restore height
            $('.learn_more').text('Hide');
            $('.code').css('height', '70%');
            /*Restore the border now that it is no longer minimised*/
            $('.code').css('border-bottom', '1px solid');
            $('.code').css('border-bottom-color', '#CACDC5');
        } else {
            $('.more_info').hide();
            $('.learn_more').text('Learn more');
            $('.code').css('height', '100%');
            $('.code').css('border', 'none'); //Otherwise width is not drawn correctly

        }
    });

    $('.details').append('<table class="locations" cellspacing="0" border-spacing: 0;></table>');

    // Draw the table that contains the links to the code.
    filtered_loc = splitnsort(finding.locations); //Sort the locations
    for (i = 0; i < filtered_loc.length; i += 1) { //Each class file
        for (j = 0; j < filtered_loc[i].length; j += 1) { //Each location within
            drawlinetable(filtered_loc[i][j], finding.locations, prev_classname);
            prev_classname = filtered_loc[i][0].classname;
        }
    }

    //Append the generic details after the table is drawn.
    $('.details').append(generic_detail);
}


function drawlinetable(location, locations, prev_classname) {
    "use strict";

    var javaicon, line, msg, url, atag, msgatag;

    javaicon = '<img style="width:1em; height:1em;" src="ico/java.gif" />';
    line = location.line;
    msg = location.msg; //Display message in the table

    /*Sometimes there is no msg tag. In that case just add a
     generic "Problem location"*/
    if (msg === undefined) {
        msg = 'Problem location';
    }
    url = "jxr/" + fileurl(location.classname, location.filen, line);

    //In case line is undefined we are probably dealing with a method
    //Try to get the name of the method.
    if (line === undefined) {
        line = 'n/a';
        if (location.tag === 'method') {
            msg = msg + ' (' + location.name_attr + ')';
        }
    }
    /*Detect whether we are going into a new file. If we are we need to draw it
    in the table.
    Draw filename if necessary. Use classname as more reliable to detect collision
    of files with same names from different packages. Remove the potential methodname.*/

    if (prev_classname.split('$')[0] !== location.classname.split('$')[0]) { //Draw filename
        $('.locations').append('<tr class="new_filename"><td class="javaicon">' + javaicon +
            '</td><td class="java_classname">' + location.filen + '</td></tr>');
    }

    //Line and msg for the location to draw in the table. Both are links to the code iframe
    atag = '<td class=num><a class="' + line + '" href=' + url + ' ' + 'target="code"' + '>' + line + '</a></td>';
    msgatag = '<a id="black_link" class="' + line + '" href =' + url + ' target="code"' + '>' + msg + '</a>';
    $('.locations').append('<tr><td></td>' + atag + '<td>' + msgatag + '</td></tr>'); //Add a row to the table

    /*Highlighting is done here. .each is used, because we have two links that 
    need to be binded a function per location*/
    $('.locations').find('a[class="' + line + '"]').each(function (i) {
        $(this).bind('click', function () {

            /*Highlight lines. If we are in the same file, change the current line to blue and then
            highlight the new one in light blue. else just highlight and don't clear*/
            if (previous_highlight.classname.split('$')[0] === location.classname.split('$')[0]) {
                $('div[class="' + previous_highlight.line + '"]',
                    window.parent.frames[0].document).css('background-color', '#d8ebf4');

                $('div[class="' + line + '"]', window.parent.frames[0].document).css('background-color', '#62bdf0');
                previous_highlight.line = line;
            } else {

                $('.code').load(function () { //Wait for the frame to load before highlighting.

                    //Flush the previous strong highlight. Too Slow!
                    highlight_clear(previous_highlight.loc);

                    previous_highlight.classname = location.classname.split('$')[0]; //Else change the classname
                    previous_highlight.line = line;


                    highlight_all(locations, previous_highlight.classname); //Highlight all the lines in the new classname
                    hover_all(locations, previous_highlight.classname); //Add title to divs

                    //Draw the focus highlight
                    $('div[class="' + line + '"]', window.parent.frames[0].document).css('background-color', '#62bdf0');
                });
            }
        });
    });

}

//Produces an url to the file in the codeframe.
function fileurl(class_string, filen, line) {
    "use strict";

    var str_arr = [], i, retstring = '', filename = '';
    str_arr = class_string.split('.');
    filename = filen.split('.')[0]; //Remove .java from the filename

    for (i = 0; i <str_arr.length - 1; i += 1) {
        retstring = retstring + str_arr[i] + '/';
    }

    //Remove final '/' and replace it .html to get the proper link to the file
    return (retstring + filename + '.html#' + line);


}

/*Sorts locations. primary location is always first. If lines are missing, the
location is put last. The rest are sorted regarding their line number*/
function locationsort(a, b) {
    "use strict";
    if (a.key === '0') {
        return -1;
    } else if (b.key === '0') {
        return 1;
    } else if (a.line === undefined) { //Lines with missing numbers are last.
        return 1;
    } else if (b.line === undefined) {
        return -1;
    } else {
        return (Number(a.line) - Number(b.line));
    }
}

/*Splits location array into several arrays of location array, depending on
filenames. Then sort the sublocation arrays, to prepare them for printing.*/

function splitnsort(locations) {
    "use strict";

    var retarray = [], filemap = [], fileidx, i; //Filemap is used to map filename to array num
    fileidx = 0; //Keep track of which file this is

    for (i = 0; i < locations.length; i += 1) {
        if (filemap[locations[i].filen] === undefined) {
            filemap[locations[i].filen] = fileidx; //Keep track of the file's indices.
            retarray[filemap[locations[i].filen]] = []; //Create a new locations array
            fileidx += 1; //Increment the indeces.
        }
        retarray[filemap[locations[i].filen]].push(locations[i]); //Put locations in the proper place
    }

    //Now sort each array
    for (i = 0; i < retarray.length; i += 1) {
        retarray[i].sort(locationsort);
    }

    return retarray;

}

/*Highlight all problematic lines in the code that are of the same
filename. Highlights with less bright colour.*/
function highlight_all(locations, classname) {
    "use strict";
    var i;
    for (i = 0; i < locations.length; i += 1) {
        if (locations[i].classname.split('$')[0] === classname.split('$')[0]) {
            $('div[class="' + locations[i].line + '"]',
                window.parent.frames[0].document).css('background-color', '#d8ebf4');
        }
    }
}

/*Clears all highlights*/
function highlight_clear(locations) {
    "use strict";
    var i;
    for (i = 0; i < locations.length; i += 1) {
        console.log("Dehighlighted line " + locations[i].line);
        $('div[class="' + locations[i].line + '"]',
            window.parent.frames[0].document).css('background-color', 'inherit');
    }
}

/*Generates an <img> tag with the appropriate severity icon, given a finding*/
function get_severity_icon(finding) {
    "use strict";
    if (finding.severity === 'minor') {
        return '<img src="ico/severity/minor.png"/>';
    } else if (finding.severity === 'major') {
        return '<img src="ico/severity/major.png"/>';
    }
}

/*Capitalizes first letter of a string. Important because some attribute values
are presented in lowercase, whereas aesthetics dictate that they be uppercase*/
function capitalize(string) {
    "use strict";
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/*Makes the tree displayed to be stripy for visibility. The function works
by iterating through all visible lines and using a counter to know which
ones to highlight and which ones to leave the same colour*/
function stripeit(div) {
    "use strict";
    var counter = 0, classes;
    //Go through all the root nodes.
    $(div).find('ul > li').each(function () {
        classes = get_classes($(this));
        if (contains('jstree-closed', classes)) {
            if ((counter % 2) === 0) {
                $(this).css('background-color', 'WhiteSmoke');
            } else { //Clear BG colour
                $(this).css('background-color', 'white');
            }
            counter += 1;
        /*Now we are at an open node. We need to count its ul elements
          in order to paint them and then continue*/
        } else if (contains('jstree-open', classes)) {
            if ((counter % 2) === 0) {
                $(this).css('background-color', 'WhiteSmoke');
            } else { //Clear BG colour
                $(this).css('background-color', 'white');
            }
            counter += 1;
            //Check each leaf of the expanded node now.
            (function (domobj) {
                domobj.find('li').each(function () {
                    if ((counter % 2) === 0) {
                        $(this).css('background-color', 'WhiteSmoke');
                    } else { //Clear BG colour
                        $(this).css('background-color', 'white');
                    }
                    counter += 1;
                });
            })($(this));
        }
    });
}

/*In case we are dealing with dom elements that contain more than one classes,
use this to split them into an array so that you can check if you are looking for
individual one*/
function get_classes(elem) {
    "use strict";
    return $(elem).attr('class').split(/\s+/);
}

/* Check if an element is in a list */

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

/*This function generates summary of the analysis, to be displayed
on the front page*/
function produce_summary(parsed_file) {
    "use strict";
    var appendpart = '', total, blocker, crit, maj, min, info;

    //Get counts:
    total = count_map_el(parsed_file['by-id']);
    maj = count_map_el(parsed_file['by-sev']['major']);
    min = count_map_el(parsed_file['by-sev']['minor']);

    //Create the text
    //appendpart += '<p>A quick summary of the analysis.<br/>';
    appendpart += '<p class="Summary"><b>' + total + '</b> Potential problems found, of which:</p>';
    appendpart += '<p class="Summary"><img src=ico/git/major.png /> <b>Major:</b> ' + maj + '</p>';
    appendpart += '<p class="Summary"><img src=ico/git/minor.png /> <b>Minor:</b> ' + min + '</p>';
    $('.details').append(appendpart);

}

/*Counts the number of elements in an array-map type of object*/
function count_map_el(array_map) {
    "use strict";
    var prop, counter = 0;
    for (prop in array_map) {
        if (array_map.hasOwnProperty(prop)) {
            counter += 1;
        }
    }
    return counter;
}

/*Loads the frame buttons that produce different trees */

function loadframebuttons(findings){

    $('.sev', window.parent.frames[0].document).bind('click', function () {
        jQuery.jstree._reference('.findings').destroy(); //Destroy the jstree
        $('.findings').empty(); //Clear the DOM
        display_all(findings, 'by-sev');
    });
    $('.cat', window.parent.frames[0].document).bind('click', function () {
        jQuery.jstree._reference('.findings').destroy(); //Destroy the jstree
        $('.findings').empty(); //Clear the DOM
        display_all(findings, 'by-cat');
    });
    $('.type', window.parent.frames[0].document).bind('click', function () {
        jQuery.jstree._reference('.findings').destroy(); //Destroy the jstree
        $('.findings').empty(); //Clear the DOM
        display_all(findings, 'by-type');
    });
}

/* Allows the error description to pop out when the cursor is over
a highlighted line in the iframe */
function hover_all(locations, classname){
    "use strict";
    var i;
    for (i = 0; i < locations.length; i += 1) {
        if (locations[i].classname.split('$')[0] === classname.split('$')[0]) {
            $('div[class="' + locations[i].line + '"]',
                window.parent.frames[0].document).attr('title', locations[i].msg);
        }
    }
}


/* Run everything*/
parse_findbugs('xml/findbugs.xml', init_page);