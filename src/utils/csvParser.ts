import Papa from 'papaparse';
import {
    RawCampaignCSV,
    RawFlowCSV,
    RawSubscriberCSV,
    ParseResult,
    ValidationError
} from './dataTypes';

export class CSVParser {
    private readonly CHUNK_SIZE = 1000; // Process 1000 rows at a time

    /**
     * Parse a CSV file with chunking support for large files
     */
    private async parseCSV<T>(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ParseResult<T>> {
        return new Promise((resolve) => {
            const results: T[] = [];
            let rowCount = 0;

            Papa.parse(file, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                chunk: (chunk: Papa.ParseResult<T>) => {
                    // Process chunk
                    results.push(...chunk.data);
                    rowCount += chunk.data.length;

                    // Report progress
                    if (onProgress && chunk.meta.cursor && file.size) {
                        const progress = (chunk.meta.cursor / file.size) * 100;
                        onProgress(Math.min(progress, 99)); // Cap at 99% until complete
                    }
                },
                complete: () => {
                    if (onProgress) onProgress(100);
                    resolve({
                        success: true,
                        data: results
                    });
                },
                error: (error: Error) => {
                    resolve({
                        success: false,
                        error: `Failed to parse CSV: ${error.message}`
                    });
                }
            });
        });
    }

