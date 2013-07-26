/*
 * The MIT License (MIT)
 *
 * Copyright (c) <2013> <Nikolay Bogoychev>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import java.io.File;
import java.io.IOException;
import org.apache.maven.jxr.JXR;
import org.apache.maven.jxr.JxrException;
import org.apache.commons.io.FileUtils;

import parse.ParameterParser;

import com.beust.jcommander.JCommander;

public class Runner {

	public static void main(String [] args) throws IOException, JxrException{
		
		//Parse
		ParameterParser jct = new ParameterParser();
		JCommander jcom = new JCommander(jct, args);
		
		//Check if all provided parameters are here.
		if (jct.help){
			jcom.usage();
			System.exit(0);
		}
		
		JXR jxr = new JXR();
		JXR.showFooter = jct.displayFooter; //Set footer visibility
		
		//Set new footer,if one is provided.
		if (jct.footertext != null){
			jxr.setFooter(jct.footertext);
		}
		
		//Set jxr parameters
		jxr.setDest( jct.outputDirectory );
		jxr.setInputEncoding( jct.ienc );
        jxr.setOutputEncoding( "UTF-8" );
        jxr.setLog( new DummyLog() );
		jxr.xref(jct.sourcepath, jct.templatepath, jct.windowtitle, jct.projectname, jct.bottomtext );
		
		//Set up the stylesheet path;
		if (jct.stylepath == null){
			jct.stylepath = jct.templatepath + "/stylesheet.css";
		}
		//Copy the stylesheet file to the proper location.
		FileUtils.copyFile(new File(jct.stylepath), new File(jct.outputDirectory + "/stylesheet.css"));
	}

}
