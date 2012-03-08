delay = (ms, func) -> setTimeout func, ms
repeat = (ms, func) -> setInterval func, ms

String::autoAt = ->
  pattern = /(@([^ :]+))/ig
  this.replace(pattern, "<a href='http://www.weibo.com/n/$2'>$1</a>")

Date::human = ->
  minutes = this.getMinutes()
  if minutes < 10 then minutes = "0" + minutes
  "#{this.getMonth() + 1}月#{this.getDate()}日 #{this.getHours()}:#{minutes}"

side_width = "500px"; 

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
    API.pick(token)

$ ->
  
  $(".main, .side").attr("style", "height: " + (window.innerHeight - 37) + "px")
  
  $(document).on "click", ".single_bo .content a", ->
    macgap.app.open($(this).attr("href"))
    return false
  
  $(window).resize ->
    $(".main, .side").attr("style", "height: " + (window.innerHeight - 37) + "px")
  
  $("#btn_fetch2").click ->
    Tweets.fetch_local()
    Comments.fetch_local()

  $("#btn_fetch").click ->
    Tweets.update_latest()
  
  $("#nav_new_status").click -> 
    NewStatus.render()
  
  $("#btn_login").click ->
    l = macgap.window.open({url: "public/auth_sina.html", width: 640, height: 480})
    check(l);
    
  $("#pick").click -> 
    t = $("#token").val()
    API.pick(t)
    
