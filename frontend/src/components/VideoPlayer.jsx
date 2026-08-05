import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    X,
    CheckCircle,
    Clock,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

/**
 * Helper function to extract YouTube video ID from various YouTube URLs.
 * @param {string} url - The YouTube video URL.
 * @returns {string|null} The YouTube video ID or null if not found.
 */
const getYouTubeVideoId = (url) => {
    if (!url) return null;
    let videoId = null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
    const match = url.match(regex);
    if (match && match[1]) {
        videoId = match[1];
    }
    return videoId;
};

/**
 * Extracts a Google Drive file ID from common share/view link formats,
 * e.g. drive.google.com/file/d/FILE_ID/view or drive.google.com/open?id=FILE_ID
 */
const getGoogleDriveFileId = (url) => {
    if (!url) return null;
    const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : null;
};

/**
 * Rewrites a Dropbox share link (…?dl=0) into a direct-content link (…?raw=1)
 * that a <video> tag can play, instead of Dropbox's HTML preview page.
 */
const getDropboxDirectUrl = (url) => {
    if (!url || !/dropbox\.com/i.test(url)) return url;
    try {
        const parsed = new URL(url);
        parsed.searchParams.delete('dl');
        parsed.searchParams.set('raw', '1');
        return parsed.toString();
    } catch {
        return url;
    }
};

