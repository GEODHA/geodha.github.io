import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  GeoPoint,
  Timestamp,
  increment,
  QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, ensureAuth } from '@/lib/firebase';
import { transformToReport } from './dataTransformService';


export type ReportCategory = 'garbage' | 'sewage' | 'burning' | 'construction' | 'pollution' | 'other';
export type ReportStatus = 'pending' | 'verified' | 'resolved' | 'archived';

// ── BBMP / Sahaaya complaint lifecycle ────────────────────────────────────────
// Written by the mobile app's submitGrievance.ts (on submit) and the backend
// pollScheduler.ts (hourly poll against the BBMP Sahaaya portal). Lives at
// report.sahaaya on the Firestore doc; absent until a complaint is submitted.
export type SahaayaStatus = 'submitting' | 'submitted' | 'failed' | 'closed';

export interface SahaayaInfo {
  /** App-side complaint lifecycle. */
  status?: SahaayaStatus;
  /** Registered BBMP complaint ID — shown to users once assigned. */
  grievanceId?: string;
  /** When the complaint was submitted to BBMP/Sahaaya. */
  submittedAt?: Timestamp;
  /** Raw status string as last returned by the BBMP portal (debug/display). */
  lastPolledStatus?: string;
  /** Timestamp of the latest BBMP poll — source for "updated after X days". */
  lastPolledAt?: Timestamp;
  /** BBMP staff remarks text from the latest poll. */
  staffRemarks?: string;
  /** When BBMP first reported a terminal closed status (fallback for timing). */
  closedAt?: Timestamp;
}

export interface Report {
  id?: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    ward?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  photos: string[];
  authorId: string;
  authorName?: string;
  isAnonymous: boolean;
  endorsements: string[]; // Array of user IDs who endorsed
  endorsementCount: number;
  metadata: {
    capturedAt: Timestamp;
    deviceInfo?: string;
    gpsAccuracy?: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  aiClassification?: {
    detectedObjects: string[];
    confidence: number;
    suggestedCategory: string;
  };
  /** BBMP/Sahaaya complaint tracking — present once a report is submitted to BBMP. */
  sahaaya?: SahaayaInfo;
}

export interface CreateReportData {
  title: string;
  description: string;
  category: Report['category'];
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
  };
  photos: File[];
  isAnonymous: boolean;
  capturedAt: Date;
}


export default class ReportsService {
  private reportsCollection = collection(db, 'reports');

  // ... (createReport, uploadPhotos, classifyImages methods remain the same) ...
  async createReport(reportData: CreateReportData, userId: string): Promise<string> {
    try {
      // Upload photos first
      const photoUrls = await this.uploadPhotos(reportData.photos, userId);
      
      // Classify images with AI (placeholder for now)
      const aiClassification = await this.classifyImages(photoUrls);

      const report: Omit<Report, 'id'> = {
        title: reportData.title,
        description: reportData.description,
        category: reportData.category,
        status: 'pending',
        location: {
          coordinates: new GeoPoint(reportData.location.latitude, reportData.location.longitude),
          address: reportData.location.address,
          city: reportData.location.city,
          state: reportData.location.state,
          ...(reportData.location.postalCode && { postalCode: reportData.location.postalCode }),
        },
        photos: photoUrls,
        authorId: userId,
        isAnonymous: reportData.isAnonymous,
        endorsements: [],
        endorsementCount: 0,
        metadata: {
          capturedAt: Timestamp.fromDate(reportData.capturedAt),
          deviceInfo: navigator.userAgent,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(aiClassification && { aiClassification }),
      };

      const docRef = await addDoc(this.reportsCollection, report);
      
      // Update user's report count
      await this.updateUserReportCount(userId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  private async uploadPhotos(photos: File[], userId: string): Promise<string[]> {
    const uploadPromises = photos.map(async (photo, index) => {
      const timestamp = Date.now();
      const photoRef = ref(storage, `reports/${userId}/${timestamp}_${index}.jpg`);
      const snapshot = await uploadBytes(photoRef, photo);
      return getDownloadURL(snapshot.ref);
    });

    return Promise.all(uploadPromises);
  }

  private async classifyImages(photoUrls: string[]): Promise<Report['aiClassification']> {
    // TODO: Integrate with Google Cloud Vision API
    return {
      detectedObjects: ['waste', 'garbage'],
      confidence: 0.85,
      suggestedCategory: 'garbage'
    };
  }

  // OPTIMIZED: Get reports with filters
  async getReports(filters: { authorId?: string; category?: string; status?: string; limit?: number } = {}): Promise<Report[]> {
    try {
      // Ensure user is authenticated before querying
      await ensureAuth();
      
      const { authorId, category, status, limit: limitCount } = filters;
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

      if (authorId) {
        constraints.push(where('authorId', '==', authorId));
      }
      if (category && category !== 'all') {
        constraints.push(where('category', '==', category));
      }
      if (status) {
        constraints.push(where('status', '==', status));
      }
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(this.reportsCollection, ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return transformToReport(doc.id, data);
      });
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      throw error;
    }
  }

  async getReportById(reportId: string): Promise<Report | null> {
    try {
      await ensureAuth();
      
      const reportRef = doc(db, 'reports', reportId);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        const data = reportSnap.data();
        return transformToReport(reportSnap.id, data);
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching report by ID:', error);
      throw error;
    }
  }

  async updateReportStatus(reportId: string, status: Report['status']): Promise<void> {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  }

  async endorseReport(reportId: string, userId: string): Promise<void> {
    try {
      const reportRef = doc(db, 'reports', reportId);
      const report = await this.getReportById(reportId);

      if (report && !report.endorsements.includes(userId)) {
        await updateDoc(reportRef, {
          endorsements: [...report.endorsements, userId],
          endorsementCount: increment(1),
          updatedAt: Timestamp.now(),
        });
      } else if (report) {
        // Optional: Allow un-endorsing
        await updateDoc(reportRef, {
          endorsements: report.endorsements.filter(id => id !== userId),
          endorsementCount: increment(-1),
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error endorsing report:', error);
      throw error;
    }
  }

  private async updateUserReportCount(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        totalReports: increment(1),
      });
    } catch (error) {
      // It's possible the user document doesn't exist yet.
      // We can choose to create it here or handle it gracefully.
      console.warn('Could not update user report count. User doc might not exist.', error);
    }
  }

  // Fetch reports within geographical bounds
  async getReportsInBounds(bounds: { north: number; south: number; east: number; west: number }): Promise<Report[]> {
    try {
      await ensureAuth();
      
      // Get all reports and filter by bounds (for simplicity)
      // In production, you might want to use GeoFirestore for more efficient geographical queries
      const reportsQuery = query(
        this.reportsCollection,
        orderBy('createdAt', 'desc'),
        limit(100) // Adjust as needed
      );
      
      const querySnapshot = await getDocs(reportsQuery);
      const reports = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return transformToReport(doc.id, data);
      });
      
      // Filter by bounds
      const filteredReports = reports.filter(report => {
        const lat = report.location?.coordinates?.latitude;
        const lng = report.location?.coordinates?.longitude;
        return lat >= bounds.south && lat <= bounds.north && 
               lng >= bounds.west && lng <= bounds.east;
      });
      
      return filteredReports;
    } catch (error) {
      console.error('❌ Error fetching reports in bounds:', error);
      throw error;
    }
  }
}

export const reportsService = new ReportsService();