/**
 * NMFC (National Motor Freight Classification) Utility
 * Calculates the standard freight class based on density.
 */

export const NMFC_CLASSES = [
    '50', '55', '60', '65', '70', '77.5', '85', '92.5', '100',
    '110', '125', '150', '175', '200', '250', '300', '400', '500'
];

/**
 * Calculates the NMFC Freight Class based on weight and dimensions.
 * @param weight Lbs
 * @param length Inches
 * @param width Inches
 * @param height Inches
 * @returns Standard NMFC Class as a string
 */
export function calculateDensityClass(weight: number, length: number, width: number, height: number): string {
    if (!weight || !length || !width || !height || weight <= 0) {
        return '50'; // Default to 50 if invalid
    }

    const volumeCubicInches = length * width * height;
    const volumeCubicFeet = volumeCubicInches / 1728;

    if (volumeCubicFeet <= 0) return '50';

    const density = weight / volumeCubicFeet; // lbs per cubic ft (pcf)

    if (density < 1) return '500';
    if (density >= 1 && density < 2) return '400';
    if (density >= 2 && density < 3) return '300';
    if (density >= 3 && density < 4) return '250';
    if (density >= 4 && density < 5) return '200';
    if (density >= 5 && density < 6) return '175';
    if (density >= 6 && density < 7) return '150';
    if (density >= 7 && density < 8) return '125';
    if (density >= 8 && density < 9) return '110';
    if (density >= 9 && density < 10.5) return '100';
    if (density >= 10.5 && density < 12) return '92.5';
    if (density >= 12 && density < 13.5) return '85';
    if (density >= 13.5 && density < 15) return '77.5';
    if (density >= 15 && density < 22.5) return '70';
    if (density >= 22.5 && density < 30) return '65';
    if (density >= 30 && density < 35) return '60';
    if (density >= 35 && density < 50) return '55';
    return '50'; // 50 pcf or greater
}