export default function VideoPlayer({
    video,
    allLectures: incomingAllLectures, // Renamed to avoid direct mutation
    onClose,
    onComplete,
    isCompleted,
    onNext,
    onPrevious
}) {
    // Ensure allLectures is always an array to prevent .length errors
    const allLectures = incomingAllLectures || [];

    const videoRef = useRef(null);
    const modalRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [progress, setProgress] = useState(0);

    const isYouTubeVideo = video?.video_url ? getYouTubeVideoId(video.video_url) : null;
    const youtubeEmbedUrl = isYouTubeVideo ? `https://www.youtube.com/embed/${isYouTubeVideo}?autoplay=1&rel=0&modestbranding=1&controls=1` : null;

    const googleDriveFileId = !isYouTubeVideo && video?.video_url ? getGoogleDriveFileId(video.video_url) : null;
    const isGoogleDriveVideo = !!googleDriveFileId;
    const googleDriveEmbedUrl = isGoogleDriveVideo ? `https://drive.google.com/file/d/${googleDriveFileId}/preview` : null;

    // YouTube and Google Drive both render as an iframe with their own player controls,
    // so our custom play/pause/seek/volume UI only applies when neither is in play.
    const isEmbeddedPlayer = !!(isYouTubeVideo || isGoogleDriveVideo);

    // Dropbox share links (…?dl=0) point at an HTML preview page, not the video itself —
    // rewrite to a direct link so it plays through our own <video> element.
    const resolvedVideoUrl = !isEmbeddedPlayer && video?.video_url
        ? getDropboxDirectUrl(video.video_url)
        : video?.video_url;

    // Determine current lecture's index for navigation
    // Use optional chaining for video._id in case video is null/undefined
    const currentLectureIndex = allLectures.findIndex(lec => lec?._id === video?._id);
    const hasPrevious = currentLectureIndex > 0;
    const hasNext = currentLectureIndex !== -1 && currentLectureIndex < allLectures.length - 1;

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!isEmbeddedPlayer && videoElement) {
            const handleTimeUpdate = () => {
                setCurrentTime(videoElement.currentTime);
                setProgress((videoElement.currentTime / videoElement.duration) * 100);
            };

            const handleLoadedMetadata = () => {
                setDuration(videoElement.duration);
                videoElement.play().catch(error => console.warn("Autoplay prevented:", error));
            };

            const handlePlay = () => setIsPlaying(true);
            const handlePause = () => setIsPlaying(false);
            const handleEnded = () => {
                setIsPlaying(false);
                if (!isCompleted && onComplete) {
                    onComplete();
                }
            };

            videoElement.addEventListener('timeupdate', handleTimeUpdate);
            videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
            videoElement.addEventListener('play', handlePlay);
            videoElement.addEventListener('pause', handlePause);
            videoElement.addEventListener('ended', handleEnded);

            videoElement.volume = volume;
            videoElement.muted = isMuted;

            return () => {
                videoElement.removeEventListener('timeupdate', handleTimeUpdate);
                videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
                videoElement.removeEventListener('play', handlePlay);
                videoElement.removeEventListener('pause', handlePause);
                videoElement.removeEventListener('ended', handleEnded);
            };
        } else if (isEmbeddedPlayer) { // No videoRef.current check needed here, it's an iframe
            setIsPlaying(true);
            setDuration(0);
            setCurrentTime(0);
            setProgress(0);
        }

        return () => {
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            setProgress(0);
        };

    }, [video, isCompleted, onComplete, isEmbeddedPlayer, volume, isMuted]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const togglePlayPause = () => {
        if (videoRef.current && !isEmbeddedPlayer) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (videoRef.current && !isEmbeddedPlayer) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e) => {
        if (videoRef.current && !isEmbeddedPlayer) {
            const newVolume = parseFloat(e.target.value);
            setVolume(newVolume);
            videoRef.current.volume = newVolume;
        }
    };

    const handleSeek = (e) => {
        if (videoRef.current && !isEmbeddedPlayer && duration > 0) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const newTime = (clickX / width) * duration;
            
            videoRef.current.currentTime = newTime;
        }
    };

    const toggleFullscreen = () => {
        const playerContainer = modalRef.current;
        if (playerContainer) {
            if (!document.fullscreenElement) {
                if (playerContainer.requestFullscreen) {
                    playerContainer.requestFullscreen();
                } else if (playerContainer.mozRequestFullScreen) {
                    playerContainer.mozRequestFullScreen();
                } else if (playerContainer.webkitRequestFullscreen) {
                    playerContainer.webkitRequestFullscreen();
                } else if (playerContainer.msRequestFullscreen) {
                    playerContainer.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!video || (!video.video_url && !youtubeEmbedUrl)) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Video Unavailable</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        The selected video is not available or has an invalid URL.
                    </p>
                    <Button onClick={onClose} className="bg-red-500 hover:bg-red-600 text-white">
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card
                ref={modalRef}
                className="w-full max-w-6xl bg-gray-900 border-0 text-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-gray-700">
                    <CardTitle className="text-white text-lg font-semibold truncate max-w-[calc(100%-60px)]">
                        {video.title || "Lecture Video"}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-white hover:bg-gray-800 rounded-full"
                        aria-label="Close video player"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                
                <CardContent className="p-0 flex-grow relative">
                    <div className="relative pt-[56.25%] bg-black">
                        {isYouTubeVideo ? (
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={youtubeEmbedUrl}
                                title={video.title || "Lecture Video"}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                loading="lazy"
                            ></iframe>
                        ) : isGoogleDriveVideo ? (
                            <iframe
                                className="absolute top-0 left-0 w-full h-full"
                                src={googleDriveEmbedUrl}
                                title={video.title || "Lecture Video"}
                                frameBorder="0"
                                allow="autoplay"
                                allowFullScreen
                                loading="lazy"
                            ></iframe>
                        ) : (
                            <video
                                ref={videoRef}
                                src={resolvedVideoUrl}
                                className="absolute top-0 left-0 w-full h-full bg-black"
                            />
                        )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-100 p-4">
                        {!isEmbeddedPlayer && (
                            <div
                                className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-2"
                                onClick={handleSeek}
                            >
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                        {isEmbeddedPlayer && (
                             <div className="mb-2 text-center text-sm text-gray-400">
                                 Video streamed from {isYouTubeVideo ? "YouTube" : "Google Drive"}. Progress not directly tracked.
                             </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {!isEmbeddedPlayer && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={togglePlayPause}
                                        className="text-white hover:bg-gray-800"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-5 h-5" />
                                        ) : (
                                            <Play className="w-5 h-5" />
                                        )}
                                    </Button>
                                )}

                                {!isEmbeddedPlayer && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={toggleMute}
                                            className="text-white hover:bg-gray-800"
                                        >
                                            {isMuted ? (
                                                <VolumeX className="w-4 h-4" />
                                            ) : (
                                                <Volume2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>
                                )}

                                {!isEmbeddedPlayer && (
                                    <div className="flex items-center gap-1 text-sm text-gray-300">
                                        <Clock className="w-4 h-4" />
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onPrevious}
                                    className="text-white hover:bg-gray-800"
                                    disabled={!hasPrevious}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onNext}
                                    className="text-white hover:bg-gray-800"
                                    disabled={!hasNext}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </Button>

                                {!isCompleted ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onComplete}
                                        className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark Complete
                                    </Button>
                                ) : (
                                    <span className="text-green-400 flex items-center text-sm font-medium">
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Completed
                                    </span>
                                )}
                                
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleFullscreen}
                                    className="text-white hover:bg-gray-800"
                                >
                                    {isFullscreen ? (
                                        <Minimize className="w-5 h-5" />
                                    ) : (
                                        <Maximize className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
