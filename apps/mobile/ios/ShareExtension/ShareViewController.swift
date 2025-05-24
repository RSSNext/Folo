/*!
 * Native module created for Expo Share Intent (https://github.com/achorein/expo-share-intent)
 * author: achorein (https://github.com/achorein)
 * inspired by :
 *  - https://ajith-ab.github.io/react-native-receive-sharing-intent/docs/ios#create-share-extension
 */
import MobileCoreServices
import Photos
import Social
import UIKit

class ShareViewController: UIViewController {
  let hostAppGroupIdentifier = "group.is.follow"
  let shareProtocol = "follow"
  let sharedKey = "followShareKey"
  var sharedMedia: [SharedMediaFile] = []
  var sharedWebUrl: [WebUrl] = []
  var sharedText: [String] = []
  let imageContentType: String = UTType.image.identifier
  let videoContentType: String = UTType.movie.identifier
  let textContentType: String = UTType.text.identifier
  let urlContentType: String = UTType.url.identifier
  let propertyListType: String = UTType.propertyList.identifier
  let fileURLType: String = UTType.fileURL.identifier
  let pdfContentType: String = UTType.pdf.identifier

  override func viewDidLoad() {
    super.viewDidLoad()
  }

  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    Task {
      guard let extensionContext = self.extensionContext,
        let content = extensionContext.inputItems.first as? NSExtensionItem,
        let attachments = content.attachments
      else {
        dismissWithError(message: "No content found")
        return
      }
      for (index, attachment) in (attachments).enumerated() {
        if attachment.hasItemConformingToTypeIdentifier(imageContentType) {
          await handleImages(content: content, attachment: attachment, index: index)
        } else if attachment.hasItemConformingToTypeIdentifier(videoContentType) {
          await handleVideos(content: content, attachment: attachment, index: index)
        } else if attachment.hasItemConformingToTypeIdentifier(fileURLType) {
          await handleFiles(content: content, attachment: attachment, index: index)
        } else if attachment.hasItemConformingToTypeIdentifier(pdfContentType) {
          await handlePdf(content: content, attachment: attachment, index: index)
        } else if attachment.hasItemConformingToTypeIdentifier(propertyListType) {
          await handlePrepocessing(content: content, attachment: attachment, index: index)
        } else if attachment.hasItemConformingToTypeIdentifier(urlContentType) {
          await handleUrl(content: content, attachment: attachment, index: index)
        } else if attachment.hasItemConformingToTypeIdentifier(textContentType) {
          await handleText(content: content, attachment: attachment, index: index)
        } else {
          NSLog("[ERROR] content type not handle !\(String(describing: content))")
          dismissWithError(message: "content type not handle \(String(describing: content)))")
        }
      }
    }
  }

  private func handleText(content: NSExtensionItem, attachment: NSItemProvider, index: Int) async {
    Task.detached {
      if let item = try! await attachment.loadItem(forTypeIdentifier: self.textContentType)
        as? String
      {
        Task { @MainActor in

          self.sharedText.append(item)
          // If this is the last item, save sharedText in userDefaults and redirect to host app
          if index == (content.attachments?.count)! - 1 {
            let userDefaults = UserDefaults(suiteName: self.hostAppGroupIdentifier)
            userDefaults?.set(self.sharedText, forKey: self.sharedKey)
            userDefaults?.synchronize()
            self.redirectToHostApp(type: .text)
          }

        }
      } else {
        NSLog("[ERROR] Cannot load text content !\(String(describing: content))")
        await self.dismissWithError(
          message: "Cannot load text content \(String(describing: content))")
      }
    }
  }

  private func handleUrl(content: NSExtensionItem, attachment: NSItemProvider, index: Int) async {
    Task.detached {
      if let item = try! await attachment.loadItem(forTypeIdentifier: self.urlContentType) as? URL {
        Task { @MainActor in

          self.sharedWebUrl.append(WebUrl(url: item.absoluteString, meta: ""))
          // If this is the last item, save sharedText in userDefaults and redirect to host app
          if index == (content.attachments?.count)! - 1 {
            let userDefaults = UserDefaults(suiteName: self.hostAppGroupIdentifier)
            userDefaults?.set(self.toData(data: self.sharedWebUrl), forKey: self.sharedKey)
            userDefaults?.synchronize()
            self.redirectToHostApp(type: .weburl)
          }

        }
      } else {
        NSLog("[ERROR] Cannot load url content !\(String(describing: content))")
        await self.dismissWithError(
          message: "Cannot load url content \(String(describing: content))")
      }
    }
  }

  private func handlePrepocessing(content: NSExtensionItem, attachment: NSItemProvider, index: Int)
    async
  {
    Task.detached {
      if let item = try! await attachment.loadItem(
        forTypeIdentifier: self.propertyListType, options: nil)
        as? NSDictionary
      {
        Task { @MainActor in

          if let results = item[NSExtensionJavaScriptPreprocessingResultsKey]
            as? NSDictionary
          {
            NSLog(
              "[DEBUG] NSExtensionJavaScriptPreprocessingResultsKey \(String(describing: results))"
            )
            self.sharedWebUrl.append(
              WebUrl(url: results["baseURI"] as! String, meta: results["meta"] as! String))
            // If this is the last item, save sharedText in userDefaults and redirect to host app
            if index == (content.attachments?.count)! - 1 {
              let userDefaults = UserDefaults(suiteName: self.hostAppGroupIdentifier)
              userDefaults?.set(self.toData(data: self.sharedWebUrl), forKey: self.sharedKey)
              userDefaults?.synchronize()
              self.redirectToHostApp(type: .weburl)
            }
          } else {
            NSLog("[ERROR] Cannot load preprocessing results !\(String(describing: content))")
            self.dismissWithError(
              message: "Cannot load preprocessing results \(String(describing: content))")
          }

        }
      } else {
        NSLog("[ERROR] Cannot load preprocessing content !\(String(describing: content))")
        await self.dismissWithError(
          message: "Cannot load preprocessing content \(String(describing: content))")
      }
    }
  }

  private func handleImages(content: NSExtensionItem, attachment: NSItemProvider, index: Int) async
  {
    Task.detached {
      if let item = try? await attachment.loadItem(forTypeIdentifier: self.imageContentType) {
        Task { @MainActor in

          var url: URL? = nil
          if let dataURL = item as? URL {
            url = dataURL
          } else if let imageData = item as? UIImage {
            url = self.saveScreenshot(imageData)
          }

          var pixelWidth: Int? = nil
          var pixelHeight: Int? = nil
          if let imageSource = CGImageSourceCreateWithURL(url! as CFURL, nil) {
            if let imageProperties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil)
              as Dictionary?
            {
              pixelWidth = imageProperties[kCGImagePropertyPixelWidth] as? Int
              pixelHeight = imageProperties[kCGImagePropertyPixelHeight] as? Int
              // Check orientation and flip size if required
              if let orientationNumber = imageProperties[kCGImagePropertyOrientation] as! CFNumber?
              {
                var orientation: Int = 0
                CFNumberGetValue(orientationNumber, .intType, &orientation)
                if orientation > 4 {
                  let temp: Int? = pixelWidth
                  pixelWidth = pixelHeight
                  pixelHeight = temp
                }
              }
            }
          }

          // Always copy
          let fileName = self.getFileName(from: url!, type: .image)
          let fileExtension = self.getExtension(from: url!, type: .image)
          let fileSize = self.getFileSize(from: url!)
          let mimeType = url!.mimeType(ext: fileExtension)
          let newName = "\(UUID().uuidString).\(fileExtension)"
          let newPath = FileManager.default
            .containerURL(
              forSecurityApplicationGroupIdentifier: self.hostAppGroupIdentifier)!
            .appendingPathComponent(newName)
          let copied = self.copyFile(at: url!, to: newPath)
          if copied {
            self.sharedMedia.append(
              SharedMediaFile(
                path: newPath.absoluteString, thumbnail: nil, fileName: fileName,
                fileSize: fileSize, width: pixelWidth, height: pixelHeight, duration: nil,
                mimeType: mimeType, type: .image))
          }

          // If this is the last item, save imagesData in userDefaults and redirect to host app
          if index == (content.attachments?.count)! - 1 {
            let userDefaults = UserDefaults(suiteName: self.hostAppGroupIdentifier)
            userDefaults?.set(self.toData(data: self.sharedMedia), forKey: self.sharedKey)
            userDefaults?.synchronize()
            self.redirectToHostApp(type: .media)
          }

        }
      } else {
        NSLog("[ERROR] Cannot load image content !\(String(describing: content))")
        await self.dismissWithError(
          message: "Cannot load image content \(String(describing: content))")
      }
    }
  }

  private func documentDirectoryPath() -> URL? {
    let path = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
    return path.first
  }

  private func saveScreenshot(_ image: UIImage) -> URL? {
    var screenshotURL: URL? = nil
    if let screenshotData = image.pngData(),
      let screenshotPath = documentDirectoryPath()?.appendingPathComponent("screenshot.png")
    {
      try? screenshotData.write(to: screenshotPath)
      screenshotURL = screenshotPath
    }
    return screenshotURL
  }

  private func handleVideos(content: NSExtensionItem, attachment: NSItemProvider, index: Int) async
  {
    Task.detached {
      if let url = try? await attachment.loadItem(forTypeIdentifier: self.videoContentType) as? URL
      {
        Task { @MainActor in

          // Always copy
          let fileName = self.getFileName(from: url, type: .video)
          let fileExtension = self.getExtension(from: url, type: .video)
          let fileSize = self.getFileSize(from: url)
          let mimeType = url.mimeType(ext: fileExtension)
          let newName = "\(UUID().uuidString).\(fileExtension)"
          let newPath = FileManager.default
            .containerURL(
              forSecurityApplicationGroupIdentifier: self.hostAppGroupIdentifier)!
            .appendingPathComponent(newName)
          let copied = self.copyFile(at: url, to: newPath)
          if copied {
            guard
              let sharedFile = self.getSharedMediaFile(
                forVideo: newPath, fileName: fileName, fileSize: fileSize, mimeType: mimeType)
            else {
              return
            }
            self.sharedMedia.append(sharedFile)
          }

          // If this is the last item, save imagesData in userDefaults and redirect to host app
          if index == (content.attachments?.count)! - 1 {
            let userDefaults = UserDefaults(suiteName: self.hostAppGroupIdentifier)
            userDefaults?.set(self.toData(data: self.sharedMedia), forKey: self.sharedKey)
            userDefaults?.synchronize()
            self.redirectToHostApp(type: .media)
          }

        }
      } else {
        NSLog("[ERROR] Cannot load video content !\(String(describing: content))")
        await self.dismissWithError(
          message: "Cannot load video content \(String(describing: content))")
      }
    }
  }

  private func handlePdf(content: NSExtensionItem, attachment: NSItemProvider, index: Int) async {
    Task.detached {
      if let url = try? await attachment.loadItem(forTypeIdentifier: self.pdfContentType) as? URL {
        Task { @MainActor in

          await self.handleFileURL(content: content, url: url, index: index)

        }
      } else {
        NSLog("[ERROR] Cannot load pdf content !\(String(describing: content))")
        await self.dismissWithError(
          message: "Cannot load pdf content \(String(describing: content))")
      }
    }
  }

  private func handleFiles(content: NSExtensionItem, attachment: NSItemProvider, index: Int) async {
    Task.detached {
      if let url = try? await attachment.loadItem(forTypeIdentifier: self.fileURLType) as? URL {
        Task { @MainActor in

          await self.handleFileURL(content: content, url: url, index: index)

        }
      } else {
        NSLog("[ERROR] Cannot load file content !\(String(describing: content))")
        await self.dismissWithError(
          message: "Cannot load file content \(String(describing: content))")
      }
    }
  }

  private func handleFileURL(content: NSExtensionItem, url: URL, index: Int) async {
    // Always copy
    let fileName = self.getFileName(from: url, type: .file)
    let fileExtension = self.getExtension(from: url, type: .file)
    let fileSize = self.getFileSize(from: url)
    let mimeType = url.mimeType(ext: fileExtension)
    let newName = "\(UUID().uuidString).\(fileExtension)"
    let newPath = FileManager.default
      .containerURL(
        forSecurityApplicationGroupIdentifier: self.hostAppGroupIdentifier)!
      .appendingPathComponent(newName)
    let copied = self.copyFile(at: url, to: newPath)
    if copied {
      self.sharedMedia.append(
        SharedMediaFile(
          path: newPath.absoluteString, thumbnail: nil, fileName: fileName,
          fileSize: fileSize, width: nil, height: nil, duration: nil, mimeType: mimeType,
          type: .file))
    }

    if index == (content.attachments?.count)! - 1 {
      let userDefaults = UserDefaults(suiteName: self.hostAppGroupIdentifier)
      userDefaults?.set(self.toData(data: self.sharedMedia), forKey: self.sharedKey)
      userDefaults?.synchronize()
      self.redirectToHostApp(type: .file)
    }
  }

  private func dismissWithError(message: String? = nil) {
    DispatchQueue.main.async {
      NSLog("[ERROR] Error loading application ! \(message!)")
      let alert = UIAlertController(
        title: "Error", message: "Error loading application: \(message!)", preferredStyle: .alert)

      let action = UIAlertAction(title: "OK", style: .cancel) { _ in
        self.dismiss(animated: true, completion: nil)
        self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
      }

      alert.addAction(action)
      self.present(alert, animated: true, completion: nil)
    }
  }

  private func redirectToHostApp(type: RedirectType) {
    let url = URL(string: "\(shareProtocol)://dataUrl=\(sharedKey)#\(type)")!
    var responder = self as UIResponder?

    while responder != nil {
      if let application = responder as? UIApplication {
        if application.canOpenURL(url) {
          application.open(url)
        } else {
          NSLog("redirectToHostApp canOpenURL KO: \(shareProtocol)")
          self.dismissWithError(
            message: "Application not found, invalid url scheme \(shareProtocol)")
          return
        }
      }
      responder = responder!.next
    }
    extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
  }

  enum RedirectType {
    case media
    case text
    case weburl
    case file
  }

  func getExtension(from url: URL, type: SharedMediaType) -> String {
    let parts = url.lastPathComponent.components(separatedBy: ".")
    var ex: String? = nil
    if parts.count > 1 {
      ex = parts.last
    }
    if ex == nil {
      switch type {
      case .image:
        ex = "PNG"
      case .video:
        ex = "MP4"
      case .file:
        ex = "TXT"
      }
    }
    return ex ?? "Unknown"
  }

  func getFileName(from url: URL, type: SharedMediaType) -> String {
    var name = url.lastPathComponent
    if name == "" {
      name = UUID().uuidString + "." + getExtension(from: url, type: type)
    }
    return name
  }

  func getFileSize(from url: URL) -> Int? {
    do {
      let resources = try url.resourceValues(forKeys: [.fileSizeKey])
      return resources.fileSize
    } catch {
      NSLog("Error: \(error)")
      return nil
    }
  }

  func copyFile(at srcURL: URL, to dstURL: URL) -> Bool {
    do {
      if FileManager.default.fileExists(atPath: dstURL.path) {
        try FileManager.default.removeItem(at: dstURL)
      }
      try FileManager.default.copyItem(at: srcURL, to: dstURL)
    } catch (let error) {
      NSLog("Cannot copy item at \(srcURL) to \(dstURL): \(error)")
      return false
    }
    return true
  }

  private func getSharedMediaFile(forVideo: URL, fileName: String, fileSize: Int?, mimeType: String)
    -> SharedMediaFile?
  {
    let asset = AVAsset(url: forVideo)
    let thumbnailPath = getThumbnailPath(for: forVideo)
    let duration = (CMTimeGetSeconds(asset.duration) * 1000).rounded()
    var trackWidth: Int? = nil
    var trackHeight: Int? = nil

    // get video info
    let track = asset.tracks(withMediaType: AVMediaType.video).first ?? nil
    if track != nil {
      let size = track!.naturalSize.applying(track!.preferredTransform)
      trackWidth = abs(Int(size.width))
      trackHeight = abs(Int(size.height))
    }

    if FileManager.default.fileExists(atPath: thumbnailPath.path) {
      return SharedMediaFile(
        path: forVideo.absoluteString, thumbnail: thumbnailPath.absoluteString, fileName: fileName,
        fileSize: fileSize, width: trackWidth, height: trackHeight, duration: duration,
        mimeType: mimeType, type: .video)
    }

    var saved = false
    let assetImgGenerate = AVAssetImageGenerator(asset: asset)
    assetImgGenerate.appliesPreferredTrackTransform = true
    assetImgGenerate.maximumSize = CGSize(width: 360, height: 360)
    do {
      let img = try assetImgGenerate.copyCGImage(
        at: CMTimeMakeWithSeconds(600, preferredTimescale: Int32(1.0)), actualTime: nil)
      try UIImage.pngData(UIImage(cgImage: img))()?.write(to: thumbnailPath)
      saved = true
    } catch {
      saved = false
    }

    return saved
      ? SharedMediaFile(
        path: forVideo.absoluteString, thumbnail: thumbnailPath.absoluteString, fileName: fileName,
        fileSize: fileSize, width: trackWidth, height: trackHeight, duration: duration,
        mimeType: mimeType, type: .video) : nil
  }

  private func getThumbnailPath(for url: URL) -> URL {
    let fileName = Data(url.lastPathComponent.utf8).base64EncodedString().replacingOccurrences(
      of: "==", with: "")
    let path = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: self.hostAppGroupIdentifier)!
      .appendingPathComponent("\(fileName).jpg")
    return path
  }

  class WebUrl: Codable {
    var url: String
    var meta: String

    init(url: String, meta: String) {
      self.url = url
      self.meta = meta
    }
  }

  class SharedMediaFile: Codable {
    var path: String  // can be image, video or url path
    var thumbnail: String?  // video thumbnail
    var fileName: String  // uuid + extension
    var fileSize: Int?
    var width: Int?  // for image
    var height: Int?  // for image
    var duration: Double?  // video duration in milliseconds
    var mimeType: String
    var type: SharedMediaType

    init(
      path: String, thumbnail: String?, fileName: String, fileSize: Int?, width: Int?, height: Int?,
      duration: Double?, mimeType: String, type: SharedMediaType
    ) {
      self.path = path
      self.thumbnail = thumbnail
      self.fileName = fileName
      self.fileSize = fileSize
      self.width = width
      self.height = height
      self.duration = duration
      self.mimeType = mimeType
      self.type = type
    }
  }

  enum SharedMediaType: Int, Codable {
    case image
    case video
    case file
  }

  func toData(data: [WebUrl]) -> Data? {
    let encodedData = try? JSONEncoder().encode(data)
    return encodedData
  }
  func toData(data: [SharedMediaFile]) -> Data? {
    let encodedData = try? JSONEncoder().encode(data)
    return encodedData
  }
}

