var check, delay, repeat, side_width;

delay = function(ms, func) {
  return setTimeout(func, ms);
};

repeat = function(ms, func) {
  return setInterval(func, ms);
};

String.prototype.autoAt = function() {
  var pattern;
  pattern = /(@([^ :]+))/ig;
  return this.replace(pattern, "<a href='http://www.weibo.com/n/$2'>$1</a>");
};

Date.prototype.human = function() {
  return this.format("m月d日 hh:mm");
};

side_width = "500px";

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
  var pattern, token, url;
  url = w.url();
  pattern = /#access_token=([^&]+)/;
  if (!pattern.test(w.url())) {
    return delay(2000, function() {
      return check(w);
    });
  } else {
    token = w.url().match(pattern)[1];
    return Tokens.add({
      token: token
    });
  }
};

$(function() {
  var _last;
  _last = null;
  $(".main, .side").attr("style", "height: " + (window.innerHeight - 40) + "px");
  $(document).on("click", ".single_bo .content a", function() {
    macgap.app.open($(this).attr("href"));
    return false;
  });
  $(window).resize(function() {
    return $(".main, .side").attr("style", "height: " + (window.innerHeight - 40) + "px");
  });
  $("#btn_fetch").click(function() {
    return Tweets.update_latest();
  });
  $("#nav_new_status").click(function() {
    return NewStatus.render();
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
