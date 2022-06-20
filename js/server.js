#!/usr/bin/env nodejs
// Name: Johnathan Chivington
// Project: home.net App Server
// Description: Basic node file/app server
// Version: 0.0.1 - Serves apps by subdomain.

// Includes
const os = require('os');
const fs = require('fs');
const url = require('url');
const http = require('http');
const qs = require('querystring');


// mime-types
const mimeTypes = {
  'html': 'text/html',
  'css': 'text/css',
  'js': 'application/javascript',
  'json': 'text/json',
  'ico': 'image/ico',
  'svg': 'image/svg+xml',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'mp4': 'video/mp4',
  'pdf': 'application/pdf',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'otf': 'application/x-font-otf'
};


// logger
function log_details(type,details) {
  console.log(`.`);
  console.log(`${type} REQUEST:\n`,details);
  console.log(`.`);
};


// request parser
function parse_request(request) {
  // Constants
  const app_root = `/var/www/domains/home.net`;
  const last_modified = `Thur, 26 May 2022 13:00:00 GMT`;
  const age = `max-age=86400`;
  const datetime = new Date(Date.now() + 86400000).toUTCString();

  // Request Details
  const subdomain = request.headers.host.split('.')[0];
  const uri = url.parse(request.url).pathname;
  const exists = fs.existsSync(`${app_root}${uri}`);
  const resource = app_root + (uri == '/' ? '/index.html' : (exists ? `${uri}` : `/index.html`));
  const extension = resource.split('.')[2];
  const mime = mimeTypes[extension] ? mimeTypes[extension] : mimeTypes['html'];

  // Return request details
  return [app_root,last_modified,age,datetime,subdomain,uri,exists,resource,extension,mime];
};


// send util
function send_response(req, res, headers, data, app) {
  res.writeHead(200, headers);
  res.write(data);
  res.end();
};


// serve app
function app_api(request,response) {
  const [app_root,last_modified,age,datetime,subdomain,uri,exists,resource,extension,mime] = parse_request(request);

  // log app request
  log_details(`APP`,{datetime,uri});

  // header details
  const headers = {'content-type': mime, 'last-modified': last_modified, 'cache-control': age, 'expires': datetime, 'Allow': 'GET, POST'};

  // send response
  fs.readFile(resource, null, (err, data) => send_response(request, response, headers, data, 'APP'));
};


// request handler
function requestHandler(request,response) {
  // serve app or relay rtc
  // if (request.method == `POST`) rtc_api(request,response);
  app_api(request,response);
};


http.createServer(requestHandler).listen(3001, '127.0.0.1');
console.log('[chivington.casa - app server] online at 127.0.0.1:3001/');
