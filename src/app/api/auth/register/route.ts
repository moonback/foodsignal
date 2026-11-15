import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12, "Le mot de passe doit contenir au moins 12 caractères.").max(128)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Le mot de passe ne doit pas dépasser 72 octets UTF-8."),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Un compte existe déjà avec cette adresse e-mail." }, { status: 409 });

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email, passwordHash, role: "CUSTOMER" },
      select: { id: true, name: true, email: true, role: true },
    });
    await createSession(user);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Informations invalides.", details: error.issues }, { status: 400 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Un compte existe déjà avec cette adresse e-mail." }, { status: 409 });
    }
    console.error("POST /api/auth/register", error);
    return NextResponse.json({ error: "Impossible de créer le compte pour le moment." }, { status: 500 });
  }
}
