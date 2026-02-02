/**
 * Events Page
 * Tonight's hottest events and parties
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Flame, Star, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  name: string;
  venue: string;
  address: string;
  time: string;
  image: string;
  attendees: number;
  isHot: boolean;
  category: string;
  price: string;
}

const mockEvents: Event[] = [
  {
    id: "1",
    name: "Neon Nights",
    venue: "Club Pulse",
    address: "123 Downtown Ave",
    time: "10 PM - 4 AM",
    image: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400",
    attendees: 234,
    isHot: true,
    category: "Club",
    price: "$20"
  },
  {
    id: "2",
    name: "Rooftop Sunset",
    venue: "Sky Lounge",
    address: "456 High Street",
    time: "6 PM - 12 AM",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
    attendees: 156,
    isHot: true,
    category: "Lounge",
    price: "Free"
  },
  {
    id: "3",
    name: "Latin Heat",
    venue: "Salsa Central",
    address: "789 Dance Blvd",
    time: "9 PM - 2 AM",
    image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400",
    attendees: 89,
    isHot: false,
    category: "Dance",
    price: "$15"
  },
  {
    id: "4",
    name: "Underground Beats",
    venue: "The Basement",
    address: "321 Music Lane",
    time: "11 PM - 5 AM",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
    attendees: 312,
    isHot: true,
    category: "Electronic",
    price: "$25"
  },
];

const categories = ["All", "Club", "Lounge", "Dance", "Electronic", "Live Music"];

export default function Events() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [interestedEvents, setInterestedEvents] = useState<Set<string>>(new Set());

  const filteredEvents = selectedCategory === "All" 
    ? mockEvents 
    : mockEvents.filter(e => e.category === selectedCategory);

  const toggleInterest = (eventId: string) => {
    setInterestedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setLocation("/")}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Tonight's Events
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl overflow-hidden bg-white/5 border border-white/10"
            >
              {/* Event Image */}
              <div className="relative h-40">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                
                {/* Hot Badge */}
                {event.isHot && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-bold">HOT</span>
                  </div>
                )}

                {/* Price */}
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="font-semibold">{event.price}</span>
                </div>

                {/* Category */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <Music className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-300">{event.category}</span>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{event.name}</h3>
                    <p className="text-orange-500 font-medium">{event.venue}</p>
                  </div>
                  <button
                    onClick={() => toggleInterest(event.id)}
                    className={`p-2 rounded-full transition-all ${
                      interestedEvents.has(event.id)
                        ? "bg-orange-500 text-white"
                        : "bg-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <Star className={`w-5 h-5 ${interestedEvents.has(event.id) ? "fill-current" : ""}`} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-500">
                      <Users className="w-4 h-4" />
                      <span>{event.attendees} going</span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  I'm Going
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">No events found</h3>
            <p className="text-gray-500 mt-2">Try a different category</p>
          </div>
        )}
      </div>
    </div>
  );
}
