import { z } from "zod";
import { isValidRefPrefix } from "@/lib/refs";

/**
 * The event content model.
 *
 * This one schema validates the seed JSON, the organizer API body, and — when
 * an admin UI eventually exists — its forms. That is the whole point of
 * authoring events as a validated document rather than as SQL inserts.
 */

// A bare "2026-09-13T05:00:00" is ambiguous: Date.parse treats it as local
// time, which silently shifts a 5 AM IST flag-off by hours depending on where
// the seed runs. Require the offset explicitly.
const HAS_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;

const instant = z
  .string()
  .regex(HAS_OFFSET, "Include a UTC offset, e.g. 2026-09-13T05:00:00+05:30")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Not a valid date-time")
  .transform((value) => new Date(value));

const slug = z
  .string()
  .trim()
  .min(3)
  .max(90)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by single hyphens.");

export const SECTION_KEYS = [
  "hero",
  "facts",
  "categories",
  "about",
  "route",
  "schedule",
  "inclusions",
  "gallery",
  "venue",
  "faqs",
  "rules",
] as const;

export const eventStatusSchema = z.enum([
  "DRAFT",
  "COMING_SOON",
  "REGISTRATION_OPEN",
  "REGISTRATION_CLOSED",
  "COMPLETED",
  "CANCELLED",
]);

const categorySchema = z.object({
  name: z.string().trim().min(1).max(20), // "5K"
  distanceMeters: z.number().int().positive().max(1_000_000),
  minAge: z.number().int().min(0).max(100).nullable().optional(),
  startTime: instant,
  slotLimit: z.number().int().positive().max(100_000),
  descriptionMd: z.string().max(2000).nullable().optional(),
  priceMinor: z.number().int().min(0).default(0),
  currency: z.string().length(3).default("INR"),
  sortOrder: z.number().int().min(0).default(0),
});

const scheduleSchema = z.object({
  timeLabel: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

const inclusionSchema = z.object({
  icon: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(80),
  description: z.string().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

const imageSchema = z.object({
  url: z.url(),
  alt: z.string().trim().min(1, "Every image needs alt text.").max(200),
  kind: z.enum(["COVER", "GALLERY", "ROUTE_MAP"]).default("GALLERY"),
  sortOrder: z.number().int().min(0).default(0),
});

const routeSchema = z.object({
  categoryName: z.string().trim().max(20).nullable().optional(),
  mapImageUrl: z.url().nullable().optional(),
  gpxUrl: z.url().nullable().optional(),
  descriptionMd: z.string().max(4000).nullable().optional(),
  elevationGainM: z.number().int().min(0).max(10_000).nullable().optional(),
});

const faqSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(2000),
  sortOrder: z.number().int().min(0).default(0),
});

const venueSchema = z.object({
  name: z.string().trim().min(1).max(160),
  addressLine: z.string().trim().min(1).max(300),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().max(80).nullable().optional(),
  pincode: z.string().trim().max(12).nullable().optional(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  mapsUrl: z.url().nullable().optional(),
});

export const eventInputSchema = z
  .object({
    slug,
    name: z.string().trim().min(3).max(160),
    tagline: z.string().trim().max(200).nullable().optional(),
    status: eventStatusSchema.default("DRAFT"),

    startAt: instant,
    endAt: instant.nullable().optional(),
    timezone: z.string().trim().min(1).default("Asia/Kolkata"),

    venue: venueSchema,

    coverImageUrl: z.url().nullable().optional(),
    ogImageUrl: z.url().nullable().optional(),

    registrationOpensAt: instant.nullable().optional(),
    registrationClosesAt: instant.nullable().optional(),

    aboutMd: z.string().max(20_000).nullable().optional(),
    rulesMd: z.string().max(20_000).nullable().optional(),

    termsVersion: z.string().trim().min(1).max(20).default("v1"),
    refPrefix: z
      .string()
      .trim()
      .toUpperCase()
      .refine(isValidRefPrefix, "Use 2–5 uppercase letters, e.g. DBE.")
      .nullable()
      .optional(),

    categories: z.array(categorySchema).min(1, "An event needs at least one race category."),
    schedule: z.array(scheduleSchema).default([]),
    inclusions: z.array(inclusionSchema).default([]),
    gallery: z.array(imageSchema).default([]),
    routes: z.array(routeSchema).default([]),
    faqs: z.array(faqSchema).default([]),

    sections: z.array(z.enum(SECTION_KEYS)).min(1),
  })
  .superRefine((event, ctx) => {
    const names = event.categories.map((c) => c.name.toLowerCase());
    const duplicate = names.find((name, i) => names.indexOf(name) !== i);
    if (duplicate) {
      ctx.addIssue({
        code: "custom",
        path: ["categories"],
        message: `Two categories are both called "${duplicate}".`,
      });
    }

    // A route may point at a category, but only one that exists.
    for (const [i, route] of event.routes.entries()) {
      if (route.categoryName && !names.includes(route.categoryName.toLowerCase())) {
        ctx.addIssue({
          code: "custom",
          path: ["routes", i, "categoryName"],
          message: `No category named "${route.categoryName}" on this event.`,
        });
      }
    }

    const { registrationOpensAt: opens, registrationClosesAt: closes } = event;
    if (opens && closes && opens >= closes) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationClosesAt"],
        message: "Registration must close after it opens.",
      });
    }
    if (closes && closes > event.startAt) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationClosesAt"],
        message: "Registration cannot close after the race has started.",
      });
    }
    if (event.endAt && event.endAt < event.startAt) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "The event cannot end before it starts.",
      });
    }
  });

export type EventInput = z.infer<typeof eventInputSchema>;

export const eventStatusUpdateSchema = z.object({
  status: eventStatusSchema,
});
