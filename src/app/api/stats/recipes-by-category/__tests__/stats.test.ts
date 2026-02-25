import { GET } from "@/app/api/stats/recipes-by-category/route";
import { prisma } from "@/lib/prisma";

// Mockujemo ceo prisma modul
jest.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: {
      groupBy: jest.fn(),
    },
    categoryRecipe: {
      findMany: jest.fn(),
    },
  },
}));

describe("Stats API - recepti po kategorijama", () => {
  beforeEach(() => {
    (prisma.recipe.groupBy as jest.Mock).mockResolvedValue([
      { categoryId: "1", _count: { _all: 3 } },
    ]);

    (prisma.categoryRecipe.findMany as jest.Mock).mockResolvedValue([
      { id: "1", name: "Test kategorija" },
    ]);
  });

  it("treba da vrati status 200", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("treba da vrati niz podataka", async () => {
    const response = await GET();
    const json = await response.json();

    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data[0]).toHaveProperty("categoryName");
    expect(json.data[0]).toHaveProperty("count");
  });
});