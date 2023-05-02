import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
import "./App.css";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      const model = await facemesh.load();

      setInterval(() => {
        detectEmotions(model);
      }, 1000);
    }

    loadModel();
  }, []);

  async function detectEmotions(model) {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      const canvas = canvasRef.current;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext("2d");

      const predictions = await model.estimateFaces(video);
      if (predictions.length > 0) {
        const keypoints = predictions[0].scaledMesh;

        // Define a mapping between facial landmarks and emotions
        const emotions = {
          angry: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 21, 22, 26,
          ],
          disgusted: [33, 34, 35, 36, 37, 38, 39, 40, 41, 42],
          fearful: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26,
          ],
          happy: [48, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64],
          neutral: [27, 28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 42, 43, 44, 45],
          sad: [
            48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
          ],
          surprised: [17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 39, 40, 41],
        };

        // Compute the average distance between each pair of keypoints
        const distances = [];
        for (let i = 0; i < Object.values(emotions).flat().length; i++) {
          for (let j = i + 1; j < Object.values(emotions).flat().length; j++) {
            const a = keypoints[Object.values(emotions).flat()[i]];
            const b = keypoints[Object.values(emotions).flat()[j]];
            distances.push(
              Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2))
            );
          }
        }
        const averageDistance =
          distances.reduce((a, b) => a + b, 0) / distances.length;

        console.log(averageDistance);

        let emotion = "unknown";
        if (averageDistance < 35) {
          emotion = "neutral";
          console.log("Init ", emotion);
        } else if (averageDistance < 50) {
          emotion = "happy";
          console.log(emotion);
        } else if (averageDistance < 70) {
          emotion = "surprised";
        } else if (averageDistance < 90) {
          emotion = "sad";
        } else if (averageDistance < 110) {
          emotion = "disgusted";
        } else if (averageDistance >= 110) {
          emotion = "angry";
        }
        // Draw the keypoints on the canvas
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";
        for (let i = 0; i < keypoints.length; i++) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, 2 * Math.PI);
          ctx.fill();
        }
        console.log(emotion);
      }
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          mirrored={true}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </header>
    </div>
  );
}

export default App;
