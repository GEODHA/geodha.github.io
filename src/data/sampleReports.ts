// Sample data generator for testing heatmap and Firestore integration
// This file contains sample reports data that matches the Firestore schema

import { Timestamp } from 'firebase/firestore';

// Helper function to create Timestamp-like objects for testing
const createMockTimestamp = (date: Date = new Date()) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: 0
});

export const sampleReports = [
  {
    id: 'sample-1',
    title: 'Overflowing Garbage Bin',
    description: 'Large garbage bin overflowing near bus stop, causing hygiene issues and attracting pests.',
    category: 'garbage',
    status: 'pending',
    location: {
      latitude: 12.9716,
      longitude: 77.5946,
      address: '1st Block, Jayanagar, Bengaluru, Karnataka',
      ward: 'Jayanagar',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    photos: ['/api/placeholder/400/300'],
    authorId: 'user-1',
    authorName: 'Rajesh Kumar',
    isAnonymous: false,
    endorsements: ['user-2', 'user-3', 'user-4'],
    endorsementCount: 3,
    metadata: {
      capturedAt: createMockTimestamp(new Date('2024-02-15T09:30:00Z')),
      deviceInfo: 'Android',
      gpsAccuracy: 5.2
    },
    createdAt: createMockTimestamp(new Date('2024-02-15T09:30:00Z')),
    updatedAt: createMockTimestamp(new Date('2024-02-15T09:30:00Z'))
  },
  {
    id: 'sample-2',
    title: 'Sewage Overflow',
    description: 'Sewage water overflowing from manholes, creating unsanitary conditions.',
    category: 'sewage',
    status: 'verified',
    location: {
      latitude: 12.9822,
      longitude: 77.5982,
      address: 'BTM Layout, Bengaluru, Karnataka',
      ward: 'BTM Layout',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    photos: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    authorId: 'user-2',
    authorName: 'Priya Sharma',
    isAnonymous: false,
    endorsements: ['user-1', 'user-3', 'user-4', 'user-5', 'user-6'],
    endorsementCount: 5,
    metadata: {
      capturedAt: createMockTimestamp(new Date('2024-02-16T14:20:00Z')),
      deviceInfo: 'iPhone',
      gpsAccuracy: 3.1
    },
    createdAt: createMockTimestamp(new Date('2024-02-16T14:20:00Z')),
    updatedAt: createMockTimestamp(new Date('2024-02-16T14:25:00Z'))
  },
  {
    id: 'sample-3',
    title: 'Illegal Waste Burning',
    description: 'Construction debris being burned in open area, causing air pollution.',
    category: 'burning',
    status: 'resolved',
    location: {
      latitude: 12.9698,
      longitude: 77.6100,
      address: 'HSR Layout, Bengaluru, Karnataka',
      ward: 'HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    photos: ['/api/placeholder/400/300'],
    authorId: 'user-3',
    isAnonymous: true,
    endorsements: ['user-1', 'user-2'],
    endorsementCount: 2,
    metadata: {
      capturedAt: createMockTimestamp(new Date('2024-02-17T11:45:00Z')),
      deviceInfo: 'Android',
      gpsAccuracy: 4.7
    },
    createdAt: createMockTimestamp(new Date('2024-02-17T11:45:00Z')),
    updatedAt: createMockTimestamp(new Date('2024-02-18T16:30:00Z'))
  },
  {
    id: 'sample-4',
    title: 'Road Construction Noise',
    description: 'Heavy construction work during night hours violating noise regulations.',
    category: 'construction',
    status: 'pending',
    location: {
      latitude: 12.9644,
      longitude: 77.5937,
      address: 'Koramangala, Bengaluru, Karnataka',
      ward: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    photos: [],
    authorId: 'user-4',
    authorName: 'Vikram Joshi',
    isAnonymous: false,
    endorsements: ['user-1', 'user-2', 'user-3', 'user-5', 'user-6', 'user-7', 'user-8'],
    endorsementCount: 7,
    metadata: {
      capturedAt: createMockTimestamp(new Date('2024-02-18T22:15:00Z')),
      deviceInfo: 'Android',
      gpsAccuracy: 6.1
    },
    createdAt: createMockTimestamp(new Date('2024-02-18T22:15:00Z')),
    updatedAt: createMockTimestamp(new Date('2024-02-18T22:15:00Z'))
  },
  {
    id: 'sample-5',
    title: 'Air Pollution from Factory',
    description: 'Industrial emissions causing severe air quality issues in residential area.',
    category: 'pollution',
    status: 'verified',
    location: {
      latitude: 12.9701,
      longitude: 77.5995,
      address: 'Whitefield, Bengaluru, Karnataka',
      ward: 'Whitefield',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    photos: ['/api/placeholder/400/300', '/api/placeholder/400/300', '/api/placeholder/400/300'],
    authorId: 'user-5',
    authorName: 'Arjun Reddy',
    isAnonymous: false,
    endorsements: ['user-1', 'user-2', 'user-3', 'user-4', 'user-6', 'user-7', 'user-8', 'user-9', 'user-10'],
    endorsementCount: 9,
    metadata: {
      capturedAt: createMockTimestamp(new Date('2024-02-19T08:30:00Z')),
      deviceInfo: 'iPhone',
      gpsAccuracy: 2.8
    },
    createdAt: createMockTimestamp(new Date('2024-02-19T08:30:00Z')),
    updatedAt: createMockTimestamp(new Date('2024-02-19T08:30:00Z'))
  },
  {
    id: 'sample-6',
    title: 'Legacy Report - Archived',
    description: 'This is a sample archived report from beta testing phase.',
    category: 'other',
    status: 'archived',
    location: {
      latitude: 12.9141,
      longitude: 77.6103,
      address: 'Jayanagar 4th Block, Bengaluru, Karnataka',
      ward: 'Jayanagar',
      city: 'Bengaluru',
      state: 'Karnataka'
    },
    photos: ['/api/placeholder/400/300'],
    authorId: 'beta-user-1',
    isAnonymous: true,
    endorsements: ['user-1'],
    endorsementCount: 1,
    metadata: {
      capturedAt: createMockTimestamp(new Date('2024-01-20T15:00:00Z')),
      deviceInfo: 'Web',
      gpsAccuracy: 10.0
    },
    createdAt: createMockTimestamp(new Date('2024-01-20T15:00:00Z')),
    updatedAt: createMockTimestamp(new Date('2024-01-20T15:00:00Z'))
  }
];


export default sampleReports;
