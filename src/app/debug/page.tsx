"use client";
import React, { useRef, useEffect, useState } from 'react';

const HLSPlayerDebug = ({ src, className = "", ...props }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), { timestamp, message, type }]);
    console.log(`[HLS ${type.toUpperCase()}] ${message}`);
  };

  useEffect(() => {
    if (!src || !videoRef.current) {
      addLog('No source or video element', 'error');
      return;
    }

    const video = videoRef.current;
    addLog(`Initializing with source: ${src}`);

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check for native HLS support (Safari, some mobile browsers)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      addLog('Using native HLS support');
      video.src = src;
      setStatus('native');
      return;
    }

    // Load HLS.js dynamically
    const loadHLS = async () => {
      try {
        if (!window.Hls) {
          addLog('Loading HLS.js from CDN...');
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const Hls = window.Hls;
        
        if (!Hls.isSupported()) {
          throw new Error('HLS is not supported in this browser');
        }

        addLog('HLS.js loaded successfully');
        
        const hls = new Hls({
          debug: false,
          enableWorker: false,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          // Add CORS handling
          xhrSetup: function (xhr, url) {
            addLog(`XHR request to: ${url}`);
            // Add any custom headers if needed
            // xhr.setRequestHeader('Authorization', 'Bearer your-token');
          },
          fetchSetup: function (context, initParams) {
            addLog(`Fetch request to: ${context.url}`);
            // Add CORS mode
            return new Request(context.url, {
              ...initParams,
              mode: 'cors',
              credentials: 'same-origin'
            });
          }
        });

        hlsRef.current = hls;

        // Event listeners
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          addLog('Media attached to video element');
        });

        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          addLog(`Manifest parsed. Found ${data.levels.length} quality levels`);
          setStatus('ready');
          
          // Log available qualities
          data.levels.forEach((level, index) => {
            addLog(`Level ${index}: ${level.width}x${level.height} @ ${level.bitrate}bps`);
          });
        });

        hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          addLog(`Level loaded: ${data.level}, live: ${data.details.live}`);
        });

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          addLog(`Fragment loaded: ${data.frag.sn}`);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          const errorMsg = `HLS Error: ${data.type} - ${data.details}`;
          addLog(errorMsg, 'error');
          setError(errorMsg);
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                addLog('Fatal network error, trying to recover...', 'error');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                addLog('Fatal media error, trying to recover...', 'error');
                hls.recoverMediaError();
                break;
              default:
                addLog('Fatal error, cannot recover', 'error');
                hls.destroy();
                setStatus('error');
                break;
            }
          }
        });

        // Load the source
        addLog('Loading HLS source...');
        hls.loadSource(src);
        hls.attachMedia(video);
        setStatus('loading');

      } catch (err) {
        const errorMsg = `Failed to initialize HLS: ${err.message}`;
        addLog(errorMsg, 'error');
        setError(errorMsg);
        setStatus('error');
      }
    };

    loadHLS();

    // Cleanup
    return () => {
      if (hlsRef.current) {
        addLog('Destroying HLS instance');
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  const handleVideoError = (e) => {
    const videoError = e.target.error;
    if (videoError) {
      const errorMsg = `Video Error: ${videoError.code} - ${videoError.message}`;
      addLog(errorMsg, 'error');
      setError(errorMsg);
    }
  };

  const testCORS = async () => {
    try {
      addLog('Testing CORS for HLS source...');
      const response = await fetch(src, { 
        method: 'HEAD',
        mode: 'cors' 
      });
      addLog(`CORS test successful: ${response.status}`);
    } catch (err) {
      addLog(`CORS test failed: ${err.message}`, 'error');
    }
  };

  const retryLoad = () => {
    setError(null);
    setStatus('initializing');
    setLogs([]);
    
    // Force re-render by changing key
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  return (
    <div className={`hls-player-container ${className}`}>
      {/* Debug Panel */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">HLS Player Debug</h3>
          <div className="flex gap-2">
            <button 
              onClick={testCORS}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Test CORS
            </button>
            <button 
              onClick={retryLoad}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
        
        <div className="mb-2">
          <span className="font-medium">Status: </span>
          <span className={`px-2 py-1 rounded text-sm ${
            status === 'ready' ? 'bg-green-200 text-green-800' :
            status === 'error' ? 'bg-red-200 text-red-800' :
            'bg-yellow-200 text-yellow-800'
          }`}>
            {status}
          </span>
        </div>
        
        <div className="mb-2">
          <span className="font-medium">Source: </span>
          <span className="text-sm font-mono break-all">{src}</span>
        </div>
        
        {error && (
          <div className="mb-2">
            <span className="font-medium text-red-600">Error: </span>
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}
        
        <details className="mt-2">
          <summary className="cursor-pointer font-medium">Debug Logs ({logs.length})</summary>
          <div className="mt-2 max-h-32 overflow-y-auto bg-black text-green-400 p-2 rounded text-xs font-mono">
            {logs.map((log, index) => (
              <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : ''}`}>
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Video Player */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-auto bg-black"
          controls
          muted
          playsInline
          onError={handleVideoError}
          onLoadStart={() => addLog('Video load started')}
          onLoadedMetadata={() => addLog('Video metadata loaded')}
          onCanPlay={() => addLog('Video can play')}
          onCanPlayThrough={() => addLog('Video can play through')}
          onPlay={() => addLog('Video playing')}
          onPause={() => addLog('Video paused')}
          onWaiting={() => addLog('Video waiting/buffering')}
          onStalled={() => addLog('Video stalled')}
          {...props}
        >
          Your browser does not support the video tag.
        </video>
        
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div>Loading HLS stream...</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-2 flex gap-2 text-sm">
        <button 
          onClick={() => videoRef.current?.play()}
          className="px-2 py-1 bg-gray-200 rounded"
          disabled={status !== 'ready'}
        >
          Play
        </button>
        <button 
          onClick={() => videoRef.current?.pause()}
          className="px-2 py-1 bg-gray-200 rounded"
        >
          Pause
        </button>
        <button 
          onClick={() => { videoRef.current.currentTime = 0; }}
          className="px-2 py-1 bg-gray-200 rounded"
        >
          Restart
        </button>
      </div>
    </div>
  );
};

// Example usage
const Page = () => {
  const hlsUrl = "http://127.0.0.1:8080/uploads/optimized/2025/08/22/hls/Facebook_Story_ce2d3bf89c1b0350c9b8c93588436615_1755841164_hls/master.m3u8";
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">HLS Player Debug Test</h1>
      <HLSPlayerDebug 
        src={hlsUrl}
        autoPlay={false}
        className="border rounded-lg overflow-hidden"
      />
    </div>
  );
};

export default Page;