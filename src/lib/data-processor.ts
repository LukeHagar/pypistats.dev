import { prisma } from './prisma.js';
import type { Prisma } from '@prisma/client';
import { BigQuery } from '@google-cloud/bigquery';
import { CacheManager, LockManager } from './redis.js';
import { env } from '$env/dynamic/private';

// Configuration constants
const MIRRORS = ['bandersnatch', 'z3c.pypimirror', 'Artifactory', 'devpi'];
const SYSTEMS = ['Windows', 'Linux', 'Darwin'];
const MAX_RECORD_AGE = 180;

interface DownloadRecord {
  package: string;
  category_label: string;
  category: string;
  downloads: number;
}

interface ProcessedData {
  [category: string]: Array<{
    date: string;
    package: string;
    category: string;
    downloads: number;
  }>;
}

export class DataProcessor {
  private bigquery: BigQuery;
  private cache: CacheManager;
  private locks: LockManager;

  constructor() {
    // Handle credentials from environment variable or file
    const base64Credentials = env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (!base64Credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_BASE64 is not set');
    }

    const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');

    const credentials = JSON.parse(decoded);

    // Initialize BigQuery client with flexible credential handling
    const bigQueryConfig = {
      projectId: credentials.project_id,
      credentials: credentials,
    };

    this.bigquery = new BigQuery(bigQueryConfig);

    // Initialize cache and locks
    this.cache = new CacheManager();
    this.locks = new LockManager();
  }

  /**
   * Main ETL process - replicates the Python etl() function
   */
  async etl(date?: string, purge: boolean = true) {
    const targetDate = date || this.getYesterdayDate();

    console.log(`Starting ETL process for date: ${targetDate}`);
    const etlLockKey = `pypistats:lock:etl:${targetDate}`;
    const processedKey = `pypistats:processed:${targetDate}`;
    let lockToken: string | null = null;

    const results: any = {};

    try {
      // If we've already processed this date, skip idempotently
      const alreadyProcessed = await this.cache.get<boolean>(processedKey);
      if (alreadyProcessed) {
        console.log(`Date ${targetDate} already processed, skipping ETL.`);
        return { skipped: true };
      }

      // Acquire a short-lived lock to avoid concurrent ETL for the same date
      lockToken = await this.locks.acquireLock(etlLockKey, 60 * 30); // 30 minutes
      if (!lockToken) {
        console.log(`Another ETL is running for ${targetDate}, skipping.`);
        return { locked: true };
      }

      // Get daily download stats
      results.downloads = await this.getDailyDownloadStats(targetDate);

      // Update __all__ package stats
      results.__all__ = await this.updateAllPackageStats(targetDate);

      // Update recent stats
      results.recent = await this.updateRecentStats();

      // Database maintenance
      results.cleanup = await this.vacuumAnalyze();

      // Purge old data
      if (purge) {
        results.purge = await this.purgeOldData(targetDate);
      }

      // Mark processed and clear cache
      await this.cache.set(processedKey, true, 60 * 60 * 24 * 14); // remember for 14 days

      console.log('ETL process completed successfully');
      return results;
    } catch (error) {
      console.error('ETL process failed:', error);
      throw error;
    } finally {
      // Best-effort release; if no lock held, it is a no-op
      try {
        if (lockToken) {
          await this.locks.releaseLock(etlLockKey, lockToken);
        }
      } catch { }
    }
  }

  /**
   * Get daily download stats from BigQuery
   */
  async getDailyDownloadStats(date: string): Promise<any> {
    console.log(`Fetching download stats for ${date} from BigQuery...`);

    const query = this.getBigQueryQuery(date);
    const [rows] = await this.bigquery.query({ query });

    console.log(`Retrieved ${rows.length} rows from BigQuery`);

    // Process data by category
    const data: ProcessedData = {};
    for (const row of rows as DownloadRecord[]) {
      if (!data[row.category_label]) {
        data[row.category_label] = [];
      }
      data[row.category_label].push({
        date,
        package: row.package,
        category: row.category,
        downloads: row.downloads,
      });
    }

    // Update database with new data
    return await this.updateDatabase(data, date);
  }

  /**
   * Update database with processed data
   */
  async updateDatabase(data: ProcessedData, date: string): Promise<any> {
    const results: any = {};

    for (const [category, rows] of Object.entries(data)) {
      console.log(`Updating ${category} table with ${rows.length} records`);

      try {
        // Wrap as a transaction to ensure idempotency and avoid partial writes
        await prisma.$transaction(async (tx) => {
          await this.deleteExistingRecords(category, date, tx);
          await this.insertRecords(category, rows, tx);
        });

        results[category] = true;
      } catch (error) {
        console.error(`Error updating ${category} table:`, error);
        results[category] = false;
      }
    }

    return results;
  }

