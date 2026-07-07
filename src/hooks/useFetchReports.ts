import { useState, useEffect } from 'react';
import { Report, reportsService } from '@/services/reportsService';
import { sampleReports } from '@/data/sampleReports';
import { useToast } from './use-toast';


interface UseFetchReportsReturn {
    reports: Report[];
    loading: boolean;
    error: string | null;
    reFetchReports: () => void;
}

export function getSampleReports(): Report[] {
    return sampleReports.map(report => ({
        ...report,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
    })) as Report[];
}

/**
 * Fetches live app reports from Firestore.
 * @param useSampleData when true, returns bundled sample data (for local testing).
 */
export const useFetchReports = (useSampleData: boolean = false): UseFetchReportsReturn => {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchReports = async () => {
        try {
            setLoading(true);

            if (useSampleData) {
                setReports(getSampleReports());
            } else {
                try {
                    // Show all reports (including anonymous ones for legacy data)
                    setReports(await reportsService.getReports());
                } catch (firebaseError) {
                    console.error('Firebase reports fetch failed, falling back to sample data:', firebaseError);
                    setReports(getSampleReports());
                    toast({
                        title: "Using Sample Data",
                        description: "Firebase connection failed. Showing sample data for demonstration.",
                        variant: "default",
                    });
                }
            }

            setError(null);
        } catch (err) {
            setError("Failed to load reports and map data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();

        return (() => {
            setLoading(false);
            setReports([]);
            setError(null);
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return { reports, loading, error, reFetchReports: fetchReports };
};
