import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useRef, useState } from 'react';
function App() {
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
      if (messageRef.current) {
        messageRef.current.innerHTML = message;
      }
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setLoaded(true);
  }

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.webm', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s.webm'));
    await ffmpeg.writeFile('reversed.webm', await fetchFile('https://raw.githubusercontent.com/ffmpegwasm/testdata/master/Big_Buck_Bunny_180_10s_reversed.webm'));
    await ffmpeg.exec([
      '-i',
      'input.webm',
      '-i',
      'reversed.webm',
      '-filter_complex',
      '[0:v][1:v]blend=all_expr=\'A*(if(eq(0,N/2),1,T))+B*(if(eq(0,N/2),T,1))\'',
      'output.mp4',
    ]);
    const data = await ffmpeg.readFile('output.mp4');
    if (videoRef.current) {
      videoRef.current.src =
      URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
    }
  }

  return (loaded
    ? (
      <>
        <video ref={videoRef} controls></video><br />
        <button onClick={transcode}>Interlace two webm video to mp4</button>
        <p ref={messageRef}></p>
        <p>Open Developer Tools (Ctrl+Shift+I) to View Logs</p>
      </>
    )
    : (
      <button onClick={load}>Load ffmpeg-core (~31 MB)</button>
    )
  );
} 
export default App;