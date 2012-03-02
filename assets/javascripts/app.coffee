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

render_status = (s, template="#template") ->
  fn = doT.template($(template).text())
  fullFn = doT.template($(template).text())
  s.text = s.text.autoLink()
  return fn(s)
  
$ ->
  statuses = new Statuses
  statuses.on "add", (s)-> 
    s = s.toJSON()    
    $(".bo_list").prepend(render_status (s))
  
  _last = null
  
  $(".container").attr("style", "height: " + (window.innerHeight - 36) + "px")

  $(document).on "click", ".bo_container", ->
    if _last != null
      _last.removeClass("selected")
    
    $(this).addClass("selected");
    _last = $(this)
    
    id = $(this).attr("data-id")
    
    $(".inner .anim_block").each ->
      if $(this).css("left") == "-400px"
        s = statuses.get(id)
        s = s.toJSON()
        $(this).html(render_status(s, "#template_full"))        
    
    $('.inner').animate {"left": "+400px"}, "slow", -> 
      $(".inner .anim_block").each (el) ->
        old = $(this).css("left")
        if old == "0px" then new_width = "-400px" else new_width = "0px"
        $(this).css("left", new_width)
        $(".inner").css("left", "0px")
  
  $(document).on "click", ".single_bo .content a", ->
    macgap.app.open($(this).attr("href"))
    return false
  
  $(window).resize ->
    $(".container, .sub_container").attr("style", "height: " + (window.innerHeight - 36) + "px")
  
  $("#btn_fetch").click ->
    url = ""
    if typeof(magcap) != 'undefined' then url = "public/"
    $.getJSON "#{url}home_timeline.json", (data) -> 
      statuses.add(data["statuses"].reverse())
  
  $("#btn_login").click ->
    l = macgap.window.open({url: "auth_sina.html", width: 640, height: 480})
    check(l);