    /**
     * Parse campaigns CSV file
     */
    async parseCampaigns(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ParseResult<RawCampaignCSV>> {
        const result = await this.parseCSV<RawCampaignCSV>(file, onProgress);

        if (!result.success || !result.data) {
            return result;
        }

        // Validate required fields
        const validated = this.validateCampaigns(result.data);
        return validated;
    }

    /**
     * Parse flows CSV file
     */
    async parseFlows(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ParseResult<RawFlowCSV>> {
        return new Promise((resolve) => {
            let skipRows = 3; // Skip first 3 rows for Klaviyo flow reports

            Papa.parse(file, {
                header: false, // Don't auto-detect headers
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (parseResults) => {
                    const allRows = parseResults.data as any[][];

                    if (allRows.length <= skipRows) {
                        resolve({
                            success: false,
                            error: 'File does not contain enough rows'
                        });
                        return;
                    }

                    // Check multiple rows to find headers
                    console.log('Row 1:', allRows[0]);
                    console.log('Row 2:', allRows[1]);
                    console.log('Row 3:', allRows[2]);
                    console.log('Row 4:', allRows[3]);

                    // Try to find which row has "Day" as first column
                    let headerRowIndex = -1;
                    for (let i = 0; i < Math.min(10, allRows.length); i++) {
                        if (allRows[i][0] === 'Day') {
                            headerRowIndex = i;
                            console.log(`Found headers at row ${i + 1}`);
                            break;
                        }
                    }

                    const headers = headerRowIndex >= 0 ? allRows[headerRowIndex] : allRows[2];
                    console.log('Using headers:', headers);
                    // Convert remaining rows to objects using the headers
                    const dataRows: RawFlowCSV[] = [];
                    const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 3;
                    for (let i = startRow; i < allRows.length; i++) {
                        const row = allRows[i];
                        const obj: any = {};

                        headers.forEach((header, index) => {
                            if (header && row[index] !== undefined) {
                                obj[header] = row[index];
                            }
                        });

                        dataRows.push(obj as RawFlowCSV);
                    }

                    console.log('Parsed flow data rows:', dataRows.length);
                    if (dataRows.length > 0) {
                        console.log('First row keys:', Object.keys(dataRows[0]));
                        console.log('First row data:', dataRows[0]);
                    }

                    // Now validate the parsed data
                    const validated = this.validateFlows(dataRows);
                    if (onProgress) onProgress(100);
                    resolve(validated);
                },
                error: (error) => {
                    resolve({
                        success: false,
                        error: `Failed to parse CSV: ${error.message}`
                    });
                }
            });
        });
    }

    /**
     * Parse subscribers CSV file
     */
    async parseSubscribers(
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ParseResult<RawSubscriberCSV>> {
        const result = await this.parseCSV<RawSubscriberCSV>(file, onProgress);

        if (!result.success || !result.data) {
            return result;
        }

        // Validate required fields
        const validated = this.validateSubscribers(result.data);
        return validated;
    }

    /**
     * Validate campaign data
     */
    private validateCampaigns(data: RawCampaignCSV[]): ParseResult<RawCampaignCSV> {
        const errors: ValidationError[] = [];
        const validData: RawCampaignCSV[] = [];

        // Required fields for campaigns
        const requiredFields = [
            'Campaign Name',
            'Send Time',
            'Total Recipients',
            'Revenue',
            'Unique Opens',
            'Unique Clicks'
        ];

        data.forEach((row, index) => {
            let isValid = true;

            // Check required fields
            requiredFields.forEach(field => {
                if (row[field as keyof RawCampaignCSV] === undefined ||
                    row[field as keyof RawCampaignCSV] === null ||
                    row[field as keyof RawCampaignCSV] === '') {
                    errors.push({
                        row: index + 2, // +2 for header and 0-index
                        field,
                        message: `Missing required field: ${field}`
                    });
                    isValid = false;
                }
            });

            // Only include rows from Email channel (exclude SMS)
            if (row['Campaign Channel'] &&
                typeof row['Campaign Channel'] === 'string' &&
                row['Campaign Channel'].toLowerCase().includes('sms')) {
                isValid = false; // Skip SMS campaigns
            }

            if (isValid) {
                validData.push(row);
            }
        });

        if (validData.length === 0) {
            return {
                success: false,
                error: 'No valid flow data found. Check that the CSV contains flows with delivery data (Delivered > 0).'
            };
        }

        return {
            success: true,
            data: validData
        };
    }

    /**
     * Validate flow data
     */
    private validateFlows(data: RawFlowCSV[]): ParseResult<RawFlowCSV> {
        const errors: ValidationError[] = [];
        const validData: RawFlowCSV[] = [];

        console.log('Flow data rows:', data.length);
        if (data.length > 0) {
            console.log('First row keys:', Object.keys(data[0]));
            console.log('First row data:', data[0]);
        }


        // Required fields for flows
        const requiredFields = [
            'Day',
            'Flow ID',
            'Flow Name',
            'Flow Message ID',
            'Flow Message Name',
            'Status',
            'Delivered'
        ];

        data.forEach((row, index) => {
            let isValid = true;

            // Check required fields
            requiredFields.forEach(field => {
                if (row[field as keyof RawFlowCSV] === undefined ||
                    row[field as keyof RawFlowCSV] === null ||
                    row[field as keyof RawFlowCSV] === '') {
                    errors.push({
                        row: index + 2,
                        field,
                        message: `Missing required field: ${field}`
                    });
                    isValid = false;
                }
            });

            // Include all flows (regardless of status or deliveries)
            // Comment out or remove the delivery/status check entirely

            if (isValid) {
                validData.push(row);
            }
        });

        if (validData.length === 0) {
            return {
                success: false,
                error: 'No valid flow data found. Check that the CSV contains the required fields.'
            };
        }

        return {
            success: true,
            data: validData
        };
    }

    /**
     * Validate subscriber data
     */
    private validateSubscribers(data: RawSubscriberCSV[]): ParseResult<RawSubscriberCSV> {
        const errors: ValidationError[] = [];
        const validData: RawSubscriberCSV[] = [];

        // Required fields for subscribers
        const requiredFields = [
            'Email',
            'Klaviyo ID',
            'Email Marketing Consent'
        ];

        data.forEach((row, index) => {
            let isValid = true;

            // Check required fields
            requiredFields.forEach(field => {
                if (row[field as keyof RawSubscriberCSV] === undefined ||
                    row[field as keyof RawSubscriberCSV] === null ||
                    row[field as keyof RawSubscriberCSV] === '') {
                    errors.push({
                        row: index + 2,
                        field,
                        message: `Missing required field: ${field}`
                    });
                    isValid = false;
                }
            });

            // Validate email format
            if (row['Email'] && typeof row['Email'] === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(row['Email'])) {
                    errors.push({
                        row: index + 2,
                        field: 'Email',
                        message: 'Invalid email format'
                    });
                    isValid = false;
                }
            }

            if (isValid) {
                validData.push(row);
            }
        });

        if (validData.length === 0) {
            return {
                success: false,
                error: 'No valid subscriber data found. Check that the CSV contains valid email addresses.'
            };
        }

        return {
            success: true,
            data: validData
        };
    }

    /**
     * Get file size in human readable format
     */
    getFileSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Estimate processing time based on file size
     */
    estimateProcessingTime(fileSize: number): string {
        // Rough estimate: 1MB per second
        const seconds = fileSize / (1024 * 1024);
        if (seconds < 60) {
            return `${Math.ceil(seconds)} seconds`;
        } else {
            return `${Math.ceil(seconds / 60)} minutes`;
        }
    }
}