api_prefix = "https://api.weibo.com"

$ ->
  AccessToken = Backbone.Model.extend({
    defaults: -> 
      {created_at: new Date}
  })

  window.AccessTokenList = Backbone.Collection.extend({
    model: AccessToken
    token: null
    
    initialize: ->
      this.bind("add", this.activate, this)
    
    activate: ->
      this.pick(this.at(0).get("token"))
    
    pick: (val)-> # use a give in token
      @token = val
      this.trigger("token:activate", @token)
    
    apiGet: (url, data, callback) ->
      this._invoke(url, data, callback, false)
    
    apiPost: (url, data, callback) ->
      this._invoke(url, data, callback, true)
    
    _invoke: (url, data, callback, isPost) ->
      verb = "get"
      if isPost then verb = "post"
      console.log("#{verb} #{url} #{JSON.stringify(data)}");
      if @token
        method = $.getJSON
        if isPost then method = $.post
        method url, _.extend({access_token: @token}, data), callback
      else
        console.log("CANNOT FIND TOKEN!")
  })
  
  window.API = new AccessTokenList
  
  User = Backbone.Model.extend({})
  UserList = Backbone.Collection.extend({
    model: User
  })
  
  Users = new UserList
  
  Tweet = Backbone.Model.extend({})
  TweetList = Backbone.Collection.extend({
    model: Tweet,
    min_id: 0,
    max_id: 0,
    api: "#{api_prefix}/2/statuses/home_timeline.json"
    
    initialize: ->
      API.bind("token:activate", this.update_latest, this)
      this.bind("add", this.updateUser, this)
        
    updateUser: (s)->
      json = s.toJSON()
      user1 = json["user"]
      if json["retweeted_status"] then user2 = json["retweeted_status"]["user"]
      this._updateUser(user1)
      if user2 then this._updateUser(user2)
    
    _updateUser: (json) ->
      u = Users.get(json["id"])
      if u
        u.set json # TODO: skip the id
      else
        Users.add(new User(json))
    
    update_latest: ->
      API.apiGet @api, {since_id: @max_id}, (data) =>
        this.add(data["statuses"].reverse()) #fix the events here to batch update
        @min_id = this.at(0).id
        @max_id = this.at(this.length - 1).id
  
    fetch_local: ->
      API.apiGet "home_timeline.json", {}, (data) =>
        this.add(data["statuses"].reverse())
  
  });

  window.Tweets = new TweetList
  
  UserTweetList = TweetList.extend({
    api: "#{api_prefix}/2/statuses/user_timeline.json"
    cache: {}    
    initialize: ->
      
    by_user: (user_id, callback) ->
      if this._expired(user_id)
        API.apiGet @api, {uid: user_id, since_id: @cache[user_id]["maxId"]}, (data) =>        
          @cache[user_id]["lastUpdate"] = (new Date()).getTime()
          d = data["statuses"]
          console.log("found #{d.length} tweets for user #{user_id}")
          if d.length > 0
            @cache[user_id]["maxId"] = d[0].id
            @cache[user_id]["minId"] = d[d.length - 1].id            
          this.add(d)          
          callback(this._filter_by_user(user_id))
      else 
        callback(this._filter_by_user(user_id))
      
    _filter_by_user: (user_id) ->
      this.select (t) -> 
        t.toJSON().user.id == parseInt(user_id)

    _expired: (user_id) ->
      if @cache[user_id]
        (new Date()).getTime() - @cache[user_id]["lastUpdate"] > 120 * 1000 
      else
        @cache[user_id] = {}
        return true
  })
  
  UserTweets = new UserTweetList
    
  Comment = Backbone.Model.extend({})
  CommentList = Backbone.Collection.extend({
    model: Comment,
    api: "#{api_prefix}/2/comments/show.json",
    cache: {}
    fetch_local: ->
      API.apiGet "status_comments.json", {}, (data) =>
        this.add(data["comments"])
    fetch_by_status: (status_id)->
      API.apiGet @api, {id: status_id}, (data) =>
        this.add(data["comments"])
    by_status: (status_id, callback) ->
      if this._expired(status_id)
        API.apiGet @api, {id: status_id, since_id: @cache[status_id]["maxId"]}, (data) =>
          cs = data["comments"]          
          @cache[status_id]["lastUpdate"] = (new Date).getTime()
          if (cs.length > 0)
            @cache[status_id]["maxId"] = cs[0].id
            @cache[status_id]["minId"] = cs[cs.length - 1].id
          this.add(cs)
          callback(this._filter_by_status(status_id))
      else
        callback(this._filter_by_status(status_id))
        
    _expired: (status_id) ->
      if @cache[status_id]
        (new Date()).getTime() - @cache[status_id]["lastUpdate"] > 120 * 1000 
      else
        @cache[status_id] = {}
        return true
      
    _filter_by_status: (status_id) ->
      if _.isUndefined(@cache[status_id])
        @cache[status_id] = {lastUpdate: 0, maxId: 0, minId: 0}
      this.select (c) -> 
        c.toJSON().status.id == parseInt(status_id)
      
  })
  
  window.Comments = new CommentList

  _last = null

  TweetView = Backbone.View.extend({
    tagName: 'li'
    className: 'bo_container'
    events: 
      "click .avatar": "show_user",
      "click .user_link": "show_user_link",      
      "click .reply": "reply",
      "click .retweet": "retweet",
      "click": "show_detail"
    template: doT.template($("#template").text())
    
    initialize: ->
      API.bind("token:activate", this.updateToken, this)
    
    updateToken: ->
      $("#logo").hide()
    
    render: ->
      $(this.el).html(this.template(this.model.toJSON()))
      return this
    
    show_detail: -> 
      if _last != null && _last != this
        $(_last.el).removeClass("selected")
      
      $(this.el).addClass("selected")
      _last = this
      Routes.navigate("tweets/#{this.model.id}", {trigger: true})
    
    show_user_link: (el)->
      location.href=$(el.target).attr("href")
      return false;
    
    reply: ->
      return false
      
    retweet: ->
      return false
    
    show_user: ->
      Routes.navigate("users/#{this.model.get("user").id}", {trigger: true})
      return false
  }) 
  
  TweetDetailView = Backbone.View.extend({
    el: $("#inner")
    side_width: "500px"
    template: doT.template($("#template_full").text())
    comment_template: doT.template($("#comments_template").text())
    
    render: ->
      _this = this
      $(this.el).scrollTop(0)
      $(this.el).css("width", parseInt(this.side_width) * 2 + "px");
      $(this.el).find(".anim_block").each ->
        $(this).css("width", _this.side_width);
        if $(this).css("left") != "0px"
          $(this).html(_this.template(_this.model.toJSON()))
          Comments.by_status _this.model.id, (data)->
            $(".loading").hide();
            comments = _.map data, (c) -> c.toJSON()
            $(".recent_comments").html(_this.comment_template(comments))
      
      this._animate()
          
    _animate: ->
      _this = this
      $(this.el).animate {"left": "+#{this.side_width}"}, "fast", -> 
        $(_this.el).find(".anim_block").each (el) ->
          old = $(this).css("left")
          if old == "0px" then new_width = "-#{_this.side_width}" else new_width = "0px"
          $(this).css("left", new_width)
          $(_this.el).css("left", "0px")
        
  })
  
  UserDetailView = Backbone.View.extend({
    el: $("#inner")
    side_width: "500px"
    comment_template: doT.template($("#comments_template").text())
    template: doT.template($("#user_detail_template").text())
    
    render: ->
      _this = this
      $(this.el).scrollTop(0)
      $(this.el).css("width", parseInt(this.side_width) * 2 + "px");
      $(this.el).find(".anim_block").each ->
        $(this).css("width", _this.side_width);
        if $(this).css("left") != "0px"
          $(this).html(_this.template(_this.model.toJSON()))
          UserTweets.by_user _this.model.id, (data)->
            $(".loading").hide();
            tweets = _.map data, (t) -> t.toJSON()
            $(".recent_statuses").html(_this.comment_template(tweets))
      
      this._animate()
    
    _animate: ->
            _this = this
            $(this.el).animate {"left": "+#{this.side_width}"}, "fast", -> 
              $(_this.el).find(".anim_block").each (el) ->
                old = $(this).css("left")
                if old == "0px" then new_width = "-#{_this.side_width}" else new_width = "0px"
                $(this).css("left", new_width)
                $(_this.el).css("left", "0px")
          
  })
  
  TweetsView = Backbone.View.extend({
    el: $("#tweets_list")
    initialize: -> 
      Tweets.bind('add', this.addOne, this)
      API.bind("token:activate", this.updateUI, this)
      
    updateUI: ->
      $(".nav_buttons").show("slow")
      $("#logo").hide("fast");
      
    addOne: (s)->
      view = new TweetView({model: s, id:"status-#{s.id}", attributes: {"data-id" : s.id}})
      $("#tweets_list").prepend(view.render().el); #TODO: only scroll when nessary
    showTweet: (id) ->
      view = new TweetDetailView({model: Tweets.get(parseInt(id))})
      view.render()
      
    showUser: (id) ->
      new UserDetailView({model: Users.get(parseInt(id))}).render()
  })

  ListView = new TweetsView
  
  NewStatusView = Backbone.View.extend({
    el: $("#new_status")
    api: "#{api_prefix}/2/statuses/update.json"
    events: {
      "click .cancel" : "cancel",
      "click .submit" : "submit"
    }
    
    render: ->
      $(this.el).animate({"top": "80px"}, "fast")
      $(this.el).find("textarea").focus()
      $("#overlay").css("z-index", "150");
    
    cancel: ->
      $(this.el).animate {"top": "-100px"}, "fast"
      $("#overlay").css("z-index", "-1");
      
    submit: ->
      API.apiPost @api, { status: $("#new_status_content").val() }, ->
        $("#new_status_content").val("")
        Tweets.update_latest()
      
      $(this.el).animate {"top": "-100px"}, "fast"
      $("#overlay").css("z-index", "-1");
  })
  
  window.NewStatus = new NewStatusView

  # Router
  Workspace = Backbone.Router.extend({
    routes: 
      "tweets/:id":     "show_tweet",  
      "users/:id":      "show_user" 
  
    show_tweet: (id)->
      if Tweets.length > 0
        ListView.showTweet(id)
  
    show_user: (id) ->
      if Users.length > 0
        ListView.showUser(id)
  })

  Routes = new Workspace
  Backbone.history.start()
