# FLaMO Project TODO

## Core Mode System
- [x] Global ModeState with id, name, emotionalIntent, colorProfile, motionProfile, ambientProfile, accessLevel
- [x] Mode store using Zustand for single source of truth
- [x] Mode definitions for all 6 modes
- [x] Feature flags for premium gating

## Six Core Modes
- [x] Focus mode (mint neon, tight glow, minimal motion) - FREE
- [x] Chill mode (ocean blue, slow breathing, soft gradients) - FREE
- [x] Sleep mode (violet/indigo, near-still visuals, darkness-first) - FREE
- [x] Romance mode (rose-gold glow, slight warmth, responsive ambient) - PREMIUM
- [x] Bond mode (amber/teal, synchronized rhythm, stability visuals) - PREMIUM
- [x] Afterglow mode (orchid fade, slow decay, emotional echo) - PREMIUM

## Glassmorphic UI System
- [x] Glass card component with 18-22px blur, 6-10% transparency, 20px radius
- [x] Mode-based glow effects with inner + outer glow
- [x] Sinusoidal breathing motion animations (6-8s cycles)
- [x] Soft borders with mode color accents
- [x] Ambient pulse responses

## Ambient Sync Feature
- [x] Web Audio API integration for microphone amplitude capture
- [x] No recording/storage - amplitude only
- [x] Visual pulse reactions synced to environment
- [x] Graceful degradation if permission denied
- [x] Privacy-first permission handling

## Shared Presence System
- [x] Mode invite generation and sharing
- [x] Session matching for two users
- [x] Synchronized mode entry without chat
- [x] Presence indicator component
- [x] Shared mode state coordination

## PWA Architecture
- [x] Service worker for offline capability
- [x] Web app manifest for installation
- [x] Mode memory persistence (localStorage fallback)
- [x] Native-like installation experience
- [x] Offline-first data strategy

## Premium Subscription System
- [x] $6.99/month subscription tier
- [x] Unlock Romance, Bond, Afterglow modes
- [x] Unlock shared presence features
- [x] User subscription state management
- [x] Premium UI indicators

## One-Time Premium Moments
- [x] Date night mode unlock ($1.99-$4.99)
- [x] Reunion mode unlock
- [x] Long-distance night mode unlock
- [x] Purchase flow and state management
- [x] Time-limited access handling

## Backend Integration
- [x] Database schema for users, modes, sessions, subscriptions
- [x] Mode persistence per user
- [x] Session matching for shared presence
- [x] Subscription and purchase tracking
- [x] Silent fallback to localStorage on failure

## Privacy & Security
- [x] No chat systems
- [x] No content storage
- [x] No tracking
- [x] Optional permissions only
- [x] Privacy-first architecture

## Owner Notifications
- [x] Notify on premium subscription
- [x] Notify on one-time mode unlock
- [x] Notify on critical errors
- [x] Operational monitoring dashboard

## LLM Mode Suggestions
- [x] Time of day analysis
- [x] Previous mode history tracking
- [x] Context-aware mode recommendations
- [x] Suggestion UI component

## Voice-Activated Mode Selection
- [x] Speech-to-text integration
- [x] Emotional state parsing
- [x] Hands-free mode switching
- [x] Voice command UI feedback

## Screens
- [x] Home/Landing screen
- [x] Mode selection screen
- [x] Active mode experience screen
- [x] Onboarding flow
- [x] Settings screen
- [x] Premium/subscription screen
- [x] Shared presence invite screen

## Final Polish
- [x] Responsive design for all screen sizes
- [x] Smooth transitions between modes
- [x] Loading states and skeletons
- [x] Error handling and fallbacks
- [x] Performance optimization


## Onboarding Tutorial (New Feature)
- [x] Welcome screen with app introduction
- [x] Mode explanation carousel (all 6 modes)
- [x] Ambient sync permission explanation
- [x] Shared presence feature walkthrough
- [x] Premium features preview
- [x] First mode selection prompt
- [x] Onboarding state persistence (show only once)
- [x] Skip option for returning users


## GPS-Based Preference Matching (New Feature)
- [x] User profile with preferences (interests, mode preferences, meet-up intent)
- [x] GPS location capture and storage
- [x] Proximity-based user discovery (closest first)
- [x] Preference matching algorithm
- [x] Mutual match system (both users must accept)
- [x] Custom messaging between matched users
- [x] Safety warnings before sharing personal info
- [x] Match notifications
- [x] Discovery screen with nearby users
- [x] Match history and conversation list
- [x] Privacy controls (visibility, location sharing)
- [x] Block/report functionality


## Profile Photos (New Feature)
- [x] S3 image upload endpoint
- [x] Profile photo upload UI component
- [x] Image preview and cropping
- [x] Avatar display in profile, discover, matches, and chat
- [x] Default avatar fallback

## Real-Time Presence (New Feature)
- [x] WebSocket server setup with Socket.IO
- [x] Live online/offline status updates
- [x] Typing indicators in chat
- [x] Real-time message delivery
- [x] Connection state management


## Push Notifications (New Feature)
- [x] Service worker push subscription
- [x] Backend push notification endpoint
- [x] New match notifications
- [x] New message notifications
- [x] Permission request UI

## Stripe Payment Integration (New Feature)
- [x] Stripe checkout for premium subscription ($6.99/month)
- [x] One-time moment purchases ($1.99-$4.99)
- [x] Webhook handling for payment events
- [x] Premium status management
- [x] Owner notifications on purchases

## Camera Photo Verification (New Feature)
- [x] Camera capture component
- [x] Face comparison between profile photo and live capture
- [x] Verification badge system (cyan checkmark)
- [x] Verified status in database
- [x] Display verification badge on profiles


## Final System Definition Refinements (New Feature)

### Color Psychology Update
- [x] Focus: Emerald/Teal for cognitive clarity
- [x] Chill: Blue-green for parasympathetic response
- [x] Sleep: Indigo/Violet for melatonin association
- [x] Romance: Burnt amber → rose for warmth + skin
- [x] Bond: Olive/gold for stability
- [x] Afterglow: Plum/copper for memory + warmth

### State Vector System
- [x] Add energy (0-1) to each mode
- [x] Add tempo (BPM equivalent) to each mode
- [x] Add intimacy (0-1) to each mode
- [x] Add attention (0-1) to each mode
- [x] Add openness (0-1) to each mode

### Enhanced Ambient Sync
- [x] RMS energy modulation for glow intensity
- [x] Background pulse sync to ambient sound
- [x] UI breathing rate responds to environment
- [x] Two devices glow together in same room

### UI Simplification for Pure Presence
- [x] Remove any chat-like elements
- [x] Remove profile complexity
- [x] Focus on "Join my mode" simplicity
- [x] No borders - depth via shadow + glow only
- [x] Subtle animated gradient only on hover/active

### Motion Rules
- [x] Idle: slow breathing pulse
- [x] Hover: parallax depth effect
- [x] Active: glow + tempo sync
- [x] Never flashy, never sharp
