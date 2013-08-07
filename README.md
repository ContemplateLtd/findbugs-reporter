findbugs-reporter v1.0
======================================== 

findbugs-reporter's purpose is to provide easy and intuitive way to navigate bug reports produced by
findbugs. It includes a parser for findbugs' xml format, a command line JXR generation tool, based on
[libJXR](https://github.com/ContemplateLtd/libJXR) and a script runs everything.

The in browser display features error highlighting, sorting by several criteria and source code browsing.
Please refer to the **screenshots** directory for several examples.

Build
--------

To get started you need to follow several simple steps:
  
  Install findbugs standalone
  
  Build and install [libJXR](https://github.com/ContemplateLtd/libJXR) 
```bash
git clone https://github.com/ContemplateLtd/libJXR.git
cd libJXR
mvn install
```
  
  Clone findbugs reporter and build it!
  
```bash
git clone https://github.com/ContemplateLtd/findbugs-reporter.git
cd findbugs-reporter
mvn clean package
```
This produces the following package: *findbugs-reporter/target/findbugs-reporter-1.0-distributable.tar.gz*

Grab it and extract it somewhere.

Usage
--------

After having built findbugs-reporter, extract the tar archive and cd to the directory:
```bash
tar -xvf findbugs-reporter-1.0-distributable.tar.gz
cd findbugs-reporter-1.0
```
  
  Analize your favourite project!
```bash
./deploy.py -d DESTINATION_FOLDER -s PATH_TO_JAVA_FILES1 PATH_TO_JAVA_FILES2, etc -c PATH_TO_CLASS_FILES1 PATH_TO_CLASS_FILES2, etc
```
  
  Start a simple http server in the DESTINATION_FOLDER directory:
```bash
cd DESTINATION_FOLDER
python2 -m SimpleHTTPServer
```
  Open http://127.0.0.1:8000 in your favourite browser

jxr-er
=======

jxr-er is an application that allows you to generate Java Cross Reference html for your project with
one single command.

It relies on on [libJXR](https://github.com/ContemplateLtd/libJXR) which is a fork of maven-jxr that adds functionality.

Build
------
To build jxr-er only do:

```bash
git clone https://github.com/ContemplateLtd/findbugs-reporter.git
cd findbugs-reporter/jxr-er
mvn clean package
```

Usage
--------
**jxr-er** is located in the *jxr-er* directory. Syntax is as follows:

Assuming you have the **templates** directory in the same folder. If that is not the case
you must provide a the **templates** folder via the -t switch

```bash
java -jar jxr-er-1.0.jar -s SOURCE_DIR1 SOURCE_DIR2, etc -d destination_dir
```
All available options:

<pre>
Usage: <main class> [options]
  Options:
    -help, --help, -h
       Display help text.
       Default: false
  * -d
       Output directory
    -f
       Display footer
       Default: false
    -ftext
       Text of the footer.
    -inputencoding
       Specify input encoding for the java files.
       Default: UTF-8
    -pname
       Project name for the template's htmls.
       Default: Project
  * -s
       Path to the source files.
       Default: []
    -style
       Provide a custom stylesheet. It is strongly recommended that if you want
       to provide a custom stylesheet, you should built upon the default one.The
       default stylesheet is located in the templates directory.
    -t
       Path to templates.
       Default: templates
    -tbottom
       Footer for the template's htmls.
       Default: Sample footer.
    -wtitle
       Window title of the template's htmls.
       Default: Window
</pre>
 
Findbugs XML parser
=====================

A javascript parser that reads the findbugs outputted XML and puts it in a convenient to use
javascript datastructure. **It is located under html/lib/parse.js**

USAGE
--------

Include the following in your .html file

```html
<script src="../lib/jquery.js"> </script>
<script src="parser.js"> </script>
```
and provide a callback function from another javascript file:

```javascript
parse_findbugs('findbugs_formatted.xml', test_callback);

function test_callback(findings) {
    problems = findings;
    //Do something with problems
}
```
OUTPUT
-------

The javascript datastructure has the following output:
<pre>
                                   .severity - major/minor
                                   .errortype - ERRORTYPE
        [by-id][index]             .descr - Longer description than the message
        [by-cat][category][index]  .msg - the message of the error  
findings[by-type][ERRORTYPE][index].locations[index].attribute -element of location array
        [by-sev][severity][index]  .primary() - returns the primary error location.
                                   .details - detailed description of the error type
                                   .category - category
                                   
</pre>

TESTING
---------
Automatic testing can be done using node. Requirements are buster, xmlhttprequest and jsdom.

Tests are located in the **test** directory.

```shellscript
npm install buster
npm link buster

npm install jsdom
npm link jsdom

npm install xmlhttprequest
npm link xmlhttprequest

node test.js
```
Notes
-----
findbugs report was generated using:
```bash
findbugs -textui -xml:withMessages -output xml/findbugs.xml PATH_TO_PROJECT_CLASS_FILES
```

Libraries used
---------------

jquery, [jstree](https://github.com/vakata/jstree) with heavily modified theme.

License
--------

Everything but, jquery and jstree is MIT licensed and owned by the University of Edinburgh