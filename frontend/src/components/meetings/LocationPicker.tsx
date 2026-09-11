import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import type { MeetingLocation } from '@/types';
import { toast } from 'sonner';

interface LocationPickerProps {
  value?: MeetingLocation;
  onChange: (location: MeetingLocation | undefined) => void;
  placeholder?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "آدرس جلسه را وارد کنید..."
}) => {
  const [manualAddress, setManualAddress] = useState(value?.type === 'manual' ? value.address : '');
  const [mapAddress, setMapAddress] = useState(value?.type === 'map' ? value.address : '');
  const [coordinates, setCoordinates] = useState(value?.coordinates);
  const [placeName, setPlaceName] = useState(value?.place_name || '');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('google_maps_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !apiKey) return;

    const initMap = () => {
      const defaultCenter = { lat: 35.6892, lng: 51.3890 };
      const center = coordinates || defaultCenter;

      const google = (window as any).google;
      mapRef.current = new google.maps.Map(mapContainerRef.current!, {
        center,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      mapRef.current.addListener('click', (e: any) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          updateMarkerPosition({ lat, lng });
          reverseGeocode({ lat, lng });
        }
      });

      if (coordinates) {
        updateMarkerPosition(coordinates);
      }
      
      setMapLoaded(true);
    };

    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=fa`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        toast.error('خطا در بارگذاری Google Maps');
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [apiKey]);

  const updateMarkerPosition = (coords: { lat: number; lng: number }) => {
    setCoordinates(coords);
    
    if (!mapRef.current) return;

    const google = (window as any).google;
    
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    markerRef.current = new google.maps.Marker({
      position: coords,
      map: mapRef.current,
      animation: google.maps.Animation.DROP,
    });

    mapRef.current.setCenter(coords);
  };

  const reverseGeocode = async (coords: { lat: number; lng: number }) => {
    const google = (window as any).google;
    const geocoder = new google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ location: coords });
      if (response.results[0]) {
        setMapAddress(response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const searchLocation = useCallback(() => {
    if (!searchQuery || !mapRef.current) return;

    const google = (window as any).google;
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        
        updateMarkerPosition(coords);
        setMapAddress(results[0].formatted_address);
        setSearchQuery('');
      } else {
        toast.error('آدرس یافت نشد');
      }
    });
  }, [searchQuery]);

  const handleManualSave = () => {
    if (!manualAddress.trim()) {
      onChange(undefined);
      return;
    }

    onChange({
      type: 'manual',
      address: manualAddress,
      place_name: placeName || undefined,
    });
    
    toast.success('آدرس ذخیره شد');
  };

  const handleMapSave = () => {
    if (!coordinates || !mapAddress) {
      toast.error('لطفاً موقعیت را روی نقشه انتخاب کنید');
      return;
    }

    onChange({
      type: 'map',
      address: mapAddress,
      coordinates,
      place_name: placeName || undefined,
      map_url: `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`,
    });
    
    toast.success('موقعیت ذخیره شد');
  };

  const handleClear = () => {
    setManualAddress('');
    setMapAddress('');
    setCoordinates(undefined);
    setPlaceName('');
    setSearchQuery('');
    
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    
    onChange(undefined);
  };

  return (
    <Card className="bg-glass border-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          انتخاب مکان جلسه
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue={value?.type || 'manual'} dir="rtl">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual">ورود دستی</TabsTrigger>
            <TabsTrigger value="map">انتخاب از نقشه</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div>
              <Label htmlFor="place-name">نام مکان (اختیاری)</Label>
              <Input
                id="place-name"
                placeholder="مثلاً: دفتر مرکزی، سالن اجتماعات"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="manual-address">آدرس</Label>
              <Input
                id="manual-address"
                placeholder={placeholder}
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleManualSave} className="flex-1">
                ذخیره آدرس
              </Button>
              <Button onClick={handleClear} variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            {!apiKey ? (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  برای استفاده از نقشه، ابتدا کلید API گوگل مپ را در تنظیمات وارد کنید
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('/admin', '_blank')}
                >
                  رفتن به تنظیمات
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="place-name-map">نام مکان (اختیاری)</Label>
                  <Input
                    id="place-name-map"
                    placeholder="مثلاً: دفتر مرکزی، سالن اجتماعات"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="جستجوی آدرس..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                  />
                  <Button onClick={searchLocation} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  ref={mapContainerRef}
                  className="w-full h-64 rounded-lg border border-border"
                />

                {coordinates && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>آدرس:</strong> {mapAddress}</p>
                    <p><strong>مختصات:</strong> {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleMapSave} className="flex-1" disabled={!coordinates}>
                    ذخیره موقعیت
                  </Button>
                  <Button onClick={handleClear} variant="outline">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
