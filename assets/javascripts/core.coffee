sina_api = {
  home: "https://api.weibo.com/2/statuses/home_timeline.json"
}
Status = Backbone.Model.extend({})
Statuses = Backbone.Collection.extend({
  model: Status,
  min_id: 0,
  max_id: 0,
  init: (token) -> 
    @token = token
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
});

StatusView = Backbone.View.extend({el: "#sub_container"})