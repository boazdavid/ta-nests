/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.ibm.watson.ta.retail;

import java.io.IOException;
import java.net.URI;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.fluent.Response;

@MultipartConfig
public class ImportHousingServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(ImportHousingServlet.class.getName());
	private static final long serialVersionUID = 1L;

	// If running locally complete the variables below with the information in VCAP_SERVICES
	private String baseURL = "https://www.hudhomestore.com/pages/ListExportToExcel.aspx";
//	private String query = "zipCode=&city=&county=&sState=PA&fromPrice=0&toPrice=0&fCaseNumber=&bed=0&bath=0&street=&buyerType=0&specialProgram=&Status=0";

	/**
	 * Forward the request to the index.jsp file
	 *
	 * @param req the req
	 * @param resp the resp
	 * @throws ServletException the servlet exception
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	@Override
	protected void doGet(HttpServletRequest req, final HttpServletResponse resp) throws ServletException, IOException {
		logger.info("forwarding...");

		req.setCharacterEncoding("UTF-8");
		try {
			String queryStr = req.getQueryString();
			String url = baseURL ;
			if (queryStr != null) {
				url += "?" + queryStr;
			}
			URI uri = new URI(url).normalize();

			Request newReq = Request.Get(uri);

			Executor executor = Executor.newInstance();
			Response response = executor.execute(newReq);
			HttpResponse httpResponse = response.returnResponse();
			resp.setStatus(httpResponse.getStatusLine().getStatusCode());

			ServletOutputStream servletOutputStream = resp.getOutputStream();
			httpResponse.getEntity().writeTo(servletOutputStream);
			servletOutputStream.flush();
			servletOutputStream.close();
		} catch (Exception e) {
			// Log something and return an error message
			logger.log(Level.SEVERE, "got error: " + e.getMessage(), e);
			resp.setStatus(HttpStatus.SC_BAD_GATEWAY);
		}
	}
}