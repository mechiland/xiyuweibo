(function() {
  var check, delay, repeat;

  delay = function(ms, func) {
    return setTimeout(func, ms);
  };

  repeat = function(ms, func) {
    return setInterval(func, ms);
  };

  doT.templateSettings = {
    evaluate: /\[\[([\s\S]+?)\]\]/g,
    interpolate: /\[\[=([\s\S]+?)\]\]/g,
    encode: /\[\[!([\s\S]+?)\]\]/g,
    use: /\[\[#([\s\S]+?)\]\]/g,
    define: /\]\]##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\]\]/g,
    varname: 'it',
    strip: true,
    append: true
  };

  check = function(w) {
    var fn, pattern, token, url;
    url = w.url();
    pattern = /#access_token=([^&]+)/;
    if (!pattern.test(w.url())) {
      return delay(2000, function() {
        return check(w);
      });
    } else {
      token = w.url().match(pattern)[1];
      url = "https://api.weibo.com/2/statuses/home_timeline.json?access_token=" + token;
      fn = doT.template($("#template").text());
      return $.getJSON(url, function(data) {
        var s, text, _i, _len, _ref, _results;
        console.log(data["statuses"].length);
        _ref = data["statuses"].reverse();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          s.text = s.text.autoLink();
          text = fn(s);
          _results.push($(".bo_list").prepend(text));
        }
        return _results;
      });
    }
  };

  $(function() {
    var _last;
    _last = null;
    $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px");
    $(document).on("click", ".bo_container", function() {
      if (_last !== null) {
        _last.removeClass("selected");
        $('.sub_container').animate({
          "left": "0px"
        }, "fast").hide();
      }
      _last = $(this);
      $(this).addClass("selected");
      return $('.sub_container').show().animate({
        "left": $(this).width() + "px"
      }, "fast");
    });
    $(document).on("click", ".single_bo .content a", function() {
      macgap.app.open($(this).attr("href"));
      return false;
    });
    $(window).resize(function() {
      return $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px");
    });
    $("#btn_fetch").click(function() {
      var fn, rtFn;
      fn = doT.template($("#template").text());
      rtFn = doT.template($("#retweet_template").text());
      return $.getJSON("home_timeline.json", function(data) {
        var s, text, _i, _len, _ref, _results;
        _ref = data["statuses"].reverse();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          s.rt_content = "";
          if (s.retweeted_status) {
            s.retweeted_status.text = s.retweeted_status.text.autoLink();
            s["rt_content"] = rtFn(s.retweeted_status);
          }
          s.text = s.text.autoLink();
          text = fn(s);
          _results.push($(".bo_list").prepend(text));
        }
        return _results;
      });
    });
    return $("#btn_login").click(function() {
      var l;
      l = macgap.window.open({
        url: "public/auth_sina.html",
        width: 640,
        height: 480
      });
      return check(l);
    });
  });

}).call(this);
