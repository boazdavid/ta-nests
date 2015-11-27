/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
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
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.CookieStore;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.fluent.Response;
import org.apache.http.cookie.Cookie;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.util.EntityUtils;

import com.ibm.json.java.JSONArray;
import com.ibm.json.java.JSONObject;

@MultipartConfig
public class TAProxyServlet extends HttpServlet {
	private static Logger logger = Logger.getLogger(TAProxyServlet.class.getName());
	private static final long serialVersionUID = 1L;

	private String serviceName = "tradeoff_analytics";

	// If running locally complete the variables below with the information in VCAP_SERVICES
	private String baseURL = "https://gateway.watsonplatform.net/tradeoff-analytics/api/";
	private String username = "<username>";
	private String password = "<password>";

	/**
	 * Forward the request to the index.jsp file
	 *
	 * @param req
	 *            the Http Servlet request
	 * @param resp
	 *            the Http Servlet response
	 * @throws ServletException
	 *             the servlet exception
	 * @throws IOException
	 *             Signals that an I/O exception has occurred.
	 */
	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		req.getRequestDispatcher("/index.jsp").forward(req, resp);
	}

	/**
	 * Create and POST a request to the Watson service
	 *
	 * @param req
	 *            the Http Servlet request
	 * @param resp
	 *            the Http Servlet response
	 * @throws ServletException
	 *             the servlet exception
	 * @throws IOException
	 *             Signals that an I/O exception has occurred.
	 */
	@Override
	protected void doPost(final HttpServletRequest req, final HttpServletResponse resp) throws ServletException,
			IOException {

		req.setCharacterEncoding("UTF-8");
		try {
			String reqURI = req.getRequestURI();
			String endpoint = reqURI.substring(reqURI.lastIndexOf('/') + 1);
			String url = baseURL + "/v1/" + endpoint;
			// concatenate query params
			String queryStr = req.getQueryString();
			if (queryStr != null) {
				url += "?" + queryStr;
			}
			URI uri = new URI(url).normalize();
			logger.info("posting to " + url);

			Request newReq = Request.Post(uri);
			newReq.addHeader("Accept", "application/json");
			
			String metadata = req.getHeader("x-watson-metadata");
			if (metadata != null) {
				metadata += "client-ip:" + req.getRemoteAddr();
				newReq.addHeader("x-watson-metadata",metadata);
			}
			
			InputStreamEntity entity = new InputStreamEntity(req.getInputStream());
			newReq.bodyString(EntityUtils.toString(entity, "UTF-8"), ContentType.APPLICATION_JSON);

			Executor executor = this.buildExecutor(uri);
			Response response = executor.execute(newReq);
			HttpResponse httpResponse = response.returnResponse();
			resp.setStatus(httpResponse.getStatusLine().getStatusCode());

			ServletOutputStream servletOutputStream = resp.getOutputStream();
			httpResponse.getEntity().writeTo(servletOutputStream);
			servletOutputStream.flush();
			servletOutputStream.close();

			logger.info("post done");
		} catch (Exception e) {
			// Log something and return an error message
			logger.log(Level.SEVERE, "got error: " + e.getMessage(), e);
			resp.setStatus(HttpStatus.SC_BAD_GATEWAY);
		}
	}

	/**
	 * Gets the <b>VCAP_SERVICES</b> environment variable and return it as a
	 * JSONObject.
	 *
	 * @return the VCAP_SERVICES as Json
	 */
	private JSONObject getVcapServices() {
		String envServices = System.getenv("VCAP_SERVICES");
		if (envServices == null)
			return null;
		JSONObject sysEnv = null;
		try {
			sysEnv = JSONObject.parse(envServices);
		} catch (IOException e) {
			// Do nothing, fall through to defaults
			logger.log(Level.SEVERE, "Error parsing VCAP_SERVICES: " + e.getMessage(), e);
		}
		return sysEnv;
	}

	@Override
	public void init() throws ServletException {
		super.init();
		processVCAP_Services();
	}

	/**
	 * If exists, process the VCAP_SERVICES environment variable in order to get
	 * the username, password and baseURL
	 */
	private void processVCAP_Services() {
		logger.info("Processing VCAP_SERVICES");
		JSONObject sysEnv = getVcapServices();
		if (sysEnv == null)
			return;
		logger.info("Looking for: " + serviceName);

		for (Object key : sysEnv.keySet()) {
			String keyString = (String) key;
			logger.info("found key: " + key);
			if (keyString.startsWith(serviceName)) {
				JSONArray services = (JSONArray) sysEnv.get(key);
				JSONObject service = (JSONObject) services.get(0);
				JSONObject credentials = (JSONObject) service.get("credentials");
				baseURL = (String) credentials.get("url");
				username = (String) credentials.get("username");
				password = (String) credentials.get("password");
				logger.info("baseURL  = " + baseURL);
				logger.info("username = " + username);
				logger.info("password = " + password);
			} else {
				logger.info("Doesn't match /^" + serviceName + "/");
			}
		}
	}

	/**
	 * Build an executor for the specified url. This disables cookies and sets
	 * preemptive authentication (creds are sent without waiting for a 401).
	 * 
	 * NOTE: This is required to avoid issues with load balancers that use
	 * cookies due to Apache Http Client issue:
	 * https://issues.apache.org/jira/browse/HTTPCLIENT-1451
	 * 
	 * @param url
	 * @return
	 */
	private Executor buildExecutor(URI url) {
		return Executor.newInstance().auth(username, password)
				.authPreemptive(new HttpHost(url.getHost(), url.getPort(), url.getScheme()))
				.cookieStore(new CookieStore() {
					// Noop cookie store.
					public void addCookie(Cookie arg0) {
					}

					public void clear() {
					}

					public boolean clearExpired(Date arg0) {
						return false;
					}

					public List<Cookie> getCookies() {
						return Collections.emptyList();
					}
				});
	}
}