  /**
   * Update stats for __all__ packages (aggregated data)
   */
  async updateAllPackageStats(date: string): Promise<any> {
    console.log('Updating __all__ package stats');

    const tables = ['overall', 'python_major', 'python_minor', 'system'];
    const results: any = {};

    for (const table of tables) {
      try {
        // Get aggregated data for __all__
        const aggregatedData = await this.getAggregatedData(table, date);

        // Delete existing __all__ records
        await this.deleteAllPackageRecords(table, date);

        // Insert aggregated records
        await this.insertAllPackageRecords(table, aggregatedData);

        results[table] = true;
      } catch (error) {
        console.error(`Error updating __all__ for ${table}:`, error);
        results[table] = false;
      }
    }

    return results;
  }

  /**
   * Update recent stats (day, week, month)
   */
  async updateRecentStats(): Promise<any> {
    console.log('Updating recent stats');

    const periods = ['day', 'week', 'month'];
    const results: any = {};

    for (const period of periods) {
      try {
        const recentData = await this.getRecentData(period);

        // Delete existing records for this period
        await prisma.recentDownloadCount.deleteMany({
          where: { category: period }
        });

        // Insert new records
        await prisma.recentDownloadCount.createMany({
          data: recentData
        });

        results[period] = true;
      } catch (error) {
        console.error(`Error updating recent stats for ${period}:`, error);
        results[period] = false;
      }
    }

    return results;
  }

  /**
   * Purge old data (keep only MAX_RECORD_AGE days)
   */
  async purgeOldData(date: string): Promise<any> {
    console.log('Purging old data');

    const purgeDate = new Date();
    purgeDate.setDate(purgeDate.getDate() - MAX_RECORD_AGE);

    const tables = ['overall', 'python_major', 'python_minor', 'system'];
    const results: any = {};

    for (const table of tables) {
      try {
        const deletedCount = await this.deleteOldRecords(table, purgeDate);
        results[table] = deletedCount;
      } catch (error) {
        console.error(`Error purging ${table}:`, error);
        results[table] = false;
      }
    }

    return results;
  }

  /**
   * Database maintenance (VACUUM and ANALYZE)
   */
  async vacuumAnalyze(): Promise<any> {
    console.log('Running database maintenance');

    const results: any = {};

    try {
      // Note: Prisma doesn't support VACUUM/ANALYZE directly
      // These would need to be run via raw SQL if needed
      results.vacuum = 'skipped'; // Would need raw SQL
      results.analyze = 'skipped'; // Would need raw SQL
    } catch (error) {
      console.error('Error during database maintenance:', error);
    }

    return results;
  }

  // Helper methods
  private getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  private getBigQueryQuery(date: string): string {
    return `
      WITH dls AS (
        SELECT
          file.project AS package,
          file.version AS file_version,
          details.installer.name AS installer,
          details.python AS python_version,
          details.system.name AS system
        FROM \`bigquery-public-data.pypi.file_downloads\`
        WHERE DATE(timestamp) = '${date}'
        AND (REGEXP_CONTAINS(details.python, r'^[0-9]\\.[0-9]+.{0,}$') OR details.python IS NULL)
      )
      SELECT
        package,
        'python_major' AS category_label,
        COALESCE(CAST(SPLIT(python_version, '.')[OFFSET(0)] AS STRING), 'unknown') AS category,
        COUNT(*) AS downloads
      FROM dls
      WHERE installer NOT IN (${MIRRORS.map(m => `'${m}'`).join(', ')})
      GROUP BY package, category
      
      UNION ALL
      
      SELECT
        package,
        'python_minor' AS category_label,
        COALESCE(REGEXP_EXTRACT(python_version, r'^[0-9]+\\.[0-9]+'), 'unknown') AS category,
        COUNT(*) AS downloads
      FROM dls
      WHERE installer NOT IN (${MIRRORS.map(m => `'${m}'`).join(', ')})
      GROUP BY package, category
      
      UNION ALL
      
      SELECT
        package,
        'overall' AS category_label,
        'with_mirrors' AS category,
        COUNT(*) AS downloads
      FROM dls
      GROUP BY package, category
      
      UNION ALL
      
      SELECT
        package,
        'overall' AS category_label,
        'without_mirrors' AS category,
        COUNT(*) AS downloads
      FROM dls
      WHERE installer NOT IN (${MIRRORS.map(m => `'${m}'`).join(', ')})
      GROUP BY package, category
      
      UNION ALL
      
      SELECT
        package,
        'system' AS category_label,
        COALESCE(CASE
          WHEN system NOT IN (${SYSTEMS.map(s => `'${s}'`).join(', ')}) THEN 'other'
          ELSE system
        END, 'other') AS category,
        COUNT(*) AS downloads
      FROM dls
      WHERE installer NOT IN (${MIRRORS.map(m => `'${m}'`).join(', ')})
      GROUP BY package, category

      UNION ALL

      SELECT
        package,
        'version' AS category_label,
        COALESCE(file_version, 'unknown') AS category,
        COUNT(*) AS downloads
      FROM dls
      WHERE installer NOT IN (${MIRRORS.map(m => `'${m}'`).join(', ')})
      GROUP BY package, category
    `;
  }

