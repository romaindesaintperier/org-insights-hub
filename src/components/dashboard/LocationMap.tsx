import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Employee } from '@/types/employee';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  employees: Employee[];
}

// Basic coordinates for common US cities and world locations
const locationCoordinates: Record<string, { lat: number; lng: number; country: string }> = {
  // US Cities
  'new york': { lat: 40.7128, lng: -74.0060, country: 'US' },
  'los angeles': { lat: 34.0522, lng: -118.2437, country: 'US' },
  'chicago': { lat: 41.8781, lng: -87.6298, country: 'US' },
  'houston': { lat: 29.7604, lng: -95.3698, country: 'US' },
  'phoenix': { lat: 33.4484, lng: -112.0740, country: 'US' },
  'philadelphia': { lat: 39.9526, lng: -75.1652, country: 'US' },
  'san antonio': { lat: 29.4241, lng: -98.4936, country: 'US' },
  'san diego': { lat: 32.7157, lng: -117.1611, country: 'US' },
  'dallas': { lat: 32.7767, lng: -96.7970, country: 'US' },
  'austin': { lat: 30.2672, lng: -97.7431, country: 'US' },
  'san francisco': { lat: 37.7749, lng: -122.4194, country: 'US' },
  'seattle': { lat: 47.6062, lng: -122.3321, country: 'US' },
  'denver': { lat: 39.7392, lng: -104.9903, country: 'US' },
  'boston': { lat: 42.3601, lng: -71.0589, country: 'US' },
  'atlanta': { lat: 33.7490, lng: -84.3880, country: 'US' },
  'miami': { lat: 25.7617, lng: -80.1918, country: 'US' },
  'washington': { lat: 38.9072, lng: -77.0369, country: 'US' },
  'dc': { lat: 38.9072, lng: -77.0369, country: 'US' },
  // World locations
  'london': { lat: 51.5074, lng: -0.1278, country: 'UK' },
  'paris': { lat: 48.8566, lng: 2.3522, country: 'France' },
  'berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany' },
  'tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  'sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia' },
  'singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  'hong kong': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong' },
  'mumbai': { lat: 19.0760, lng: 72.8777, country: 'India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, country: 'India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India' },
  'delhi': { lat: 28.6139, lng: 77.2090, country: 'India' },
  'manila': { lat: 14.5995, lng: 120.9842, country: 'Philippines' },
  'toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada' },
  'vancouver': { lat: 49.2827, lng: -123.1207, country: 'Canada' },
  'mexico city': { lat: 19.4326, lng: -99.1332, country: 'Mexico' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, country: 'Brazil' },
  'dublin': { lat: 53.3498, lng: -6.2603, country: 'Ireland' },
  'amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands' },
  'shanghai': { lat: 31.2304, lng: 121.4737, country: 'China' },
  'beijing': { lat: 39.9042, lng: 116.4074, country: 'China' },
  'krakow': { lat: 50.0647, lng: 19.9450, country: 'Poland' },
  'warsaw': { lat: 52.2297, lng: 21.0122, country: 'Poland' },
  'costa rica': { lat: 9.7489, lng: -83.7534, country: 'Costa Rica' },
};

function getLocationKey(location: string): string | null {
  const lower = location.toLowerCase().trim();
  
  // Direct match
  if (locationCoordinates[lower]) return lower;
  
  // Partial match
  for (const key of Object.keys(locationCoordinates)) {
    if (lower.includes(key) || key.includes(lower)) return key;
  }
  
  return null;
}

