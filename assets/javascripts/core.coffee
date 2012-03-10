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
  
  Tweet = Backbone.Model.extend({})
  TweetList = Backbone.Collection.extend({
    model: Tweet,
    min_id: 0,
    max_id: 0,
    api: "#{api_prefix}/2/statuses/home_timeline.json"
    
    initialize: ->
      API.bind("token:activate", this.update_latest, this)
    
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
  
  PublicTweetList = TweetList.extend({
    api: "#{api_prefix}/2/statuses/public_timeline.json"
  })
  window.PublicTweets = new PublicTweetList
  
  User = Backbone.Model.extend({})
  UserList = Backbone.Collection.extend({
    model: User,
    initialize: ->
      Tweets.bind("add", this.updateUser, this)
      PublicTweets.bind("add", this.updateUser, this)
  
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

  })
  
  Users = new UserList
  
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
      NewComment.render(this.model.id)
      return false
      
    retweet: ->
      NewRetweet.render(this.model.id)
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
  
  TweetListView = Backbone.View.extend({
    el: $("#home_tweets_list")
    initialize: -> 
      Tweets.bind('add', this.addOne, this)
      API.bind("token:activate", this.updateUI, this)
      
    updateUI: ->      
      $("#logo").hide("fast");
      
    addOne: (s)->
      view = new TweetView({model: s, id:"status-#{s.id}", attributes: {"data-id" : s.id}})
      $(this.el).prepend(view.render().el); #TODO: only scroll when nessary

    getTweet: (id) ->
      Tweets.get(parseInt(id))

    render: ->
      $("#home_tweets_list").show()
      $("#public_tweets_list").hide()
  })

  HomeTweetsView = new TweetListView
  
  PublicTweetListView = TweetListView.extend({
    el: $("#public_tweets_list")
    initialize: ->
      PublicTweets.bind('add', this.addOne, this)
    getTweet: (id) ->
      PublicTweets.get(parseInt(id))
    render: ->
      $("#home_tweets_list").hide()
      $("#public_tweets_list").show()    
  })
  
  PublicTweetsView = new PublicTweetListView
    
  NewStatusView = Backbone.View.extend({
    el: $("#new_status")
    api: "#{api_prefix}/2/statuses/update.json"
    events: {
      "click .cancel" : "cancel",
      "click .submit" : "submit"
    }
    
    render: ->      
      $(this.el).animate({"top": "80px"}, "fast")
      $(this.el).find(".post_input_content").focus()
      $("#overlay").css("z-index", "150");
    
    cancel: ->
      $(this.el).animate {"top": "-100px"}, "fast"
      $("#overlay").css("z-index", "-1");
      
    submit: ->
      this._postData()
      $(this.el).animate {"top": "-100px"}, "fast"
      $("#overlay").css("z-index", "-1");
      
    _postData: ->
      input = $(this.el).find(".post_input_content")
      API.apiPost @api, {status: input.val()}, =>
        input.val("")
        Tweets.update_latest()
      
  })
  
  NewCommentView = NewStatusView.extend({
    el: $("#new_comment")
    api: "#{api_prefix}/2/comments/create.json"
    render: (status_id) ->
      @status_id = status_id
      NewStatusView.prototype.render.call(this); # ugly
    
    _postData: -> 
      input = $(this.el).find(".post_input_content")
      API.apiPost @api, { comment: input.val(), id: @status_id }, =>
        input.val("")
        Comments.by_status @status_id, ->
          console.log("update comments")
        # Tweets.update_latest()
  })
  
  NewRetweetView = NewStatusView.extend({
    el: $("#new_retweet")
    api: "#{api_prefix}/2/statuses/repost.json"
    render: (status_id) ->
      @status_id = status_id
      NewStatusView.prototype.render.call(this); # ugly
      $(this.el).find(".post_input_content").val("转发微博")      
    
    _postData: -> 
      input = $(this.el).find(".post_input_content")
      API.apiPost @api, { status: input.val(), id: @status_id }, =>
        input.val("")
        Tweets.update_latest()
  })
  
  window.NewStatus = new NewStatusView
  window.NewComment = new NewCommentView
  window.NewRetweet = new NewRetweetView
  
  NavView = Backbone.View.extend({
    el: $("nav")
    current: '.home'
    events: {
      "click .home" : "goHome",
      "click .at_me" : "goAtMe",
      "click .public" : "goPublic",
      "click .refresh" : "refresh",
      "click .new_status" : "newStatus"
    }
    
    initialize: ->
      API.bind("token:activate", this.render, this)
          
    render: ->
      $(this.el).find(".nav_buttons").show("slow")
      
    goHome: ->
      this._updateIcon(".home");
      HomeTweetsView.render();
      return false;

    goAtMe: ->
      this._updateIcon(".at_me");
      return false;

    goPublic: ->
      this._updateIcon(".public");
      PublicTweetsView.render();
      return false;

    refresh: ->
      if @current == '.home' then Tweets.update_latest()
      if @current == '.public' then PublicTweets.update_latest()
      return false;

    newStatus: ->
      NewStatus.render()
      return false;
    
    _updateIcon: (new_state)->
      if new_state == @current then return
      $(this.el).find(@current).removeClass("nav_selected")
      @current = new_state
      $(this.el).find(@current).addClass("nav_selected")    
  })
  window.Nav = new NavView
  
  # Router
  Workspace = Backbone.Router.extend({
    routes: 
      "tweets/:id":     "show_tweet",  
      "users/:id":      "show_user" 
  
    show_tweet: (id)->
      if Nav.current == ".home"
        tweet = Tweets.get(id)
      else 
        tweet = PublicTweets.get(id)
      view = new TweetDetailView({model: tweet})
      view.render()
  
    show_user: (id) ->
      new UserDetailView({model: Users.get(parseInt(id))}).render()
  })

  Routes = new Workspace
  Backbone.history.start()
