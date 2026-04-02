'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'motion/react';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Listing {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  guests: number;
  bedrooms: number;
  amenities: string[];
  image: string;
  distance: string;
}

interface GatheringData {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  groupSize: number;
}

export default function AccommodationPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const { addToast } = useToast();
  const [tab, setTab] = useState<'book' | 'preapprove'>('book');
  const [listings, setListings] = useState<Listing[]>([]);
  const [gathering, setGathering] = useState<GatheringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const gatheringRes = await fetch(`/api/gatherings/${id}`);
        if (!gatheringRes.ok) {
          addToast({ message: 'Failed to load gathering details', type: 'error' });
          setIsLoading(false);
          return;
        }
        const gatheringData: GatheringData = await gatheringRes.json();
        setGathering(gatheringData);

        const city = encodeURIComponent(gatheringData.location);
        const guests = gatheringData.groupSize;
        const listingsRes = await fetch(`/api/airbnb/listings?city=${city}&guests=${guests}`);
        if (!listingsRes.ok) {
          addToast({ message: 'Failed to load listings', type: 'error' });
          setIsLoading(false);
          return;
        }
        const listingsData: Listing[] = await listingsRes.json();
        setListings(listingsData);
      } catch {
        addToast({ message: 'An error occurred while loading data', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const gatheringDates = gathering
    ? `${format(new Date(gathering.startDate), 'MMM d')}–${format(new Date(gathering.endDate), 'MMM d, yyyy')}`
    : 'TBD';
  const gatheringGuests = gathering?.groupSize ?? 0;
  const gatheringLocation = gathering?.location ?? 'TBD';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  };

  const handleBook = async (listing: Listing) => {
    if (!gathering) return;
    setBookingInProgress(listing.id);
    try {
      const bookRes = await fetch('/api/airbnb/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          checkIn: gathering.startDate,
          checkOut: gathering.endDate,
          guests: gathering.groupSize,
        }),
      });

      if (!bookRes.ok) {
        addToast({ message: 'Booking failed. Please try again.', type: 'error' });
        return;
      }

      const bookData = await bookRes.json();

      // Save booking to gathering record
      await fetch(`/api/gatherings/${id}/accommodation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listing.title,
          address: listing.distance,
          pricePerNight: listing.price,
          checkIn: gathering.startDate,
          checkOut: gathering.endDate,
          airbnbListingId: listing.id,
          imageUrl: listing.image,
          bookingType: tab === 'book' ? 'TEAM' : 'PRE_APPROVED',
        }),
      });

      addToast({
        message: `${tab === 'book' ? 'Booked' : 'Pre-approved'} "${listing.title}" (${bookData.confirmationCode})`,
        type: 'success',
      });
    } catch {
      addToast({ message: 'An error occurred during booking', type: 'error' });
    } finally {
      setBookingInProgress(null);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-foggy" />
          <p className="text-foggy">Loading accommodation options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <Link href={`/gathering/${id}`} className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-8">
        <ArrowLeft size={16} className="mr-2" /> Back to Hub
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-kazan mb-2">Accommodation</h1>
          <p className="text-foggy text-lg">Browse and book stays for your team in {gatheringLocation}.</p>
        </div>

        <div className="flex bg-bg-gray p-1 rounded-btn border border-light-gray">
          <button
            className={`px-6 py-2 rounded-md font-bold text-sm transition-colors ${tab === 'book' ? 'bg-white shadow-sm text-kazan' : 'text-foggy hover:text-kazan'}`}
            onClick={() => setTab('book')}
          >
            Book for Team
          </button>
          <button
            className={`px-6 py-2 rounded-md font-bold text-sm transition-colors ${tab === 'preapprove' ? 'bg-white shadow-sm text-kazan' : 'text-foggy hover:text-kazan'}`}
            onClick={() => setTab('preapprove')}
          >
            Pre-approve for Self-Booking
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[200px] p-4 border border-light-gray rounded-btn bg-white">
          <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-1">City</p>
          <p className="font-medium text-kazan">{gatheringLocation}</p>
        </div>
        <div className="flex-1 min-w-[200px] p-4 border border-light-gray rounded-btn bg-white">
          <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-1">Dates</p>
          <p className="font-medium text-kazan">{gatheringDates}</p>
        </div>
        <div className="flex-1 min-w-[200px] p-4 border border-light-gray rounded-btn bg-white">
          <p className="text-xs font-bold text-foggy uppercase tracking-wider mb-1">Guests</p>
          <p className="font-medium text-kazan">{gatheringGuests} attendees</p>
        </div>
        <Button variant="secondary" className="h-auto shrink-0">Filters</Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-foggy">
          <p className="text-lg">No listings found for {gatheringLocation}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing, i) => (
            <motion.div key={listing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-0 overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer h-full flex flex-col border-none shadow-none">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-card">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-pill text-xs font-bold flex items-center gap-1 shadow-sm">
                    <Star size={12} className="fill-kazan text-kazan" /> {listing.rating}
                  </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-kazan text-base leading-tight line-clamp-2 mb-1">{listing.title}</h3>
                  <p className="text-foggy text-sm mb-1">{listing.distance}</p>
                  <p className="text-foggy text-sm mb-3">{listing.guests} guests &bull; {listing.bedrooms} bedrooms</p>
                  <div className="mt-auto pt-4 flex justify-between items-center">
                    <p className="font-bold text-kazan"><span className="text-lg">${listing.price}</span> <span className="text-sm font-normal text-foggy">night</span></p>
                    <Button
                      size="sm"
                      variant={tab === 'book' ? 'primary' : 'secondary'}
                      onClick={() => handleBook(listing)}
                      isLoading={bookingInProgress === listing.id}
                    >
                      {tab === 'book' ? 'Book' : 'Pre-approve'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
