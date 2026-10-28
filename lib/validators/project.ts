import { z } from "zod";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .nullable();

export const projectFieldsSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100),
    goal: z.string().trim().max(2000).nullable(),
    status: z.enum(["active", "on_hold", "completed"]),
    start_date: dateOnly,
    deadline: dateOnly,
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  })
  .refine((p) => !p.start_date || !p.deadline || p.start_date <= p.deadline, {
    message: "Start date must be on or before the deadline",
    path: ["deadline"],
  });
export type ProjectFields = z.infer<typeof projectFieldsSchema>;

export const milestoneFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  deadline: dateOnly,
});
export type MilestoneFields = z.infer<typeof milestoneFieldsSchema>;

export const idSchema = z.string().uuid();
