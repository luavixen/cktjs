export type CKTValue = null | boolean | number | string | CKTTable;
export type CKTTable = { [index: string]: undefined | CKTValue };
export function parse(script: any): CKTTable;
export function stringify(value: any, indent?: string | number): string;
export const CKT: { parse: typeof parse, stringify: typeof stringify };
export default CKT;
