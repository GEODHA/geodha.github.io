// TODO: Heatmap + Ward Overlay Visualization Plan
// -------------------------------------------------
// Visualization Goals:
// 1. Show a point-based HEATMAP layer (gradient: green → yellow → red)
//    - Data source: Firestore reports (latitude, longitude, endorsementCount, status).
//    - Weight function: More endorsements = stronger heat intensity.
// 2. Overlay WARD BOUNDARIES (GeoJSON polygons).
//    - Initially outlines only (thin border, semi-transparent fill).
//    - Later optional choropleth mode: fill wards with color intensity based on report density.
// 3. UX Toggles (top-right controls):
//    - [Heatmap] <-> [Cluster Pins] switch
//    - [Show Ward Boundaries] toggle
//    - (Future) [Ward Summary] toggle for choropleth view
// 4. Mobile UI: 
//    - Heatmap fills ~50% of screen height
//    - Ward outlines visible at all zoom levels
//    - Tapping inside a ward (future) could show summary of reports
// 5. Desktop UI:
//    - Heatmap + ward outlines visible by default
//    - Sidebar shows either report details (when pin selected) or ward summary (future).
//
// Notes:
// - Until updated ward maps are available, keep placeholder GeoJSON import disabled.
// - Store ward GeoJSON in a `/data/wards.json` file when ready.
// - Implementation Reference: Leaflet/Mapbox heatmap layers + polygon overlays.


