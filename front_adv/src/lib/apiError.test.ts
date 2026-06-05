import { describe, expect, it } from "vitest";

import { ApiError, flattenApiErrorDetails, parseApiError, parseTransportError } from "./apiError";

describe("apiError", () => {
  it("uses validation details from a DRF-style payload as the main message", () => {
    const error = parseApiError(400, {
      email: ["Ja existe um usuario com este email."],
      non_field_errors: ["Revise os dados enviados."],
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("email: Ja existe um usuario com este email.");
    expect(error.details).toEqual({
      email: ["Ja existe um usuario com este email."],
      non_field_errors: ["Revise os dados enviados."],
    });
  });

  it("prefers nested detail fields over generic top-level messages", () => {
    const error = parseApiError(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation error.",
        details: {
          contact_recipient_emails: ["Informe pelo menos um email valido."],
        },
      },
    });

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("contact recipient emails: Informe pelo menos um email valido.");
    expect(error.details).toEqual({
      contact_recipient_emails: ["Informe pelo menos um email valido."],
    });
  });

  it("keeps direct detail messages when the API already returned a clear error", () => {
    const error = parseApiError(401, { detail: "Credenciais invalidas." });

    expect(error.message).toBe("Credenciais invalidas.");
    expect(error.details).toBeNull();
  });

  it("creates a friendly network error for transport failures", () => {
    const error = parseTransportError(new TypeError("Failed to fetch"));

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("NETWORK_ERROR");
    expect(error.message).toBe("Nao foi possivel conectar ao servidor. Verifique a conexao e tente novamente.");
  });

  it("flattens nested validation objects into readable messages", () => {
    expect(
      flattenApiErrorDetails({
        profile: {
          phone_number: ["Numero invalido."],
        },
      }),
    ).toEqual(["profile phone number: Numero invalido."]);
  });
});
