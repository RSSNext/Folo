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

        const state = {
          abortController: null,
          audioContext: null,
          chunkBytesSinceLastDecode: 0,
          chunks: [],
          closed: false,
          decodePromise: null,
          decodedDuration: 0,
          entryId: null,
          pendingDecode: false,
          reader: null,
          requestId: null,
          scheduledTime: 0,
          status: "idle",
          totalLength: 0,
        };

        const postMessage = (payload) => {
          window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
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

        const stopPlayback = async () => {
          if (state.closed) {
            return;
          }

          state.closed = true;

          try {
            state.abortController?.abort();
          } catch {}

          try {
            await state.reader?.cancel();
          } catch {}

          try {
            await state.audioContext?.close();
          } catch {}

          state.abortController = null;
          state.audioContext = null;
          state.chunkBytesSinceLastDecode = 0;
          state.chunks = [];
          state.closed = false;
          state.decodePromise = null;
          state.decodedDuration = 0;
          state.entryId = null;
          state.pendingDecode = false;
          state.reader = null;
          state.requestId = null;
          state.scheduledTime = 0;
          state.status = "idle";
          state.totalLength = 0;
        };

        const scheduleDecodedBuffer = (buffer) => {
          if (!state.audioContext) {
            return;
          }

          const totalDuration = buffer.duration;
          const newDuration = totalDuration - state.decodedDuration;

          if (newDuration <= 0) {
            state.decodedDuration = Math.max(state.decodedDuration, totalDuration);
            return;
          }

          const sampleRate = buffer.sampleRate;
          const startSample = Math.floor(state.decodedDuration * sampleRate);
          const endSample = Math.floor(totalDuration * sampleRate);
          const frameCount = endSample - startSample;

          if (frameCount <= 0) {
            return;
          }

          const segmentBuffer = state.audioContext.createBuffer(
            buffer.numberOfChannels,
            frameCount,
            sampleRate,
          );

          for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
            const channelData = new Float32Array(frameCount);
            buffer.copyFromChannel(channelData, channel, startSample);
            segmentBuffer.copyToChannel(channelData, channel, 0);
          }

          const source = state.audioContext.createBufferSource();
          source.buffer = segmentBuffer;
          source.connect(state.audioContext.destination);
          source.start(state.scheduledTime);

          state.scheduledTime += frameCount / sampleRate;
          state.decodedDuration = totalDuration;

          if (state.status !== "playing") {
            state.status = "playing";
            postMessage({
              entryId: state.entryId,
              requestId: state.requestId,
              type: "started",
            });
          } else {
            postMessage({
              entryId: state.entryId,
              type: "playing",
            });
          }
        };

        const decodeChunks = async () => {
          if (!state.audioContext || state.closed) {
            return;
          }

          const merged = concatChunks(state.chunks, state.totalLength);

          let decoded;
          try {
            decoded = await state.audioContext.decodeAudioData(merged.slice(0));
          } catch {
            return;
          }

          scheduleDecodedBuffer(decoded);
        };

        const requestDecode = () => {
          if (state.decodePromise) {
            state.pendingDecode = true;
            return;
          }

          state.decodePromise = decodeChunks()
            .catch(() => {})
            .finally(() => {
              state.decodePromise = null;
              if (state.pendingDecode) {
                state.pendingDecode = false;
                requestDecode();
              }
            });
        };

        const processStream = async (response) => {
          if (!response.body || !response.body.getReader) {
            const buffer = await response.arrayBuffer();
            const decoded = await state.audioContext.decodeAudioData(buffer.slice(0));
            scheduleDecodedBuffer(decoded);
            return;
          }

          state.reader = response.body.getReader();

          while (!state.closed) {
            const { done, value } = await state.reader.read();
            if (done) {
              break;
            }

            if (!value) {
              continue;
            }

            state.chunks.push(value);
            state.totalLength += value.length;
            state.chunkBytesSinceLastDecode += value.length;

            const threshold =
              state.decodedDuration === 0
                ? MIN_INITIAL_DECODE_BYTES
                : MIN_INCREMENTAL_DECODE_BYTES;

            if (state.chunkBytesSinceLastDecode >= threshold) {
              state.chunkBytesSinceLastDecode = 0;
              requestDecode();
            }
          }

          requestDecode();
          if (state.decodePromise) {
            await state.decodePromise;
          }
        };

        const waitForPlaybackToFinish = async () => {
          while (
            !state.closed &&
            state.audioContext &&
            state.audioContext.currentTime < state.scheduledTime
          ) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        };

        const handlePlay = async (payload) => {
          const sameEntry = state.entryId === payload.entryId;
          if (sameEntry && (state.status === "playing" || state.status === "paused")) {
            await handleToggle(payload);
            return;
          }

          await stopPlayback();

          state.abortController = new AbortController();
          state.audioContext = getAudioContext();
          state.chunkBytesSinceLastDecode = 0;
          state.chunks = [];
          state.decodedDuration = 0;
          state.entryId = payload.entryId;
          state.requestId = payload.requestId;
          state.scheduledTime = state.audioContext.currentTime;
          state.status = "loading";
          state.totalLength = 0;

          try {
            await state.audioContext.resume();

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
              signal: state.abortController.signal,
            });

            if (!response.ok) {
              throw new Error(await readErrorMessage(response));
            }

            await processStream(response);
            await waitForPlaybackToFinish();

            postMessage({
              entryId: payload.entryId,
              type: "ended",
            });
          } catch (error) {
            if (state.abortController?.signal.aborted) {
              return;
            }

            postMessage({
              entryId: payload.entryId,
              message: error instanceof Error ? error.message : "TTS streaming failed",
              requestId: payload.requestId,
              type: "error",
            });
          } finally {
            await stopPlayback();
          }
        };

        const handleToggle = async (payload) => {
          if (!state.audioContext || state.entryId !== payload.entryId) {
            return;
          }

          if (state.status === "playing") {
            await state.audioContext.suspend();
            state.status = "paused";
            postMessage({
              entryId: payload.entryId,
              type: "paused",
            });
            return;
          }

          if (state.status === "paused") {
            await state.audioContext.resume();
            state.status = "playing";
            postMessage({
              entryId: payload.entryId,
              type: "playing",
            });
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
            await stopPlayback();
            postMessage({
              entryId: state.entryId,
              type: "ended",
            });
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
