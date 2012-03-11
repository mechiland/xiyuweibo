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
end