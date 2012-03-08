var api_prefix;

api_prefix = "https://api.weibo.com";

$(function() {
  var AccessToken, Comment, CommentList, ListView, NewStatusView, Routes, Tweet, TweetDetailView, TweetList, TweetView, TweetsView, User, UserDetailView, UserList, UserTweetList, UserTweets, Users, Workspace, _last;
  AccessToken = Backbone.Model.extend({
    defaults: function() {
      return {
        created_at: new Date
      };
    }
  });
  window.AccessTokenList = Backbone.Collection.extend({
    model: AccessToken,
    token: null,
    initialize: function() {
      return this.bind("add", this.activate, this);
    },
    activate: function() {
      return this.pick(this.at(0).get("token"));
    },
    pick: function(val) {
      this.token = val;
      return this.trigger("token:activate", this.token);
    },
    apiGet: function(url, data, callback) {
      return this._invoke(url, data, callback, false);
    },
    apiPost: function(url, data, callback) {
      return this._invoke(url, data, callback, true);
    },
    _invoke: function(url, data, callback, isPost) {
      var method, verb;
      verb = "get";
      if (isPost) verb = "post";
      console.log("" + verb + " " + url + " " + (JSON.stringify(data)));
      if (this.token) {
        method = $.getJSON;
        if (isPost) method = $.post;
        return method(url, _.extend({
          access_token: this.token
        }, data), callback);
      } else {
        return console.log("CANNOT FIND TOKEN!");
      }
    }
  });
  window.API = new AccessTokenList;
  User = Backbone.Model.extend({});
  UserList = Backbone.Collection.extend({
    model: User
  });
  Users = new UserList;
  Tweet = Backbone.Model.extend({});
  TweetList = Backbone.Collection.extend({
    model: Tweet,
    min_id: 0,
    max_id: 0,
    api: "" + api_prefix + "/2/statuses/home_timeline.json",
    initialize: function() {
      API.bind("token:activate", this.update_latest, this);
      return this.bind("add", this.updateUser, this);
    },
    updateUser: function(s) {
      var json, user1, user2;
      json = s.toJSON();
      user1 = json["user"];
      if (json["retweeted_status"]) user2 = json["retweeted_status"]["user"];
      this._updateUser(user1);
      if (user2) return this._updateUser(user2);
    },
    _updateUser: function(json) {
      var u;
      u = Users.get(json["id"]);
      if (u) {
        return u.set(json);
      } else {
        return Users.add(new User(json));
      }
    },
    update_latest: function() {
      var _this = this;
      return API.apiGet(this.api, {
        since_id: this.max_id
      }, function(data) {
        _this.add(data["statuses"].reverse());
        _this.min_id = _this.at(0).id;
        return _this.max_id = _this.at(_this.length - 1).id;
      });
    },
    fetch_local: function() {
      var _this = this;
      return API.apiGet("home_timeline.json", {}, function(data) {
        return _this.add(data["statuses"].reverse());
      });
    }
  });
  window.Tweets = new TweetList;
  UserTweetList = TweetList.extend({
    api: "" + api_prefix + "/2/statuses/user_timeline.json",
    cache: {},
    initialize: function() {},
    by_user: function(user_id, callback) {
      var _this = this;
      if (this._expired(user_id)) {
        return API.apiGet(this.api, {
          uid: user_id,
          since_id: this.cache[user_id]["maxId"]
        }, function(data) {
          var d;
          _this.cache[user_id]["lastUpdate"] = (new Date()).getTime();
          d = data["statuses"];
          console.log("found " + d.length + " tweets for user " + user_id);
          if (d.length > 0) {
            _this.cache[user_id]["maxId"] = d[0].id;
            _this.cache[user_id]["minId"] = d[d.length - 1].id;
          }
          _this.add(d);
          return callback(_this._filter_by_user(user_id));
        });
      } else {
        return callback(this._filter_by_user(user_id));
      }
    },
    _filter_by_user: function(user_id) {
      return this.select(function(t) {
        return t.toJSON().user.id === parseInt(user_id);
      });
    },
    _expired: function(user_id) {
      if (this.cache[user_id]) {
        return (new Date()).getTime() - this.cache[user_id]["lastUpdate"] > 120 * 1000;
      } else {
        this.cache[user_id] = {};
        return true;
      }
    }
  });
  UserTweets = new UserTweetList;
  Comment = Backbone.Model.extend({});
  CommentList = Backbone.Collection.extend({
    model: Comment,
    api: "" + api_prefix + "/2/comments/show.json",
    cache: {},
    fetch_local: function() {
      var _this = this;
      return API.apiGet("status_comments.json", {}, function(data) {
        return _this.add(data["comments"]);
      });
    },
    fetch_by_status: function(status_id) {
      var _this = this;
      return API.apiGet(this.api, {
        id: status_id
      }, function(data) {
        return _this.add(data["comments"]);
      });
    },
    by_status: function(status_id, callback) {
      var _this = this;
      if (this._expired(status_id)) {
        API.apiGet(this.api, {
          id: status_id,
          since_id: this.cache[status_id]["maxId"]
        }, function(data) {
          var cs;
          cs = data["comments"];
          _this.cache[status_id]["lastUpdate"] = (new Date).getTime();
          if (cs.length > 0) {
            _this.cache[status_id]["maxId"] = cs[0].id;
            _this.cache[status_id]["minId"] = cs[cs.length - 1].id;
          }
          return _this.add(cs);
        });
        return callback(this._filter_by_status(status_id));
      } else {
        return this._filter_by_status(status_id);
      }
    },
    _expired: function(status_id) {
      if (this.cache[status_id]) {
        return (new Date()).getTime() - this.cache[status_id]["lastUpdate"] > 120 * 1000;
      } else {
        this.cache[status_id] = {};
        return true;
      }
    },
    _filter_by_status: function(status_id) {
      if (_.isUndefined(this.cache[status_id])) {
        this.cache[status_id] = {
          lastUpdate: 0,
          maxId: 0,
          minId: 0
        };
      }
      return this.select(function(c) {
        return c.toJSON().status.id === parseInt(status_id);
      });
    }
  });
  window.Comments = new CommentList;
  _last = null;
  TweetView = Backbone.View.extend({
    tagName: 'li',
    className: 'bo_container',
    events: {
      "click .avatar": "show_user",
      "click .user_link": "show_user_link",
      "click .reply": "reply",
      "click .retweet": "retweet",
      "click": "show_detail"
    },
    template: doT.template($("#template").text()),
    initialize: function() {
      return API.bind("token:activate", this.updateToken, this);
    },
    updateToken: function() {
      return $("#logo").hide();
    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },
    show_detail: function() {
      if (_last !== null && _last !== this) $(_last.el).removeClass("selected");
      $(this.el).addClass("selected");
      _last = this;
      return Routes.navigate("tweets/" + this.model.id, {
        trigger: true
      });
    },
    show_user_link: function(el) {
      location.href = $(el.target).attr("href");
      return false;
    },
    reply: function() {
      return false;
    },
    retweet: function() {
      return false;
    },
    show_user: function() {
      Routes.navigate("users/" + (this.model.get("user").id), {
        trigger: true
      });
      return false;
    }
  });
  TweetDetailView = Backbone.View.extend({
    el: $("#inner"),
    side_width: "500px",
    template: doT.template($("#template_full").text()),
    comment_template: doT.template($("#comments_template").text()),
    render: function() {
      var _this;
      _this = this;
      $(this.el).scrollTop(0);
      $(this.el).css("width", parseInt(this.side_width) * 2 + "px");
      $(this.el).find(".anim_block").each(function() {
        $(this).css("width", _this.side_width);
        if ($(this).css("left") !== "0px") {
          $(this).html(_this.template(_this.model.toJSON()));
          return Comments.by_status(_this.model.id, function(data) {
            var comments;
            $(".loading").hide();
            comments = _.map(data, function(c) {
              return c.toJSON();
            });
            return $(".recent_comments").html(_this.comment_template(comments));
          });
        }
      });
      return this._animate();
    },
    _animate: function() {
      var _this;
      _this = this;
      return $(this.el).animate({
        "left": "+" + this.side_width
      }, "fast", function() {
        return $(_this.el).find(".anim_block").each(function(el) {
          var new_width, old;
          old = $(this).css("left");
          if (old === "0px") {
            new_width = "-" + _this.side_width;
          } else {
            new_width = "0px";
          }
          $(this).css("left", new_width);
          return $(_this.el).css("left", "0px");
        });
      });
    }
  });
  UserDetailView = Backbone.View.extend({
    el: $("#inner"),
    side_width: "500px",
    comment_template: doT.template($("#comments_template").text()),
    template: doT.template($("#user_detail_template").text()),
    render: function() {
      var _this;
      _this = this;
      $(this.el).scrollTop(0);
      $(this.el).css("width", parseInt(this.side_width) * 2 + "px");
      $(this.el).find(".anim_block").each(function() {
        $(this).css("width", _this.side_width);
        if ($(this).css("left") !== "0px") {
          $(this).html(_this.template(_this.model.toJSON()));
          return UserTweets.by_user(_this.model.id, function(data) {
            var tweets;
            $(".loading").hide();
            tweets = _.map(data, function(t) {
              return t.toJSON();
            });
            return $(".recent_statuses").html(_this.comment_template(tweets));
          });
        }
      });
      return this._animate();
    },
    _animate: function() {
      var _this;
      _this = this;
      return $(this.el).animate({
        "left": "+" + this.side_width
      }, "fast", function() {
        return $(_this.el).find(".anim_block").each(function(el) {
          var new_width, old;
          old = $(this).css("left");
          if (old === "0px") {
            new_width = "-" + _this.side_width;
          } else {
            new_width = "0px";
          }
          $(this).css("left", new_width);
          return $(_this.el).css("left", "0px");
        });
      });
    }
  });
  TweetsView = Backbone.View.extend({
    el: $("#tweets_list"),
    initialize: function() {
      Tweets.bind('add', this.addOne, this);
      return API.bind("token:activate", this.updateUI, this);
    },
    updateUI: function() {
      $(".nav_buttons").show("slow");
      return $("#logo").hide("fast");
    },
    addOne: function(s) {
      var view;
      view = new TweetView({
        model: s,
        id: "status-" + s.id,
        attributes: {
          "data-id": s.id
        }
      });
      return $("#tweets_list").prepend(view.render().el);
    },
    showTweet: function(id) {
      var view;
      view = new TweetDetailView({
        model: Tweets.get(parseInt(id))
      });
      return view.render();
    },
    showUser: function(id) {
      return new UserDetailView({
        model: Users.get(parseInt(id))
      }).render();
    }
  });
  ListView = new TweetsView;
  NewStatusView = Backbone.View.extend({
    el: $("#new_status"),
    api: "" + api_prefix + "/2/statuses/update.json",
    events: {
      "click .cancel": "cancel",
      "click .submit": "submit"
    },
    render: function() {
      $(this.el).animate({
        "top": "80px"
      }, "fast");
      $(this.el).find("textarea").focus();
      return $("#overlay").css("z-index", "150");
    },
    cancel: function() {
      $(this.el).animate({
        "top": "-100px"
      }, "fast");
      return $("#overlay").css("z-index", "-1");
    },
    submit: function() {
      API.apiPost(this.api, {
        status: $("#new_status_content").val()
      }, function() {
        $("#new_status_content").val("");
        return Tweets.update_latest();
      });
      $(this.el).animate({
        "top": "-100px"
      }, "fast");
      return $("#overlay").css("z-index", "-1");
    }
  });
  window.NewStatus = new NewStatusView;
  Workspace = Backbone.Router.extend({
    routes: {
      "tweets/:id": "show_tweet",
      "users/:id": "show_user"
    },
    show_tweet: function(id) {
      if (Tweets.length > 0) return ListView.showTweet(id);
    },
    show_user: function(id) {
      if (Users.length > 0) return ListView.showUser(id);
    }
  });
  Routes = new Workspace;
  return Backbone.history.start();
});
