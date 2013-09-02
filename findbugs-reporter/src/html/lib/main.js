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

//A variable that suppresses the highlighter from fireing when undesired
var supress_highlighter = false;
var not_ready_highlighter = true; //Necessarity to avoid calling highlighter before initial load

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

    $('.classFrame').attr("src", 'intro.html');
        $('.classFrame').load(function () {
        loadframebuttons(findings);
        not_ready_highlighter = false;
    });

}

function display_all(findings, sorttype) {
    "use strict";
    var prop, navigationtext, selector, listframeheight, frameurl;

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
        navigationtext = '<span class=home_button><a>Go to start</a></span>' +
        '<span class=package_view><a>Package explorer</a></span>';
        $('.findings').prepend(navigationtext);
        $('.home_button').bind('click', function () {
            //If we are not on the intro page, load it
            frameurl = document.getElementById("classFrame").contentWindow.location.href.split('\/');
            if (frameurl[frameurl.length - 1] !== 'intro.html'){
                $('.classFrame').attr("src", 'intro.html');
                $('.classFrame').load(function () {
                    loadframebuttons(findings);
                });
            }

            $('.packageFrame').attr('src', 'jxr/allclasses-frame.html');
            $('.details').empty();
            produce_summary(findings);
            jQuery.jstree._reference('.findings').close_all();
        });
        //Make the home button and the go to package_view/findings button work in package_view
        $('.package_view').bind('click', function() {
            $('.findings').hide();
            selector = $('.package_explorer');
            selector.show();
            if (selector.find('.dummydiv').length === 0){
                //Recalculate heights
                selector.prepend('<div class="dummydiv">'+navigationtext+'</div>'); //Dummy div in order to calculate height properly
                listframeheight = (selector.height()/3 - selector.find('.dummydiv').height())*100/selector.height();
                $('.packageListFrame').height(String(listframeheight) + '%');
                $('.packageFrame').height(String((selector.height() - $('.dummydiv').height() -
                    $('.packageListFrame').height() -1)*100/$('.package_explorer').height()) + '%');
                selector.find('.package_view').find('a').text('Findings explorer');
                selector.find('.package_view').bind('click', function(){
                    selector.hide();
                    $('.findings').show();
                });
                selector.find('.home_button').bind('click', function () {
                    //If we are not on the intro page, load it
                    frameurl = document.getElementById("classFrame").contentWindow.location.href.split('\/');
                    if (frameurl[frameurl.length - 1] !== 'intro.html'){
                        $('.classFrame').attr("src", 'intro.html');
                        $('.classFrame').load(function () {
                            loadframebuttons(findings);
                        });
                    }

                    $('.packageFrame').attr('src', 'jxr/allclasses-frame.html');
                    $('.details').empty();
                    produce_summary(findings);
                    jQuery.jstree._reference('.findings').close_all();
                    selector.find('.package_view').bind('click', function(){
                        selector.hide();
                        $('.findings').show();
                    });
                    //$('.package_view').hide();
                    //$('.findings').show();
                });
            }
        });

        document.body.style.display = 'block'; //Show the document once everything is done.
        //Fixes the package_view switch button from dieing out.
        $('.package_explorer').find('.package_view').bind('click', function(){
            $('.package_explorer').hide();
            $('.findings').show();
        });
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
    var i, propnospace;

    propnospace = prop.replace(/\ /g, ''); //Space in prop breaks classes.
    propnospace = propnospace.replace(/\./g, ''); //Dot breaks class attribute

    if (sorttype === 'by-type'){ //Case if we are sorting by type
        //Apend it to the list that was constructed in the display_all function.
        $('.main').append('<li class=' + propnospace + '><a>' + get_severity_icon(findings[sorttype][prop][0]) +
            ' ' + findings[sorttype][prop][0].descr + ' (' +
            findings[sorttype][prop].length + ')</a></li>');
    } else if (sorttype === 'by-class') { //Use different icon when sorting by class
        $('.main').append('<li class=' + propnospace + '><a><img style="width:1em; height:1em;" src="ico/java.gif" />' +
            ' ' + capitalize(prop) + ' (' + findings[sorttype][prop].length + ')</a></li>');
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
    propnospace = propnospace.replace(/\./g, ''); //Dot breaks class attribute

    //Get the pricese url for the .java file
    line = finding.primary().line;
    /* In case the primary location is a class tag, it does not have a classname attribute and
    therefore classname is undefined and we can't call fileurl on that. However a class tag
    contains a name attribute which is identical to the classname. Use it in stead.
    The second condition on the if statement is so that it can accomodate the findbugs parser. */

    if (finding.primary().tag === 'class' && finding.primary().classname === undefined) {
        finding.locations[0].classname = finding.primary().name_attr;
    }
    
    //Sometimes the primary location does not have a message, so we should add a generic "Problem location"

    if (finding.primary().msg === undefined){
        finding.locations[0].msg = "Problem location";
    }

    url = "jxr/" + fileurl(finding.primary().classname, finding.primary().filen, line);

    /*(Add link to the file. use class li + i so that it is an unique name that can be
    referenced later on by jquery. This is still part of the tree drawing */
    $('.ul' + propnospace).append('<li class="li' + i + '"><a href=' + url + ' target="classFrame">' +
        get_severity_icon(finding) + ' ' + finding.msg + '</a>' + '</li>');

    /*Function that onclick draws everything in the .details div */
    $('.ul' + propnospace).find('.li' + i).find('a').bind('click', function () {

        /* Clear any content from previous location */
        $('.details').empty();
        $('.more_info').empty();

        //First time fill of the previously highlighted locations.
        if (previous_highlight.loc.length === 0){
            previous_highlight.loc = finding.locations;
        }

        //Highlight the locations in the code iframe
        if ($('.classFrame').attr('src').split('#')[0] === url.split('#')[0]) { /*If we are in the same file already
            we don't need for the frame to load, and that is why we have 2 separate cases here, otherwise
            load never finishes */
            $('.classFrame').attr("src", url);
            highlight_clear(previous_highlight.loc); // Clear highlights
            previous_highlight.loc = finding.locations; //Update locations
            //$('*', window.parent.frames[0].document).css('background-color', 'inherit'); //Clear any previous bgcolour
            //Too slow!

            highlight_all(finding.locations, finding.primary().classname); //Weak highlight of non-primary locations
            hover_all(finding.locations, finding.primary().classname); //Add title to divs
            $('div[class="' + line + '"]', window.parent.frames[0].document).css('background-color', '#62bdf0');

        } else { //If we have to wait for a file to load.
            supress_highlighter = true; //Supress the highligher
            $('.classFrame').attr("src", url);
            $('.classFrame').load(function () {
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
       
       //When you open a new finding the more_info should be hidden by default
        $('.more_info').hide();
        $('.classFrame').css('height', '100%');
        $('.classFrame').css('border', 'none'); //Otherwise width is not drawn correctly


    });
}

function displaylocations(finding) {
    "use strict";

    var i, j, generic_detail, specific_detail, generic_descr, ico,
    guardsinfo, more_info, filtered_loc = [], guard_descr,primary_url, prev_classname = "";

    //If guards exist, construct the object for them
    //First condition is so that it'd work with findbugs xml where there are no guards
    if (finding.guards !== undefined && finding.guards.length !== 0){
        primary_url = 'jxr/' + fileurl(finding.primary().classname, finding.primary().filen, finding.primary().line);
        guardsinfo = draw_guards(finding);
        //Guard_description
        guard_descr = '<p class="guard_descr">Guards for access to ' +
                finding.primary().tag + ' ' + '<a class="prim_loc" href=' + primary_url + ' target="classFrame">' +
                finding.primary().classname.split('.').slice(-1)[0] +
                '.' + finding.primary().name_attr +
                '</a>:<span class="close_button"><img src="ico/close.gif" title="Close"/></span></h3><br/></p>';
    }

    //Text to be inserted in more_info

    more_info = '<h3>' + finding.descr +
    '</h3><span class="close_button"><img src="ico/close.gif" title="Close"/></span>' + finding.details;

    ico = get_severity_icon(finding); //Severity icon here

    /*The generic description appears on top of the .details, same as the text on the root node,
    containing the leaf*/
    generic_descr = '<p class="generic_detail"><b>' + finding.descr + '</b> ' +
        '<img class=learn_more src="ico/question.gif" title="Learn more"/></p>';

    /*The generic detail that appears on the bottom of the .details div*/
    generic_detail = '<p class="generic_detail"><b>Category:</b> ' +
        finding.category + '<br/><b>Severity:</b> ' + ico + capitalize(finding.severity) +
            '<br/><b>Type:</b> ' + finding.errortype + '</p>';

    specific_detail = '<p class="specific_detail">' + finding.msg +'</p>';

    //Append to the DOM the 
    $('.details').append(generic_descr + specific_detail);

    //Give an option to display guards if guards are present
    if (finding.guards !== undefined && finding.guards.length !== 0){
        $('.details > .specific_detail').append('</br><span class="guardview">Show guards</span>');
        $('.details > .specific_detail > .guardview').bind('click', function() {
            if ($(this).text() === "Show guards") {
                $('.more_info').show();
                $('.more_info').css('height', '30%'); //Restore height
                $(this).text('Hide guards');
                //Reset learn more.
                $('.details > .generic_detail > .learn_more').attr('title', 'Learn more');
                $('.classFrame').css('height', '70%');
                /*Restore the border now that it is no longer minimised*/
                $('.classFrame').css('border-bottom', '1px solid');
                $('.classFrame').css('border-bottom-color', '#CACDC5');
                $('.more_info').empty();
                $('.more_info').append(guard_descr);
                $('.more_info').append(draw_guards(finding));

                //Make highlighting work in the guards view as well.
                $('.more_info').find('a').each(function (i){
                    $(this).bind('click', function(){
                        /*Just forward the click to the link in .details which has highlighting
                        already implemented*/
                        $('.details').find('a[href="' + $(this).attr('href') +'"]').click();
                    });
                });
                //Add a close button inside the div
                $('.close_button', '.more_info').bind('click', function(){
                    $('.details > .generic_detail > .learn_more').attr('title', 'Learn more');
                    $('.details > .specific_detail > .guardview').text('Show guards');
                    $('.more_info').hide();
                    $('.classFrame').css('height', '100%');
                    $('.classFrame').css('border', 'none');
                });
            } else {
                $('.more_info').hide();
                $(this).text('Show guards');
                //Reset learn more, just in case
                $('.details > .generic_detail > .learn_more').attr('title', 'Learn more');
                $('.classFrame').css('height', '100%');
                $('.classFrame').css('border', 'none'); //Otherwise width is not drawn correctly
            }
        });
    }
        

    //Show/hide more_info
    $('.details > .generic_detail > .learn_more').bind('click', function () {
        if ($(this).attr('title') === "Learn more") {
            $('.more_info').empty();
            $('.more_info').append(more_info);
            $('.more_info').show();
            $('.more_info').css('height', '30%'); //Restore height
            $(this).attr('title', 'Hide');
            //Reset guards.
            $('.details > .specific_detail > .guardview').text('Show guards');
            $('.classFrame').css('height', '70%');
            /*Restore the border now that it is no longer minimised*/
            $('.classFrame').css('border-bottom', '1px solid');
            $('.classFrame').css('border-bottom-color', '#CACDC5');
            //Add a close button inside the div
            $('.close_button', '.more_info').bind('click', function(){
                $('.details > .generic_detail > .learn_more').attr('title', 'Learn more');
                $('.details > .specific_detail > .guardview').text('Show guards');
                $('.more_info').hide();
                $('.classFrame').css('height', '100%');
                $('.classFrame').css('border', 'none');
            });
        } else {
            $('.more_info').hide();
            $(this).attr('title', 'Learn more');
            $('.details > .specific_detail > .guardview').text('Show guards');
            $('.classFrame').css('height', '100%');
            $('.classFrame').css('border', 'none'); //Otherwise width is not drawn correctly

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

    /*Sometimes there is no msg tag. In that case don't draw anything */
    if (msg === undefined) {
        return;
        //msg = 'Problem location';
    }
    

    /* In case the location is a class tag, it does not have a classname attribute and
    therefore classname is undefined and we can't call fileurl on that. However a class tag
    contains a name attribute which is identical to the classname. Use it in stead */

    /*The second condition is for compatibility with the findbugs xml*/
    if (location.tag === 'class' && location.classname === undefined) {
        location.classname = location.name_attr;
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
    atag = '<td class=num><a class="' + line + '" href=' + url + ' ' + 'target="classFrame"' + '>' + line + '</a></td>';
    msgatag = '<a id="black_link" class="' + line + '" href =' + url + ' target="classFrame"' + '>' + msg + '</a>';
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
                supress_highlighter = true; //Supress the highlighter
                $('.classFrame').load(function () { //Wait for the frame to load before highlighting.

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
        // Fix undefined classname (Second condition is for compatibility with findbugs xml)
        if (locations[i].tag === 'class' && locations[i].classname === undefined){
            locations[i].classname = locations[i].name_attr;
        }
        /*Ignore locations without a msg:
        if ((locations[i].msg === undefined) && (i !== 9)){
            continue;
        }*/
        if (locations[i].classname.split('$')[0] === classname.split('$')[0]) {
            $('div[class="' + locations[i].line + '"]',
                window.parent.frames[0].document).css('background-color', '#d8ebf4');
        }
    }
}

/*Clears all highlights*/
function highlight_clear(locations) {
    "use strict";
    var i, selector;
    for (i = 0; i < locations.length; i += 1) {
        selector = $('div[class="' + locations[i].line + '"]', window.parent.frames[0].document);
        selector.css('background-color', 'inherit');
        selector.removeAttr('title');
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
    appendpart += '<p class="Summary"><img src=ico/severity/major.png /> <b>Major:</b> ' + maj + '</p>';
    appendpart += '<p class="Summary"><img src=ico/severity/minor.png /> <b>Minor:</b> ' + min + '</p>';
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
        $('.package_explorer').find('.package_view').bind('click', function(){
            $('.package_explorer').hide();
            $('.findings').show();
        });
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
    $('.class', window.parent.frames[0].document).bind('click', function () {
        jQuery.jstree._reference('.findings').destroy(); //Destroy the jstree
        $('.findings').empty(); //Clear the DOM
        display_all(findings, 'by-class');
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


/*The function draws the guard view window onto the more_info div*/
function draw_guards(finding){
    "use strict";
    var table, i, j, guard_name, guard_key, guard_loc, acc_loc, acc_text, acc_td_arr, url;

    table = $('<table class="accesses">');

    //Add Guards row
    table.append('<tr class="guards"><td></td></tr>');

    //Add all guards.
    for (i = 0; i<finding.guards.length; i += 1){

        //Get the corresponding location
        if (finding.guards[i].tag === 'guardUnknown'){
            guard_loc = undefined;
        } else {
            if (finding.guards[i].guardpath.length !== 0){
                guard_loc = finding.locations[Number(finding.guards[i].guardpath[0])];
            } else {
                guard_loc = finding.locations[Number(finding.guards[i].typeRef)];
            }
        }

        //Set up the table entry
        if (guard_loc === undefined){
            guard_name = '&lt;unknown&gt;';
            $('.guards', table).append('<td>' + guard_name + '</td>');
        } else {
            //Name for guard relative
            if (finding.guards[i].tag === 'guardRelative'){
                if (guard_loc.tag === 'class'){
                    guard_name = guard_loc.name_attr.split('.').slice(-1)[0]  + '.this';
                } else {
                    guard_name = guard_loc.classname.split('.').slice(-1)[0] + '.this';
                }
            }else{ //Name for guard_absolute
                if (guard_loc.tag === 'class') {
                    guard_name = guard_loc.name_attr.split('.').slice(-1)[0]  + '.class';
                } else{
                    guard_name = guard_loc.classname.split('.').slice(-1)[0];
                }
            }

            //Add path to name.
            if ((guard_name !== '&lt;unknown&gt;') && (guard_loc.tag !== 'class')){
                guard_name = guard_name + '.' + guard_loc.name_attr;
            }

            //Link to the file
            if (guard_loc.classname === undefined){
                guard_loc.classname = guard_loc.name_attr;
            }
            url = "jxr/" + fileurl(guard_loc.classname, guard_loc.filen, guard_loc.line);

            //Append to table
            $('.guards', table).append('<td><a href=' + url + ' target="classFrame">' + guard_name + '</a></td>');
        }
    }

    //Make the last cell on each row extend to fill in the div
    $('.guards', table).children().last().css('width', '99%');

    //Sort acccesses array:

    finding.accesses = accessessort(finding);

    //Now add the accesses

    for (i = 0; i<finding.accesses.length; i += 1){
        
        acc_loc = finding.locations[Number(finding.accesses[i].location_attr)];
        acc_text = acc_loc.filen + ': ' + acc_loc.line;

        //In case we don't have a message for this location, don't display it.
        if (acc_loc.msg === undefined){
            continue;
        }

        table.append('<tr class="accesses' + i + '"></tr>');

        if (acc_loc.classname === undefined){
                acc_loc.classname = acc_loc.name_attr;
        }
        url = "jxr/" + fileurl(acc_loc.classname, acc_loc.filen, acc_loc.line);
        $('.accesses' + i, table).append('<td><a href=' + url + ' target="classFrame">' + acc_text + '</a></td>');

        //Add accesses text now
        acc_td_arr = [];
        for (j = 0; j< finding.accesses[i].guard_ref.length; j += 1){
            acc_td_arr[Number(finding.accesses[i].guard_ref[j].key)] = finding.accesses[i].guard_ref[j].status_attr;
        }

        //Sometimes a guard is not mentioned so we have to add the text manually.
        for (j = 0; j<finding.guards.length; j += 1){
            if (acc_td_arr[j] === undefined){
                acc_td_arr[j] = 'Not Held';
            } else if (acc_td_arr[j] === 'sometimes') {
                acc_td_arr[j] = 'Maybe Held';
            } else if (acc_td_arr[j] === 'always') {
                acc_td_arr[j] = 'Always Held';
            }
        }

        //Output the TD rows;

        for (j = 0; j<acc_td_arr.length; j++){
            $('.accesses' + i, table).append('<td class="' + acc_td_arr[j].split(' ')[0] +
                '">' + acc_td_arr[j] + '</td>');
        }
    }
    //Return a striped table for visibility
    return (stripetable(table));
}

function stripetable(tabledom){
    "use strict";

    var counter = 0;
    tabledom.find('tr').each(function () {
        if ((counter % 2) === 0) {
                $(this).css('background-color', 'WhiteSmoke');
        }
        counter += 1;
    });

    return tabledom;
}

function accessessort(finding){
    "use strict";

    var i, new_accesses = [];

    //A new accesses array  more suitable for sorting.
    for (i = 0; i < finding.accesses.length; i += 1){
        new_accesses[i] = finding.accesses[i];
        new_accesses[i].old_index = i;
        new_accesses[i].line = finding.locations[Number(finding.accesses[i].location_attr)].line;
        new_accesses[i].filen = finding.locations[Number(finding.accesses[i].location_attr)].filen;
    }

    //Sort temp accesses
    new_accesses.sort(function (a, b) {
        if (a.filen === b.filen) {
            return (Number(a.line) - Number(b.line));
        } else {
            return (Number(a.location_attr) - Number(b.location_attr));
        }
    });

    return new_accesses;
   
}

/*Gather all locations relevant to a given file*/
function filelocations(fileurl, findings){
    "use strict";
    var i, j, str_arr = [], java_filename, file_locations = [];

    //Get the java filename
    str_arr = fileurl.split('\/');
    java_filename = str_arr[str_arr.length - 1];
    java_filename = java_filename.replace('.html', '.java');


    // Highlight all the files with that
    if (findings['by-class'][java_filename] !== undefined){

        //Created a locations array from all findings that contain this file
        for (i = 0; i < count_map_el(findings['by-class'][java_filename]); i += 1){
            
            for (j = 0; j < findings['by-class'][java_filename][i].locations.length; j += 1){
                
                if (findings['by-class'][java_filename][i].locations[j].filen === java_filename) {
                    file_locations.push(findings['by-class'][java_filename][i].locations[j]);
                }
            }
        }

    }

    //If file_locations are empty then there's nothing to highlight.
    return file_locations;
}

/*Highlights all problem locations in a file*/
function filehighlight(fileurl, findings){
    "use strict";
    var locations = [], classname;

    locations = filelocations(fileurl, findings);

    $('.classFrame').load(function (){
    //In case the file does not have any problems assossiated with it, don't do anything.
    if (supress_highlighter){
        return; //Hack to prevent multiple executuions.
    }
    if (locations.length === 0) {
        highlight_clear(previous_highlight.loc); //Clear previous highlight even in files without problems
        console.log("No findings in this file " + fileurl + ", highlights cleared.");
        //Since highlights are cleared, we shouldn't keep a record of highlights
        previous_highlight.loc = [];
        previous_highlight.classname = "";
        return;
    }

    classname = locations[0].classname; //Hack to get the necessary classname for the functions

    //setTimeout(function () { //Hack to get some sort of functionality
    highlight_clear(previous_highlight.loc); // Clear previous highlights

    //Highlight everything in the new file
    previous_highlight.loc = locations;
    previous_highlight.classname = classname;

    highlight_all(locations, classname);

    //Do the hovering
    hover_all(locations, classname);
//}, 3000);
   });
}

function highlighter(){
    "use strict";

    var url;

    if (supress_highlighter || not_ready_highlighter){
        //Do not fire, only change the supressor
        supress_highlighter = false;
        console.log("Triggered and supressed.");
    } else {
        url = document.getElementById("classFrame").contentWindow.location.href;
        filehighlight(url,problems);
        console.log("Triggered and for the url: " + url);
    }
}

/*$('.classFrame').bind('load', function() {
    console.log("Triggered");
    highlighter();
});*/