import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockCookieSet })),
}));

const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  })),
  jwtVerify: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSign.mockResolvedValue("mock-jwt-token");
});

const { createSession } = await import("../auth");

test("createSession sets cookie with name auth-token", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  expect(mockCookieSet.mock.calls[0][0]).toBe("auth-token");
});

test("createSession sets cookie value to the JWT token", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet.mock.calls[0][1]).toBe("mock-jwt-token");
});

test("createSession sets httpOnly: true", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet.mock.calls[0][2]).toMatchObject({ httpOnly: true });
});

test("createSession sets sameSite: lax", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet.mock.calls[0][2]).toMatchObject({ sameSite: "lax" });
});

test("createSession sets path: /", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet.mock.calls[0][2]).toMatchObject({ path: "/" });
});

test("createSession sets secure: false outside production", async () => {
  await createSession("user-123", "test@example.com");

  // NODE_ENV is "test" in vitest, not "production"
  expect(mockCookieSet.mock.calls[0][2]).toMatchObject({ secure: false });
});

test("createSession sets secure: true in production", async () => {
  vi.stubEnv("NODE_ENV", "production");

  await createSession("user-123", "test@example.com");

  expect(mockCookieSet.mock.calls[0][2]).toMatchObject({ secure: true });

  vi.unstubAllEnvs();
});

test("createSession sets expiry approximately 7 days from now", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const expires: Date = mockCookieSet.mock.calls[0][2].expires;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession signs JWT with userId and email in payload", async () => {
  const { SignJWT } = await import("jose");
  await createSession("user-456", "hello@example.com");

  expect(SignJWT).toHaveBeenCalledOnce();
  const payload = (SignJWT as any).mock.calls[0][0];
  expect(payload.userId).toBe("user-456");
  expect(payload.email).toBe("hello@example.com");
});

test("createSession signs JWT with HS256 algorithm", async () => {
  const { SignJWT } = await import("jose");
  const mockInstance = (SignJWT as any).mock.results[0]?.value;

  await createSession("user-123", "test@example.com");

  const instance = (SignJWT as any).mock.results[0].value;
  expect(instance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
});

test("createSession sets JWT expiration to 7d", async () => {
  const { SignJWT } = await import("jose");

  await createSession("user-123", "test@example.com");

  const instance = (SignJWT as any).mock.results[0].value;
  expect(instance.setExpirationTime).toHaveBeenCalledWith("7d");
});
