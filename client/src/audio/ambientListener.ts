/**
 * FLaMO Ambient Listener
 * Microphone amplitude capture using Web Audio API.
 * 
 * "Two people in the same room:
 *  Phones glow together
 *  Tempo subtly matches
 *  Presence without speech"
 * 
 * Rules:
 * - Use microphone amplitude (RMS energy) only
 * - No audio recording
 * - No storage
 * - No transmission
 * - Must degrade gracefully if permission denied
 * 
 * Used ONLY to modulate:
 * - Glow intensity
 * - Background pulse
 * - UI breathing rate
 */

export interface AmbientListenerState {
  isListening: boolean;
  hasPermission: boolean | null;
  amplitude: number;
  rmsEnergy: number;
  smoothedEnergy: number;
  peakEnergy: number;
}

/**
 * Ambient modulation values derived from RMS energy
 * These are what the UI components consume
 */
export interface AmbientModulation {
  glowIntensity: number;      // 0-1: How bright the glow should be
  pulseRate: number;          // Multiplier for pulse animation speed
  breathingRate: number;      // Multiplier for breathing animation speed
  backgroundPulse: number;    // 0-1: Background pulse intensity
}

export type AmplitudeCallback = (amplitude: number, modulation: AmbientModulation) => void;

class AmbientListener {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private animationId: number | null = null;
  private callback: AmplitudeCallback | null = null;
  
  private _isListening = false;
  private _hasPermission: boolean | null = null;
  private _amplitude = 0;
  private _rmsEnergy = 0;
  private _smoothedEnergy = 0;
  private _peakEnergy = 0;
  
  // Smoothing parameters
  private readonly SMOOTHING_FACTOR = 0.15; // Lower = smoother
  private readonly PEAK_DECAY = 0.995; // How fast peaks decay
  private readonly SENSITIVITY = 2.5; // Amplitude sensitivity multiplier
  
  get isListening(): boolean {
    return this._isListening;
  }
  
  get hasPermission(): boolean | null {
    return this._hasPermission;
  }
  
  get amplitude(): number {
    return this._amplitude;
  }
  
  get rmsEnergy(): number {
    return this._rmsEnergy;
  }
  
  get smoothedEnergy(): number {
    return this._smoothedEnergy;
  }
  
  get peakEnergy(): number {
    return this._peakEnergy;
  }
  
  /**
   * Calculate modulation values from current energy levels
   */
  getModulation(): AmbientModulation {
    const energy = this._smoothedEnergy;
    const peak = this._peakEnergy;
    
    return {
      // Glow intensity: base 0.3, scales up with energy
      glowIntensity: 0.3 + (energy * 0.7),
      
      // Pulse rate: 0.8x to 1.4x based on energy
      pulseRate: 0.8 + (energy * 0.6),
      
      // Breathing rate: 0.7x to 1.3x based on smoothed energy
      breathingRate: 0.7 + (energy * 0.6),
      
      // Background pulse: responds to peaks
      backgroundPulse: peak * 0.8,
    };
  }
  
  /**
   * Request microphone permission and start listening.
   * Returns true if successful, false otherwise.
   */
  async start(callback: AmplitudeCallback): Promise<boolean> {
    if (this._isListening) {
      return true;
    }
    
    this.callback = callback;
    
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
      
      this._hasPermission = true;
      
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5; // Less smoothing for responsiveness
      
      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      
      // Note: We do NOT connect to destination (speakers) - no audio output
      
      // Create data array for amplitude readings
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
      
      // Start amplitude monitoring
      this._isListening = true;
      this.monitorAmplitude();
      
      return true;
    } catch (error) {
      console.error('Failed to start ambient listener:', error);
      
      if ((error as Error).name === 'NotAllowedError') {
        this._hasPermission = false;
      }
      
      this.cleanup();
      return false;
    }
  }
  
  /**
   * Stop listening and release resources.
   */
  stop(): void {
    this._isListening = false;
    this._amplitude = 0;
    this._rmsEnergy = 0;
    this._smoothedEnergy = 0;
    this._peakEnergy = 0;
    
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.cleanup();
    
    if (this.callback) {
      this.callback(0, this.getModulation());
    }
  }
  
  /**
   * Monitor amplitude continuously.
   * Calculates RMS energy and derives modulation values.
   */
  private monitorAmplitude(): void {
    if (!this._isListening || !this.analyser || !this.dataArray) {
      return;
    }
    
    // Get time domain data (waveform)
    this.analyser.getByteTimeDomainData(this.dataArray);
    
    // Calculate RMS (root mean square) for amplitude
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const value = (this.dataArray[i] - 128) / 128; // Normalize to -1 to 1
      sum += value * value;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    
    // Store raw RMS energy
    this._rmsEnergy = rms;
    
    // Normalize to 0-1 range with sensitivity scaling
    this._amplitude = Math.min(1, rms * this.SENSITIVITY);
    
    // Apply exponential smoothing for stable modulation
    this._smoothedEnergy = this._smoothedEnergy * (1 - this.SMOOTHING_FACTOR) + 
                          this._amplitude * this.SMOOTHING_FACTOR;
    
    // Track peak energy with decay
    if (this._amplitude > this._peakEnergy) {
      this._peakEnergy = this._amplitude;
    } else {
      this._peakEnergy *= this.PEAK_DECAY;
    }
    
    // Call callback with amplitude and modulation values
    if (this.callback) {
      this.callback(this._amplitude, this.getModulation());
    }
    
    // Continue monitoring
    this.animationId = requestAnimationFrame(() => this.monitorAmplitude());
  }
  
  /**
   * Clean up audio resources.
   */
  private cleanup(): void {
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.dataArray = null;
  }
  
  /**
   * Check if Web Audio API is supported.
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      (window.AudioContext || (window as any).webkitAudioContext) &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }
}

// Singleton instance
export const ambientListener = new AmbientListener();

// Export class for static methods
export { AmbientListener };

export default ambientListener;
