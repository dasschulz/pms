"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Play, Music, FileText, Pause, Volume2, VolumeX, Maximize, Minimize, Download, MessageSquareText, Mic2, FolderOpen } from "lucide-react";

// Component for enhanced media modal with transcript
function MediaModal({ 
  isOpen, 
  onClose, 
  mediaType, 
  mediaUrl, 
  transcript, 
  transcriptSentences,
  title,
  speechData,
  startFeedbackGeneration
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mediaType: 'video' | 'audio'; 
  mediaUrl: string; 
  transcript: string; 
  transcriptSentences?: Array<{text: string, timeStart: number, timeEnd: number, speaker?: string}>;
  title: string;
  speechData?: any;
  startFeedbackGeneration?: boolean;
}) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [highlightedSentence, setHighlightedSentence] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasRealAudioData, setHasRealAudioData] = useState(false);

  const getProxiedUrlIfNeeded = (originalUrl: string, type: 'audio' | 'video') => {
    if (type === 'audio' && originalUrl.includes('cldf-od.r53.cdn.tv1.eu')) {
      return `/api/audio-fetcher?url=${encodeURIComponent(originalUrl)}`;
    }
    return originalUrl;
  };

  // Use timestamped sentences if available, otherwise split plain text
  const sentences = transcriptSentences && transcriptSentences.length > 0 
    ? transcriptSentences 
    : transcript.split(/(?<=[.!?])\s+/).filter(s => s.trim()).map(text => ({ text, timeStart: 0, timeEnd: 0, speaker: '' }));

  // Memoize the proxied URL to prevent re-evaluation on every render
  const proxiedMediaUrl = useMemo(() => getProxiedUrlIfNeeded(mediaUrl, mediaType), [mediaUrl, mediaType]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    
    // Clear any existing intervals immediately
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Start basic progress tracking
    progressIntervalRef.current = setInterval(() => {
      const currentMedia = mediaRef.current;
      if (currentMedia) {
        if (!currentMedia.paused) {
          setCurrentTime(currentMedia.currentTime);
          
          // Force duration if needed
          if (currentMedia.duration && currentMedia.duration > 0) {
            setDuration(currentMedia.duration);
          }
        }
      } else {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 100);
    
    // Initialize Web Audio API for real frequency data
    if (mediaType === 'audio') {
      setTimeout(() => {
        initializeAudioAnalyser();
      }, 200);
    }
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.duration && Number.isFinite(media.duration) && media.duration > 0) {
      setDuration(media.duration);
    }
  }, []);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    // VOLCANIC GUARD: Prevent duplicate setups
    let isSetupComplete = false;
    
    // Poll for media element existence
    let pollAttempts = 0;
    const maxPollAttempts = 20; // Try for 2 seconds
    
    const pollForMedia = () => {
      pollAttempts++;
      const media = mediaRef.current;
      
      if (isSetupComplete) {
        return;
      }
      
      if (!media) {
        if (pollAttempts < maxPollAttempts) {
          setTimeout(pollForMedia, 100);
          return;
        } else {
          return;
        }
      }
      
      isSetupComplete = true;
      
      // Reset states for new media
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setHasRealAudioData(false);

      // Define handleTimeUpdate inside useEffect to avoid closure issues
      const handleTimeUpdate = () => {
        const media = mediaRef.current;
        if (!media) return;
        setCurrentTime(media.currentTime);
        if (duration === 0 && media.duration && Number.isFinite(media.duration) && media.duration > 0) {
          setDuration(media.duration);
        }
        if (transcriptSentences && transcriptSentences.length > 0) {
          let currentSentenceIndex = transcriptSentences.findIndex(
            sentence => media.currentTime >= sentence.timeStart && media.currentTime <= sentence.timeEnd
          );
          if (currentSentenceIndex === -1) {
            for (let i = transcriptSentences.length - 1; i >= 0; i--) {
              if (media.currentTime >= transcriptSentences[i].timeStart) {
                currentSentenceIndex = i;
                break;
              }
            }
          }
          if (currentSentenceIndex === -1) currentSentenceIndex = 0;
          setHighlightedSentence(currentSentenceIndex);
        } else if (duration > 0) {
          const progress = media.currentTime / duration;
          const sentenceIndex = Math.floor(progress * sentences.length);
          setHighlightedSentence(Math.min(sentenceIndex, sentences.length - 1));
        }
      };

      const attemptSetDuration = () => {
        if (media.duration && Number.isFinite(media.duration) && media.duration > 0) {
          setDuration(prevDuration => {
            if (prevDuration !== media.duration) {
              return media.duration;
            }
            return prevDuration;
          });
          return true; 
        }
        return false; 
      };

      // Try to set duration immediately if available
      if (media.readyState >= 1 /* HAVE_METADATA */) {
        if (!attemptSetDuration()) {
          setTimeout(() => attemptSetDuration(), 100);
        }
      }

      // Clear any existing intervals before creating new ones
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Play handler
      const handlePlay = () => {
        setIsPlaying(true);
        
        // Clear any existing intervals
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Start progress tracking
        progressIntervalRef.current = setInterval(() => {
          const currentMedia = mediaRef.current;
          if (currentMedia && !currentMedia.paused) {
            setCurrentTime(currentMedia.currentTime);
            if (currentMedia.duration && currentMedia.duration > 0) {
              setDuration(currentMedia.duration);
            }
          }
        }, 100);
        
        // Initialize Web Audio API for real frequency data
        if (mediaType === 'audio') {
          setTimeout(() => {
            initializeAudioAnalyser();
          }, 200);
        }
      };

      const handlePause = () => {
        setIsPlaying(false);
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      };
      
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      // Enhanced event handlers for duration
      const handleLoadedMetadata = () => {
        attemptSetDuration();
      };

      const handleCanPlay = () => {
        attemptSetDuration();
      };

      const handleDurationChange = () => {
        attemptSetDuration();
      };

      // Add event listeners
      media.addEventListener('loadedmetadata', handleLoadedMetadata);
      media.addEventListener('canplay', handleCanPlay);
      media.addEventListener('durationchange', handleDurationChange);
      media.addEventListener('timeupdate', handleTimeUpdate);
      media.addEventListener('play', handlePlay);
      media.addEventListener('pause', handlePause);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      // Store cleanup function
      return () => {
        media.removeEventListener('loadedmetadata', handleLoadedMetadata);
        media.removeEventListener('canplay', handleCanPlay);
        media.removeEventListener('durationchange', handleDurationChange);
        media.removeEventListener('timeupdate', handleTimeUpdate);
        media.removeEventListener('play', handlePlay);
        media.removeEventListener('pause', handlePause);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch (e) {
            console.warn("Error disconnecting sourceRef in cleanup:", e);
          }
          sourceRef.current = null;
        }
        if (analyserRef.current) {
           try {
            analyserRef.current.disconnect();
          } catch (e) {
            console.warn("Error disconnecting analyserRef in cleanup:", e);
          }
        }
      };
    };
    
    // Start polling for media element
    const cleanup = pollForMedia();
    
    return () => {
      isSetupComplete = true; // Prevent any pending polls from running
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [mediaUrl, transcriptSentences]);

  // SEPARATE useEffect for canvas setup to avoid dependency array issues
  useEffect(() => {
    // VOLCANIC GUARD: Prevent duplicate canvas setups
    let isCanvasSetupComplete = false;
    
    if (isOpen && mediaType === 'audio') {
      // CANVAS POLLING: Wait for canvas to exist
      let canvasPollAttempts = 0;
      const maxCanvasPollAttempts = 20; // Try for 2 seconds
      
      const pollForCanvas = () => {
        canvasPollAttempts++;
        
        if (isCanvasSetupComplete) {
          return;
        }
        
        if (!canvasRef.current) {
          // Try to find canvas by other means
          const canvasElements = document.querySelectorAll('canvas');
          
          if (canvasElements.length === 0) {
            if (canvasPollAttempts < maxCanvasPollAttempts) {
              setTimeout(pollForCanvas, 100);
              return;
            } else {
              return;
            }
          }
        }
        
        const canvas = canvasRef.current || document.querySelector('canvas');
        if (!canvas) {
          if (canvasPollAttempts < maxCanvasPollAttempts) {
            setTimeout(pollForCanvas, 100);
          }
          return;
        }
        
        isCanvasSetupComplete = true;
        
        // Clear any existing animation frames
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
        
        // FORCE canvas dimensions
        const width = 800;
        const height = 192;
        canvas.width = width;
        canvas.height = height;
        
        // Start immediate visualization
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return;
        }
        
        // Test canvas immediately with a simple shape
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, 100, 100);
        
        // Clear and start animation
        setTimeout(() => {
          let frameCount = 0;
          const drawEmergencyBars = () => {
            // Check if we should still be running
            if (isCanvasSetupComplete === false) {
              return;
            }
            
            frameCount++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Only show anything when audio is actually playing
            const currentMedia = mediaRef.current;
            const isAudioPlaying = currentMedia && !currentMedia.paused && currentMedia.currentTime > 0;
            
            if (isAudioPlaying) {
              // Only show fallback if Web Audio API hasn't provided real data yet
              // and we've been playing for more than 2 seconds (giving Web Audio API time to work)
              const playTime = currentMedia.currentTime;
              const shouldShowFallback = !hasRealAudioData && playTime > 2;
              
              if (shouldShowFallback) {
                // Fallback animated bars when Web Audio API fails
                ctx.fillStyle = 'hsl(0 100% 50%)'; // Red emergency bars
                const numBars = 60;
                const barWidth = canvas.width / numBars;
                
                for (let i = 0; i < numBars; i++) {
                  const barHeight = Math.sin(Date.now() * 0.003 + i * 0.2) * 0.3 + 0.5;
                  const height = barHeight * canvas.height * 0.8;
                  const x = i * barWidth;
                  ctx.fillRect(x, canvas.height - height, barWidth - 1, height);
                }
              }
              // Otherwise: keep canvas blank while waiting for Web Audio API
            }
            
            const animationId = requestAnimationFrame(drawEmergencyBars);
            animationFrameIdRef.current = animationId;
          };
          
          drawEmergencyBars();
        }, 100);
        
        // Return cleanup function
        return () => {
          isCanvasSetupComplete = false; // Signal animation to stop
          if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
          }
        };
      };
      
      // Start canvas polling
      const canvasCleanup = pollForCanvas();
      
      return () => {
        isCanvasSetupComplete = false; // Prevent any pending polls from running
        if (typeof canvasCleanup === 'function') {
          canvasCleanup();
        }
      };
    }
  }, [isOpen, mediaType]);

  // Auto-scroll to keep highlighted sentence visible
  useEffect(() => {
    if (transcriptRef.current && highlightedSentence >= 0) {
      const highlightedElement = transcriptRef.current.children[highlightedSentence] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [highlightedSentence]);

  const jumpToSentence = (sentenceIndex: number) => {
    const media = mediaRef.current;
    if (!media) return;
    
    setHighlightedSentence(sentenceIndex);
    
    const sentence = sentences[sentenceIndex];
    let targetTime = 0;
    let shouldPlayAfterJump = !media.paused || media.currentTime === 0;

    // Check if we have real timestamped sentences
    if (transcriptSentences && transcriptSentences.length > 0 && transcriptSentences[sentenceIndex] && transcriptSentences[sentenceIndex].timeStart > 0) {
      targetTime = transcriptSentences[sentenceIndex].timeStart;
    } else if (sentence && typeof sentence === 'object' && sentence.timeStart > 0) {
      targetTime = sentence.timeStart;
    } else {
      // Use media.duration directly if duration state is not set yet
      const currentDuration = duration > 0 ? duration : (media.duration || 0);
      if (currentDuration > 0) {
        // Fallback: calculate time based on sentence position
        targetTime = (sentenceIndex / sentences.length) * currentDuration;
      } else {
        return; // Don't jump if we can't calculate a meaningful time
      }
    }

    // Ensure targetTime is within valid range
    const finalDuration = duration > 0 ? duration : (media.duration || 0);
    if (finalDuration > 0) {
      targetTime = Math.max(0, Math.min(targetTime, finalDuration));
    }
    
    // Pause media before seeking
    const wasPlaying = !media.paused;
    if (wasPlaying) {
      media.pause();
    }
    
    // Add seeked event listener
    const handleSeeked = () => {
      media.removeEventListener('seeked', handleSeeked);
      
      // Manually update currentTime state to sync the progress bar
      setCurrentTime(media.currentTime);
      
      // Resume playing if it was playing before
      if (wasPlaying) {
        media.play().catch(e => console.error("Error resuming playback after seek:", e));
      }
    };
    
    const handleSeeking = () => {
      media.removeEventListener('seeking', handleSeeking);
    };
    
    media.addEventListener('seeked', handleSeeked);
    media.addEventListener('seeking', handleSeeking);
    
    // Direct assignment
    media.currentTime = targetTime;

    if (shouldPlayAfterJump && media.paused && !wasPlaying) {
        media.play().catch(e => console.error("Error playing after jumpToSentence:", e));
    }
  };

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.paused) {
      media.play();
    } else {
      media.pause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (mediaRef.current) {
      mediaRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (media.muted) {
      media.muted = false;
      setIsMuted(false);
      // If unmuting and volume was 0, set to a default volume (e.g., 0.5)
      if (media.volume === 0) {
        media.volume = 0.5;
        setVolume(0.5);
      }
    } else {
      media.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const mediaElement = mediaRef.current;

    if (!mediaElement) return;

    // Only attempt fullscreen for video elements
    if (mediaType === 'video') {
      if (!document.fullscreenElement) {
        mediaElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode for video: ${err.message} (${err.name})`);
          alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    } else {
      console.log('Fullscreen toggle clicked for audio, no action taken.');
      // Optionally, disable the button or provide feedback for audio
    }
  };

  const handleDownload = (url: string | undefined, defaultFilename: string) => {
    if (!url) {
      alert('Download-URL nicht verfügbar.');
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateFeedback = async () => {
    if (!transcript) {
      alert('Transkript nicht verfügbar, um Feedback zu generieren.');
      return;
    }
    setIsGeneratingFeedback(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/ai/rede-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API-Fehler: ${response.status}`);
      }

      const result = await response.json();
      setFeedback(result.feedback);
    } catch (error) {
      console.error("Fehler beim Generieren des Feedbacks:", error);
      setFeedback(`Fehler beim Generieren des Feedbacks: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  useEffect(() => {
    if (isOpen && startFeedbackGeneration && transcript && !feedback && !isGeneratingFeedback) {
      // Check for transcript to avoid alert, and ensure feedback isn't already there or being generated
      handleGenerateFeedback();
    }
  }, [isOpen, startFeedbackGeneration, transcript, feedback, isGeneratingFeedback, mediaType]);

  const drawAudioWaveform = useCallback(() => {
    // Cancel any existing animation frames (including fallback)
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    if (!canvasCtx) {
      return;
    }

    // Ensure canvas has dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = 800;
      canvas.height = 192;
    }

    // Check if Web Audio API is available
    let dataArray: Uint8Array;
    let bufferLength: number;
    const hasWebAudio = analyserRef.current && audioContextRef.current;

    if (hasWebAudio) {
      const analyser = analyserRef.current!;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const draw = () => {
      if (!canvasRef.current || !canvasCtx) {
        return;
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
      
      // Clear canvas
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set waveform color
      canvasCtx.fillStyle = 'hsl(0 100% 50%)'; // Red color
      
      if (hasWebAudio && analyserRef.current && audioContextRef.current) {
        // REAL Web Audio API visualization
        if (audioContextRef.current.state !== 'running') {
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(e => console.warn('Error resuming AudioContext:', e));
          }
        }

        // Get frequency data
        analyserRef.current.getByteFrequencyData(dataArray!);
        
        // Check if we have real audio data
        const totalEnergy = Array.from(dataArray!).reduce((sum, val) => sum + val, 0);
        if (totalEnergy > 0) {
          // Set flag that we have real audio data
          if (!hasRealAudioData) {
            setHasRealAudioData(true);
          }
          
          // Draw real frequency bars
          const barWidth = (canvas.width / bufferLength!) * 2.5;
          let x = 0;
          
          for (let i = 0; i < bufferLength!; i++) {
            const barHeight = (dataArray![i] / 255) * canvas.height * 0.8;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        }
      }
    };

    draw();
  }, []);

  const initializeAudioAnalyser = useCallback(() => {
    if (mediaType !== 'audio' || !mediaRef.current || !canvasRef.current) {
      return;
    }

    const audioEl = mediaRef.current as HTMLAudioElement;

    try {
      // Force canvas dimensions first
      const canvas = canvasRef.current;
      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = 800;
        canvas.height = 192;
      }

      // Initialize AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume AudioContext if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(e => {
          console.error('Failed to resume AudioContext:', e);
        });
      }

      // Initialize AnalyserNode if needed
      if (!analyserRef.current && audioContextRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }

      // Create MediaElementSourceNode if needed
      if (!sourceRef.current && audioContextRef.current && analyserRef.current) {
        let sourceCreated = false;
        
        // First attempt: with crossOrigin
        try {
          audioEl.crossOrigin = 'anonymous';
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioEl);
          sourceCreated = true;
        } catch (e) {
          // Second attempt: without crossOrigin
          try {
            audioEl.crossOrigin = '';
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioEl);
            sourceCreated = true;
          } catch (e2) {
            console.error('Failed to create MediaElementSourceNode:', e2);
          }
        }
        
        if (sourceCreated && sourceRef.current && analyserRef.current) {
          // Connect source -> analyser -> destination
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
      }

      // Start drawing waveform
      if (audioContextRef.current && analyserRef.current) {
        drawAudioWaveform();
        
        // Also try after a delay
        setTimeout(() => {
          drawAudioWaveform();
        }, 200);
        
        // And try again after AudioContext is definitely running
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            setTimeout(() => drawAudioWaveform(), 100);
          });
        }
      }

    } catch (error) {
      console.error('Error in initializeAudioAnalyser:', error);
      
      // Fallback visualization
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw some test bars to show the canvas is working
        ctx.fillStyle = 'hsl(0 100% 50%)'; // Red bars
        for (let i = 0; i < 20; i++) {
          const barHeight = Math.random() * canvas.height * 0.8;
          const barWidth = canvas.width / 20;
          const x = i * barWidth;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        }
        
        // Animate the fallback
        let animationCount = 0;
        const animateFallback = () => {
          if (animationCount++ < 50) { // Run for 5 seconds
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'hsl(0 100% 50%)';
            for (let i = 0; i < 20; i++) {
              const barHeight = Math.random() * canvas.height * 0.8;
              const barWidth = canvas.width / 20;
              const x = i * barWidth;
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            }
            setTimeout(animateFallback, 100);
          }
        };
        animateFallback();
      }
    }
  }, [mediaType, drawAudioWaveform]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{mediaType === 'video' ? 'Video' : 'Audio'} abspielen - {title}</DialogTitle>
          <DialogDescription>
            {/* Description removed as requested - shown on main page */}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Media Player and Information */}
          <div className="space-y-4 flex flex-col">
            {mediaType === 'video' ? (
              <video 
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={mediaUrl} // Videos are not proxied for now
                className="w-full max-h-96 rounded-lg object-contain"
              />
            ) : (
              <div className="space-y-2">
                {/* Canvas for audio visualization */}
                <canvas 
                  ref={canvasRef} 
                  width={800} 
                  height={256} 
                  className="w-full h-48 rounded-lg" 
                  style={{ maxWidth: '100%', maxHeight: '192px' }}
                /> 
                <audio 
                  ref={mediaRef as React.RefObject<HTMLAudioElement>}
                  src={proxiedMediaUrl}
                  className="w-full"
                  crossOrigin="anonymous" 
                />
              </div>
            )}
            
            {/* Custom Controls */}
            <div className="flex items-center gap-2">
              <Button onClick={togglePlayPause} variant="outline" size="icon">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              {/* Progress Bar */}
              <div 
                className="flex-1 h-2 bg-border rounded-full cursor-pointer relative"
                onClick={(e) => {
                  const media = mediaRef.current;
                  const currentDuration = duration > 0 ? duration : (media?.duration || 0);
                  if (!media || currentDuration <= 0) {
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                  const newTime = percentage * currentDuration;
                  
                  // Validate the new time is within bounds
                  if (newTime >= 0 && newTime <= currentDuration) {
                    media.currentTime = newTime;
                    // Update the current time state immediately for better UX
                    setCurrentTime(newTime);
                  }
                }}
              >
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-150"
                  style={{ width: duration > 0 ? `${Math.max(0, Math.min(100, (currentTime / duration) * 100))}%` : (mediaRef.current?.duration ? `${Math.max(0, Math.min(100, (currentTime / mediaRef.current.duration) * 100))}%` : '0%') }}
                />
                 {/* Current Time Knob */}
                <div 
                  className="absolute top-1/2 left-0 w-4 h-4 bg-accent rounded-full border-2 border-card shadow-md transform -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-150"
                  style={{ left: duration > 0 ? `${Math.max(0, Math.min(100, (currentTime / duration) * 100))}%` : (mediaRef.current?.duration ? `${Math.max(0, Math.min(100, (currentTime / mediaRef.current.duration) * 100))}%` : '0%') }}
                />
              </div>
              {/* Time indicator - moved here to be inline with controls */}
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {(() => {
                  const currentDuration = duration > 0 ? duration : (mediaRef.current?.duration || 0);
                  return currentDuration > 0 ? (
                    <>
                      {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(currentDuration / 60)}:{(Math.floor(currentDuration % 60)).toString().padStart(2, '0')}
                    </>
                  ) : (
                    "0:00 / 0:00"
                  );
                })()}
              </div>
              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button onClick={toggleMute} variant="outline" size="icon">
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-border rounded-full appearance-none cursor-pointer accent-accent"
                />
              </div>
              {/* Fullscreen Toggle - Only show for video */}
              {mediaType === 'video' && (
                <Button onClick={toggleFullscreen} variant="outline" size="icon" title="Vollbild umschalten">
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              )}
            </div>

            {/* Additional Information */}
            {speechData && (
              <div className="space-y-4 text-sm">
                {/* Merged Session and Topic Information */}
                {(speechData.electoralPeriod || speechData.session || speechData.topic) && (
                  <div className="bg-gray-100 dark:bg-muted/20 rounded-lg p-3">
                    <h4 className="font-semibold text-base mb-3">Sitzungsdetails</h4>
                    {/* Session info in one line, muted */}
                    <p className="text-muted-foreground mb-2">
                      {[
                        speechData.electoralPeriod?.label && `${speechData.electoralPeriod.label}`,
                        speechData.session?.label && `${speechData.session.label}`,
                        speechData.session?.date && new Date(speechData.session.date).toLocaleDateString('de-DE')
                      ].filter(Boolean).join(', ')}
                    </p>
                    {/* Topic on new line */}
                    {speechData.topic && (
                      <p><strong>Tagesordnungspunkt:</strong> {speechData.topic}</p>
                    )}
                  </div>
                )}

                {/* Documents */}
                {speechData.documents && speechData.documents.length > 0 && (
                  <div className="bg-gray-100 dark:bg-muted/20 rounded-lg p-3">
                    <h4 className="font-medium mb-2">Verwandte Dokumente</h4>
                    <ul className="space-y-1">
                      {speechData.documents.slice(0, 3).map((doc: any, index: number) => (
                        <li key={index} className="text-xs">
                          <span className="font-medium">{doc.title}</span>
                          {doc.abstract && <span className="text-muted-foreground"> - {doc.abstract.slice(0, 100)}...</span>}
                        </li>
                      ))}
                      {speechData.documents.length > 3 && (
                        <li className="text-xs text-muted-foreground">
                          und {speechData.documents.length - 3} weitere Dokumente
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Download and Feedback Buttons - all on one line */}
                <div className="flex flex-wrap gap-1 mt-4">
                  {speechData?.audioFileURI && (
                    <Button variant="outline" size="sm" className="text-xs px-2 py-1" onClick={() => handleDownload(speechData.audioFileURI, `${title}_audio.mp3`)}>
                      <Download className="mr-1 h-3 w-3" /> Audio
                    </Button>
                  )}
                  {speechData?.videoFileURI && (
                    <Button variant="outline" size="sm" className="text-xs px-2 py-1" onClick={() => handleDownload(speechData.videoFileURI, `${title}_video.mp4`)}>
                      <Download className="mr-1 h-3 w-3" /> Video
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs px-2 py-1"
                    onClick={handleGenerateFeedback} 
                    disabled={isGeneratingFeedback || !transcript}
                  >
                    <MessageSquareText className="mr-1 h-3 w-3" /> 
                    {isGeneratingFeedback ? "Generiere..." : "Feedback"}
                  </Button>
                </div>

                {/* Display Feedback */}
                {feedback && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/20">
                    <h4 className="font-medium mb-2">Generiertes Feedback:</h4>
                    {/* We will use a markdown renderer here later if needed */}
                    <pre className="whitespace-pre-wrap text-sm">{feedback}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" />
              <h3 className="font-semibold">Transkript</h3>
            </div>
            
            <div
              className="flex-1 overflow-y-auto rounded-lg p-4 space-y-2 min-h-0"
              ref={transcriptRef}
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0, black 3rem, black calc(100% - 3rem), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 3rem, black calc(100% - 3rem), transparent 100%)',
              }}
            >
              {transcript ? (
                sentences.map((sentence, index) => {
                  const currentSpeaker = typeof sentence === 'object' && sentence.speaker ? sentence.speaker : '';
                  const previousSpeaker = index > 0 && typeof sentences[index - 1] === 'object' && sentences[index - 1].speaker ? sentences[index - 1].speaker : '';
                  const showSpeaker = currentSpeaker && currentSpeaker !== previousSpeaker;
                  
                  return (
                    <div key={index}>
                      {showSpeaker && (
                        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-3 mb-1 first:mt-0">
                          {currentSpeaker}:
                        </div>
                      )}
                      <p
                        key={`sentence-${index}`}
                        className={`cursor-pointer transition-all duration-200 ${index === highlightedSentence ? 'opacity-100 font-medium px-2' : 'opacity-50 hover:opacity-75 p-2 rounded'}`}
                        onClick={() => jumpToSentence(index)}
                      >
                        {typeof sentence === 'string' ? sentence : sentence.text}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-muted-foreground italic">
                  Kein Transkript verfügbar für diese Rede.
                </p>
              )}
            </div>
            
            {transcript && (
              <div className="text-xs text-muted-foreground mt-2">
                Klicke auf einen Satz, um zu dieser Stelle im {mediaType === 'video' ? 'Video' : 'Audio'} zu springen.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Schließen</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MySpeechesPage() {
  const { data: session } = useSession();
  const userName = session?.user.name;
  const [speeches, setSpeeches] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, perPage: 6, page: 1, maxPages: 1 });
  const [loading, setLoading] = useState(false);
  
  // Enhanced modal states with all advanced features
  const [selectedMedia, setSelectedMedia] = useState<{
    isOpen: boolean;
    mediaType: 'video' | 'audio';
    mediaUrl: string;
    transcript: string;
    transcriptSentences?: Array<{text: string, timeStart: number, timeEnd: number, speaker?: string}>;
    title: string;
    speechData?: any;
    startFeedbackGeneration?: boolean;
  }>({
    isOpen: false,
    mediaType: 'audio',
    mediaUrl: '',
    transcript: '',
    title: '',
  });

  const fetchSpeeches = async (page: number) => {
    if (!userName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reden?name=${encodeURIComponent(userName)}&page=${page}`);
      const json = await res.json();
      if (res.ok) {
        setSpeeches(json.speeches);
        setMeta(json.meta);
      } else {
        console.error("Error fetching speeches:", json.error || json);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpeeches(meta.page);
  }, [userName, meta.page]);

  const handlePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.maxPages) {
      setMeta((m) => ({ ...m, page: newPage }));
    }
  };

  const openMediaModal = (speech: any, mediaType: 'video' | 'audio', startFeedbackGeneration = false) => {
    const mediaUrl = mediaType === 'video' ? speech.videoFileURI : speech.audioFileURI;
    
    if (!mediaUrl) {
      alert(`${mediaType === 'video' ? 'Video' : 'Audio'} nicht verfügbar für diese Rede.`);
      return;
    }

    setSelectedMedia({
      isOpen: true,
      mediaType,
      mediaUrl,
      transcript: speech.text || speech.speechContent || '',
      transcriptSentences: speech.transcriptSentences,
      title: speech.agendaItem || speech.title || `${speech.speaker} - ${new Date(speech.date || speech.session?.date || '').toLocaleDateString('de-DE')}`,
      speechData: speech,
      startFeedbackGeneration,
    });
  };

  const closeMediaModal = () => {
    setSelectedMedia(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <PageLayout 
      title="Meine Reden" 
      description={
        <span>
          Hier kannst du deine letzten Reden ansehen, anhören, nachlesen und dir Feedback geben lassen. 
          Quelle für alle Reden ist der Deutsche Bundestag (
          <a 
            href="https://www.bundestag.de/nutzungsbedingungen" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Nutzungsbedingungen
          </a>
          ).
        </span>
      }
    >
      {!userName && <p>Bitte melde dich an, um deine Reden einzusehen.</p>}

      {userName && (
        <>
          {loading && <Skeleton className="h-8 w-64 mb-4" />}

          {!loading && speeches.length === 0 && <p>Keine Reden gefunden.</p>}

          {!loading && speeches.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {speeches.map((speech: any) => (
                <Card key={speech.id}>
                  <CardHeader className="p-0">
                    <div className="relative w-full h-48 overflow-hidden">
                      <img 
                        src={speech.thumbnailURI || '/images/categories/rede.jpg'} 
                        alt={speech.agendaItem || speech.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to default image if thumbnail fails to load
                          (e.target as HTMLImageElement).src = '/images/categories/rede.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end items-start p-4">
                        <h3 className="text-white text-xl font-semibold leading-tight">{speech.agendaItem || speech.title}</h3>
                        <p className="text-white text-sm">{speech.date ? new Date(speech.date).toLocaleDateString('de-DE') : ''}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Session info (normal size) */}
                    <p className="mb-4 text-base leading-tight">
                      WP {speech.electoralPeriodNumber} | {speech.sessionNumber}. Sitzung | {speech.officialTitle}
                    </p>
                    <div className="flex gap-2">
                      {speech.videoFileURI && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openMediaModal(speech, 'video')}
                        >
                          <Play className="mr-1 h-4 w-4" /> Video
                        </Button>
                      )}
                      {speech.audioFileURI && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openMediaModal(speech, 'audio')}
                        >
                          <Music className="mr-1 h-4 w-4" /> Audio
                        </Button>
                      )}
                      {(speech.text || speech.speechContent) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openMediaModal(speech, speech.videoFileURI ? 'video' : 'audio', true)}
                        >
                          <MessageSquareText className="mr-1 h-4 w-4" /> Feedback
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {meta.maxPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePage(meta.page - 1)}
                    className={meta.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: meta.maxPages }, (_, i) => i + 1).map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      isActive={n === meta.page}
                      onClick={() => handlePage(n)}
                      className="cursor-pointer"
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePage(meta.page + 1)}
                    className={meta.page === meta.maxPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Enhanced Media Modal with all advanced features */}
      <MediaModal
        isOpen={selectedMedia.isOpen}
        onClose={closeMediaModal}
        mediaType={selectedMedia.mediaType}
        mediaUrl={selectedMedia.mediaUrl}
        transcript={selectedMedia.transcript}
        transcriptSentences={selectedMedia.transcriptSentences}
        title={selectedMedia.title}
        speechData={selectedMedia.speechData}
        startFeedbackGeneration={selectedMedia.startFeedbackGeneration}
      />
    </PageLayout>
  );
}