import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MapPin, Filter, ThumbsUp, Loader2, ServerCrash, Layers, Grid, Map, ToggleLeft, ToggleRight } from "lucide-react";
import PhotoCarousel from "@/components/PhotoCarousel";
import MapErrorBoundary from "@/components/MapErrorBoundary";
import { reportsService, Report } from "@/services/reportsService";
import { initializeAuth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import OpenStreetMap, { type MapReport } from "@/components/OpenStreetMap";
import { categoryColors, categoryColorHex } from "@/data/mockData";
import { formatDistanceToNow } from 'date-fns';
import Dashboard from "./Dashboard";
import { useFetchReports } from "@/hooks/useFetchReports";
import { useLocation } from "react-router-dom";
import { getDisplayDate, getReportsListFromChartDate } from "@/lib/utils";
import { secondaryWasteDisplayName, SecondaryWasteType, } from "@/data/wasteCategories";
import { filterReportsBySecondaryCategory } from "@/lib/wasteCategorizationUtils";

// ⚠️ DEVELOPMENT MODE FLAG ⚠️
// Set to true to use sample data for heatmap testing
// Set to false to use live Firebase data
const USE_SAMPLE_DATA_FOR_TESTING = false;

// Memoize status colors to prevent object recreation
const statusColors = {
  pending: 'hsl(0 84% 60%)', // red
  verified: 'hsl(45 93% 47%)', // yellow  
  resolved: 'hsl(142 71% 45%)', // green
  archived: 'hsl(215 16% 47%)' // gray
}

const getStatusColor = (status: string) => {
  return statusColors[status as keyof typeof statusColors] || statusColors.pending;
};


const categoryOptions = ['all', 'garbage', 'sewage', 'burning', 'construction', 'pollution', 'other'];


const MapReports = () => {
  const isMobile = useIsMobile();
  const { reports: fetchedReports, loading, error } = useFetchReports(USE_SAMPLE_DATA_FOR_TESTING);
  const location = useLocation();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedDateFromChart, setSelectedDateFromChart] = useState<string>("")
  const [secondaryCategoryFilter, setSecondaryCategoryFilter] = useState<SecondaryWasteType | null>(null);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('map');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Initialize Firebase authentication when MapReports component loads
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth();
        setAuthReady(true);
        console.log('🔥 Firebase authentication initialized for map page');
      } catch (error) {
        console.error('Failed to initialize Firebase auth:', error);
        setAuthReady(true); // Still proceed, will fall back to sample data
      }
    };
    
    initAuth();
  }, []);

  useEffect(() => {
    // Only fetch reports after auth is ready
    if (!authReady || loading) return;
    
    setReports(fetchedReports);
    setFilteredReports(fetchedReports);

  }, [authReady, loading, fetchedReports]); // Only run when auth is ready


  const scrollToReportsList = useCallback(() => {
    const element = document.getElementById('reports-tabs-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const seeReports = useCallback(() => {
    setActiveView('reports'); // Switch to reports tab to show the filtered list
    scrollToReportsList();
  }, [scrollToReportsList]);

  useEffect(() => {
    // Check if we have a date range passed from the dashboard
    if (location.state && (location.state).dateRangeSelected) {
      const dateRangeSelected = (location.state).dateRangeSelected;
      setSelectedDateFromChart(dateRangeSelected);
      setSecondaryCategoryFilter(null)
      const filteredReports = getReportsListFromChartDate(dateRangeSelected, reports);
      setFilteredReports(filteredReports);
      seeReports();
    } else if (location.state && (location.state).secondaryCategoryFilter) {
      const secondaryCategoryFilter = location.state?.secondaryCategoryFilter as SecondaryWasteType;
      const result = filterReportsBySecondaryCategory(reports, secondaryCategoryFilter)
      setSecondaryCategoryFilter(secondaryCategoryFilter);
      setSelectedDateFromChart("")
      setFilteredReports(result);
      seeReports();
    }
  }, [location, reports, seeReports]);

  function resetDateFilterFromChart() {
    setSelectedDateFromChart("");
    setSecondaryCategoryFilter(null)
    setFilteredReports(reports);
  }

  // useEffect(() => {
  //   if (categoryFilter === 'all') {
  //     setFilteredReports(reports);
  //   } else {
  //     setFilteredReports(reports.filter(report => report.category === categoryFilter));
  //   }
  // }, [categoryFilter, reports]);

  // Memoize expensive computations
  const mapReports: MapReport[] = useMemo(() =>
    filteredReports
      .map(report => ({
        report,
        latitude: report.location?.latitude,
        longitude: report.location?.longitude,
      }))
      .filter(({ latitude, longitude }) =>
        latitude != null &&
        longitude != null &&
        !isNaN(latitude) &&
        !isNaN(longitude)
      )
      .map(({ report, latitude, longitude }) => ({
        id: report.id!,
        position: [latitude, longitude],
        title: report.title,
        category: report.category,
        status: report.status as 'pending' | 'verified' | 'resolved' | 'archived',
        description: report.description,
        photos: report.photos,
        endorsementCount: report.endorsementCount,
        ward: report.location.ward || report.location.address?.split(',')[0], // Extract ward from address
        createdAt: report.createdAt.toDate().toISOString(),
      })),
    [filteredReports]
  );

  // Memoize expensive computations
  // const mapReports: MapReport[] = useMemo(() =>
  //   filteredReports
  //     .filter(report =>
  //       report.location?.coordinates?.latitude &&
  //       report.location?.coordinates?.longitude &&
  //       !isNaN(report.location.coordinates.latitude) &&
  //       !isNaN(report.location.coordinates.longitude)
  //     )
  //     .map(report => ({
  //       id: report.id!,
  //       position: [report.location.coordinates.latitude, report.location.coordinates.longitude],
  //       title: report.title,
  //       category: report.category,
  //       status: report.status as 'pending' | 'verified' | 'resolved' | 'archived',
  //       description: report.description,
  //       photos: report.photos,
  //       endorsementCount: report.endorsementCount,
  //       ward: report.location.ward || report.location.address?.split(',')[0], // Extract ward from address
  //       createdAt: report.createdAt.toDate().toISOString(),
  //     })),
  //   [filteredReports]
  // );


  // Memoized callback for report click handling
  const handleReportClick = useCallback((reportId: string) => {
    setSelectedReportId(reportId);
    if (isMobile) {
      setSheetOpen(true);
    }
  }, [isMobile]);

  // Memoized callback for view details
  const handleViewDetails = useCallback(() => {
    setActiveView('map');
  }, []);

  // Debug logging
  console.log('MapReports - Total reports:', reports.length);
  console.log('MapReports - Filtered reports:', filteredReports.length);
  console.log('MapReports - Map reports:', mapReports.length);
  console.log('MapReports - Show heatmap:', showHeatmap);

  const selectedReportData = useMemo(() =>
    reports.find(r => r.id === selectedReportId),
    [reports, selectedReportId]
  );

  const ReportDetailsContent = ({ report }: { report: Report }) => (
    <div className="space-y-4">
      {report.status !== 'archived' && report.photos.length > 0 && (
        <PhotoCarousel photos={report.photos} title={report.title} />
      )}
      
      <div>
        <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
        
        {/* Add ward info to description if available */}
        {report.location.ward && (
          <p className="text-sm text-muted-foreground mb-3">Ward: {report.location.ward}</p>
        )}
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge 
            style={{ backgroundColor: getStatusColor(report.status) }} 
            className="text-white"
          >
            {report.status}
          </Badge>
          <Badge 
            style={{ backgroundColor: categoryColorHex[report.category] }} 
            className="text-white"
          >
            {report.category}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Reported {formatDistanceToNow(report.createdAt.toDate(), { addSuffix: true })}</p>
          <p>{report.endorsementCount} endorsements</p>
          {report.status === 'archived' && report.photos.length > 0 && (
            <p className="text-xs text-amber-600">📷 {report.photos.length} image(s) archived</p>
          )}
        </div>
      </div>
    </div>
  );

  // Show Firebase authentication loading screen
  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading GEODHA...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading community data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center py-12 text-destructive">
          <ServerCrash className="h-10 w-10 mb-4" />
          <p className="font-semibold">{error}</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {USE_SAMPLE_DATA_FOR_TESTING && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                <strong>Development Mode:</strong> Using sample data for heatmap testing.
                Set <code>USE_SAMPLE_DATA_FOR_TESTING = false</code> in MapReports.tsx to restore live Firebase data.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="container px-4 py-8 space-y-6">
        {/*                                      */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Community Reports & Map</h1>
            <p className="text-muted-foreground">Explore civic issues reported by the community</p>
          </div>
          {/*<div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>*/}
        </div>

        <Tabs id="reports-tabs-section" value={activeView} onValueChange={setActiveView} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Reports List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-0">
            {isMobile ? (
              // Mobile Layout
              <div className="space-y-4">
                {/* Map Container - Fixed height for mobile */}
                <div className="relative h-[50vh] border rounded-lg overflow-hidden shadow-soft bg-background">
                  {/* Map Controls */}
                  <div className="absolute top-2 right-2 z-[1000] flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className="bg-background/90 backdrop-blur-sm shadow-md"
                      aria-label={showHeatmap ? "Show cluster pins" : "Show heatmap"}
                    >
                      {showHeatmap ? (
                        <>
                          <Grid className="h-3 w-3 mr-1" />
                          Pins
                        </>
                      ) : (
                        <>
                          <Layers className="h-3 w-3 mr-1" />
                          Heat
                        </>
                      )}
                    </Button>
                  </div>

                  <MapErrorBoundary>
                    <OpenStreetMap
                      reports={mapReports}
                      onReportClick={handleReportClick}
                      selectedReportId={selectedReportId}
                      showHeatmap={showHeatmap}
                      enableClustering={!showHeatmap}
                      zoom={isMobile ? 11 : undefined} // Optimal mobile zoom for Bangalore metro area
                      className="h-full w-full relative z-0"
                    />
                  </MapErrorBoundary>
                </div>

                {/* Mobile Report Hint */}
                {!selectedReportData && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap a pin on the map to view report details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              // Desktop Layout
              <div className="flex flex-row h-[calc(100vh-300px)] border rounded-lg overflow-hidden shadow-soft">
                {/* Desktop Sidebar */}
                <div className="w-96 bg-background border-r overflow-y-auto">
                  {selectedReportData ? (
                    <Card className="border-0 rounded-none h-full">
                      <CardHeader>
                        <CardTitle>{selectedReportData.title}</CardTitle>
                        <CardDescription>{selectedReportData.location.address || selectedReportData.location.ward || '-'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ReportDetailsContent report={selectedReportData} />
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full text-muted-foreground">
                      <MapPin className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">Select a Report</p>
                      <p className="text-sm">Click on a map pin to see report details</p>
                    </div>
                  )}
                </div>

                {/* Desktop Map Area */}
                <div className="flex-1 relative h-full">
                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className="bg-background/90 backdrop-blur-sm"
                      aria-label={showHeatmap ? "Show cluster pins" : "Show heatmap"}
                    >
                      {showHeatmap ? (
                        <>
                          <Grid className="h-4 w-4 mr-2" />
                          Pins
                        </>
                      ) : (
                        <>
                          <Layers className="h-4 w-4 mr-2" />
                          Heat
                        </>
                      )}
                    </Button>
                  </div>

                  <MapErrorBoundary>
                    <OpenStreetMap
                      reports={mapReports}
                      onReportClick={handleReportClick}
                      selectedReportId={selectedReportId}
                      showHeatmap={showHeatmap}
                      enableClustering={!showHeatmap}
                      zoom={isMobile ? 9 : undefined} // Optimal mobile zoom for Bangalore metro area
                      className="h-full w-full"
                    />
                  </MapErrorBoundary>
                </div>
              </div>
            )}

            {/* Mobile Bottom Sheet */}
            {isMobile && selectedReportData && (
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="bottom" className="h-[65vh] overflow-y-auto z-[2000]">
                  <SheetHeader className="text-left mb-4">
                    <SheetTitle className="text-lg">{selectedReportData.title}</SheetTitle>
                    <SheetDescription className="text-sm">
                      {selectedReportData.location.address || selectedReportData.location.ward || '-'}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="pb-4">
                    <ReportDetailsContent report={selectedReportData} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Community Reports</CardTitle>
                <CardDescription>
                  {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
                  {selectedDateFromChart !== '' && ` found in ${getDisplayDate(selectedDateFromChart)}`}
                  {secondaryCategoryFilter !== null && ` had "${secondaryWasteDisplayName[secondaryCategoryFilter]}" in trash`}
                  {categoryFilter !== 'all' && ` in "${categoryFilter}"`}
                </CardDescription>
                {
                  selectedDateFromChart !== "" || secondaryCategoryFilter !== null ? <CardDescription>
                    <Button
                      className="md:flex items-center space-x-2"
                      disabled={selectedDateFromChart === "" && secondaryCategoryFilter === null}
                      variant="hero"
                      size="sm"
                      onClick={resetDateFilterFromChart}>
                      Show All Reports
                    </Button>
                  </CardDescription> : null
                }

              </CardHeader>
              <CardContent className="scroll-container">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                    <p className="text-muted-foreground">
                      {categoryFilter === 'all' 
                        ? "No reports have been submitted yet." 
                        : `No reports found for the category "${categoryFilter}".`
                      }
                    </p>
                  </div>
                ) : (
                  <div 
                    className={`grid gap-6 report-grid transform-gpu ${isMobile ? 'grid-cols-1 mobile-scroll-optimized' : 'md:grid-cols-2 lg:grid-cols-3'}`}
                    style={{
                      // Optimize for hardware acceleration
                      transform: 'translateZ(0)',
                      willChange: 'scroll-position'
                    }}
                  >
                    {filteredReports.map((report) => (
                      <Card 
                        key={report.id} 
                        className="overflow-hidden report-card transform-gpu" // Hardware acceleration
                        style={{
                          // Optimize rendering
                          contentVisibility: 'auto',
                          containIntrinsicSize: '300px'
                        }}
                      >
                        <div className="relative">
                          {report.status !== 'archived' && report.photos.length > 0 && (
                            <img
                              src={report.photos[0]}
                              alt={report.title}
                              className="w-full h-48 object-cover"
                              loading="lazy"
                              decoding="async" // Improve decode performance
                              style={{
                                contentVisibility: 'auto',
                                containIntrinsicSize: '1px 192px'
                              }}
                            />
                          )}
                          {report.status === 'archived' && report.photos.length > 0 && (
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                              <div className="text-center text-gray-500">
                                <div className="text-2xl mb-2">📷</div>
                                <div className="text-sm">{report.photos.length} archived image(s)</div>
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-lg leading-tight line-clamp-2">{report.title}</h3>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge 
                              style={{ backgroundColor: getStatusColor(report.status) }} 
                              className="text-white text-xs"
                            >
                              {report.status}
                            </Badge>
                            <Badge 
                              style={{ backgroundColor: categoryColorHex[report.category] }} 
                              className="text-white text-xs"
                            >
                              {report.category}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {report.description}
                          </p>

                          <div className="text-xs text-muted-foreground space-y-1">
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{report.location.address || report.location.ward || '-'}</span>
                            </p>
                            <p>
                              Reported {formatDistanceToNow(report.createdAt.toDate(), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <ThumbsUp className="h-4 w-4" />
                              {report.endorsementCount}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                handleReportClick(report.id!);
                                handleViewDetails()
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MapReports;
