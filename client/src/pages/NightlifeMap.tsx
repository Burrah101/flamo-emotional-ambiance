import { useState, useRef, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MapChat } from "@/components/MapChat";
import { toast } from "sonner";
import { 
  MapPin, 
  Users, 
  Flame, 
  Filter, 
  Navigation,
  Music,
  Wine,
  Sparkles,
  X,
  MessageCircle,
  Zap
} from "lucide-react";

interface NearbyUser {
  id: number;
  username: string;
  photoUrl: string | null;
  currentMood: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  isOnline: boolean;
}

interface NightlifeVenue {
  id: string;
  name: string;
  type: "club" | "bar" | "lounge" | "event";
  lat: number;
  lng: number;
  rating: number;
  crowdLevel: "low" | "medium" | "high" | "packed";
  isHot: boolean;
  address: string;
}

// Mock venues for demo - in production these would come from Google Places API
const mockVenues: NightlifeVenue[] = [
  { id: "v1", name: "Inferno Club", type: "club", lat: 37.7849, lng: -122.4094, rating: 4.5, crowdLevel: "packed", isHot: true, address: "123 Fire St" },
  { id: "v2", name: "The Ember Lounge", type: "lounge", lat: 37.7799, lng: -122.4144, rating: 4.2, crowdLevel: "medium", isHot: false, address: "456 Glow Ave" },
  { id: "v3", name: "Blaze Bar", type: "bar", lat: 37.7729, lng: -122.4064, rating: 4.7, crowdLevel: "high", isHot: true, address: "789 Spark Blvd" },
  { id: "v4", name: "Midnight Heat", type: "club", lat: 37.7879, lng: -122.4024, rating: 4.0, crowdLevel: "low", isHot: false, address: "321 Night Rd" },
  { id: "v5", name: "Velvet Flames", type: "lounge", lat: 37.7759, lng: -122.4194, rating: 4.8, crowdLevel: "high", isHot: true, address: "654 Velvet Way" },
];

// Mock nearby users for demo
const mockUsers: NearbyUser[] = [
  { id: 1, username: "FireDancer", photoUrl: null, currentMood: "Romance", latitude: 37.7819, longitude: -122.4114, distance: 0.3, isOnline: true },
  { id: 2, username: "NightOwl", photoUrl: null, currentMood: "Chill", latitude: 37.7789, longitude: -122.4074, distance: 0.5, isOnline: true },
  { id: 3, username: "VibeSeeker", photoUrl: null, currentMood: "Focus", latitude: 37.7859, longitude: -122.4134, distance: 0.7, isOnline: false },
];

const venueTypeIcons = {
  club: Music,
  bar: Wine,
  lounge: Sparkles,
  event: Flame,
};

const crowdLevelColors = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  packed: "#ef4444",
};

