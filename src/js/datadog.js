/**
 * Datadog RUM + Logs, loaded after the page has finished loading so it never
 * delays rendering. Only 10% of sessions are tracked (and 10% of those get a
 * session replay). Included on every page via scripts/site-chrome.cjs.
 */
(function () {
  'use strict';

  var CDN = 'https://www.datadoghq-browser-agent.com/us5/v7/';
  var CLIENT_TOKEN = 'pub398e9055d3a8e18d44a22e64e505b1fa';
  var SITE = 'us5.datadoghq.com';
  var SERVICE = 'love-and-layovers';
  var SAMPLE = 10;

  // Ad blockers and Google tags fail often and aren't our bugs
  function isGoogle(url) {
    return !!url && (url.indexOf('google-analytics.com') !== -1 || url.indexOf('googletagmanager.com') !== -1);
  }

  function load(file, onload) {
    var s = document.createElement('script');
    s.src = CDN + file;
    s.async = true;
    s.onload = onload;
    document.head.appendChild(s);
  }

  function start() {
    load('datadog-rum.js', function () {
      if (!window.DD_RUM) return;
      window.DD_RUM.init({
        applicationId: '2b36cb95-5c53-4b4c-afd7-5cc7207d8d8c',
        clientToken: CLIENT_TOKEN,
        site: SITE,
        service: SERVICE,
        env: 'production',
        version: '3.0.0',
        sessionSampleRate: SAMPLE,
        sessionReplaySampleRate: 10,
        trackResources: true,
        trackUserInteractions: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
        beforeSend: function (event) {
          return !(event.type === 'error' && event.error && event.error.resource && isGoogle(event.error.resource.url));
        }
      });
    });
    load('datadog-logs.js', function () {
      if (!window.DD_LOGS) return;
      window.DD_LOGS.init({
        clientToken: CLIENT_TOKEN,
        site: SITE,
        service: SERVICE,
        env: 'production',
        sessionSampleRate: SAMPLE,
        forwardErrorsToLogs: true,
        beforeSend: function (log) { return !(log.http && isGoogle(log.http.url)); }
      });
      window.DD_LOGS.logger.info('Page loaded: ' + document.title, { url: location.href, path: location.pathname });
    });
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
