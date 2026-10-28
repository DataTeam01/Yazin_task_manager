import { z } from "zod";

export const tagNameSchema = z.string().trim().toLowerCase().min(1, "Tag name is required").max(40, "Tag name is too long");

export const subtaskTitleSchema = z.string().trim().min(1, "Title is required").max(200);

export const taskTagsSchema = z.object({
  taskId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).max(50),
});
