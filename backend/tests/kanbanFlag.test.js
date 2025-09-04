const request = require("supertest");

// Configura ambiente para testes
process.env.NODE_ENV = "test";
process.env.KANBAN_ENABLED = "false";

const app = require("../server");

describe("Kanban feature flag", () => {
  it("deve retornar 404 quando KANBAN_ENABLED=false", async () => {
    const res = await request(app).get("/api/kanban/v1/status");
    expect(res.statusCode).toBe(404);
  });
});