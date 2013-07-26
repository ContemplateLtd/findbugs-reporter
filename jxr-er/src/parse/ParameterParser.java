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

package parse;

import java.util.ArrayList;
import java.util.List;

import com.beust.jcommander.Parameter;

public class ParameterParser {

	  @Parameter(names = { "-help", "--help", "-h" }, help = true, description = "Display help text.")
	  public boolean help = false;

	  @Parameter(names = "-t", description = "Path to templates.")
	  public String templatepath = "templates";

	  @Parameter(names = "-s", variableArity = true, required = true, description ="Path to the source files.")
	  public List<String> sourcepath = new ArrayList<String>();;

	  @Parameter(names = "-d", required = true, description ="Output directory")
	  public String outputDirectory;
	 
	  @Parameter(names = "-f", description ="Display footer")
	  public Boolean displayFooter = false;
	  
	  @Parameter(names = "-inputencoding", description = "Specify input encoding for the java files.")
	  public String ienc = "UTF-8";
	  
	  @Parameter(names = "-ftext", description ="Text of the footer.")
	  public String footertext;
	  
	  @Parameter(names = "-wtitle", description ="Window title of the template\'s htmls.")
	  public String windowtitle = "Window";
	  
	  @Parameter(names = "-pname", description ="Project name for the template\'s htmls.")
	  public String projectname = "Project";
	  
	  @Parameter(names = "-tbottom", description ="Footer for the template\'s htmls.")
	  public String bottomtext = "Sample footer.";
	  
	  @Parameter(names = "-style", description = "Provide a custom stylesheet. It is strongly " +
	  		"recommended that if you want to provide a custom stylesheet, you should built upon the default one.")
	  public String stylepath;
	  
}
