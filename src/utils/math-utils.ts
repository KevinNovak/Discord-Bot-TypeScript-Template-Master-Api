export class MathUtils {
    public static sum(numbers: number[]): number {
        return numbers.reduce((a, b) => a + b, 0);
    }
}
