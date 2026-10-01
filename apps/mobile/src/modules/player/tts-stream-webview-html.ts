export const TTS_STREAM_WEBVIEW_HTML = String.raw`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <title>TTS Stream</title>
  </head>
  <body>
    <script>
      (() => {
        const TTS_SERVICE_URL = "https://tts.folo.is";
        const TTS_MIME_FALLBACK = "audio/mpeg";
        const MIN_INITIAL_DECODE_BYTES = 24 * 1024;
        const MIN_INCREMENTAL_DECODE_BYTES = 16 * 1024;
        const PROGRESS_INTERVAL_MS = 1000;
        // Matches the app's start timeout: the service never pauses this long between chunks
        const STALL_TIMEOUT_MS = 15000;

        // The playback that owns the audio output. A play command replaces it and a stop command
        // clears it. Async work of an earlier playback checks isCurrent() before it touches audio
        // or posts an event, so it can't stop or report on the playback that replaced it.
        let current = null;

        const postMessage = (payload) => {
          window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
        };

        const isCurrent = (playback) => current === playback;

        const postPlaybackEvent = (playback, type, extra) => {
          if (!isCurrent(playback)) {
            return;
          }

          postMessage({
            ...extra,
            entryId: playback.entryId,
            requestId: playback.requestId,
            type,
          });
        };

        const concatChunks = (chunks, totalLength) => {
          const merged = new Uint8Array(totalLength);
          let offset = 0;

          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }

          return merged.buffer;
        };

        const getAudioContext = () => {
          const AudioContextConstructor =
            window.AudioContext || window.webkitAudioContext || null;

          if (!AudioContextConstructor) {
            throw new Error("Streaming TTS is not supported on this device");
          }

          return new AudioContextConstructor();
        };

        const readErrorMessage = async (response) => {
          try {
            const data = await response.clone().json();
            return data?.error?.message || "TTS request failed";
          } catch {
            return "TTS request failed";
          }
        };

        const closePlayback = (playback) => {
          if (!playback || playback.closed) {
            return;
          }

          playback.closed = true;
          if (isCurrent(playback)) {
            current = null;
          }

          clearInterval(playback.stallTimer);

          try {
            playback.abortController.abort();
          } catch {}

          try {
            playback.reader?.cancel().catch(() => {});
          } catch {}

          try {
            playback.audioContext?.close().catch(() => {});
          } catch {}
        };

        // Tells the app that the download is still moving, so it keeps waiting for the first audio
        const reportProgress = (playback) => {
          const now = Date.now();
          if (
            playback.status !== "loading" ||
            now - playback.lastProgressAt < PROGRESS_INTERVAL_MS
          ) {
            return;
          }

          playback.lastProgressAt = now;
          postPlaybackEvent(playback, "progress");
        };

        // Once playing, a stalled download would leave the stream silent while the app shows it
        // playing. Before the first audio the app's start timeout covers it.
        const checkStall = (playback) => {
          if (
            !isCurrent(playback) ||
            !playback.downloading ||
            playback.status !== "playing" ||
            playback.audioContext.currentTime < playback.scheduledTime ||
            Date.now() - playback.lastChunkAt < STALL_TIMEOUT_MS
          ) {
            return;
          }

          postPlaybackEvent(playback, "error", { message: "TTS stream stalled" });
          closePlayback(playback);
        };

        const scheduleDecodedBuffer = (playback, buffer) => {
          const { audioContext } = playback;
          const totalDuration = buffer.duration;

          if (totalDuration <= playback.decodedDuration) {
            return;
          }

          const sampleRate = buffer.sampleRate;
          const startSample = Math.floor(playback.decodedDuration * sampleRate);
          const endSample = Math.floor(totalDuration * sampleRate);
          const frameCount = endSample - startSample;

          if (frameCount <= 0) {
            return;
          }

          const segmentBuffer = audioContext.createBuffer(
            buffer.numberOfChannels,
            frameCount,
            sampleRate,
          );

          for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
            const channelData = new Float32Array(frameCount);
            buffer.copyFromChannel(channelData, channel, startSample);
            segmentBuffer.copyToChannel(channelData, channel, 0);
          }

          const source = audioContext.createBufferSource();
          source.buffer = segmentBuffer;
          source.connect(audioContext.destination);
          // The context clock runs while the first bytes download, so a segment scheduled in the
          // past would start right away and overlap the segment before it.
          const startTime = Math.max(playback.scheduledTime, audioContext.currentTime);
          source.start(startTime);

          playback.scheduledTime = startTime + frameCount / sampleRate;
          playback.decodedDuration = totalDuration;

          // A paused playback stays paused while the rest of the audio decodes
          if (playback.status === "loading") {
            playback.status = "playing";
            postPlaybackEvent(playback, "started");
          }
        };

        const decodeChunks = async (playback) => {
          const merged = concatChunks(playback.chunks, playback.totalLength);

          let decoded;
          try {
            decoded = await playback.audioContext.decodeAudioData(merged.slice(0));
          } catch {
            return;
          }

          if (isCurrent(playback)) {
            scheduleDecodedBuffer(playback, decoded);
          }
        };

        const requestDecode = (playback) => {
          if (!isCurrent(playback)) {
            return;
          }

          if (playback.decodePromise) {
            playback.pendingDecode = true;
            return;
          }

          playback.decodePromise = decodeChunks(playback)
            .catch(() => {})
            .finally(() => {
              playback.decodePromise = null;
              if (playback.pendingDecode) {
                playback.pendingDecode = false;
                requestDecode(playback);
              }
            });
        };

        const processStream = async (playback, response) => {
          if (!response.body || !response.body.getReader) {
            const buffer = await response.arrayBuffer();
            playback.downloading = false;
            const decoded = await playback.audioContext.decodeAudioData(buffer.slice(0));
            if (isCurrent(playback)) {
              scheduleDecodedBuffer(playback, decoded);
            }
            return;
          }

          playback.reader = response.body.getReader();

          while (isCurrent(playback)) {
            const { done, value } = await playback.reader.read();
            if (done) {
              break;
            }

            if (!value) {
              continue;
            }

            playback.lastChunkAt = Date.now();
            playback.chunks.push(value);
            playback.totalLength += value.length;
            playback.chunkBytesSinceLastDecode += value.length;
            reportProgress(playback);

            const threshold =
              playback.decodedDuration === 0
                ? MIN_INITIAL_DECODE_BYTES
                : MIN_INCREMENTAL_DECODE_BYTES;

            if (playback.chunkBytesSinceLastDecode >= threshold) {
              playback.chunkBytesSinceLastDecode = 0;
              requestDecode(playback);
            }
          }

          playback.downloading = false;
          requestDecode(playback);
          // A decode that was running queues one more for the bytes that arrived meanwhile
          while (playback.decodePromise) {
            await playback.decodePromise;
          }
        };

        const waitForPlaybackToFinish = async (playback) => {
          while (
            isCurrent(playback) &&
            playback.audioContext.currentTime < playback.scheduledTime
          ) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        };

        const handlePlay = async (payload) => {
          // A play command always starts over, also for the entry that is playing. The app pauses
          // and resumes with toggle commands and waits for this request's started event.
          closePlayback(current);

          const playback = {
            abortController: new AbortController(),
            audioContext: null,
            chunkBytesSinceLastDecode: 0,
            chunks: [],
            closed: false,
            decodePromise: null,
            decodedDuration: 0,
            downloading: false,
            entryId: payload.entryId,
            lastChunkAt: 0,
            lastProgressAt: 0,
            pendingDecode: false,
            reader: null,
            requestId: payload.requestId,
            scheduledTime: 0,
            stallTimer: null,
            status: "loading",
            totalLength: 0,
          };
          current = playback;

          try {
            playback.audioContext = getAudioContext();
            playback.scheduledTime = playback.audioContext.currentTime;
            await playback.audioContext.resume();

            const response = await fetch(TTS_SERVICE_URL + "/tts", {
              body: JSON.stringify({
                text: payload.text,
                ...(payload.voice ? { voice: payload.voice } : {}),
              }),
              headers: {
                "Content-Type": "application/json",
                Accept: TTS_MIME_FALLBACK,
              },
              method: "POST",
              signal: playback.abortController.signal,
            });

            if (!response.ok) {
              throw new Error(await readErrorMessage(response));
            }

            playback.downloading = true;
            playback.lastChunkAt = Date.now();
            playback.stallTimer = setInterval(() => checkStall(playback), 1000);
            reportProgress(playback);
            await processStream(playback, response);

            if (isCurrent(playback) && playback.status === "loading") {
              throw new Error("TTS stream contained no playable audio");
            }

            await waitForPlaybackToFinish(playback);
            postPlaybackEvent(playback, "ended");
          } catch (error) {
            postPlaybackEvent(playback, "error", {
              message: error instanceof Error ? error.message : "TTS streaming failed",
            });
          } finally {
            closePlayback(playback);
          }
        };

        const handleToggle = async (payload) => {
          const playback = current;
          if (!playback || playback.entryId !== payload.entryId) {
            return;
          }

          if (playback.status === "playing") {
            playback.status = "paused";
            await playback.audioContext.suspend();
            postPlaybackEvent(playback, "paused");
            return;
          }

          if (playback.status === "paused") {
            playback.status = "playing";
            await playback.audioContext.resume();
            postPlaybackEvent(playback, "playing");
          }
        };

        const handleMessage = async (raw) => {
          let payload;
          try {
            payload = JSON.parse(raw);
          } catch {
            return;
          }

          if (payload.type === "play") {
            await handlePlay(payload);
            return;
          }

          if (payload.type === "toggle") {
            await handleToggle(payload);
            return;
          }

          if (payload.type === "stop") {
            closePlayback(current);
          }
        };

        window.addEventListener("message", (event) => {
          void handleMessage(event.data);
        });
        document.addEventListener("message", (event) => {
          void handleMessage(event.data);
        });

        postMessage({ type: "ready" });
      })();
    </script>
  </body>
</html>
`
