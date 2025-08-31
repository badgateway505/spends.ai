# MVP Development Plan - Spends.ai

## Core MVP Philosophy

**Build the simplest possible working app that demonstrates core value:**
- User can capture expenses via voice
- Expenses are automatically classified with AI
- User can see their spending immediately

**Priority Order:**
1. Core functionality that delivers immediate value
2. Voice integration (key differentiator)
3. Basic data management
4. Enhanced features
5. Polish and authentication

---

## MVP Task List (Priority Order)

### **🏆 PRIORITY 1: Core Expense Tracking (Week 1)**

#### **MVP-1.1: Basic App Shell & Expense Display**
**Goal:** User can see a working app with expense list

- ✅ MVP-1.1.1 Create basic React app structure with routing
- ✅ MVP-1.1.2 Set up Supabase client connection
- ✅ MVP-1.1.3 Create main dashboard with "Today's Expenses" list
- ✅ MVP-1.1.4 Implement basic expense display component (item, amount, time)
- ✅ MVP-1.1.5 Add simple styling with Tailwind CSS

#### **MVP-1.2: Manual Expense Entry**
**Goal:** User can manually add expenses

- ✅ MVP-1.2.1 Create simple expense entry form (item, amount, currency)
- ✅ MVP-1.2.2 Implement form validation and submission
- ✅ MVP-1.2.3 Connect to Supabase database (basic CRUD)
- ✅ MVP-1.2.4 Show new expense in list immediately
- ✅ MVP-1.2.5 Add loading states and basic error handling

#### **MVP-1.3: AI Classification Integration**
**Goal:** Expenses are automatically categorized

- ✅ MVP-1.3.1 Connect to existing `/classify` Edge Function
- ✅ MVP-1.3.2 Create default groups (Food, Transport, Shopping, etc.)
- ✅ MVP-1.3.3 Show AI suggestions in review step
- ✅ MVP-1.3.4 Allow user to accept/modify suggestions
- ✅ MVP-1.3.5 Display group/category in expense list

---

### **🎤 PRIORITY 2: Voice Integration (Week 2)**

#### **MVP-2.1: Web Speech API Implementation (Primary - Free)**
**Goal:** User can record voice and see transcription in real-time

- ✅ MVP-2.1.1 Implement browser speech recognition (Web Speech API)
  - ✅ Check browser compatibility (Chrome, Safari, Edge)
  - ✅ Support EN/RU languages as specified
  - ✅ Configure continuous recognition with interim results
- ✅ MVP-2.1.2 Create voice recording button with visual feedback
  - ✅ Microphone icon with pulsing animation during recording
  - ✅ Visual waveform or sound level indicator
- ✅ MVP-2.1.3 Show live transcription during recording
  - ✅ Real-time transcript display in overlay
  - ✅ Handle interim vs final results
- ✅ MVP-2.1.4 Add voice permission handling and error states
  - ✅ Request microphone permissions gracefully
  - ✅ Handle permission denied scenarios
  - ✅ Show clear error messages for unsupported browsers
- ✅ MVP-2.1.5 Implement confidence scoring and auto-stop
  - ✅ Detect voice activity and silence
  - ✅ Auto-stop after silence period
  - ✅ Confidence indicators for transcription quality

#### **MVP-2.2: Groq Fallback STT (Secondary - Free)**
**Goal:** High-quality fallback when Web Speech API unavailable

