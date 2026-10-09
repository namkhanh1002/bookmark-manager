import { prisma } from "../lib/prisma";
import { unauthorized, conflict, notFound } from "../lib/errors";
import { hashPassword, verifyPassword } from "../lib/password";
import { signToken } from "../lib/jwt";
import type { LoginInput, RegisterInput } from "../validators/schemas";

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface AuthResult {
  token: string;
  user: UserDto;
}

function toUserDto(user: { id: string; email: string; name: string | null; createdAt: Date }): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict("An account with this email already exists");

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? input.email.split("@")[0],
      passwordHash: hashPassword(input.password),
    },
  });

  return { token: signToken({ sub: user.id, email: user.email }), user: toUserDto(user) };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw unauthorized("Incorrect email or password");
  }

  return { token: signToken({ sub: user.id, email: user.email }), user: toUserDto(user) };
}

export async function getProfile(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("Account not found");
  return toUserDto(user);
}
