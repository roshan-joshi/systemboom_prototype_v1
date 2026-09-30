/**
 * UC-C4.4 test fixture generator — NOT part of the app, never imported by product code.
 * Produces real, valid JPEGs with REAL embedded EXIF (GPS + DateTimeOriginal + device),
 * so pipeline tests exercise the actual extraction/geocode path rather than a fixture
 * whose takenPlace is already "Kathmandu" (explicitly forbidden by the UC-C4.4 brief).
 *
 * Run once: node fixtures/generate-exif-fixtures.cjs
 */
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const piexif = require("piexifjs");

const OUT = __dirname;

async function baseJpegBinaryString(color) {
  const img = new Jimp(64, 48, color);
  const buf = await img.getBufferAsync(Jimp.MIME_JPEG);
  return buf.toString("binary");
}

function withExif(binaryStr, { lat, lon, alt, dateTimeOriginal, make, model, lens, orientation }) {
  const zeroth = {};
  const exif = {};
  const gps = {};
  if (make) zeroth[piexif.ImageIFD.Make] = make;
  if (model) zeroth[piexif.ImageIFD.Model] = model;
  if (orientation) zeroth[piexif.ImageIFD.Orientation] = orientation;
  if (dateTimeOriginal) exif[piexif.ExifIFD.DateTimeOriginal] = dateTimeOriginal;
  if (lens) exif[piexif.ExifIFD.LensModel] = lens;
  if (lat !== undefined && lon !== undefined) {
    gps[piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? "N" : "S";
    gps[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lat));
    gps[piexif.GPSIFD.GPSLongitudeRef] = lon >= 0 ? "E" : "W";
    gps[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(Math.abs(lon));
    if (alt !== undefined) {
      gps[piexif.GPSIFD.GPSAltitudeRef] = alt >= 0 ? 0 : 1;
      gps[piexif.GPSIFD.GPSAltitude] = [Math.round(Math.abs(alt) * 100), 100];
    }
  }
  const exifObj = { "0th": zeroth, "Exif": exif, "GPS": gps };
  const exifBytes = piexif.dump(exifObj);
  return piexif.insert(exifBytes, binaryStr);
}

(async () => {
  // 1 — real GPS + capture time + device (Kathmandu, matching the brief's own DMS values
  // 27°39'31.95"N / 85°17'36.39"E exactly).
  const withGps = withExif(await baseJpegBinaryString(0xff8844ff), {
    lat: 27.658875,
    lon: 85.293442,
    alt: 1345,
    dateTimeOriginal: "2026:09:29 15:42:00",
    make: "Apple",
    model: "iPhone 14 Pro Max",
    lens: "iPhone 14 Pro Max back triple camera 6.765mm f/1.78",
    orientation: 1,
  });
  fs.writeFileSync(path.join(OUT, "exif-gps-kathmandu.jpg"), withGps, "binary");

  // 2 — a second, DIFFERENT real location (Pokhara) + a later capture time — for
  // multi-asset consistency/conflict tests.
  const withGpsPokhara = withExif(await baseJpegBinaryString(0x4488ffff), {
    lat: 28.209967,
    lon: 83.958839,
    dateTimeOriginal: "2026:09:29 16:10:00",
    make: "Apple",
    model: "iPhone 14 Pro Max",
  });
  fs.writeFileSync(path.join(OUT, "exif-gps-pokhara.jpg"), withGpsPokhara, "binary");

  // 3 — a second Kathmandu asset, same place, different minute — for the "consistent
  // location across multiple assets" test.
  const withGpsKathmandu2 = withExif(await baseJpegBinaryString(0x22aa66ff), {
    lat: 27.671389,
    lon: 85.42,
    dateTimeOriginal: "2026:09:29 15:47:00",
    make: "Apple",
    model: "iPhone 14 Pro Max",
  });
  fs.writeFileSync(path.join(OUT, "exif-gps-kathmandu-2.jpg"), withGpsKathmandu2, "binary");

  // 4 — capture time only, no GPS at all (device was carried with location off).
  const timeOnly = withExif(await baseJpegBinaryString(0x999999ff), {
    dateTimeOriginal: "2026:09:20 09:15:00",
    make: "Apple",
    model: "iPhone 14 Pro Max",
  });
  fs.writeFileSync(path.join(OUT, "exif-time-only.jpg"), timeOnly, "binary");

  // 5 — a perfectly ordinary JPEG with NO Exif segment at all (no-metadata happy path).
  const noExif = await baseJpegBinaryString(0x336699ff);
  fs.writeFileSync(path.join(OUT, "no-exif.jpg"), noExif, "binary");

  // 6 — malformed/corrupted metadata section: a real, valid, decodable JPEG whose Exif
  // APP1 segment is deliberately truncated garbage — the image itself must stay usable.
  const corrupt = await baseJpegBinaryString(0xaa3355ff);
  const soi = corrupt.slice(0, 2); // 0xFFD8
  const rest = corrupt.slice(2);
  const garbage = "\xFF\xE1\x00\x08Exif\x00\x00\xDE\xAD"; // APP1 marker, bogus/truncated TIFF header
  fs.writeFileSync(path.join(OUT, "corrupt-exif.jpg"), soi + garbage + rest, "binary");

  console.log("Fixtures written to", OUT);
})();
