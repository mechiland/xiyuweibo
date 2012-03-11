# encoding: utf-8

desc "Build the final Mac App"
task :build do
  app_template = "build/MacGap.app"
  target = "build/target/"
  app_name = "细语微博.app"
  system "mkdir -p #{target}"
  system "rm -rf #{target}#{app_name}"
  system "cp -rf #{app_template} #{target}#{app_name}"
  system "cp -rf _site/ #{target}#{app_name}/Contents/Resources/public"
  system "mv #{target}#{app_name}/Contents/MacOS/MacGap #{target}#{app_name}/Contents/MacOS/XiyuWeibo"
  system "cp -f build/Info.plist #{target}#{app_name}/Contents/Info.plist"
  system "cp -f build/Credits.rtf #{target}#{app_name}/Contents/Resources/en.lproj/Credits.rtf"
  system "sips -s format icns build/application.png --out #{target}#{app_name}/Contents/Resources/application.icns"
end