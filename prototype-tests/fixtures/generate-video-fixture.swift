// UC-MEAL-AI test 8 (VIDEO KEYFRAMES) — generates `meal-video.mp4`: a real, valid, genuinely
// decodable H.264 MP4 (~2.5s, 480x270, ~17KB), via AVFoundation's AVAssetWriter (no ffmpeg
// available in this environment). Not a static image renamed — every frame is real, distinct
// pixel content (an animated hue + a moving white bar), so real client-side keyframe
// extraction against it produces genuinely different frames. Verified independently readable
// by macOS's own `avconvert` (a full transcode round-trip, zero errors) before being adopted
// as a fixture.
//
// Regenerate with:  swift generate-video-fixture.swift meal-video.mp4
import AVFoundation
import CoreGraphics
import CoreVideo
import Foundation

let width = 480
let height = 270
let fps: Int32 = 10
let seconds = 2.5
let frameCount = Int(Double(fps) * seconds)
let outputPath = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/meal-fixture.mp4"
let outputURL = URL(fileURLWithPath: outputPath)
try? FileManager.default.removeItem(at: outputURL)

let writer = try! AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let videoSettings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 220_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264BaselineAutoLevel,
        AVVideoMaxKeyFrameIntervalKey: fps,
    ],
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
input.expectsMediaDataInRealTime = false

let attrs: [String: Any] = [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height,
]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attrs)
writer.add(input)
writer.startWriting()
writer.startSession(atSourceTime: .zero)

func hsvToRGB(h: CGFloat) -> (CGFloat, CGFloat, CGFloat) {
    let s: CGFloat = 0.55
    let v: CGFloat = 0.8
    let i = Int(h * 6)
    let f = h * 6 - CGFloat(i)
    let p = v * (1 - s)
    let q = v * (1 - f * s)
    let t = v * (1 - (1 - f) * s)
    switch i % 6 {
    case 0: return (v, t, p)
    case 1: return (q, v, p)
    case 2: return (p, v, t)
    case 3: return (p, q, v)
    case 4: return (t, p, v)
    default: return (v, p, q)
    }
}

func makePixelBuffer(frameIndex: Int) -> CVPixelBuffer? {
    var pixelBuffer: CVPixelBuffer?
    let options: [String: Any] = [
        kCVPixelBufferCGImageCompatibilityKey as String: true,
        kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
    ]
    CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32ARGB, options as CFDictionary, &pixelBuffer)
    guard let buffer = pixelBuffer else { return nil }
    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    guard let context = CGContext(
        data: CVPixelBufferGetBaseAddress(buffer),
        width: width, height: height, bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: colorSpace, bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
    ) else { return nil }
    let t = CGFloat(frameIndex) / CGFloat(max(frameCount - 1, 1))
    let (r, g, b) = hsvToRGB(h: t)
    context.setFillColor(CGColor(red: r, green: g, blue: b, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.9))
    let barX = t * CGFloat(width - 30)
    context.fill(CGRect(x: barX, y: 0, width: 30, height: CGFloat(height)))
    return buffer
}

let group = DispatchGroup()
group.enter()
var frameIndex = 0
input.requestMediaDataWhenReady(on: DispatchQueue(label: "video-writer")) {
    while input.isReadyForMoreMediaData && frameIndex < frameCount {
        let presentationTime = CMTime(value: CMTimeValue(frameIndex), timescale: fps)
        if let buffer = makePixelBuffer(frameIndex: frameIndex) {
            adaptor.append(buffer, withPresentationTime: presentationTime)
        }
        frameIndex += 1
    }
    if frameIndex >= frameCount {
        input.markAsFinished()
        writer.finishWriting {
            group.leave()
        }
    }
}
group.wait()
print("wrote \(outputPath) frames=\(frameIndex) status=\(writer.status.rawValue) error=\(String(describing: writer.error))")
