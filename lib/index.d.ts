export type CKTValue = null | boolean | number | string | CKTArray | CKTTable;
export type CKTArray = CKTValue[];
export type CKTTable = { [key: string]: CKTValue };

/**
 * Parses a string as a CKT document
 * @param text - Text to parse
 * @returns Decoded CKT table
 * @throws {@link SyntaxError} on invalid syntax
 */
export function parse(text: any): CKTTable;

/**
 * Encodes a value as a CKT document
 * @param value - Value to encode
 * @param indent - Indent string/space count
 * @returns Encoded CKT document
 * @throws {@link TypeError} on cyclic reference
 */
export function stringify(value: any, indent?: string | number): string;
