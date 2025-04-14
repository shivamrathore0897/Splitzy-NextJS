'use server';
/**
 * @fileOverview Extracts bill information from an image using OCR.
 *
 * - billOcr - A function that handles the bill OCR process.
 * - BillOcrInput - The input type for the billOcr function.
 * - BillOcrOutput - The return type for the billOcr function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const BillOcrInputSchema = z.object({
  photoUrl: z.string().describe('The URL of the bill photo.'),
});
export type BillOcrInput = z.infer<typeof BillOcrInputSchema>;

const BillOcrOutputSchema = z.object({
  totalAmount: z.number().optional().describe('The total amount due on the bill.'),
  items: z.array(
    z.object({
      name: z.string().describe('The name of the item.'),
      amount: z.number().describe('The amount of the item.'),
    })
  ).optional().describe('The list of items on the bill.'),
});
export type BillOcrOutput = z.infer<typeof BillOcrOutputSchema>;

export async function billOcr(input: BillOcrInput): Promise<BillOcrOutput> {
  return billOcrFlow(input);
}

const prompt = ai.definePrompt({
  name: 'billOcrPrompt',
  input: {
    schema: z.object({
      photoUrl: z.string().describe('The URL of the bill photo.'),
    }),
  },
  output: {
    schema: z.object({
      totalAmount: z.number().optional().describe('The total amount due on the bill.'),
      items: z.array(
        z.object({
          name: z.string().describe('The name of the item.'),
          amount: z.number().describe('The amount of the item.'),
        })
      ).optional().describe('The list of items on the bill.'),
    }),
  },
  prompt: `You are an OCR expert specializing in extracting information from bills.

You will use this information to extract the total amount due on the bill, and any items listed on the bill.

Use the following as the primary source of information about the bill.

Photo: {{media url=photoUrl}}

Output the information as a JSON object.
`,
});

const billOcrFlow = ai.defineFlow<
  typeof BillOcrInputSchema,
  typeof BillOcrOutputSchema
>(
  {
    name: 'billOcrFlow',
    inputSchema: BillOcrInputSchema,
    outputSchema: BillOcrOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
