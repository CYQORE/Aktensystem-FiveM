import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Zod-Validierungs-Pipe. Nutzt die geteilten Schemas aus @aktensystem/shared,
 * sodass Frontend und Backend gegen denselben Vertrag prüfen.
 *
 *   @Body(new ZodPipe(CreateCaseFileSchema)) dto: CreateCaseFile
 */
export class ZodPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Validierung fehlgeschlagen",
        issues: result.error.issues,
      });
    }
    return result.data;
  }
}
