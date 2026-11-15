import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128).refine((value) => Buffer.byteLength(value, "utf8") <= 72),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
    if (!user || !valid) return NextResponse.json({ error: "Adresse e-mail ou mot de passe incorrect." }, { status: 401 });

    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Informations invalides." }, { status: 400 });
    console.error("POST /api/auth/login", error);
    return NextResponse.json({ error: "Connexion indisponible pour le moment." }, { status: 500 });
  }
}