  /**
   * Ensure a package has up-to-date data. If missing or stale, fetch from BigQuery.
   */
  async ensurePackageFreshness(packageName: string): Promise<void> {
    const yesterday = this.getYesterdayDate();
    const last = await prisma.overallDownloadCount.findFirst({
      where: { package: packageName },
      orderBy: { date: 'desc' },
      select: { date: true }
    });

    const lastDate = last?.date ? last.date.toISOString().split('T')[0] : null;
    if (lastDate === yesterday) return; // up to date

    // Determine start date (inclusive)
    let startDate: string;
    if (lastDate) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + 1);
      startDate = d.toISOString().split('T')[0];
    } else {
      // If no data, pull last 30 days to seed
      const d = new Date();
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
    }

    const endDate = yesterday;
    if (new Date(startDate) > new Date(endDate)) return;

    // Lock per package to avoid duplicate ingestion
    const lockKey = `pypistats:lock:pkg:${packageName}:${startDate}:${endDate}`;
    const token = await this.locks.acquireLock(lockKey, 60 * 15);
    if (!token) return;
    try {
      const data = await this.getPackageDownloadStats(packageName, startDate, endDate);
      await this.updateDatabase(data, startDate); // date not used inside for deletes per date; safe
      // Recompute __all__ for these dates for this package is not needed; __all__ refers to special package '__all__'
    } finally {
      await this.locks.releaseLock(lockKey, token);
    }
  }

  /**
   * Query BigQuery for a package between dates (inclusive) aggregating required categories per day.
   */
  private async getPackageDownloadStats(packageName: string, startDate: string, endDate: string): Promise<ProcessedData> {
    const query = this.getPackageBigQueryQuery(packageName, startDate, endDate);
    const [rows] = await this.bigquery.query({ query });
    const data: ProcessedData = {};
    for (const row of rows as any[]) {
      const label = row.category_label as string;
      if (!data[label]) data[label] = [];
      data[label].push({
        date: row.date,
        package: row.package,
        category: row.category,
        downloads: Number(row.downloads)
      });
    }
    return data;
  }

  private getPackageBigQueryQuery(packageName: string, startDate: string, endDate: string): string {
    return `
      WITH dls AS (
        SELECT
          DATE(timestamp) AS date,
          file.project AS package,
          file.version AS file_version,
          details.installer.name AS installer,
          details.python AS python_version,
          details.system.name AS system
        FROM \`bigquery-public-data.pypi.file_downloads\`
        WHERE DATE(timestamp) BETWEEN '${startDate}' AND '${endDate}'
          AND file.project = '${packageName}'
          AND (REGEXP_CONTAINS(details.python, r'^[0-9]\\.[0-9]+.{0,}$') OR details.python IS NULL)
      )
      SELECT
        date,
        package,
        'python_major' AS category_label,
        COALESCE(CAST(SPLIT(python_version, '.')[OFFSET(0)] AS STRING), 'unknown') AS category,
        COUNT(*) AS downloads
      FROM dls
      GROUP BY date, package, category

      UNION ALL

      SELECT
        date,
        package,
        'python_minor' AS category_label,
        COALESCE(REGEXP_EXTRACT(python_version, r'^[0-9]+\\.[0-9]+'), 'unknown') AS category,
        COUNT(*) AS downloads
      FROM dls
      GROUP BY date, package, category

      UNION ALL

      SELECT
        date,
        package,
        'overall' AS category_label,
        'with_mirrors' AS category,
        COUNT(*) AS downloads
      FROM dls
      GROUP BY date, package, category

      UNION ALL

      SELECT
        date,
        package,
        'overall' AS category_label,
        'without_mirrors' AS category,
        COUNT(*) AS downloads
      FROM dls
      WHERE installer NOT IN (${MIRRORS.map(m => `'${m}'`).join(', ')})
      GROUP BY date, package, category

      UNION ALL

      SELECT
        date,
        package,
        'system' AS category_label,
        COALESCE(CASE WHEN system NOT IN (${SYSTEMS.map(s => `'${s}'`).join(', ')}) THEN 'other' ELSE system END, 'other') AS category,
        COUNT(*) AS downloads
      FROM dls
      GROUP BY date, package, category

      UNION ALL

      SELECT
        date,
        package,
        'installer' AS category_label,
        COALESCE(installer, 'unknown') AS category,
        COUNT(*) AS downloads
      FROM dls
      GROUP BY date, package, category

      UNION ALL

      SELECT
        date,
        package,
        'version' AS category_label,
        COALESCE(file_version, 'unknown') AS category,
        COUNT(*) AS downloads
      FROM dls
      GROUP BY date, package, category
    `;
  }

  private async deleteExistingRecords(table: string, date: string, tx: Prisma.TransactionClient): Promise<void> {
    const dateObj = new Date(date);

    switch (table) {
      case 'overall':
        await tx.overallDownloadCount.deleteMany({
          where: { date: dateObj }
        });
        break;
      case 'python_major':
        await tx.pythonMajorDownloadCount.deleteMany({
          where: { date: dateObj }
        });
        break;
      case 'python_minor':
        await tx.pythonMinorDownloadCount.deleteMany({
          where: { date: dateObj }
        });
        break;
      case 'system':
        await tx.systemDownloadCount.deleteMany({
          where: { date: dateObj }
        });
        break;
      case 'installer':
        await (tx as any).installerDownloadCount.deleteMany({
          where: { date: dateObj }
        });
        break;
      case 'version':
        if ((tx as any).versionDownloadCount) {
          await (tx as any).versionDownloadCount.deleteMany({ where: { date: dateObj } });
        }
        break;
    }
  }

  private async insertRecords(table: string, records: any[], tx: Prisma.TransactionClient): Promise<void> {
    const normalizeDate = (value: any): Date => {
      if (value instanceof Date) return value;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          const d = new Date(`${trimmed}T00:00:00Z`);
          if (!isNaN(d.getTime())) return d;
        }
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;
      }
      if (value && typeof value === 'object') {
        // BigQuery DATE often arrives as { value: 'YYYY-MM-DD' }
        if (typeof (value as any).value === 'string') {
          return normalizeDate((value as any).value);
        }
        // Some drivers return { year, month, day }
        const maybeY = (value as any).year;
        const maybeM = (value as any).month;
        const maybeD = (value as any).day;
        if (
          typeof maybeY === 'number' &&
          typeof maybeM === 'number' &&
          typeof maybeD === 'number'
        ) {
          const mm = String(maybeM).padStart(2, '0');
          const dd = String(maybeD).padStart(2, '0');
          return normalizeDate(`${maybeY}-${mm}-${dd}`);
        }
        // Timestamp-like with toDate()
        if (typeof (value as any).toDate === 'function') {
          const d = (value as any).toDate();
          if (d instanceof Date && !isNaN(d.getTime())) return d;
        }
        // Timestamp-like with seconds/nanos
        if (
          typeof (value as any).seconds === 'number' ||
          typeof (value as any).nanos === 'number'
        ) {
          const seconds = Number((value as any).seconds || 0);
          const nanos = Number((value as any).nanos || 0);
          const d = new Date(seconds * 1000 + Math.floor(nanos / 1e6));
          if (!isNaN(d.getTime())) return d;
        }
      }
      throw new Error(`Invalid date value: ${value}`);
    };

    switch (table) {
      case 'overall':
        await tx.overallDownloadCount.createMany({
          data: records.map(r => ({
            date: normalizeDate(r.date),
            package: r.package,
            category: r.category ?? 'unknown',
            downloads: r.downloads
          }))
        });
        break;
      case 'python_major':
        await tx.pythonMajorDownloadCount.createMany({
          data: records.map(r => ({
            date: normalizeDate(r.date),
            package: r.package,
            category: r.category ?? 'unknown',
            downloads: r.downloads
          }))
        });
        break;
      case 'python_minor':
        await tx.pythonMinorDownloadCount.createMany({
          data: records.map(r => ({
            date: normalizeDate(r.date),
            package: r.package,
            category: r.category ?? 'unknown',
            downloads: r.downloads
          }))
        });
        break;
      case 'system':
        await tx.systemDownloadCount.createMany({
          data: records.map(r => ({
            date: normalizeDate(r.date),
            package: r.package,
            category: r.category ?? 'other',
            downloads: r.downloads
          }))
        });
        break;
      case 'installer':
        await (tx as any).installerDownloadCount.createMany({
          data: records.map(r => ({
            date: normalizeDate(r.date),
            package: r.package,
            category: r.category ?? 'unknown',
            downloads: r.downloads
          }))
        });
        break;
      case 'version':
        if ((tx as any).versionDownloadCount) {
          await (tx as any).versionDownloadCount.createMany({
            data: records.map(r => ({
              date: normalizeDate(r.date),
              package: r.package,
              category: r.category ?? 'unknown',
              downloads: r.downloads
            }))
          });
        }
        break;
    }
  }

  private async getAggregatedData(table: string, date: string) {
    const dateObj = new Date(date);

    switch (table) {
      case 'overall':
        return await prisma.overallDownloadCount.groupBy({
          by: ['date', 'category'],
          where: { date: dateObj },
          _sum: { downloads: true }
        });
      case 'python_major':
        return await prisma.pythonMajorDownloadCount.groupBy({
          by: ['date', 'category'],
          where: { date: dateObj },
          _sum: { downloads: true }
        });
      case 'python_minor':
        return await prisma.pythonMinorDownloadCount.groupBy({
          by: ['date', 'category'],
          where: { date: dateObj },
          _sum: { downloads: true }
        });
      case 'system':
        return await prisma.systemDownloadCount.groupBy({
          by: ['date', 'category'],
          where: { date: dateObj },
          _sum: { downloads: true }
        });
      default:
        return [];
    }
  }

  private async deleteAllPackageRecords(table: string, date: string): Promise<void> {
    const dateObj = new Date(date);

    switch (table) {
      case 'overall':
        await prisma.overallDownloadCount.deleteMany({
          where: { date: dateObj, package: '__all__' }
        });
        break;
      case 'python_major':
        await prisma.pythonMajorDownloadCount.deleteMany({
          where: { date: dateObj, package: '__all__' }
        });
        break;
      case 'python_minor':
        await prisma.pythonMinorDownloadCount.deleteMany({
          where: { date: dateObj, package: '__all__' }
        });
        break;
      case 'system':
        await prisma.systemDownloadCount.deleteMany({
          where: { date: dateObj, package: '__all__' }
        });
        break;
    }
  }

  private async insertAllPackageRecords(table: string, aggregatedData: any[]): Promise<void> {
    const records = aggregatedData.map(data => ({
      date: data.date,
      package: '__all__',
      category: data.category ?? (table === 'system' ? 'other' : 'unknown'),
      downloads: data._sum.downloads || 0
    }));

    await this.insertRecords(table, records, prisma);
  }

  private async getRecentData(period: string): Promise<any[]> {
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(today);
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error(`Invalid period: ${period}`);
    }

    const results = await prisma.overallDownloadCount.groupBy({
      by: ['package'],
      where: {
        date: { gte: startDate },
        category: 'without_mirrors'
      },
      _sum: { downloads: true }
    });

    return results.map(result => ({
      package: result.package,
      category: period,
      downloads: result._sum.downloads || 0
    }));
  }

  private async deleteOldRecords(table: string, purgeDate: Date): Promise<number> {
    switch (table) {
      case 'overall':
        const overallResult = await prisma.overallDownloadCount.deleteMany({
          where: { date: { lt: purgeDate } }
        });
        return overallResult.count;
      case 'python_major':
        const majorResult = await prisma.pythonMajorDownloadCount.deleteMany({
          where: { date: { lt: purgeDate } }
        });
        return majorResult.count;
      case 'python_minor':
        const minorResult = await prisma.pythonMinorDownloadCount.deleteMany({
          where: { date: { lt: purgeDate } }
        });
        return minorResult.count;
      case 'system':
        const systemResult = await prisma.systemDownloadCount.deleteMany({
          where: { date: { lt: purgeDate } }
        });
        return systemResult.count;
      case 'version':
        const versionResult = await (prisma as any).versionDownloadCount.deleteMany({
          where: { date: { lt: purgeDate } }
        });
        return versionResult.count;
      default:
        return 0;
    }
  }
} 