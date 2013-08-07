#! /usr/bin/env python

import argparse
import subprocess
import os
import time

parser = argparse.ArgumentParser(description='A tool to produce a findbugs report for browsing')
parser.add_argument('-c', '--classpath', nargs='*', type=str,
                    help='Specify path(s) to .class files')
parser.add_argument('-s', '--sourcepath', nargs='*', type=str,
                    help='Specify path(s) to .java files')
parser.add_argument('-d', '--destination', nargs=1, type=str,
                    help='Specify destination for the report.'),
parser.add_argument('-p', '--projectname', nargs=1, type=str,
                    help='Provide the name of the project to be analysed.')
args = parser.parse_args()  # Parse arguments

#Check arguments provided
if not (args.sourcepath and args.destination and args.classpath and args.projectname):
    parser.error('Not enough arguments supplied. Please use --help to enquire about usage.')

# Get a string of source and classpath. Also make paths absolute, as
# libJXR might break otherwise

sourcepath = ""
for item in args.sourcepath:
    sourcepath = sourcepath + ' ' + os.path.abspath(item)

classpath = ""
for item in args.classpath:
    classpath = classpath + ' ' + os.path.abspath(item)

destination = os.path.abspath(args.destination[0])

projectname = args.projectname[0]

print("Creating files.")
subprocess.check_call(["cp -a html " + destination], shell=True)
subprocess.check_call(["mkdir " + destination + "/jxr"], shell=True)
subprocess.check_call(["mkdir " + destination + "/xml"], shell=True)


# Findbugs
findbugscommand = "findbugs -textui -xml:withMessages -output " + destination +\
                  "/xml/findbugs.xml " + classpath
print("Creating findbugs report")
print("Command is " + findbugscommand)
subprocess.check_call([findbugscommand], shell=True)

#Write project specific infromation:

introfile = open(destination + '/intro.html', 'r+')
html = introfile.read()
html = html.replace('<p>Project: </p>', '<p>Project: ' + projectname + '</p>')
analysistime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
html = html.replace('<p>Date: </p>', '<p>Date: ' + analysistime + '</p>')
count_proc = subprocess.Popen(['find '+ sourcepath + ' -name "*.java" | wc -l'], shell=True, stdout=subprocess.PIPE)
count = count_proc.stdout.read()
number = (count.decode('utf-8')).replace('\n', '')
html = html.replace('<p>Number of java files: </p>', '<p>Number of java files: ' + number +'</p>')
introfile.seek(0)
introfile.write(html)
introfile.truncate()
introfile.close()

# JXR generation
jxrcommand = "java -jar jxr-er-1.0-jar-with-dependencies.jar -d " +\
             destination + "/jxr -s " + sourcepath

print("Creating Java Cross Reference using jxr-er")
print("Command is " + jxrcommand)

subprocess.check_call([jxrcommand], shell=True)

print("Done! Start an http server in order to view the report.")
print("One way to do that is by using python: ")
print("cd " + destination)
print("python2 -m SimpleHTTPServer")
print("Now go on http://127.0.0.1:8000")