export default function NightlifeMap() {
  const { user } = useAuth();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  
  const [selectedVenue, setSelectedVenue] = useState<NightlifeVenue | null>(null);
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [showUsers, setShowUsers] = useState(true);
  const [showVenues, setShowVenues] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Chat state
  const [chatUser, setChatUser] = useState<NearbyUser | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unlockedUsers, setUnlockedUsers] = useState<Set<number>>(new Set());

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location access denied, using default");
          setUserLocation({ lat: 37.7749, lng: -122.4194 }); // Default to SF
        }
      );
    }
  }, []);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
    setMapError(false);
    
    // Apply dark nightlife theme to map
    map.setOptions({
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f0f1a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a2e1a" }] },
      ],
    });

    // Add markers after map is ready
    addMarkers(map);
  };

  const addMarkers = (map: google.maps.Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.map = null);
    markersRef.current = [];

    // Add venue markers
    if (showVenues) {
      const filteredVenues = activeFilter === "all" 
        ? mockVenues 
        : mockVenues.filter(v => v.type === activeFilter);

      filteredVenues.forEach(venue => {
        const markerContent = document.createElement("div");
        markerContent.innerHTML = `
          <div style="
            background: ${venue.isHot ? 'linear-gradient(135deg, #FF4500, #FF6B35)' : 'linear-gradient(135deg, #2a2a4a, #3a3a5a)'};
            padding: 8px 12px;
            border-radius: 20px;
            border: 2px solid ${venue.isHot ? '#FF4500' : '#555'};
            box-shadow: ${venue.isHot ? '0 0 20px rgba(255,69,0,0.5)' : '0 4px 12px rgba(0,0,0,0.3)'};
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
          ">
            <span style="font-size: 16px;">${venue.type === 'club' ? '🎵' : venue.type === 'bar' ? '🍸' : venue.type === 'lounge' ? '✨' : '🔥'}</span>
            <span style="color: white; font-weight: 600; font-size: 12px;">${venue.name}</span>
            ${venue.isHot ? '<span style="font-size: 12px;">🔥</span>' : ''}
          </div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: venue.lat, lng: venue.lng },
          content: markerContent,
          title: venue.name,
        });

        marker.addListener("click", () => {
          setSelectedVenue(venue);
          setSelectedUser(null);
        });

        markersRef.current.push(marker);
      });
    }

    // Add user markers
    if (showUsers) {
      mockUsers.forEach(nearbyUser => {
        const markerContent = document.createElement("div");
        markerContent.innerHTML = `
          <div style="
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: ${nearbyUser.isOnline ? 'linear-gradient(135deg, #D000FF, #FF4500)' : '#555'};
            border: 3px solid ${nearbyUser.isOnline ? '#D000FF' : '#333'};
            box-shadow: ${nearbyUser.isOnline ? '0 0 15px rgba(208,0,255,0.5)' : '0 4px 8px rgba(0,0,0,0.3)'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
          ">
            <span style="font-size: 20px;">👤</span>
            ${nearbyUser.isOnline ? `
              <div style="
                position: absolute;
                bottom: -2px;
                right: -2px;
                width: 14px;
                height: 14px;
                background: #22c55e;
                border-radius: 50%;
                border: 2px solid #1a1a2e;
              "></div>
            ` : ''}
          </div>
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: nearbyUser.latitude, lng: nearbyUser.longitude },
          content: markerContent,
          title: nearbyUser.username,
        });

        marker.addListener("click", () => {
          setSelectedUser(nearbyUser);
          setSelectedVenue(null);
        });

        markersRef.current.push(marker);
      });
    }

    // Add current user marker
    if (userLocation) {
      const myMarkerContent = document.createElement("div");
      myMarkerContent.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #FF4500;
          border: 4px solid white;
          box-shadow: 0 0 20px rgba(255,69,0,0.8), 0 0 40px rgba(255,69,0,0.4);
        "></div>
      `;

      const myMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: userLocation,
        content: myMarkerContent,
        title: "You are here",
      });

      markersRef.current.push(myMarker);
    }
  };

  // Re-add markers when filters change
  useEffect(() => {
    if (mapRef.current) {
      addMarkers(mapRef.current);
    }
  }, [showUsers, showVenues, activeFilter, userLocation]);

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-full flex items-center justify-center shadow-lg shadow-[#FF4500]/30">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Nightlife Map</h1>
              <p className="text-gray-400 text-xs">Find the heat near you</p>
            </div>
          </div>
          
          <Button
            onClick={centerOnUser}
            className="bg-[#FF4500]/20 hover:bg-[#FF4500]/30 text-[#FF4500] border border-[#FF4500]/30"
          >
            <Navigation className="w-4 h-4 mr-2" />
            My Location
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            onClick={() => setActiveFilter("all")}
            className={`flex-shrink-0 ${activeFilter === "all" 
              ? "bg-[#FF4500] text-white" 
              : "bg-[#1a1a2e] text-gray-300 border border-gray-700"}`}
            size="sm"
          >
            <Flame className="w-4 h-4 mr-1" />
            All
          </Button>
          <Button
            onClick={() => setActiveFilter("club")}
            className={`flex-shrink-0 ${activeFilter === "club" 
              ? "bg-[#FF4500] text-white" 
              : "bg-[#1a1a2e] text-gray-300 border border-gray-700"}`}
            size="sm"
          >
            <Music className="w-4 h-4 mr-1" />
            Clubs
          </Button>
          <Button
            onClick={() => setActiveFilter("bar")}
            className={`flex-shrink-0 ${activeFilter === "bar" 
              ? "bg-[#FF4500] text-white" 
              : "bg-[#1a1a2e] text-gray-300 border border-gray-700"}`}
            size="sm"
          >
            <Wine className="w-4 h-4 mr-1" />
            Bars
          </Button>
          <Button
            onClick={() => setActiveFilter("lounge")}
            className={`flex-shrink-0 ${activeFilter === "lounge" 
              ? "bg-[#FF4500] text-white" 
              : "bg-[#1a1a2e] text-gray-300 border border-gray-700"}`}
            size="sm"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Lounges
          </Button>
          
          <div className="h-6 w-px bg-gray-700 mx-2" />
          
          <Button
            onClick={() => setShowVenues(!showVenues)}
            className={`flex-shrink-0 ${showVenues 
              ? "bg-[#D000FF]/20 text-[#D000FF] border border-[#D000FF]/30" 
              : "bg-[#1a1a2e] text-gray-500 border border-gray-700"}`}
            size="sm"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Venues
          </Button>
          <Button
            onClick={() => setShowUsers(!showUsers)}
            className={`flex-shrink-0 ${showUsers 
              ? "bg-[#D000FF]/20 text-[#D000FF] border border-[#D000FF]/30" 
              : "bg-[#1a1a2e] text-gray-500 border border-gray-700"}`}
            size="sm"
          >
            <Users className="w-4 h-4 mr-1" />
            People
          </Button>
        </div>
      </div>

      {/* Map or Fallback List View */}
      <div className="pt-32 pb-24 px-4 min-h-screen">
        {/* Venues List */}
        <div className="space-y-3">
          {(activeFilter === "all" ? mockVenues : mockVenues.filter(v => v.type === activeFilter)).map((venue) => (
            <div
              key={venue.id}
              onClick={() => { setSelectedVenue(venue); setSelectedUser(null); }}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                selectedVenue?.id === venue.id
                  ? "bg-[#FF4500]/20 border-2 border-[#FF4500]"
                  : "bg-[#1a1a2e] border border-gray-800 hover:border-[#FF4500]/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  venue.isHot
                    ? "bg-gradient-to-br from-[#FF4500] to-[#FF6B35] shadow-lg shadow-[#FF4500]/30"
                    : "bg-[#2a2a4a]"
                }`}>
                  <span className="text-2xl">
                    {venue.type === 'club' ? '🎵' : venue.type === 'bar' ? '🍸' : venue.type === 'lounge' ? '✨' : '🔥'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold">{venue.name}</h3>
                    {venue.isHot && <span className="text-xs bg-gradient-to-r from-[#FF4500] to-[#FF6B35] px-2 py-0.5 rounded-full text-white">🔥 HOT</span>}
                  </div>
                  <p className="text-gray-400 text-sm">{venue.address}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-yellow-400 text-sm">★ {venue.rating}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: crowdLevelColors[venue.crowdLevel] }}
                    >
                      {venue.crowdLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Navigation className="w-5 h-5 text-[#FF4500]" />
              </div>
            </div>
          ))}
        </div>

        {/* Nearby Users Section */}
        {showUsers && (
          <div className="mt-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D000FF]" />
              People Nearby
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {mockUsers.map((nearbyUser) => (
                <div
                  key={nearbyUser.id}
                  className={`flex-shrink-0 p-4 rounded-xl transition-all w-40 ${
                    selectedUser?.id === nearbyUser.id
                      ? "bg-[#D000FF]/20 border-2 border-[#D000FF]"
                      : "bg-[#1a1a2e] border border-gray-800 hover:border-[#D000FF]/50"
                  }`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => { setSelectedUser(nearbyUser); setSelectedVenue(null); }}
                  >
                    <div className="relative w-16 h-16 mx-auto mb-2">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-[#D000FF] to-[#FF4500] flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      {nearbyUser.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                      )}
                    </div>
                    <p className="text-white font-medium text-center text-sm">{nearbyUser.username}</p>
                    <p className="text-gray-400 text-xs text-center">{nearbyUser.distance} mi</p>
                    {nearbyUser.currentMood && (
                      <p className="text-[#FF4500] text-xs text-center mt-1">{nearbyUser.currentMood}</p>
                    )}
                  </div>
                  
                  {/* Send Spark / Chat Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatUser(nearbyUser);
                      setIsChatOpen(true);
                    }}
                    className="w-full mt-3 py-2 px-3 rounded-lg bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:from-[#FF5500] hover:to-[#FF7B45] transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Send Spark
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Venue Info Card */}
      {selectedVenue && (
        <div className="absolute bottom-24 left-4 right-4 z-20">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-xl border border-[#FF4500]/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedVenue.isHot 
                    ? "bg-gradient-to-br from-[#FF4500] to-[#FF6B35] shadow-lg shadow-[#FF4500]/30" 
                    : "bg-[#2a2a4a]"
                }`}>
                  <span className="text-2xl">
                    {selectedVenue.type === 'club' ? '🎵' : selectedVenue.type === 'bar' ? '🍸' : selectedVenue.type === 'lounge' ? '✨' : '🔥'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-lg">{selectedVenue.name}</h3>
                    {selectedVenue.isHot && <span className="text-sm">🔥 HOT</span>}
                  </div>
                  <p className="text-gray-400 text-sm">{selectedVenue.address}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVenue(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span className="text-white font-medium">{selectedVenue.rating}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Crowd:</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: crowdLevelColors[selectedVenue.crowdLevel] }}
                >
                  {selectedVenue.crowdLevel.toUpperCase()}
                </span>
              </div>
              <span className="text-gray-400 text-sm capitalize">{selectedVenue.type}</span>
            </div>
            
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] hover:from-[#FF5500] hover:to-[#FF7B45] text-white font-semibold">
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </Button>
              <Button className="bg-[#D000FF]/20 hover:bg-[#D000FF]/30 text-[#D000FF] border border-[#D000FF]/30">
                <Users className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Info Card */}
      {selectedUser && (
        <div className="absolute bottom-24 left-4 right-4 z-20">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-xl border border-[#D000FF]/30 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D000FF] to-[#FF4500] flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  {selectedUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1a2e]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-bold text-lg">{selectedUser.username}</h3>
                    {selectedUser.isOnline && (
                      <span className="text-green-400 text-xs">● Online</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{selectedUser.distance} mi away</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedUser.currentMood && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-400 text-sm">Current Vibe:</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/30">
                  {selectedUser.currentMood}
                </span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setChatUser(selectedUser);
                  setIsChatOpen(true);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-gradient-to-r from-[#D000FF] to-[#FF4500] hover:from-[#E000FF] hover:to-[#FF5500] text-white font-semibold"
              >
                <Zap className="w-4 h-4 mr-2" />
                Send Spark
              </Button>
              <Button className="bg-[#FF4500]/20 hover:bg-[#FF4500]/30 text-[#FF4500] border border-[#FF4500]/30">
                View Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Map Chat Component */}
      {chatUser && (
        <MapChat
          user={chatUser}
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setChatUser(null);
          }}
          isUnlocked={unlockedUsers.has(chatUser.id)}
          onUnlockRequest={() => {
            // Simulate unlock for demo - in production would trigger Stripe payment
            toast.success(`Chat with ${chatUser.username} unlocked! 🔥`);
            setUnlockedUsers(prev => new Set([...prev, chatUser.id]));
          }}
        />
      )}

      {/* Bottom Stats Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-[#1a1a2e]/90 backdrop-blur-xl border border-gray-800 rounded-xl p-3 flex items-center justify-around">
          <div className="text-center">
            <p className="text-[#FF4500] font-bold text-lg">{mockVenues.filter(v => v.isHot).length}</p>
            <p className="text-gray-400 text-xs">Hot Spots</p>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div className="text-center">
            <p className="text-[#D000FF] font-bold text-lg">{mockUsers.filter(u => u.isOnline).length}</p>
            <p className="text-gray-400 text-xs">People Nearby</p>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div className="text-center">
            <p className="text-green-400 font-bold text-lg">{mockVenues.length}</p>
            <p className="text-gray-400 text-xs">Venues</p>
          </div>
        </div>
      </div>
    </div>
  );
}
