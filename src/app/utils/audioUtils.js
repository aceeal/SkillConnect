// src/app/utils/audioUtils.js

/**
 * Audio utility to play sound notifications for calls.
 * This includes handling the audio context and playing different sounds.
 */

// Create a dictionary to store audio elements
const audioCache = {};

/**
 * Play a sound notification with optional looping
 * @param {string} sound - The sound to play ('ringtone', 'outgoing', 'connected', 'ended')
 * @param {boolean} loop - Whether the sound should loop
 * @returns {Object} - The audio element and control functions
 */
export function playNotificationSound(sound, loop = false) {
  // Map sound names to file paths
  const soundMap = {
    ringtone: '/sounds/call-ringtone.mp3',
    outgoing: '/sounds/call-outgoing.mp3',
    connected: '/sounds/call-connected.mp3',
    ended: '/sounds/call-ended.mp3',
  };

  // Get the file path
  const soundPath = soundMap[sound] || soundMap.ringtone;
  
  // Create or get audio element from cache
  let audio = audioCache[sound];
  if (!audio) {
    audio = new Audio(soundPath);
    audioCache[sound] = audio;
  }
  
  // Reset the audio in case it was previously played
  audio.currentTime = 0;
  audio.loop = loop;
  
  // Play the sound
  const playPromise = audio.play().catch((error) => {
    console.error(`Error playing sound: ${error}`);
    // User interaction might be required before audio can play
    return null;
  });
  
  // Return controls for the audio
  return {
    audio,
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
    pause: () => {
      audio.pause();
    },
    resume: () => {
      audio.play().catch((error) => {
        console.error(`Error resuming sound: ${error}`);
      });
    },
    setVolume: (volume) => {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  };
}

/**
 * Stop all playing sounds
 */
export function stopAllSounds() {
  Object.values(audioCache).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

/**
 * Preload all sound files to reduce latency when playing
 */
export function preloadSounds() {
  const sounds = ['ringtone', 'outgoing', 'connected', 'ended'];
  sounds.forEach(sound => {
    playNotificationSound(sound, false).stop();
  });
}

// Function to play a notification sound once with AutoPlay policy workaround
export function playSoundWithUserInteraction(sound) {
  const handleUserInteraction = () => {
    const soundPlayer = playNotificationSound(sound, false);
    // Remove event listeners after playing
    document.removeEventListener('click', handleUserInteraction);
    document.removeEventListener('keydown', handleUserInteraction);
    return soundPlayer;
  };
  
  // Add event listeners for user interaction
  document.addEventListener('click', handleUserInteraction, { once: true });
  document.addEventListener('keydown', handleUserInteraction, { once: true });
  
  // Return a function to cancel the listeners
  return () => {
    document.removeEventListener('click', handleUserInteraction);
    document.removeEventListener('keydown', handleUserInteraction);
  };
}