export function LocationMap({ employees }: LocationMapProps) {
  const locationData = useMemo(() => {
    const locationMap = new Map<string, { count: number; flrr: number; coords: { lat: number; lng: number }; displayName: string }>();
    
    employees.forEach(emp => {
      const locKey = getLocationKey(emp.location);
      if (locKey) {
        const existing = locationMap.get(locKey) || { 
          count: 0, 
          flrr: 0, 
          coords: locationCoordinates[locKey],
          displayName: emp.location 
        };
        existing.count++;
        existing.flrr += emp.flrr;
        locationMap.set(locKey, existing);
      }
    });
    
    return Array.from(locationMap.entries()).map(([key, data]) => ({
      key,
      ...data,
    })).sort((a, b) => b.count - a.count);
  }, [employees]);

  // Determine if this is primarily US or global
  const usLocations = locationData.filter(l => locationCoordinates[l.key]?.country === 'US');
  const isUSFocused = usLocations.length > locationData.length * 0.5;

  // Calculate bounds for the map
  const bounds = useMemo(() => {
    if (locationData.length === 0) return { minLat: 25, maxLat: 50, minLng: -125, maxLng: -65 }; // Default US
    
    const lats = locationData.map(l => l.coords.lat);
    const lngs = locationData.map(l => l.coords.lng);
    
    return {
      minLat: Math.min(...lats) - 5,
      maxLat: Math.max(...lats) + 5,
      minLng: Math.min(...lngs) - 10,
      maxLng: Math.max(...lngs) + 10,
    };
  }, [locationData]);

  // Simple SVG map with bubbles
  const mapWidth = 600;
  const mapHeight = 350;

  const projectToSvg = (lat: number, lng: number) => {
    // Mercator-like projection
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * mapWidth;
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * mapHeight;
    return { x, y };
  };

  const maxCount = Math.max(...locationData.map(l => l.count), 1);
  const getBubbleSize = (count: number) => Math.max(8, Math.min(35, (count / maxCount) * 35 + 8));

  const unknownCount = employees.filter(e => !getLocationKey(e.location)).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Employee Distribution by Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        {locationData.length > 0 ? (
          <>
            <div className="relative w-full aspect-[16/9] bg-secondary/30 rounded-lg overflow-hidden">
              <svg 
                viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Simple world/US outline - just a rectangle for simplicity */}
                <rect 
                  x="0" y="0" 
                  width={mapWidth} height={mapHeight} 
                  fill="hsl(var(--secondary))" 
                  opacity="0.3"
                />
                
                {/* Grid lines */}
                {[...Array(5)].map((_, i) => (
                  <line 
                    key={`h-${i}`}
                    x1="0" y1={i * (mapHeight / 4)} 
                    x2={mapWidth} y2={i * (mapHeight / 4)}
                    stroke="hsl(var(--border))" 
                    strokeWidth="1" 
                    strokeDasharray="4,4"
                    opacity="0.5"
                  />
                ))}
                {[...Array(7)].map((_, i) => (
                  <line 
                    key={`v-${i}`}
                    x1={i * (mapWidth / 6)} y1="0" 
                    x2={i * (mapWidth / 6)} y2={mapHeight}
                    stroke="hsl(var(--border))" 
                    strokeWidth="1" 
                    strokeDasharray="4,4"
                    opacity="0.5"
                  />
                ))}
                
                {/* Location bubbles */}
                {locationData.map((loc) => {
                  const { x, y } = projectToSvg(loc.coords.lat, loc.coords.lng);
                  const size = getBubbleSize(loc.count);
                  
                  return (
                    <g key={loc.key}>
                      {/* Outer glow */}
                      <circle
                        cx={x}
                        cy={y}
                        r={size + 3}
                        fill="hsl(var(--primary))"
                        opacity="0.2"
                      />
                      {/* Main bubble */}
                      <circle
                        cx={x}
                        cy={y}
                        r={size}
                        fill="hsl(var(--primary))"
                        opacity="0.7"
                        stroke="hsl(var(--primary-foreground))"
                        strokeWidth="2"
                      />
                      {/* Count label */}
                      <text
                        x={x}
                        y={y + 4}
                        textAnchor="middle"
                        fill="hsl(var(--primary-foreground))"
                        fontSize={size > 15 ? "12" : "10"}
                        fontWeight="600"
                      >
                        {loc.count}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {locationData.slice(0, 8).map((loc) => (
                <div key={loc.key} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full bg-primary" 
                    style={{ opacity: 0.7 }}
                  />
                  <span className="truncate">{loc.displayName}</span>
                  <span className="text-muted-foreground ml-auto">{loc.count}</span>
                </div>
              ))}
            </div>
            
            {unknownCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {unknownCount} employees with unrecognized locations not shown on map
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>No location data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
