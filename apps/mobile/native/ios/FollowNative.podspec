require 'json'
new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'FollowNative'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.4'
  s.source         = { git: 'https://github.com/RSSNext/follow' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'SnapKit', '~> 5.7.0'
  s.dependency 'SDWebImage', '~> 5.0'
  s.dependency "ToastViewSwift", "~> 2.1.3"
  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'OTHER_SWIFT_FLAGS' => "$(inherited) #{new_arch_enabled ? '-DRCT_NEW_ARCH_ENABLED' : ''}",
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp,js}"

  s.resource_bundles = {
    'js' => ['Modules/SharedWebView/injected/**/*'],
    'FollowNative' => ['Media.xcassets'],
  }

end
