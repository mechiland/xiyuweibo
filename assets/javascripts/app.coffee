delay = (ms, func) -> setTimeout func, ms
repeat = (ms, func) -> setInterval func, ms

doT.templateSettings = {
  evaluate:    /\[\[([\s\S]+?)\]\]/g,
  interpolate: /\[\[=([\s\S]+?)\]\]/g,
  encode:      /\[\[!([\s\S]+?)\]\]/g,
  use:         /\[\[#([\s\S]+?)\]\]/g,
  define:      /\]\]##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\]\]/g,
  varname:     'it',
  strip :      true,
  append:      true
};

check = (w) ->
  url = w.url()
  pattern = /#access_token=([^&]+)/
  if !pattern.test(w.url())
    delay(2000, -> check(w))
  else
    token = w.url().match(pattern)[1]
    url = "https://api.weibo.com/2/statuses/home_timeline.json?access_token=#{token}"
    fn = doT.template($("#template").text())
    $.getJSON url, (data) -> 
      console.log(data["statuses"].length)
      for s in data["statuses"].reverse()
        s.text = s.text.autoLink()
        text = fn(s)
        $(".bo_list").prepend(text)

$ ->
  _last = null
  $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")

  $(document).on "click", ".bo_container", ->
    if _last != null
      _last.removeClass("selected")
      $('.sub_container').animate({"left": "0px"}, "fast").hide()
      
    _last = $(this)
    $(this).addClass("selected")
    $('.sub_container').show().animate({"left": $(this).width() + "px"}, "fast")
  
  $(document).on "click", ".single_bo .content a", ->
    macgap.app.open($(this).attr("href"))
    return false
  
  $(window).resize ->
    $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")
  
  $("#btn_fetch").click ->
    fn = doT.template($("#template").text())
    rtFn = doT.template($("#retweet_template").text())
    $.getJSON "home_timeline.json", (data) -> 
      for s in data["statuses"].reverse()
        s.rt_content = ""
        if s.retweeted_status
          s.retweeted_status.text = s.retweeted_status.text.autoLink()
          s["rt_content"] = rtFn(s.retweeted_status)
        s.text = s.text.autoLink()
        text = fn(s)
        
        $(".bo_list").prepend(text)
  
  $("#btn_login").click ->
    l = macgap.window.open({url: "public/auth_sina.html", width: 640, height: 480})
    check(l);    

