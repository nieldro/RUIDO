import { describe, expect, it } from "vitest";
import { es } from "./es";
import { en } from "./en";
import services from "./services.json";

/** Recorre un objeto y devuelve la ruta de cada hoja («hero.title», «jobs.0.role»…). */
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (value === null || typeof value !== "object") return [[path, value]];
  return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
}

describe("diccionarios es / en", () => {
  const esLeaves = leaves(es);
  const enLeaves = leaves(en);

  it("tienen exactamente las mismas rutas", () => {
    expect(enLeaves.map(([p]) => p)).toEqual(esLeaves.map(([p]) => p));
  });

  it("no dejan textos vacíos", () => {
    for (const [path, value] of [...esLeaves, ...enLeaves]) {
      if (typeof value === "string") expect(value.trim(), path).not.toBe("");
    }
  });

  it("no dejan marcadores pendientes", () => {
    for (const [path, value] of [...esLeaves, ...enLeaves]) {
      if (typeof value === "string") expect(value, path).not.toMatch(/\[PLACEHOLDER\]|TODO|XXX/);
    }
  });
});

describe("services.json", () => {
  const groupIds = new Set(services.groups.map((g) => g.id));

  it("cada servicio pertenece a un grupo que existe", () => {
    for (const item of services.items) expect(groupIds.has(item.group), item.id).toBe(true);
  });

  it("los id de servicios no se repiten", () => {
    const ids = services.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("el precio es positivo, o null cuando el servicio es a la medida", () => {
    for (const item of services.items) {
      if (item.price !== null) expect(item.price, item.id).toBeGreaterThan(0);
    }
  });

  it("cada servicio tiene nombre en ambos idiomas", () => {
    for (const item of services.items) {
      expect(item.name.es.trim(), item.id).not.toBe("");
      expect(item.name.en.trim(), item.id).not.toBe("");
    }
  });
});
