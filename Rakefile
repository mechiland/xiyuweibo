# encoding: utf-8

desc "Build the final Mac App"
task :build do
  app_template = "/Users/michael/Library/Developer/Xcode/DerivedData/MacGap-dchrhfdustllkkfbjyonlumwwosi/Build/Products/Release/MacGap.app"
  target = "_build/"
  app_name = "细语微博.app"
  system "rm -rf #{target}#{app_name}"
  system "cp -rf #{app_template} #{target}#{app_name}"
end