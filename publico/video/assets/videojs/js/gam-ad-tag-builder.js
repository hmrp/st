(function () {
  function encodeCustParams(params) {
    var pairs = [];
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === '') {
        return;
      }
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
    });
    return encodeURIComponent(pairs.join('&'));
  }

  function buildGamAdTag(config) {
    var baseUrl = config.baseUrl || 'https://pubads.g.doubleclick.net/gampad/ads';
    var params = {
      iu: config.adUnitPath,
      description_url: config.descriptionUrl || window.location.href,
      tfcd: config.tfcd || '0',
      npa: config.npa || '0',
      sz: config.size || '640x480',
      gdfp_req: '1',
      output: config.output || 'vast',
      env: 'vp',
      impl: 's',
      unviewed_position_start: config.unviewedPositionStart || '1',
      correlator: config.correlator || String(Date.now())
    };
    if (config.url) {
      params.url = config.url;
    }
    if (config.ppid) {
      params.ppid = config.ppid;
    }
    if (config.vpmute !== undefined) {
      params.vpmute = config.vpmute ? '1' : '0';
    }
    if (config.vpa !== undefined) {
      params.vpa = config.vpa;
    }
    if (config.custParams) {
      params.cust_params = encodeCustParams(config.custParams);
    }
    return baseUrl + '?' + Object.keys(params).filter(function (key) {
      return params[key] !== undefined && params[key] !== null && params[key] !== '';
    }).map(function (key) {
      if (key === 'cust_params') {
        return key + '=' + params[key];
      }
      return key + '=' + encodeURIComponent(params[key]);
    }).join('&');
  }

  window.PublisherGamAdTagBuilder = {
    build: buildGamAdTag
  };
})();
