require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'CrossoverDetector'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  # MediaPipeTasksVision requires a recent deployment target.
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  # Expo module runtime + the two native ML/camera dependencies this module bridges.
  s.dependency 'ExpoModulesCore'
  s.dependency 'VisionCamera'
  s.dependency 'MediaPipeTasksVision'

  # Swift/Objective-C compatibility + build the whole module together.
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,swift}'

  # Bundle the MediaPipe Pose Landmarker model directly into the app so inference
  # is 100% on-device (no cloud APIs). Loaded via Bundle.main at runtime.
  s.resources = ['pose_landmarker_lite.task']
end
