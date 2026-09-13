"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, Check } from "lucide-react";

interface Props {
  projectId: string;
  workerId: string;
  workerName: string;
  alreadyPresent: boolean;
  alreadyFinished?: boolean;
}

export default function AttendanceButton({
  projectId,
  workerId,
  workerName,
  alreadyPresent,
  alreadyFinished = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(alreadyFinished);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      alert("Tidak bisa mengakses kamera. Izinkan akses kamera di browser.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
      }
    }
  };

  const submitAttendance = async (type: "MASUK" | "SELESAI") => {
    setLoading(true);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (e) {
          console.warn("Gagal ambil lokasi");
        }
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          workerId,
          type,
          latitude,
          longitude,
          photo: capturedImage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Gagal melakukan absensi");
        return;
      }

      if (type === "SELESAI") {
        setFinished(true);
      }

      alert("Absensi berhasil");
      stopCamera();
      router.refresh();
    } catch (error) {
      alert("Gagal melakukan absensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  if (alreadyPresent && finished) {
    return (
      <span className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg">
        Sudah Selesai
      </span>
    );
  }

  if (alreadyPresent) {
    return (
      <button
        onClick={() => submitAttendance("SELESAI")}
        disabled={loading}
        className="text-sm bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-60"
      >
        {loading ? "Menyimpan..." : "Absen Selesai"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={startCamera}
        disabled={loading}
        className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-60 flex items-center gap-1"
      >
        <Camera className="w-4 h-4" />
        Absen Masuk
      </button>

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                Selfie Absensi - {workerName}
              </h3>
              <button onClick={stopCamera} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black aspect-[3/4]">
              {!capturedImage ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="p-4 flex items-center justify-center gap-4">
              {!capturedImage ? (
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white shadow-lg"
                >
                  <Camera className="w-7 h-7" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Ulangi
                  </button>
                  <button
                    onClick={() => submitAttendance("MASUK")}
                    disabled={loading}
                    className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center gap-2 disabled:opacity-70"
                  >
                    <Check className="w-5 h-5" />
                    {loading ? "Menyimpan..." : "Konfirmasi Absen"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}