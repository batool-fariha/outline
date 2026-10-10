import { IntegrationService } from "../../types/integrations";
import embeds from ".";

describe("diagrams embed", () => {
  const embed = embeds.find((e) => e.name === IntegrationService.Diagrams);

  afterEach(() => {
    if (embed) {
      embed.settings = undefined;
    }
  });

  it("matches the default viewer url", () => {
    expect(embed?.matcher("https://viewer.diagrams.net/?title=a")).toBeTruthy();
  });

  it("does not match a self-hosted url without configuration", () => {
    expect(embed?.matcher("https://draw.example.com/?title=a")).toBe(false);
  });

  it("matches a self-hosted url configured under settings.diagrams.url", () => {
    if (!embed) {
      throw new Error("diagrams embed not found");
    }
    embed.settings = { diagrams: { url: "https://draw.example.com/" } };

    expect(embed.matcher("https://draw.example.com/?title=a")).toBeTruthy();
  });
});
