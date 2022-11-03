import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";

import "./lib.scss";
//@ts-ignore
import windowShareUrl from "./window-share.png?url";

let VideoPreview = ({ stream }: { stream: MediaStream }) => {
  let ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    ref.current!.srcObject = stream;
  }, []);
  return (
    <video
      className="video-visualizer"
      width={300}
      height={300}
      autoPlay
      ref={ref}
    />
  );
};

let AudioPreview = ({ stream }: { stream: MediaStream }) => {
  let visualizer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    (async () => {
      let ctx = new AudioContext();
      let src = ctx.createMediaStreamSource(stream);
      await ctx.audioWorklet.addModule("vumeter-worklet.js");
      let node = new AudioWorkletNode(ctx, "vumeter");
      src.connect(node);

      let volumes: number[] = [];
      node.port.onmessage = event => {
        volumes.push(event.data.volume);
        if (volumes.length > 10) volumes.shift();
      };

      let stop = false;
      let draw = () => {
        if (stop || !visualizer.current) return;
        requestAnimationFrame(draw);
        let avg = _.mean(volumes);
        let width = Math.min(3000 * avg, 500);
        visualizer.current.style.width = `${width}px`;
      };
      draw();
      return () => {
        stop = true;
      };
    })();
  }, []);
  return (
    <div>
      <div className="audio-visualizer">
        <div className="bar" ref={visualizer} />
      </div>
    </div>
  );
};

const MIME_TYPES: [string, string][] = [
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/x-matroska", "mkv"],
];

export class Recorder {
  private chunks: Blob[] = [];
  private mediaRecorder: MediaRecorder;
  readonly extension: string;

  constructor(videoStream: MediaStream, audioStream: MediaStream) {
    let audioTrack = audioStream.getTracks()[0];
    videoStream.addTrack(audioTrack);
    audioStream.removeTrack(audioTrack);

    let pair = MIME_TYPES.find(([type]) => MediaRecorder.isTypeSupported(type));
    if (!pair) throw new Error("No supported video type!");
    let [mimeType, ext] = pair;

    this.extension = ext;
    console.debug(`Mime type: ${mimeType}`);

    this.mediaRecorder = new MediaRecorder(videoStream, { mimeType });
    this.mediaRecorder.addEventListener("dataavailable", e => {
      this.chunks.push(e.data);
    });

    let videoTrack = videoStream.getVideoTracks()[0];
    videoTrack.addEventListener("ended", async () => {
      // this.mediaRecorder.stop();
      // let newVideoStream = await navigator.mediaDevices.getDisplayMedia({
      //   video: true,
      // } as any);
      // this.mediaRecorder.stream.removeTrack(videoTrack);
      // this.mediaRecorder.stream.addTrack(newVideoStream.getVideoTracks()[0]);
      // this.mediaRecorder.start();

      document.getElementById("root")!.innerHTML =
        "<strong>Error:</strong> you cannot stop the screen recording during the experiment (it is an unrecoverable error right now). Please refresh the page and restart the experiment.";
    });

    this.mediaRecorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise(resolve => {
      this.mediaRecorder.addEventListener("stop", () => {
        resolve(new Blob(this.chunks, { type: this.chunks[0].type }));
      });
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }
}

/** Test */
export let RecordingSetup = ({
  next,
  registerRecorder,
}: {
  next: () => void;
  registerRecorder: (recorder: Recorder) => void;
}) => {
  let [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  let [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  let initVideo = async () => {
    try {
      setVideoStream(
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
        } as any)
      );
    } catch (err) {
      console.error(err);
      return;
    }
  };

  let initAudio = async () => {
    try {
      setAudioStream(
        await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
          },
        })
      );
    } catch (err) {
      console.error(err);
      return;
    }
  };

  let finish = () => {
    if (!videoStream || !audioStream) throw new Error("Unreachable");
    registerRecorder(new Recorder(videoStream, audioStream));
    next();
  };

  useEffect(() => {
    window.scroll({
      left: 0,
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  }, [videoStream, audioStream]);

  return (
    <div className="container recording-setup">
      <p>
        First, we need to setup the recording. Click the button below to enable
        screen recording, and{" "}
        <strong>select the screen containing this browser</strong> (not the
        tab!) to record. The screenshot below shows how this should look in
        Google Chrome.
      </p>
      <div>
        <img
          style={{ width: "500px", border: "1px solid #ccc" }}
          src={windowShareUrl}
        />
      </div>
      <p>
        <button onClick={initVideo}>Enable screen recording</button>
      </p>
      {videoStream ? (
        <>
          <p>
            If that worked correctly, you should see the current web page in the
            streaming video below. If you see a different page, please click the
            button above again.
          </p>
          <VideoPreview stream={videoStream!} />
          <p>Next, click the button below to enable mic recording:</p>
          <p>
            <button onClick={initAudio}>Enable mic recording</button>
          </p>
          {audioStream ? (
            <>
              <p>
                Try speaking into your microphone. If that worked correctly,
                then you should see a green bar going up as you talk.
              </p>
              <AudioPreview stream={audioStream!} />
              <p>
                If both the video and the audio are working, then click here to
                continue:
              </p>
              <button onClick={finish}>Continue</button>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export let Outro = ({
  recorder,
  dropboxUrl,
  uuid,
}: {
  recorder?: Recorder;
  dropboxUrl: string;
  uuid: string;
}) => {
  // let [uploaded, setUploaded] = useState(false);
  let [urlParams, setUrlParams] = useState<any | undefined>();
  useEffect(() => {
    if (!recorder) return;
    recorder.stop().then(data => {
      let now = new Date();
      let date = [now.getFullYear(), now.getMonth(), now.getDate()]
        .map(n => n.toString().padStart(2, "0"))
        .join("-");

      setUrlParams({
        href: URL.createObjectURL(data),
        download: `recording_${date}_${uuid}.${recorder.extension}`,
      });

      /*let xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable)
          console.log("upload progress:", event.loaded / event.total);
      });
      xhr.addEventListener("loadend", () => {
        setUploaded(true);
      });
      xhr.open("POST", "https://mindover.computer/upload");
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
      xhr.send(formData);*/
    });
  }, []);

  // TODO: if upload fails, give option to download and ask them to send it.

  return (
    <div className="container">
      {recorder ? (
        <>
          <p>
            <strong>DO NOT CLOSE THE TAB YET.</strong> We have stopped recording
            your screen and audio.
          </p>
          {urlParams ? (
            <>
              <p>
                Next, please click here to download the recorded video:{" "}
                <a {...urlParams}>Download</a>
              </p>
              <p>
                Then upload the video to this Dropbox link:{" "}
                <a href={dropboxUrl} target="_blank" rel="noreferrer">
                  {dropboxUrl}
                </a>
              </p>
              <p>And that&apos;s it! Thanks for your participation.</p>
            </>
          ) : (
            <p>Wait while we prepare the recorded video...</p>
          )}
          {/* {uploaded ? (
            <p>
              The recording has been successfully uploaded. You may now close
              this tab.
            </p>
          ) : (
            <>
              <p>
                <strong style={{ fontSize: "24px" }}>
                  DO NOT CLOSE THIS TAB!
                </strong>
              </p>
              <p>
                We are currently uploading the recording to our server. Please
                wait a minute for the upload to complete...
              </p>
            </>
          )} */}
        </>
      ) : (
        <p>Thank you for your participation in the experiment!</p>
      )}
    </div>
  );
};
