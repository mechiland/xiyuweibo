require 'rb-fsevent'

def watch
  fsevent = FSEvent.new
  fsevent.watch "assets/javascripts" do |directories|
    puts "Detected change inside: #{directories.inspect}"
    system "coffee -c assets/javascripts/app.coffee"
    fsevent.stop
    watch
  end
  fsevent.run
end


watch
