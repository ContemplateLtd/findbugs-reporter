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
subprocess.call(["cp -a html " + destination], shell=True)

# Findbugs
findbugscommand = "findbugs -textui -xml:withMessages -output " + destination +\
                  "/xml/findbugs.xml " + classpath
print("Creating findbugs report")
print("Command is " + findbugscommand)
subprocess.call([findbugscommand], shell=True)

# JXR generation
jxrcommand = "java -jar jxr-er/target/jxr-er-1.0-jar-with-dependencies.jar -d " +\
             destination + "/jxr -t " + os.path.abspath("jxr-er/templates") +\
             " -s " + sourcepath
print("Creating Java Cross Reference using jxr-er")
print("Command is " + jxrcommand)

subprocess.call([jxrcommand], shell=True)

print("Done! Start a server in order to view the report.")
