"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Play, Music, FileText, Pause, Volume2, VolumeX, Maximize, Minimize, Download, MessageSquareText, Mic2, FolderOpen, CalendarDays } from "lucide-react";

// Full-featured MediaModal component (copied from meine-reden with all functionality)
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
  }, [mediaType]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  }, []);

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

    try {
      // Close any existing audio context
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          console.warn('Error closing existing AudioContext:', e);
        }
      }

      // Create new AudioContext
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume AudioContext if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Create source from media element
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {
          console.warn('Error disconnecting existing source:', e);
        }
      }
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(mediaRef.current);
      
      // Connect: source -> analyser -> destination
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      // Start drawing
      drawAudioWaveform();

    } catch (error) {
      console.error('Error in initializeAudioAnalyser:', error);
    }
  }, [mediaType, drawAudioWaveform]);

  const jumpToSentence = (sentenceIndex: number) => {
    const media = mediaRef.current;
    if (!media) return;
    
    setHighlightedSentence(sentenceIndex);
    
    const sentence = sentences[sentenceIndex];
    let targetTime = 0;

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
    
    media.addEventListener('seeked', handleSeeked);
    
    // Direct assignment
    media.currentTime = targetTime;

    if (!wasPlaying && media.paused) {
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
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
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

  const handleDownload = (url: string | undefined, defaultFilename: string) => {
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auto-generate feedback if requested
  useEffect(() => {
    if (startFeedbackGeneration && transcript && isOpen) {
      handleGenerateFeedback();
    }
  }, [startFeedbackGeneration, transcript, isOpen]);

  // Media event setup
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      setCurrentTime(media.currentTime);
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

    const handleLoadedMetadata = () => {
      if (media.duration && Number.isFinite(media.duration) && media.duration > 0) {
        setDuration(media.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (mediaType === 'audio') {
        setTimeout(() => {
          initializeAudioAnalyser();
        }, 200);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    // Add event listeners
    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [mediaUrl, transcriptSentences, duration, sentences.length, mediaType]);

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
              {/* Time indicator */}
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

                {/* Download and Feedback Buttons */}
                <div className="flex gap-2 flex-wrap text-xs">
                  {speechData.videoFileURI && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(speechData.videoFileURI, `${speechData.speaker}_${speechData.date}_video.mp4`)}
                      className="flex-1 min-w-0"
                    >
                      <Download className="mr-1 h-3 w-3" /> Video
                    </Button>
                  )}
                  {speechData.audioFileURI && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownload(speechData.audioFileURI, `${speechData.speaker}_${speechData.date}_audio.mp3`)}
                      className="flex-1 min-w-0"
                    >
                      <Download className="mr-1 h-3 w-3" /> Audio
                    </Button>
                  )}
                  {transcript && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateFeedback}
                      disabled={isGeneratingFeedback}
                      className="flex-1 min-w-0"
                    >
                      <MessageSquareText className="mr-1 h-3 w-3" />
                      {isGeneratingFeedback ? 'Generiert...' : 'Feedback'}
                    </Button>
                  )}
                </div>

                {/* Generated Feedback */}
                {(feedback || isGeneratingFeedback) && (
                  <div className="bg-gray-100 dark:bg-muted/20 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <h4 className="font-medium mb-2 flex items-center">
                      <MessageSquareText className="mr-1 h-4 w-4" />
                      AI-Feedback zur Rede
                    </h4>
                    {isGeneratingFeedback ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">Feedback wird generiert...</span>
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-wrap">{feedback}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transcript Section with scroll shadow */}
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

interface LatestSpeechCardProps {
  className?: string;
}

export function LatestSpeechCard({ className }: LatestSpeechCardProps) {
  const { data: session } = useSession();
  const userName = session?.user.name;
  const [latestSpeech, setLatestSpeech] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
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

  const fetchLatestSpeech = async () => {
    if (!userName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/reden?name=${encodeURIComponent(userName)}&page=1`);
      const json = await res.json();
      
      if (res.ok && json.speeches && json.speeches.length > 0) {
        setLatestSpeech(json.speeches[0]); // Get the first (newest) speech
      } else {
        setError('Keine Reden gefunden');
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Fehler beim Laden der Rede');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestSpeech();
  }, [userName]);

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

  if (!userName) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic2 className="w-5 h-5" />
            <span>Meine letzte Rede</span>
          </CardTitle>
          <CardDescription>Bitte melde dich an, um deine Reden zu sehen.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic2 className="w-5 h-5" />
            <span>Meine letzte Rede</span>
          </CardTitle>
          <CardDescription>Lade neueste Rede...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !latestSpeech) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic2 className="w-5 h-5" />
            <span>Meine letzte Rede</span>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {error || 'Keine Reden verfügbar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/meine-reden">
            <Button variant="outline" className="w-full">
              <FolderOpen className="w-4 h-4 mr-2" />
              Alle Reden durchsuchen
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`shadow-lg ${className}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Mic2 className="w-5 h-5" />
            <span>Meine letzte Rede</span>
          </CardTitle>
          <CardDescription className="overflow-hidden text-ellipsis">
            {latestSpeech.agendaItem || latestSpeech.title || 'Parlamentsrede'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Speech Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>
                  {latestSpeech.date 
                    ? new Date(latestSpeech.date).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Datum unbekannt'
                  }
                </span>
              </div>
              {latestSpeech.session && (
                <Badge variant="outline" className="text-xs">
                  {latestSpeech.session.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {latestSpeech.videoFileURI && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openMediaModal(latestSpeech, 'video')}
                className="flex-1"
              >
                <Play className="mr-1 h-4 w-4" /> Video
              </Button>
            )}
            {latestSpeech.audioFileURI && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openMediaModal(latestSpeech, 'audio')}
                className="flex-1"
              >
                <Music className="mr-1 h-4 w-4" /> Audio
              </Button>
            )}
          </div>

          {latestSpeech.text || latestSpeech.speechContent ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => openMediaModal(latestSpeech, latestSpeech.videoFileURI ? 'video' : 'audio', true)}
              className="w-full"
            >
              <MessageSquareText className="mr-1 h-4 w-4" /> Feedback generieren
            </Button>
          ) : null}

          {/* Link to all speeches */}
          <div className="pt-2 border-t">
            <Link href="/meine-reden">
              <Button variant="ghost" size="sm" className="w-full">
                <FolderOpen className="w-4 h-4 mr-2" />
                Alle Reden ansehen
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Media Modal */}
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
    </>
  );
} 