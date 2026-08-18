// Löst den From-Header auf: Account-Default oder optionales Override (verifizierter Alias).
import { InvalidAddressError } from "./errors.js";

export type FromOverride = string | { address: string; name?: string };

const HEADER_INJECTION_RE = /[\r\n]/;

function assertNoInjection(value: string): void {
  if (HEADER_INJECTION_RE.test(value)) {
    throw new InvalidAddressError(value);
  }
}

export function resolveFrom(
  accConfig: { user: string; from_name?: string },
  override?: FromOverride,
): string {
  if (!override) {
    return accConfig.from_name
      ? `"${accConfig.from_name}" <${accConfig.user}>`
      : accConfig.user;
  }

  if (typeof override === "string") {
    assertNoInjection(override);
    return override;
  }

  assertNoInjection(override.address);
  if (override.name) {
    assertNoInjection(override.name);
    return `"${override.name}" <${override.address}>`;
  }
  return override.address;
}
