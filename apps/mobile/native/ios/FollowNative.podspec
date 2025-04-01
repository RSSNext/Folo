require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
#https://github.com/lodev09/react-native-true-sheet/blob/main/TrueSheet.podspec
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

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
  s.dependency "React-Core"

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp,js}"

  s.resource_bundles = {
    'js' => ['Modules/SharedWebView/injected/**/*'],
    'FollowNative' => ['Media.xcassets'],
  }


  if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
    
    s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
    s.pod_target_xcconfig =  {
      "OTHER_SWIFT_FLAGS" => "-DRCT_NEW_ARCH_ENABLED",
      "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/boost\"",
      "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
      "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
    }
    s.dependency "React-RCTFabric"
  end

end
