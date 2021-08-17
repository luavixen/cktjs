export type CKTValue = null | boolean | number | string | CKTTable;
export type CKTTable = { [index: string]: undefined | CKTValue };

/**
 * Decodes a CKT script string.
 * @param script - Script to decode.
 * @returns Decoded table.
 * @throws {@link SyntaxError} on invalid syntax.
 */
export function parse(script: any): CKTTable;

/**
 * Encodes a value as a CKT script string.
 * @param value - Value to encode.
 * @param indent - Indent string/amount.
 * @returns Encoded value.
 * @throws {@link TypeError} on cyclic reference.
 */
export function stringify(value: any, indent?: string | number): string;
