import { parse, isWithinInterval, parseISO } from 'date-fns';

/**
 * Generalized filtering utility for date range, program, and additional filters.
 * @param data - Array of data to filter.
 * @param options - Filtering options.
 * @returns Filtered data.
 */
export function filterData(
  data: any[],
  options: {
    dateRange?: { start: string; end: string };
    program?: string;
    additionalFilters?: (item: any) => boolean;
    dateKey?: string;
    programKey?: string;
  }
): any[] {
  const {
    dateRange,
    program,
    additionalFilters,
    dateKey = 'month_year',
    programKey = 'programshortname',
  } = options;

  let filteredData = data;

  // Date range filtering
  if (dateRange?.start && dateRange?.end) {
    const start = parse(dateRange.start, 'yyyy-MM', new Date());
    const end = parse(dateRange.end, 'yyyy-MM', new Date());
    filteredData = filteredData.filter((item) => {
      let date;
      try {
        // Try parsing as ISO date first
        date = parseISO(item[dateKey]);
      } catch {
        // If that fails, try parsing as 'yyyy-MM'
        date = parse(item[dateKey], 'yyyy-MM', new Date());
      }
      return isWithinInterval(date, { start, end });
    });
  }

  // Program-specific filtering
  if (program) {
    filteredData = filteredData.filter((item) => item[programKey] === program);
  }

  // Additional filters
  if (additionalFilters) {
    filteredData = filteredData.filter(additionalFilters);
  }

  return filteredData;
}

