#! /usr/bin/env python

import argparse
import subprocess
import os

parser = argparse.ArgumentParser(description='A tool to produce a findbugs report for browsing')
parser.add_argument('-c', '--classpath', nargs='*', type=str,
                    help='Specify path(s) to .class files')
parser.add_argument('-s', '--sourcepath', nargs='*', type=str,
                    help='Specify path(s) to .java files')
parser.add_argument('-d', '--destination', nargs=1, type=str,
                    help='Specify destination for the report.')
args = parser.parse_args()  # Parse arguments

# Get a string of source and classpath. Also make paths absolute, as
# libJXR might break otherwise

sourcepath = ""
for item in args.sourcepath:
    sourcepath = sourcepath + ' ' + os.path.abspath(item)

classpath = ""
for item in args.classpath:
    classpath = classpath + ' ' + os.path.abspath(item)

destination = os.path.abspath(args.destination[0])

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
