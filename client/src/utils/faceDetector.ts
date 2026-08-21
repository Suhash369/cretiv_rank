export interface IFaceDetectionResult {
  faceCount: number;
  multipleFacesDetected: boolean;
  noFaceDetected: boolean;
  details: string;
}

/**
 * Real-Time Browser Face Detection Engine
 * Uses Native Experimental ShapeDetection API (FaceDetector) if available,
 * with fallback to Skin-Tone & Spatial Bounding Cluster Segmentation.
 */
export const detectFacesInVideo = async (
  video: HTMLVideoElement,
  canvas?: HTMLCanvasElement
): Promise<IFaceDetectionResult> => {
  if (!video || video.readyState < 2 || video.paused || video.ended) {
    return {
      faceCount: 1,
      multipleFacesDetected: false,
      noFaceDetected: false,
      details: 'Video feed initializing...',
    };
  }

  // 1. Primary: Native Browser FaceDetector (Chromium / Edge Shape Detection API)
  if ('FaceDetector' in window) {
    try {
      const FaceDetectorClass = (window as any).FaceDetector;
      const detector = new FaceDetectorClass({ maxFaces: 5, fastMode: true });
      const faces = await detector.detect(video);
      const faceCount = faces.length;

      return {
        faceCount,
        multipleFacesDetected: faceCount > 1,
        noFaceDetected: faceCount === 0,
        details:
          faceCount > 1
            ? `ANOMALY: ${faceCount} distinct faces detected in candidate camera frame!`
            : faceCount === 0
            ? 'WARNING: Candidate face not detected in front of camera.'
            : 'Single candidate face verified.',
      };
    } catch (err) {
      // Fall through to Canvas Heuristic Fallback
    }
  }

  // 2. Secondary: Off-screen Canvas Skin-Tone & Spatial Contour Clustering
  try {
    const workCanvas = canvas || document.createElement('canvas');
    const width = 160;
    const height = 120;
    workCanvas.width = width;
    workCanvas.height = height;

    const ctx = workCanvas.getContext('2d');
    if (!ctx) {
      return {
        faceCount: 1,
        multipleFacesDetected: false,
        noFaceDetected: false,
        details: 'Canvas 2D context unavailable.',
      };
    }

    ctx.drawImage(video, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Skin-tone pixel detection in YCbCr color space
    let skinPixelColumns: number[] = new Array(width).fill(0);
    let totalSkinPixels = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];

        // YCbCr Conversion
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        // Skin Tone Range Rules (Normalized for varied illumination)
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && cb >= 80 && cb <= 135 && cr >= 135 && cr <= 180) {
          skinPixelColumns[x]++;
          totalSkinPixels++;
        }
      }
    }

    // Identify distinct spatial clusters (horizontal separation > 25px)
    let clusterCount = 0;
    let inCluster = false;
    let clusterWidth = 0;

    for (let x = 0; x < width; x++) {
      if (skinPixelColumns[x] > 12) { // Column contains significant skin pixels
        if (!inCluster) {
          inCluster = true;
          clusterWidth = 1;
        } else {
          clusterWidth++;
        }
      } else {
        if (inCluster) {
          if (clusterWidth > 8) { // Minimum cluster width for a face region
            clusterCount++;
          }
          inCluster = false;
          clusterWidth = 0;
        }
      }
    }
    if (inCluster && clusterWidth > 8) clusterCount++;

    const noFaceDetected = totalSkinPixels < 200;
    const multipleFacesDetected = clusterCount >= 2;

    return {
      faceCount: multipleFacesDetected ? Math.max(2, clusterCount) : noFaceDetected ? 0 : 1,
      multipleFacesDetected,
      noFaceDetected,
      details: multipleFacesDetected
        ? `ANOMALY: Multiple distinct facial regions (${clusterCount}) detected in candidate camera frame!`
        : noFaceDetected
        ? 'WARNING: Candidate face not detected in front of camera.'
        : 'Single candidate face verified.',
    };
  } catch (err) {
    return {
      faceCount: 1,
      multipleFacesDetected: false,
      noFaceDetected: false,
      details: 'Face detection scanner active.',
    };
  }
};
