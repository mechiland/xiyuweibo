sina_api = {
  home: "https://api.weibo.com/2/statuses/home_timeline.json"
}

$ ->
  window.Tweet = Backbone.Model.extend({})

  window.TweetList = Backbone.Collection.extend({
    model: Tweet,
    min_id: 0,
    max_id: 0,
    init: (token) -> 
      @token = token
      console.log("get token: #{@token}")
      $.getJSON sina_api.home, {access_token: @token}, (data) =>
        this.add(data["statuses"].reverse())
        @min_id = this.at(0).id
        @max_id = this.at(this.length - 1).id
    update_latest: ->
      console.log("Updating from server...> #{@max_id}")
      $.getJSON sina_api.home, {access_token: @token, since_id: @max_id}, (data) =>
        this.add(data["statuses"].reverse())
        @min_id = this.at(0).id
        @max_id = this.at(this.length - 1).id
  
    fetch_local: ->
      $.getJSON "home_timeline.json", (data) =>
        this.add(data["statuses"].reverse())
  
  });

  window.Tweets = new TweetList

  window.AccessToken = Backbone.Model.extend({
    defaults: -> 
      {created_at: new Date}
  })
  
  _last = null

  TweetView = Backbone.View.extend({
    tagName: 'li'
    className: 'bo_container'
    events: 
      "click .avatar": "show_user"
      "click .content": "show_detail"
      
    template: doT.template($("#template").text())
    
    render: ->
      $(this.el).html(this.template(this.model.toJSON()))
      return this
    
    show_detail: -> 
      if _last != null 
        if _last == this then return
        $(_last.el).removeClass("selected")
      
      $(this.el).addClass("selected")
      _last = this
      Routes.navigate("tweets/#{this.model.id}", {trigger: true})
    
    show_user: ->
      console.log("Showing user");
  }) 
  
  TweetDetailView = Backbone.View.extend({
    el: $("#inner")
    side_width: "500px"
    template: doT.template($("#template_full").text())
    
    render: ->
      _this = this
      $(this.el).css("width", parseInt(this.side_width) * 2 + "px");
      $(this.el).find(".anim_block").each ->
        $(this).css("width", _this.side_width);
        if $(this).css("left") != "0px"
          $(this).html(_this.template(_this.model.toJSON()))
      
      $(this.el).animate {"left": "+#{this.side_width}"}, "fast", -> 
        $(_this.el).find(".anim_block").each (el) ->
          old = $(this).css("left")
          if old == "0px" then new_width = "-#{_this.side_width}" else new_width = "0px"
          $(this).css("left", new_width)
          $(_this.el).css("left", "0px")
  })

  TweetsView = Backbone.View.extend({
    el: $("#tweets_list")
    initialize: -> Tweets.bind('add', this.addOne, this)
    addOne: (s)->
      view = new TweetView({model: s, id:"status-#{s.id}", attributes: {"data-id" : s.id}})
      $("#tweets_list").prepend(view.render().el);
    showTweet: (id) ->
      view = new TweetDetailView({model: Tweets.get(parseInt(id))})
      view.render()
  })

  ListView = new TweetsView

  # Router
  Workspace = Backbone.Router.extend({
    routes: 
      "":                 "index",  
      "tweets/:id":     "show_tweet",  
      "users/:id":         "show_user" 

    index: ->
      console.log("Home") # TODO
  
    show_tweet: (id)->
      if Tweets.length > 0
        ListView.showTweet(id)
  
    show_user: (id) ->
      console.log("show user #{id}") #TODO
  })

  Routes = new Workspace
  Backbone.history.start()
