import type { Site, SiteType } from "@/schemas/site";
import {
  faker,
  NUM_SITES,
  VIENNA_LAT_MIN,
  VIENNA_LAT_MAX,
  VIENNA_LNG_MIN,
  VIENNA_LNG_MAX,
} from "./seed";

// Vienna district names for realistic addresses
const VIENNA_DISTRICTS = [
  "Innere Stadt",
  "Leopoldstadt",
  "Landstraße",
  "Wieden",
  "Margareten",
  "Mariahilf",
  "Neubau",
  "Josefstadt",
  "Alsergrund",
  "Favoriten",
  "Simmering",
  "Meidling",
  "Hietzing",
  "Penzing",
  "Rudolfsheim-Fünfhaus",
  "Ottakring",
  "Hernals",
  "Währing",
  "Döbling",
  "Brigittenau",
  "Floridsdorf",
  "Donaustadt",
  "Liesing",
];

const VIENNA_STREETS = [
  "Mariahilfer Straße",
  "Kärntner Straße",
  "Wiedner Hauptstraße",
  "Landstraßer Hauptstraße",
  "Taborstraße",
  "Favoritenstraße",
  "Simmeringer Hauptstraße",
  "Meidlinger Hauptstraße",
  "Hietzinger Hauptstraße",
  "Linzer Straße",
  "Ottakringer Straße",
  "Währinger Straße",
  "Nussdorfer Straße",
  "Grinzinger Straße",
  "Brünner Straße",
  "Wagramer Straße",
  "Liesinger Platz",
  "Prater Hauptallee",
  "Donaufelder Straße",
  "Breitenfurter Straße",
];

/** Site type distribution: 12 residential, 6 commercial, 2 industrial */
function getSiteType(index: number): SiteType {
  if (index < 12) return "residential";
  if (index < 18) return "commercial";
  return "industrial";
}

/** Grid connection size by site type */
function getGridConnectionKva(type: SiteType): number {
  switch (type) {
    case "residential":
      return faker.helpers.arrayElement([25, 35, 50]);
    case "commercial":
      return faker.helpers.arrayElement([100, 150, 250]);
    case "industrial":
      return faker.helpers.arrayElement([500, 1000, 2000]);
  }
}

function generateSite(index: number): Site {
  const type = getSiteType(index);
  const district = VIENNA_DISTRICTS[index % VIENNA_DISTRICTS.length];
  const street = VIENNA_STREETS[index % VIENNA_STREETS.length];
  const houseNumber = faker.number.int({ min: 1, max: 120 });

  return {
    id: faker.string.uuid(),
    name:
      type === "residential"
        ? `${faker.person.lastName()} Residence`
        : type === "commercial"
          ? `${faker.company.name()} Office`
          : `${faker.company.name()} Plant`,
    address: `${street} ${houseNumber}, ${district}, Vienna`,
    lat: faker.number.float({ min: VIENNA_LAT_MIN, max: VIENNA_LAT_MAX, fractionDigits: 6 }),
    lng: faker.number.float({ min: VIENNA_LNG_MIN, max: VIENNA_LNG_MAX, fractionDigits: 6 }),
    timezone: "Europe/Vienna",
    type,
    grid_connection_kva: getGridConnectionKva(type),
    status: faker.helpers.weightedArrayElement([
      { value: "active" as const, weight: 17 },
      { value: "inactive" as const, weight: 2 },
      { value: "commissioning" as const, weight: 1 },
    ]),
    created_at: faker.date.past({ years: 3 }),
  };
}

/** 20 deterministic sites around Vienna */
export const mockSites: Site[] = Array.from({ length: NUM_SITES }, (_, i) =>
  generateSite(i)
);
