// Key civic contacts for the Neighbourhood Scorecard.
//
// Corporation officials: "City Corporation Contact Details" published on the
// BBMP updates portal (as on Dec 2025), compiled by the kaun-city/kaun project
// (MIT). Officials get transferred often — corrections welcome via a PR or
// contact@geodha.org.

import type { CorporationKey } from '@/lib/wards';

export const CONTACTS_AS_OF  = 'December 2025';
export const CONTACTS_SOURCE = 'https://updates.bbmpgov.in/v1/api/file/835746023571-City%20Corp%20Contact%20Details.pdf';

export interface Official { role: string; name: string; phone: string }

export interface CorporationInfo {
  name:         string;
  email:        string;
  controlRoom:  string[];
  office:       string;
  commissioner: Official;
  /** Joint Commissioner per zone ("Zone1" | "Zone2"). */
  jointCommissioner: Record<string, Official>;
  healthOfficer: Official;
}

export const CORPORATIONS: Record<CorporationKey, CorporationInfo> = {
  Central: {
    name: 'Bengaluru Central City Corporation',
    email: 'commissionerbccc@gmail.com',
    controlRoom: ['080-22975803', '94806 85702'],
    office: '10th Floor, Multipurpose P.U. Building, Mahatma Gandhi Road, Bengaluru 560001',
    commissioner: { role: 'Commissioner', name: 'Rajendra Cholan P, IAS', phone: '94485 73007' },
    jointCommissioner: {
      Zone1: { role: 'Joint Commissioner, Zone 1', name: 'Ranganath K, KAS', phone: '96206 30581' },
      Zone2: { role: 'Joint Commissioner, Zone 2', name: 'Hemanth Sharan, KMAS', phone: '98458 16773' },
    },
    healthOfficer: { role: 'Health Officer', name: 'Dr. Shivakumar', phone: '94809 73395' },
  },
  East: {
    name: 'Bengaluru East City Corporation',
    email: 'commissioner.becc@gmail.com',
    controlRoom: ['080-28512300', '080-28512301', '94806 85706'],
    office: 'RHB Colony, opp. Phoenix Mall, Whitefield Main Road, Mahadevapura, Bengaluru 560048',
    commissioner: { role: 'Commissioner', name: 'Ramesh D S, IAS', phone: '87627 08901' },
    jointCommissioner: {
      Zone1: { role: 'Joint Commissioner, Zone 1', name: 'Dr. Dakshayini, KAS', phone: '98459 25372' },
      Zone2: { role: 'Joint Commissioner, Zone 2', name: 'Smt. Sudha, KAS', phone: '99015 75664' },
    },
    healthOfficer: { role: 'Health Officer', name: 'Dr. Savitha', phone: '94806 88560' },
  },
  North: {
    name: 'Bengaluru North City Corporation',
    email: 'bengalurunorthcitycorporation@gmail.com',
    controlRoom: ['080-22975936', '080-28636671', '94806 85705'],
    office: 'Byatarayanapura, Amruthahalli Main Road, Ballari Road, Bengaluru 560092',
    commissioner: { role: 'Commissioner', name: 'Pommala Sunil Kumar, IAS', phone: '94806 84949' },
    jointCommissioner: {
      Zone1: { role: 'Joint Commissioner, Zone 1', name: 'Mohammed Naeem Momin, KAS', phone: '96207 57186' },
      Zone2: { role: 'Joint Commissioner, Zone 2', name: 'Smt. K R Pallavi, KAS', phone: '95918 60887' },
    },
    healthOfficer: { role: 'Health Officer', name: 'Dr. Siddappaji', phone: '94806 88298' },
  },
  South: {
    name: 'Bengaluru South City Corporation',
    email: 'comm.south.gba@gmail.com',
    controlRoom: ['080-26566362', '080-22975703', '94806 85704'],
    office: '9th Main Road, 9th Cross, 2nd Stage, Jayanagar, Bengaluru 560011',
    commissioner: { role: 'Commissioner', name: 'Ramesh K N, IAS', phone: '94825 09549' },
    jointCommissioner: {
      Zone1: { role: 'Joint Commissioner, Zone 1', name: 'Smt. Madhu N N, KAS', phone: '94814 92649' },
      Zone2: { role: 'Joint Commissioner, Zone 2', name: 'Satish Babu, KAS', phone: '87627 16711' },
    },
    healthOfficer: { role: 'Health Officer', name: 'Dr. Balasundar', phone: '94806 88300' },
  },
  West: {
    name: 'Bengaluru West City Corporation',
    email: 'commissioner.bwcc@gmail.com',
    controlRoom: ['080-23561692', '080-23463366', '94806 85703'],
    office: '18th Cross Road, Ideal Homes Township, Rajarajeshwari Nagar, Bengaluru 560098',
    commissioner: { role: 'Commissioner', name: 'Dr. Rajendra K V, IAS', phone: '99722 46800' },
    jointCommissioner: {
      Zone1: { role: 'Joint Commissioner, Zone 1', name: 'Smt. Arathi Anand, KAS', phone: '80730 77109' },
      Zone2: { role: 'Joint Commissioner, Zone 2', name: 'Sangappa, KAS', phone: '99026 02220' },
    },
    healthOfficer: { role: 'Health Officer', name: 'Dr. Manoranjan Hegde', phone: '94806 88561' },
  },
};

/** Ward marshal line for a BBMP-198 ward (9448197 + 3-digit ward number). */
export const wardMarshalPhone = (bbmpWard: number) => `9448197${String(bbmpWard).padStart(3, '0')}`;

/** City-wide grievance helpline. */
export const CITY_HELPLINE = '1533';
export const COMPLAINT_PORTAL_URL = 'https://nammabengaluru.org.in';

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