internal let mimeTypes = [
  "html": "text/html",
  "htm": "text/html",
  "shtml": "text/html",
  "css": "text/css",
  "xml": "text/xml",
  "gif": "image/gif",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "application/javascript",
  "atom": "application/atom+xml",
  "rss": "application/rss+xml",
  "mml": "text/mathml",
  "txt": "text/plain",
  "jad": "text/vnd.sun.j2me.app-descriptor",
  "wml": "text/vnd.wap.wml",
  "htc": "text/x-component",
  "png": "image/png",
  "tif": "image/tiff",
  "tiff": "image/tiff",
  "wbmp": "image/vnd.wap.wbmp",
  "ico": "image/x-icon",
  "jng": "image/x-jng",
  "bmp": "image/x-ms-bmp",
  "svg": "image/svg+xml",
  "svgz": "image/svg+xml",
  "webp": "image/webp",
  "woff": "application/font-woff",
  "jar": "application/java-archive",
  "war": "application/java-archive",
  "ear": "application/java-archive",
  "json": "application/json",
  "hqx": "application/mac-binhex40",
  "doc": "application/msword",
  "pdf": "application/pdf",
  "ps": "application/postscript",
  "eps": "application/postscript",
  "ai": "application/postscript",
  "rtf": "application/rtf",
  "m3u8": "application/vnd.apple.mpegurl",
  "xls": "application/vnd.ms-excel",
  "eot": "application/vnd.ms-fontobject",
  "ppt": "application/vnd.ms-powerpoint",
  "wmlc": "application/vnd.wap.wmlc",
  "kml": "application/vnd.google-earth.kml+xml",
  "kmz": "application/vnd.google-earth.kmz",
  "7z": "application/x-7z-compressed",
  "cco": "application/x-cocoa",
  "jardiff": "application/x-java-archive-diff",
  "jnlp": "application/x-java-jnlp-file",
  "run": "application/x-makeself",
  "pl": "application/x-perl",
  "pm": "application/x-perl",
  "prc": "application/x-pilot",
  "pdb": "application/x-pilot",
  "rar": "application/x-rar-compressed",
  "rpm": "application/x-redhat-package-manager",
  "sea": "application/x-sea",
  "swf": "application/x-shockwave-flash",
  "sit": "application/x-stuffit",
  "tcl": "application/x-tcl",
  "tk": "application/x-tcl",
  "der": "application/x-x509-ca-cert",
  "pem": "application/x-x509-ca-cert",
  "crt": "application/x-x509-ca-cert",
  "xpi": "application/x-xpinstall",
  "xhtml": "application/xhtml+xml",
  "xspf": "application/xspf+xml",
  "zip": "application/zip",
  "epub": "application/epub+zip",
  "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "mid": "audio/midi",
  "midi": "audio/midi",
  "kar": "audio/midi",
  "mp3": "audio/mpeg",
  "ogg": "audio/ogg",
  "m4a": "audio/x-m4a",
  "ra": "audio/x-realaudio",
  "3gpp": "video/3gpp",
  "3gp": "video/3gpp",
  "ts": "video/mp2t",
  "mp4": "video/mp4",
  "mpeg": "video/mpeg",
  "mpg": "video/mpeg",
  "mov": "video/quicktime",
  "webm": "video/webm",
  "flv": "video/x-flv",
  "m4v": "video/x-m4v",
  "mng": "video/x-mng",
  "asx": "video/x-ms-asf",
  "asf": "video/x-ms-asf",
  "wmv": "video/x-ms-wmv",
  "avi": "video/x-msvideo",
]

extension URL {
  func mimeType(ext: String?) -> String {
    if #available(iOSApplicationExtension 14.0, *) {
      if let pathExt = ext,
        let mimeType = UTType(filenameExtension: pathExt)?.preferredMIMEType
      {
        return mimeType
      } else {
        return "application/octet-stream"
      }
    } else {
      return mimeTypes[ext?.lowercased() ?? ""] ?? "application/octet-stream"
    }
  }
}

extension Array {
  subscript(safe index: UInt) -> Element? {
    return Int(index) < count ? self[Int(index)] : nil
  }
}
