import { z } from "zod";

export const inviteMemberSchema = z.object({
	email: z.email("Enter a valid email"),
	role: z.enum(["MEMBER", "ADMIN"]),
});

export const updateMemberRoleSchema = z.object({
	membershipId: z.string().min(1),
	role: z.enum(["MEMBER", "ADMIN", "OWNER"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
