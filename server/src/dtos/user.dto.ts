import { UserSchema } from "../types/user.type";
import z, { email } from "zod";

export const CreateUserDTO = UserSchema.pick({
  email: true,
  password: true,
  username: true,
});

export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const LoginUserDTO = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export interface UserResponseDTO {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
}

export type LoginUserDTO = z.infer<typeof LoginUserDTO>;
export const UpdateUserDTO = UserSchema.partial(); //all fields optional
export type UpdateUserDTO = z.infer<typeof UpdateUserDTO>;