- ✅ MVP-2.2.1 Set up Groq Whisper API integration
  - ✅ Create free Groq account and obtain API key
  - ✅ Configure Groq endpoint (https://api.groq.com/openai/v1)
  - ✅ Use whisper-large-v3 model for best quality
- ✅ MVP-2.2.2 Implement audio recording for unsupported browsers
  - ✅ Record audio in browser (WebRTC MediaRecorder)
  - ✅ Convert to supported format (mp3/wav/webm)
  - ✅ Implement file size limits (25MB max)
- ✅ MVP-2.2.3 Create audio upload and processing
  - ✅ Upload recorded audio to Supabase Edge Function
  - ✅ Process via Groq Whisper API
  - ✅ Return transcription with confidence scores
- ✅ MVP-2.2.4 Add progressive enhancement logic
  - ✅ Detect Web Speech API support
  - ✅ Fallback to Groq when primary unavailable  
  - ✅ Graceful degradation to manual entry if both fail

#### **MVP-2.3: Voice-to-Expense Flow**
**Goal:** Complete voice capture workflow

- ✅ MVP-2.3.1 Connect voice transcription to AI classification
  - ✅ Send transcript to existing `/classify` Edge Function
  - ✅ Parse expense data from natural language
  - ✅ Handle multiple languages (EN/RU)
- ✅ MVP-2.3.2 Create voice overlay UI (full-screen recording)
  - ✅ White semi-transparent fullscreen overlay
  - ✅ Centered microphone stop button
  - ✅ Live transcript display with legible font
- ✅ MVP-2.3.3 Implement voice → transcription → AI → review → save flow
  - ✅ Smooth transitions between voice and review
  - ✅ Preserve transcript data through flow
  - ✅ Handle errors at each stage gracefully
- ✅ MVP-2.3.4 Add voice recording indicators and animations
  - ✅ Pulsing microphone during recording
  - ✅ Sound wave visualizations
  - ✅ Clear start/stop visual feedback
- ✅ MVP-2.3.5 Handle voice recording errors gracefully
  - ✅ Network timeout handling
  - ✅ Microphone access issues
  - ✅ Fallback to manual entry with prefilled transcript

---

### **📊 PRIORITY 3: Essential Data Management (Week 3)**

#### **MVP-3.1: Expense History & Today View**
**Goal:** User can see and manage their expenses

- ✅ MVP-3.1.1 Implement expense list with date grouping
- ✅ MVP-3.1.2 Add "Today" vs "History" tabs/views
- ✅ MVP-3.1.3 Show daily totals and currency conversion
- ❌ MVP-3.1.4 Basic expense editing (tap to edit)
- ❌ MVP-3.1.5 Simple expense deletion with confirmation

#### **MVP-3.2: Basic Filtering & Search**
**Goal:** User can find specific expenses

- MVP-3.2.1 Add date range filter (Today, 7 days, 30 days)
- MVP-3.2.2 Implement text search in expense items
- MVP-3.2.3 Add group/category filter dropdown
- MVP-3.2.4 Show filter status and clear filters option
- MVP-3.2.5 Persist filter state across sessions

---

### **💰 PRIORITY 4: Currency & Groups Management (Week 4)**

#### **MVP-4.1: Currency Support**
**Goal:** Multi-currency support with conversion

- ✅ MVP-4.1.1 Implement THB/USD currency selector
- ✅ MVP-4.1.2 Connect to FX rates API and display conversions
- ✅ MVP-4.1.3 Show amounts in user's preferred currency
- ❌ MVP-4.1.4 Add currency settings (default currency)
- ✅ MVP-4.1.5 Handle FX rate loading and fallbacks

#### **MVP-4.2: Groups & Tags Management**
**Goal:** User can customize categories

- ✅ MVP-4.2.1 Create groups management page (CRUD operations)
- ✅ MVP-4.2.2 Allow creating new groups during expense entry
- ✅ MVP-4.2.3 Implement basic tags system
- ❌ MVP-4.2.4 Show group/tag statistics (spending by category)
- ❌ MVP-4.2.5 Add group icons and colors

---

### **📱 PRIORITY 5: Mobile & UX Polish (Week 5)**

#### **MVP-5.1: Mobile-First Design**
**Goal:** App works great on mobile devices

- MVP-5.1.1 Optimize UI for mobile touch interactions
- MVP-5.1.2 Implement swipe gestures (swipe to delete/edit)
- MVP-5.1.3 Add pull-to-refresh functionality
- MVP-5.1.4 Optimize voice recording for mobile
- MVP-5.1.5 Test and fix mobile browser compatibility

#### **MVP-5.2: Performance & Offline**
**Goal:** App is fast and works offline

- MVP-5.2.1 Add loading skeletons and optimistic updates
- MVP-5.2.2 Implement basic offline storage (localStorage)
- MVP-5.2.3 Add sync when connection restored
- MVP-5.2.4 Optimize bundle size and loading performance
- MVP-5.2.5 Add basic PWA manifest for home screen install

---

### **🔐 PRIORITY 6: Authentication (Week 6)**

#### **MVP-6.1: Simple Authentication**
**Goal:** User data is protected and persistent

- ✅ MVP-6.1.1 Implement email/password authentication
- ✅ MVP-6.1.2 Create simple login/signup forms
- ✅ MVP-6.1.3 Add authentication guards to protected routes
- ✅ MVP-6.1.4 Implement user session management
- ✅ MVP-6.1.5 Add logout functionality

#### **MVP-6.2: Social Authentication (Optional)**
**Goal:** Easy signup with social providers

- MVP-6.2.1 Add Google OAuth integration
- MVP-6.2.2 Create social login buttons
- MVP-6.2.3 Handle social auth errors and edge cases
- MVP-6.2.4 Sync user data across auth methods
- MVP-6.2.5 Add profile management basics

---

### **📈 PRIORITY 7: Basic Analytics (Week 7)**

#### **MVP-7.1: Simple Analytics Dashboard**
**Goal:** User can see spending insights

- MVP-7.1.1 Create basic analytics page
- MVP-7.1.2 Show spending totals by time period
- MVP-7.1.3 Implement simple pie chart (spending by group)
- MVP-7.1.4 Add spending trends (daily/weekly)
- MVP-7.1.5 Show top spending categories

---

## MVP Success Criteria

### **Week 1 Goal: Working Expense Tracker**
- ✅ User can manually add expenses
- ✅ Expenses are saved to database
- ✅ User can see expense list
- ✅ Basic AI classification works

### **Week 2 Goal: Voice-Powered Expense Capture**
- ✅ User can record voice to add expenses (Web Speech API)
- ⚠️ Voice transcription works in supported browsers (Groq fallback API ready, but client-side recording not implemented)
- ✅ Complete voice → AI → save workflow

### **Week 3 Goal: Expense Management**
- ✅ User can view and edit expense history
- ✅ Basic filtering and search functionality
- ✅ Daily totals and grouping

### **Week 4 Goal: Multi-Currency Support**
- ✅ THB/USD support with conversion
- ✅ Category management
- ✅ Spending by category views

### **Week 5 Goal: Mobile-Ready App**
- ✅ Works great on mobile devices
- ✅ Basic offline functionality
- ✅ PWA capabilities

### **Week 6 Goal: User Authentication**
- ✅ Secure user accounts
- ✅ Data persistence across sessions
- ✅ Social login options

### **Week 7 Goal: Complete MVP**
- ✅ Basic analytics and insights
- ✅ Production-ready deployment
- ✅ User onboarding flow

---

## Technical Decisions for MVP

### **Simplified Architecture:**
- Skip complex state management (use React state + SWR)
- Minimal UI library (Tailwind + Headless UI)
- Direct Supabase integration (no additional API layer)
- Browser-first approach (PWA later)

### **Deferred Features:**
- Complex animations and 3D backgrounds
- Advanced analytics and charts
- Bulk operations and advanced filtering
- Complex archive system
- Advanced offline capabilities
- Comprehensive testing suite

### **MVP Tech Stack:**
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (database + auth + edge functions)
- **Voice:** Web Speech API (primary) + Groq Whisper (fallback) - Both FREE
- **AI:** OpenRouter + Claude (already implemented)
- **Deployment:** Vercel/Netlify

### **Voice Recognition Strategy (Updated):**
- **Primary:** Web Speech API - Free, real-time, ~300ms latency ✅ IMPLEMENTED
- **Fallback:** Groq Whisper API - Free tier, ~500ms latency, high quality ⚠️ SERVER READY, CLIENT RECORDING NOT IMPLEMENTED
- **Languages:** EN/RU support for both options ✅ WEB SPEECH ONLY
- **Progressive Enhancement:** Graceful degradation from real-time to server-side ❌ NOT IMPLEMENTED
- **Cost:** $0 for voice recognition (keeping MVP completely free) ✅

---

## Development Strategy

1. **Start with manual expense entry** - prove the basic concept
2. **Add voice ASAP** - the key differentiator
3. **Focus on core user flow** - capture → classify → review → save
4. **Polish what works** - don't add features until core is solid
5. **Mobile-first approach** - most users will use this on mobile
6. **Authentication last** - let users try it without signup first

This MVP approach gets a working voice-powered expense tracker in users' hands within 2-3 weeks, then iteratively improves it based on real usage feedback.

---

## Voice Recognition Implementation Details

### **Web Speech API Configuration**
```typescript
// Primary voice recognition (free, real-time)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;           // Keep listening
recognition.interimResults = true;       // Show live transcript
recognition.lang = 'en-US' | 'ru-RU';   // EN/RU support
recognition.maxAlternatives = 1;         // Single best result
```

### **Groq Whisper API Setup**
```typescript
// Fallback STT service (free, high quality)
const GROQ_CONFIG = {
  baseURL: 'https://api.groq.com/openai/v1',
  model: 'whisper-large-v3',
  apiKey: process.env.GROQ_API_KEY,  // Free tier: 14,400 requests/day
  maxFileSize: 25 * 1024 * 1024,     // 25MB limit
  supportedFormats: ['mp3', 'wav', 'webm', 'ogg']
};
```

### **Progressive Enhancement Logic**
```typescript
// Voice recognition waterfall
async function startVoiceCapture() {
  if (isWebSpeechSupported()) {
    return useWebSpeechAPI();          // Real-time, free
  } else if (isAudioRecordingSupported()) {
    return useGroqWhisper();           // Server-side, free
  } else {
    return showManualEntry();          // Fallback
  }
}
```

### **Environment Variables Needed**
```bash
# Add to .env file
GROQ_API_KEY=your_groq_api_key_here        # Free at console.groq.com
VITE_VOICE_LANGUAGES=en-US,ru-RU          # Supported languages
VITE_VOICE_AUTO_STOP_TIMEOUT=3000         # Auto-stop after 3s silence
VITE_GROQ_ENABLED=true                    # Enable Groq fallback
```

### **File Structure Updates**
```
src/voice/
├── services/
│   ├── webSpeechService.ts        # Web Speech API implementation
│   ├── groqSTTService.ts          # Groq Whisper fallback
│   └── voiceManager.ts            # Progressive enhancement logic
├── components/
│   ├── VoiceOverlay.tsx           # Full-screen recording UI
│   ├── VoiceButton.tsx            # Microphone trigger
│   └── TranscriptDisplay.tsx      # Live transcript
└── hooks/
    ├── useWebSpeech.ts            # Web Speech API hook
    ├── useGroqSTT.ts              # Groq STT hook
    └── useVoiceCapture.ts         # Main voice capture hook

supabase/functions/
└── stt-groq/                     # Groq STT Edge Function
    ├── index.ts                   # Main handler
    └── groq-client.ts             # Groq API client
```
